// Maybe Box order endpoint (Vercel serverless function).
// Demo order flow: no payment collected, no persistent storage.
// Product prices are maintained server-side; browser-supplied prices are ignored.

const PRODUCTS = {
  "maybe-box-mini": { name: "Maybe Box — Mini", price: 39 },
  "maybe-box-standard": { name: "Maybe Box — Standard", price: 54 },
  "spare-peg-set": { name: "Spare peg set", price: 9 },
};

const SHIPPING_THRESHOLD = 50;
const SHIPPING_FLAT = 5;
const MAX_QTY = 99;

function json(res, status, body) {
  res.setHeader("Content-Type", "application/json");
  res.status(status).json(body);
}

function isValidEmail(email) {
  if (typeof email !== "string") return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function isValidPhone(phone) {
  if (typeof phone !== "string") return false;
  const digits = phone.replace(/[^0-9+]/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function isFiniteQty(qty) {
  if (typeof qty !== "number" || !Number.isFinite(qty)) return false;
  if (!Number.isInteger(qty)) return false;
  if (qty < 1 || qty > MAX_QTY) return false;
  return true;
}

module.exports = async function order(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed. Use POST." });
    return;
  }

  try {
    // Parse body robustly; invalid JSON must return 400 JSON, not HTML.
    let body;
    try {
      body = req.body;
      if (body === undefined || body === null) {
        const raw = await new Promise((resolve, reject) => {
          let data = "";
          req.on("data", (chunk) => { data += chunk; });
          req.on("end", () => resolve(data));
          req.on("error", reject);
        });
        body = raw ? JSON.parse(raw) : {};
      }
    } catch (e) {
      json(res, 400, { error: "Invalid JSON body.", details: { body: "Request body must be valid JSON." } });
      return;
    }
    body = body || {};

    const errors = {};

    // Validate customer fields
    const name = body.name;
    const email = body.email;
    const phone = body.phone;
    const address = body.address;

    if (typeof name !== "string" || name.trim() === "") {
      errors.name = "Name is required.";
    }
    if (typeof email !== "string" || !isValidEmail(email)) {
      errors.email = "A valid email address is required.";
    }
    if (typeof phone !== "string" || !isValidPhone(phone)) {
      errors.phone = "A valid phone number is required.";
    }
    if (typeof address !== "string" || address.trim() === "") {
      errors.address = "Address is required.";
    }

    // Validate items
    let items = body.items;
    if (!Array.isArray(items) || items.length === 0) {
      errors.items = "At least one order item is required.";
    }

    if (Object.keys(errors).length > 0) {
      json(res, 400, { error: "Invalid request.", details: errors });
      return;
    }

    // Build line items from server-side prices (never trust browser prices).
    const lineItems = [];
    let subtotal = 0;

    for (const item of items) {
      const itemErrors = {};
      const pid = item.id;
      const qty = item.qty;

      if (!PRODUCTS[pid]) {
        itemErrors.id = "Unknown product ID: " + String(pid);
      }
      if (!isFiniteQty(qty)) {
        itemErrors.qty = "Quantity must be a whole number between 1 and " + MAX_QTY + ".";
      }

      if (Object.keys(itemErrors).length > 0) {
        errors["items[" + items.indexOf(item) + "]"] = itemErrors;
        continue;
      }

      const product = PRODUCTS[pid];
      const lineTotal = product.price * qty;
      lineItems.push({
        id: pid,
        name: product.name,
        unit_price: product.price,
        qty: qty,
        line_total: lineTotal,
      });
      subtotal += lineTotal;
    }

    if (Object.keys(errors).length > 0) {
      json(res, 400, { error: "Invalid request.", details: errors });
      return;
    }

    if (lineItems.length === 0) {
      json(res, 400, { error: "Invalid request.", details: { items: "No valid order items." } });
      return;
    }

    const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
    const total = subtotal + shipping;

    const orderId = "MB-" + Math.random().toString(36).slice(2, 10).toUpperCase();

    json(res, 200, {
      ok: true,
      order_id: orderId,
      message: "Order received. Your Maybe Box is on its way — a little chance, a lot of joy. (Demo: no payment taken.)",
      customer: {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
      },
      items: lineItems,
      subtotal: subtotal,
      shipping: shipping,
      total: total,
      demo: true,
    });
  } catch (e) {
    json(res, 500, { error: "Unexpected server error. Please try again later." });
  }
};
