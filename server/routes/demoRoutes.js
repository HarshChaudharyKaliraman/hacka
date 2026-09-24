// routes/demoRoutes.js
// This is our LOCAL DEMO API — used exclusively for hackathon demonstrations.
//
// ── PRODUCTS API (/api/products) ──────────────────────────────────────────────
//   POST   /api/products       — Create a product (name, price, quantity)
//   GET    /api/products       — List all products
//   GET    /api/products/:id   — Get a single product by ID
//   DELETE /api/products/:id   — Delete a product
//   DELETE /api/products       — Reset all products (demo reset)
//
// ── USERS API (/api/users) ────────────────────────────────────────────────────
//   POST   /api/users          — Register a user (name, email, age, role)
//   GET    /api/users          — List all users
//   DELETE /api/users          — Reset all users (demo reset)
//
// Each endpoint has its own validation rules — the fuzzer tests ANY of them.

const express = require('express');
const router = express.Router();

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTS — stored in memory (resets when server restarts — fine for demo)
// ═══════════════════════════════════════════════════════════════════════════════

let products = [];
let productNextId = 1;

// ─── POST /api/products ──────────────────────────────────────────────────────
// Creates a new product.
// DEMO 1: Fuzz with body {"name":"Laptop","price":45000,"quantity":2}
router.post('/', (req, res) => {
  const { name, price, quantity } = req.body;

  if (name === undefined || name === null) {
    return res.status(400).json({ error: 'Validation failed', message: 'Field "name" is required.' });
  }
  if (typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Validation failed', message: 'Field "name" must be a non-empty string.' });
  }
  if (name.length > 200) {
    return res.status(400).json({ error: 'Validation failed', message: 'Field "name" must be 200 characters or fewer.' });
  }
  if (price === undefined || price === null) {
    return res.status(400).json({ error: 'Validation failed', message: 'Field "price" is required.' });
  }
  if (typeof price !== 'number' || isNaN(price)) {
    return res.status(400).json({ error: 'Validation failed', message: 'Field "price" must be a valid number.' });
  }
  if (price < 0) {
    return res.status(400).json({ error: 'Validation failed', message: 'Field "price" must be zero or greater.' });
  }
  if (quantity === undefined || quantity === null) {
    return res.status(400).json({ error: 'Validation failed', message: 'Field "quantity" is required.' });
  }
  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ error: 'Validation failed', message: 'Field "quantity" must be a positive integer.' });
  }

  // DEMO-ONLY ANOMALY: price=99999 simulates a 500 server crash (anomaly detection demo)
  if (price === 99999) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: '[DEMO ONLY] Simulated server crash for price=99999. This demonstrates anomaly detection.'
    });
  }

  const newProduct = {
    id: productNextId++,
    name: name.trim(),
    price,
    quantity,
    createdAt: new Date().toISOString()
  };
  products.push(newProduct);

  res.status(201).json({ message: 'Product created successfully.', product: newProduct });
});

// ─── GET /api/products ───────────────────────────────────────────────────────
router.get('/', (req, res) => {
  res.json({ count: products.length, products });
});

// ─── GET /api/products/:id ───────────────────────────────────────────────────
// Get a single product by its numeric ID.
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Validation failed', message: 'Product ID must be a number.' });
  }

  const product = products.find(p => p.id === id);
  if (!product) {
    return res.status(404).json({ error: 'Not found', message: `Product with id ${id} does not exist.` });
  }

  res.json({ product });
});

// ─── DELETE /api/products/:id ────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = products.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: `Product with id ${id} not found.` });
  }

  products.splice(index, 1);
  res.json({ message: `Product ${id} deleted.` });
});

// ─── DELETE /api/products (reset) ────────────────────────────────────────────
router.delete('/', (req, res) => {
  products = [];
  productNextId = 1;
  res.json({ message: 'All products cleared. Demo reset.' });
});


// ═══════════════════════════════════════════════════════════════════════════════
// USERS — a completely different endpoint to prove the fuzzer works on ANY API
//
// DEMO 2: Fuzz with body {"name":"John","email":"john@example.com","age":25,"role":"user"}
//
// New validation rules here that products doesn't have:
//   - Email format validation
//   - Age range (1-120)
//   - Enum validation (role must be admin / user / guest)
//   - Duplicate email check (returns 409 Conflict)
//   - ANOMALY: role="superadmin" triggers 500
// ═══════════════════════════════════════════════════════════════════════════════

let users = [];
let userNextId = 1;
const VALID_ROLES = ['admin', 'user', 'guest'];

// ─── POST /api/users ─────────────────────────────────────────────────────────
router.post('/users', (req, res) => {
  const { name, email, age, role } = req.body;

  // Rule 1: name
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Field "name" is required and must be a non-empty string.'
    });
  }

  // Rule 2: email is required and must be a string
  if (!email || typeof email !== 'string') {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Field "email" is required and must be a string.'
    });
  }

  // Rule 3: email must be valid format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Field "email" must be a valid email address (e.g. user@example.com).'
    });
  }

  // Rule 4: no duplicate emails (returns 409 Conflict — different from 400!)
  const emailExists = users.some(u => u.email === email.toLowerCase());
  if (emailExists) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'A user with this email already exists.'
    });
  }

  // Rule 5: age is required
  if (age === undefined || age === null) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Field "age" is required.'
    });
  }

  // Rule 6: age must be a whole number
  if (typeof age !== 'number' || !Number.isInteger(age)) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Field "age" must be a whole number (e.g. 25).'
    });
  }

  // Rule 7: age must be in range 1-120
  if (age < 1 || age > 120) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Field "age" must be between 1 and 120.'
    });
  }

  // DEMO-ONLY ANOMALY: role="superadmin" must be checked FIRST before VALID_ROLES
  // Otherwise the VALID_ROLES check would catch it and return 400 instead of 500
  if (role === 'superadmin') {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: '[DEMO ONLY] Simulated crash for role=superadmin. Demonstrates anomaly detection.'
    });
  }

  // Rule 8: role must be one of the allowed enum values
  if (!role || !VALID_ROLES.includes(role)) {
    return res.status(400).json({
      error: 'Validation failed',
      message: `Field "role" must be one of: ${VALID_ROLES.join(', ')}.`
    });
  }

  const newUser = {
    id: userNextId++,
    name: name.trim(),
    email: email.toLowerCase(),
    age,
    role,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);

  res.status(201).json({ message: 'User registered successfully.', user: newUser });
});

// ─── GET /api/users ──────────────────────────────────────────────────────────
router.get('/users', (req, res) => {
  res.json({ count: users.length, users });
});

// ─── DELETE /api/users (reset) ───────────────────────────────────────────────
router.delete('/users', (req, res) => {
  users = [];
  userNextId = 1;
  res.json({ message: 'All users cleared. Demo reset.' });
});

module.exports = router;
