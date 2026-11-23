/* ===== Maybe Box — shared script ===== */

(function () {
  "use strict";

  // Mobile nav toggle
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("main-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open === true ? "true" : "false");
    });

    // Close menu when a link is clicked
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Smooth-scroll for in-page anchors
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      var target = document.querySelector(this.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
})();


// ===== Cart (shared across pages) =====
(function () {
  "use strict";
  var CART_KEY = "maybe_box_cart";
  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch (e) { return []; }
  }
  function saveCart(cart) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
  }
  function addToCart(id, name, price, qty) {
    if (!qty || qty < 1) return;
    var cart = loadCart();
    var existing = cart.find(function (i) { return i.id === id; });
    if (existing) { existing.qty += qty; } else { cart.push({ id: id, name: name, price: price, qty: qty }); }
    saveCart(cart);
  }
  function getCartCount() {
    var cart = loadCart();
    return cart.reduce(function (sum, i) { return sum + (i.qty || 0); }, 0);
  }
  function updateCartCount() {
    var count = getCartCount();
    document.querySelectorAll(".cart-count").forEach(function (el) { el.textContent = count; });
  }
  window.maybeBox = window.maybeBox || {};
  window.maybeBox.addToCart = addToCart;
  window.maybeBox.getCartCount = getCartCount;
  window.maybeBox.updateCartCount = updateCartCount;
  updateCartCount();
})();
