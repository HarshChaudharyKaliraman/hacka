// services/testGenerator.js
// This is the heart of the fuzzing tool.
// It takes an original JSON body and generates many different test cases automatically.
//
// HOW IT WORKS:
// 1. We look at each field in the original JSON body.
// 2. Depending on the field's data type (string, number, boolean), we create mutated versions.
// 3. We also create structural mutations (missing fields, extra fields, null values, etc.).
// 4. We return an array of test cases, each with a name, category, and mutated body.

// Maximum number of test cases to generate in one run
const MAX_TEST_CASES = 20;

/**
 * generateTestCases
 * @param {object} originalBody - The JSON body the user entered
 * @param {string} method - HTTP method (POST, PUT, etc.)
 * @returns {Array} - Array of test case objects
 */
function generateTestCases(originalBody, method) {
  const testCases = [];

  // Safety check: make sure originalBody is a plain object
  if (!originalBody || typeof originalBody !== 'object' || Array.isArray(originalBody)) {
    throw new Error('Request body must be a plain JSON object (not an array or primitive).');
  }

  const fields = Object.keys(originalBody);

  if (fields.length === 0) {
    throw new Error('Request body must have at least one field.');
  }

  // ── Test Case 1: Valid Input (the original body, untouched) ──────────────
  testCases.push({
    testName: 'Valid Input',
    category: 'Valid Input',
    requestBody: { ...originalBody },
    expectedBehavior: 'Should return 200 or 201 — the API should accept this.',
    expectedStatuses: [200, 201, 204]
  });

  // ── Per-field mutations ──────────────────────────────────────────────────
  // For each field, we generate several mutated test cases
  for (const field of fields) {
    if (testCases.length >= MAX_TEST_CASES) break;

    const originalValue = originalBody[field];
    const fieldType = getFieldType(originalValue);

    // ── Empty String ────────────────────────────────────────────────────
    if (fieldType === 'string') {
      testCases.push({
        testName: `Empty String - ${field}`,
        category: 'Empty Value',
        requestBody: { ...originalBody, [field]: '' },
        expectedBehavior: `"${field}" is empty. API should return 400 (validation error).`,
        expectedStatuses: [400, 422]
      });
      if (testCases.length >= MAX_TEST_CASES) break;
    }

    // ── Null Value ──────────────────────────────────────────────────────
    testCases.push({
      testName: `Null Value - ${field}`,
      category: 'Null Value',
      requestBody: { ...originalBody, [field]: null },
      expectedBehavior: `"${field}" is null. API should return 400.`,
      expectedStatuses: [400, 422]
    });
    if (testCases.length >= MAX_TEST_CASES) break;

    // ── Wrong Data Type ─────────────────────────────────────────────────
    if (fieldType === 'number') {
      testCases.push({
        testName: `Wrong Type - ${field} (string instead of number)`,
        category: 'Wrong Data Type',
        requestBody: { ...originalBody, [field]: 'not-a-number' },
        expectedBehavior: `"${field}" receives a string instead of a number. API should return 400.`,
        expectedStatuses: [400, 422]
      });
      if (testCases.length >= MAX_TEST_CASES) break;

      // ── Negative Number ─────────────────────────────────────────────
      testCases.push({
        testName: `Negative Number - ${field}`,
        category: 'Boundary Value',
        requestBody: { ...originalBody, [field]: -1 },
        expectedBehavior: `"${field}" is negative. API may return 400 if it validates positive-only values.`,
        expectedStatuses: [400, 422, 200, 201]
      });
      if (testCases.length >= MAX_TEST_CASES) break;

      // ── Zero Value ──────────────────────────────────────────────────
      testCases.push({
        testName: `Zero Value - ${field}`,
        category: 'Boundary Value',
        requestBody: { ...originalBody, [field]: 0 },
        expectedBehavior: `"${field}" is 0. API should handle edge cases around zero.`,
        expectedStatuses: [400, 422, 200, 201]
      });
      if (testCases.length >= MAX_TEST_CASES) break;

      // ── Very Large Number ───────────────────────────────────────────
      testCases.push({
        testName: `Large Number - ${field}`,
        category: 'Boundary Value',
        requestBody: { ...originalBody, [field]: 999999999 },
        expectedBehavior: `"${field}" is extremely large. API should handle this gracefully.`,
        expectedStatuses: [400, 422, 200, 201]
      });
      if (testCases.length >= MAX_TEST_CASES) break;
    }

    if (fieldType === 'string') {
      // ── Wrong Type: number instead of string ─────────────────────────
      testCases.push({
        testName: `Wrong Type - ${field} (number instead of string)`,
        category: 'Wrong Data Type',
        requestBody: { ...originalBody, [field]: 12345 },
        expectedBehavior: `"${field}" receives a number instead of a string. API may return 400.`,
        expectedStatuses: [400, 422, 200, 201]
      });
      if (testCases.length >= MAX_TEST_CASES) break;

      // ── Long String ─────────────────────────────────────────────────
      testCases.push({
        testName: `Long String - ${field}`,
        category: 'Boundary Value',
        requestBody: { ...originalBody, [field]: 'A'.repeat(300) },
        expectedBehavior: `"${field}" is 300 characters long. API should handle or reject it.`,
        expectedStatuses: [400, 422, 200, 201]
      });
      if (testCases.length >= MAX_TEST_CASES) break;
    }

    // ── Missing Field ───────────────────────────────────────────────────
    const bodyWithoutField = { ...originalBody };
    delete bodyWithoutField[field];

    testCases.push({
      testName: `Missing Field - ${field}`,
      category: 'Missing Field',
      requestBody: bodyWithoutField,
      expectedBehavior: `"${field}" is missing from the request. API should return 400 if it is required.`,
      expectedStatuses: [400, 422]
    });
    if (testCases.length >= MAX_TEST_CASES) break;
  }

  // ── Extra Field ──────────────────────────────────────────────────────────
  if (testCases.length < MAX_TEST_CASES) {
    testCases.push({
      testName: 'Extra Field - unexpectedField',
      category: 'Extra Field',
      requestBody: { ...originalBody, unexpectedField: 'fuzz-test-value' },
      expectedBehavior: 'Extra field added. API should either ignore it or return 400.',
      expectedStatuses: [200, 201, 400, 422]
    });
  }

  // ── Empty Object ─────────────────────────────────────────────────────────
  if (testCases.length < MAX_TEST_CASES) {
    testCases.push({
      testName: 'Empty Object',
      category: 'Missing Field',
      requestBody: {},
      expectedBehavior: 'Completely empty body. API should return 400.',
      expectedStatuses: [400, 422]
    });
  }

  // ── Boolean instead of expected value ───────────────────────────────────
  if (fields.length > 0 && testCases.length < MAX_TEST_CASES) {
    const firstField = fields[0];
    testCases.push({
      testName: `Boolean Value - ${firstField}`,
      category: 'Wrong Data Type',
      requestBody: { ...originalBody, [firstField]: true },
      expectedBehavior: `"${firstField}" receives a boolean. API should validate types.`,
      expectedStatuses: [400, 422, 200, 201]
    });
  }

  // Add an index to each test case so the frontend can display them in order
  return testCases.map((tc, index) => ({
    id: index + 1,
    ...tc,
    status: 'pending' // Will become "passed", "failed", etc. after running
  }));
}

/**
 * getFieldType
 * Returns a simple string for the JavaScript type of a value.
 * We use this to decide which mutations to apply to each field.
 */
function getFieldType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value; // 'string', 'number', 'boolean', 'object'
}

module.exports = { generateTestCases };
