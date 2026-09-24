// services/testRunner.js
// This file sends actual HTTP requests to the target API.
//
// HOW IT WORKS:
// 1. For each generated test case, we send an HTTP request using Axios.
// 2. We measure how long the request takes (execution time).
// 3. We capture the status code and response body.
// 4. If there's a network error or timeout, we record that too.
// 5. We return all results to the controller.

const axios = require('axios');

// Maximum time (in ms) to wait for a response before giving up
const REQUEST_TIMEOUT_MS = 10000; // 10 seconds

// Maximum number of test cases we'll run in a single batch
const MAX_REQUESTS_PER_RUN = 20;

/**
 * runTestCases
 * Sends each test case to the target API and collects results.
 *
 * @param {string} apiUrl - The URL to send requests to
 * @param {string} method - HTTP method (POST, PUT, PATCH, etc.)
 * @param {Array} testCases - The generated test cases from testGenerator.js
 * @returns {Array} - Results for each test case
 */
async function runTestCases(apiUrl, method, testCases) {
  // Validate the URL before making any requests
  validateUrl(apiUrl);

  // Limit how many requests we send in one run (safety measure)
  const casesToRun = testCases.slice(0, MAX_REQUESTS_PER_RUN);

  const results = [];

  // Run test cases one by one (sequential, not parallel — easier to debug)
  for (const testCase of casesToRun) {
    const result = await runSingleTest(apiUrl, method, testCase);
    results.push(result);
  }

  return results;
}

/**
 * runSingleTest
 * Sends one HTTP request and returns the result.
 */
async function runSingleTest(apiUrl, method, testCase) {
  const startTime = Date.now(); // Record when we started

  try {
    // Build the Axios request config
    const config = {
      method: method.toLowerCase(), // axios expects lowercase method names
      url: apiUrl,
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json'
      },
      // Only include a body if the method supports it
      ...(supportsBody(method) && { data: testCase.requestBody }),
      // Tell axios not to throw errors for non-2xx status codes
      // We want to capture those responses ourselves
      validateStatus: () => true
    };

    const response = await axios(config);
    const executionTime = Date.now() - startTime;

    return {
      testName: testCase.testName,
      category: testCase.category,
      httpMethod: method,
      requestUrl: apiUrl,
      requestBody: testCase.requestBody,
      expectedBehavior: testCase.expectedBehavior,
      expectedStatuses: testCase.expectedStatuses,
      statusCode: response.status,
      responseBody: response.data,
      executionTime,
      errorMessage: null
    };

  } catch (error) {
    // This catches network errors, timeouts, etc.
    const executionTime = Date.now() - startTime;
    const errorMessage = buildErrorMessage(error);

    return {
      testName: testCase.testName,
      category: testCase.category,
      httpMethod: method,
      requestUrl: apiUrl,
      requestBody: testCase.requestBody,
      expectedBehavior: testCase.expectedBehavior,
      expectedStatuses: testCase.expectedStatuses,
      statusCode: null,    // No status code — request never completed
      responseBody: null,
      executionTime,
      errorMessage
    };
  }
}

/**
 * supportsBody
 * Returns true for HTTP methods that can carry a request body.
 * GET and DELETE typically don't send a body.
 */
function supportsBody(method) {
  return ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase());
}

/**
 * validateUrl
 * Makes sure the URL is http or https only.
 * We don't want to accidentally send requests to file:// or other schemes.
 */
function validateUrl(apiUrl) {
  let parsed;
  try {
    parsed = new URL(apiUrl);
  } catch {
    throw new Error(`Invalid URL: "${apiUrl}". Please enter a valid HTTP or HTTPS URL.`);
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`URL must use http or https. Received: ${parsed.protocol}`);
  }
}

/**
 * buildErrorMessage
 * Creates a human-readable error message from an Axios error.
 */
function buildErrorMessage(error) {
  if (error.code === 'ECONNABORTED') {
    return `Request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds.`;
  }
  if (error.code === 'ECONNREFUSED') {
    return 'Connection refused. Is the demo API server running?';
  }
  if (error.code === 'ENOTFOUND') {
    return 'Host not found. Check if the URL is correct.';
  }
  return error.message || 'Unknown network error.';
}

module.exports = { runTestCases };
