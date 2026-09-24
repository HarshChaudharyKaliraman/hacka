// controllers/testController.js
// Connects routes to services.
// MongoDB removed — results are returned to the client which persists them in localStorage.

const { generateTestCases } = require('../services/testGenerator');
const { runTestCases } = require('../services/testRunner');
const { analyzeResults, summarizeResults } = require('../services/resultAnalyzer');

/**
 * POST /api/tests/generate
 * Generates synthetic test cases from a user-provided JSON body.
 *
 * Request body expected:
 * {
 *   "method": "POST",
 *   "requestBody": { "name": "Laptop", "price": 45000 }
 * }
 */
async function generateTests(req, res) {
  try {
    const { method, requestBody } = req.body;

    if (!method) {
      return res.status(400).json({ error: 'HTTP method is required.' });
    }

    if (!requestBody || typeof requestBody !== 'object' || Array.isArray(requestBody)) {
      return res.status(400).json({ error: 'requestBody must be a JSON object.' });
    }

    const testCases = generateTestCases(requestBody, method);

    res.json({
      message: `Generated ${testCases.length} test cases.`,
      count: testCases.length,
      testCases
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

/**
 * POST /api/tests/run
 * Runs all test cases against the target API and analyzes results.
 * No database — results are returned to the client for localStorage persistence.
 *
 * Request body expected:
 * {
 *   "apiUrl": "http://localhost:5000/api/products",
 *   "method": "POST",
 *   "originalBody": { "name": "Laptop", "price": 45000 },
 *   "testCases": [ ...array of test case objects... ]
 * }
 */
async function runTests(req, res) {
  try {
    const { apiUrl, method, originalBody, testCases } = req.body;

    if (!apiUrl) return res.status(400).json({ error: 'apiUrl is required.' });
    if (!method) return res.status(400).json({ error: 'method is required.' });
    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
      return res.status(400).json({ error: 'testCases must be a non-empty array.' });
    }

    // Step 1: Run all test cases
    const rawResults = await runTestCases(apiUrl, method, testCases);

    // Step 2: Analyze — PASSED / FAILED / ERROR / UNEXPECTED
    const analyzedResults = analyzeResults(rawResults);

    // Step 3: Build summary
    const summary = summarizeResults(analyzedResults);

    res.json({
      message: 'Test run complete.',
      summary,
      results: analyzedResults
    });

  } catch (error) {
    console.error('Error running tests:', error.message);
    res.status(500).json({ error: error.message });
  }
}

module.exports = { generateTests, runTests };
