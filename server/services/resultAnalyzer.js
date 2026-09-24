// services/resultAnalyzer.js
// This file decides whether each test PASSED, FAILED, had an ERROR, or was UNEXPECTED.
//
// THE FOUR RESULT TYPES:
//
// PASSED     — The API responded exactly as we expected.
//              Example: We sent an invalid body and got 400 back.
//              Example: We sent a valid body and got 201 back.
//
// FAILED     — The API responded with a status code we did NOT expect.
//              Example: We sent a valid body but got 404.
//
// UNEXPECTED — The API returned a 500 Internal Server Error.
//              This is not automatically a bug, but it's worth investigating.
//
// ERROR      — The request never completed (network failure, timeout, etc.)

/**
 * analyzeResults
 * Takes the raw results from testRunner.js and adds a verdict to each.
 *
 * @param {Array} rawResults - Results from runTestCases()
 * @returns {Array} - Results with added "result" and "reason" fields
 */
function analyzeResults(rawResults) {
  return rawResults.map(analyzeOneResult);
}

/**
 * analyzeOneResult
 * Decides the verdict for a single test result.
 */
function analyzeOneResult(raw) {
  // Case 1: Network error — request never reached the server
  if (raw.errorMessage && raw.statusCode === null) {
    return {
      ...raw,
      result: 'ERROR',
      reason: `Network error: ${raw.errorMessage}`
    };
  }

  // Case 2: Server returned a 500 — flag it as unexpected
  if (raw.statusCode >= 500) {
    return {
      ...raw,
      result: 'UNEXPECTED',
      reason: `Server returned ${raw.statusCode}. This may indicate an unhandled error on the server. Investigate the server logs.`
    };
  }

  // Case 3: Check if the status code matches what we expected
  const expectedStatuses = raw.expectedStatuses || [];

  if (expectedStatuses.includes(raw.statusCode)) {
    // The API behaved as expected
    return {
      ...raw,
      result: 'PASSED',
      reason: `Got ${raw.statusCode} — matches expected behavior.`
    };
  }

  // Case 4: The status code was not in our expected list
  return {
    ...raw,
    result: 'FAILED',
    reason: `Got ${raw.statusCode} but expected one of [${expectedStatuses.join(', ')}].`
  };
}

/**
 * summarizeResults
 * Counts how many tests passed, failed, had errors, or were unexpected.
 * Returns a summary object.
 */
function summarizeResults(analyzedResults) {
  const summary = {
    totalTests: analyzedResults.length,
    passedTests: 0,
    failedTests: 0,
    errorTests: 0,
    unexpectedTests: 0,
    findings: [] // Noteworthy issues to display in the Findings section
  };

  for (const result of analyzedResults) {
    if (result.result === 'PASSED') summary.passedTests++;
    else if (result.result === 'FAILED') summary.failedTests++;
    else if (result.result === 'ERROR') summary.errorTests++;
    else if (result.result === 'UNEXPECTED') summary.unexpectedTests++;

    // Collect findings (anything that is not a clean PASS)
    if (result.result !== 'PASSED') {
      summary.findings.push({
        testName: result.testName,
        result: result.result,
        statusCode: result.statusCode,
        reason: result.reason,
        category: result.category
      });
    }
  }

  return summary;
}

module.exports = { analyzeResults, summarizeResults };
