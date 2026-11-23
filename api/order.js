// Maybe Box order endpoint (Vercel serverless function).
// Placeholder for the future order page. Accepts a test order and returns
// a confirmation without persisting anything (no auth, no database).

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
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  const body = req.body || {};
  const { name, email, address, quantity } = body;

  if (!name || !email || !address) {
    res.status(400).json({ error: "Name, email and address are required." });
    return;
  }

  res.status(200).json({
    ok: true,
    message: "Order received. Your Maybe Box is on its way — a little chance, a lot of joy.",
    order: {
      name,
      email,
      address,
      quantity: quantity || 1,
    },
  });
};
