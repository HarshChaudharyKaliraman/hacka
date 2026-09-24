// routes/testRoutes.js
// API routes for test generation and execution.
// History routes removed — history is now stored in browser localStorage.

const express = require('express');
const router = express.Router();
const { generateTests, runTests } = require('../controllers/testController');

// POST /api/tests/generate — Generate test cases from a JSON body
router.post('/tests/generate', generateTests);

// POST /api/tests/run — Execute test cases and return results
router.post('/tests/run', runTests);

module.exports = router;
