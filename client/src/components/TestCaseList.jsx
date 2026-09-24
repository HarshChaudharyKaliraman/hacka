// src/components/TestCaseList.jsx
// Displays the generated test cases in a table BEFORE the user runs them.
// The user can review what test cases will be sent to the API.

import React, { useState } from 'react';

function TestCaseList({ testCases }) {
  // Allow expanding the request body for each row
  const [expanded, setExpanded] = useState(null);

  if (!testCases || testCases.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-header-icon">📋</span>
          <div>
            <h2>Generated Test Cases</h2>
            <p>Test cases will appear here after generation</p>
          </div>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">🔬</div>
          <p>No test cases generated yet.<br />Enter a JSON body above and click <strong>Generate Test Cases</strong>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-icon">📋</span>
        <div>
          <h2>Generated Test Cases</h2>
          <p>
            {testCases.length} test cases ready — review them before running
          </p>
        </div>
        <span className="badge badge-info" style={{ marginLeft: 'auto' }}>
          {testCases.length} Cases
        </span>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Test Name</th>
              <th>Category</th>
              <th>Expected Behavior</th>
              <th>Request Body</th>
            </tr>
          </thead>
          <tbody>
            {testCases.map((tc) => (
              <tr key={tc.id}>
                <td className="mono" style={{ width: '40px' }}>{tc.id}</td>
                <td style={{ fontWeight: 500, minWidth: '180px' }}>{tc.testName}</td>
                <td>
                  <span className={`badge ${getCategoryBadge(tc.category)}`}>
                    {tc.category}
                  </span>
                </td>
                <td style={{ fontSize: '12px', color: 'var(--text-secondary)', minWidth: '200px' }}>
                  {tc.expectedBehavior}
                </td>
                <td style={{ minWidth: '200px' }}>
                  <button
                    className="btn btn-outline"
                    style={{ padding: '3px 10px', fontSize: '11px', marginBottom: '6px' }}
                    onClick={() => setExpanded(expanded === tc.id ? null : tc.id)}
                  >
                    {expanded === tc.id ? '▲ Hide' : '▼ Show'}
                  </button>
                  {expanded === tc.id && (
                    <div className="code-block">
                      {JSON.stringify(tc.requestBody, null, 2)}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Returns a CSS class name based on the category label
function getCategoryBadge(category) {
  const map = {
    'Valid Input': 'badge-passed',
    'Missing Field': 'badge-failed',
    'Empty Value': 'badge-failed',
    'Wrong Data Type': 'badge-unexpected',
    'Boundary Value': 'badge-info',
    'Null Value': 'badge-failed',
    'Extra Field': 'badge-pending',
  };
  return map[category] || 'badge-pending';
}

export default TestCaseList;
