// src/components/ResultsDashboard.jsx
// Displays test results AFTER the tests have been run.
// Shows a summary (stats), a detailed results table, and a findings section.

import React, { useState } from 'react';

function ResultsDashboard({ summary, results }) {
  const [expandedRow, setExpandedRow] = useState(null);

  // Nothing to show yet
  if (!summary || !results || results.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-header-icon">📊</span>
          <div>
            <h2>Test Results</h2>
            <p>Results will appear here after running tests</p>
          </div>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">🚀</div>
          <p>No results yet.<br />Generate test cases and click <strong>Run Tests</strong>.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Stats Summary ─────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <span className="card-header-icon">📊</span>
          <div>
            <h2>Test Results Summary</h2>
            <p>Overview of the completed test run</p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-value stat-total">{summary.totalTests}</div>
            <div className="stat-card-label">Total</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value stat-passed">{summary.passedTests}</div>
            <div className="stat-card-label">✅ Passed</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value stat-failed">{summary.failedTests}</div>
            <div className="stat-card-label">❌ Failed</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value stat-unexpected">{summary.unexpectedTests}</div>
            <div className="stat-card-label">⚠️ Unexpected</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value stat-error">{summary.errorTests}</div>
            <div className="stat-card-label">💜 Errors</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: '4px' }}>
          <div style={{
            height: '6px',
            background: 'var(--bg-input)',
            borderRadius: '3px',
            overflow: 'hidden',
            display: 'flex'
          }}>
            <div style={{
              width: `${(summary.passedTests / summary.totalTests) * 100}%`,
              background: 'var(--green)',
              transition: 'width 0.5s'
            }} />
            <div style={{
              width: `${(summary.failedTests / summary.totalTests) * 100}%`,
              background: 'var(--red)'
            }} />
            <div style={{
              width: `${(summary.unexpectedTests / summary.totalTests) * 100}%`,
              background: 'var(--yellow)'
            }} />
            <div style={{
              width: `${(summary.errorTests / summary.totalTests) * 100}%`,
              background: 'var(--purple)'
            }} />
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--green)' }}>■ Passed</span>
            <span style={{ color: 'var(--red)' }}>■ Failed</span>
            <span style={{ color: 'var(--yellow)' }}>■ Unexpected</span>
            <span style={{ color: 'var(--purple)' }}>■ Error</span>
          </div>
        </div>
      </div>

      {/* ── Detailed Results Table ─────────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <span className="card-header-icon">🔍</span>
          <div>
            <h2>Detailed Results</h2>
            <p>Click a row to expand the request/response details</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Test Name</th>
                <th>Category</th>
                <th>Status Code</th>
                <th>Result</th>
                <th>Exec Time</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, index) => (
                <React.Fragment key={index}>
                  <tr onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                    style={{ cursor: 'pointer' }}>
                    <td className="mono">{index + 1}</td>
                    <td style={{ fontWeight: 500 }}>{r.testName}</td>
                    <td>
                      <span className="badge badge-pending" style={{ fontSize: '10px' }}>
                        {r.category}
                      </span>
                    </td>
                    <td>
                      <span className={`mono ${getStatusCodeColor(r.statusCode)}`}>
                        {r.statusCode ?? 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getResultBadge(r.result)}`}>
                        {r.result}
                      </span>
                    </td>
                    <td className="mono">
                      {r.executionTime != null ? `${r.executionTime}ms` : '—'}
                    </td>
                    <td>
                      <button className="btn btn-outline" style={{ padding: '2px 8px', fontSize: '11px' }}>
                        {expandedRow === index ? '▲' : '▼'}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded row with full details */}
                  {expandedRow === index && (
                    <tr>
                      <td colSpan={7} style={{ background: 'var(--bg-input)', padding: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          {/* Left column */}
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                              Request Body Sent
                            </div>
                            <div className="code-block" style={{ maxHeight: '150px' }}>
                              {JSON.stringify(r.requestBody, null, 2)}
                            </div>

                            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '12px 0 6px' }}>
                              Expected Behavior
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {r.expectedBehavior}
                            </div>
                          </div>

                          {/* Right column */}
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                              Response Body Received
                            </div>
                            <div className="code-block" style={{ maxHeight: '150px' }}>
                              {r.responseBody ? JSON.stringify(r.responseBody, null, 2) : r.errorMessage || 'No response'}
                            </div>

                            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '12px 0 6px' }}>
                              Analysis
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {r.reason}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Findings Section ───────────────────────────────────────────── */}
      {summary.findings && summary.findings.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-header-icon">🔎</span>
            <div>
              <h2>Findings</h2>
              <p>Unusual or unexpected responses that need attention</p>
            </div>
            <span className="badge badge-unexpected" style={{ marginLeft: 'auto' }}>
              {summary.findings.length} Finding{summary.findings.length !== 1 ? 's' : ''}
            </span>
          </div>

          {summary.findings.map((f, index) => (
            <div
              key={index}
              className={`finding-item ${f.result === 'ERROR' ? 'finding-error' : f.result === 'FAILED' ? 'finding-failed' : ''}`}
            >
              <div className="finding-header">
                <span className="finding-name">{f.testName}</span>
                <span className={`badge ${getResultBadge(f.result)}`}>{f.result}</span>
                {f.statusCode && (
                  <span className={`mono ${getStatusCodeColor(f.statusCode)}`} style={{ fontSize: '12px' }}>
                    HTTP {f.statusCode}
                  </span>
                )}
                <span className="badge badge-pending" style={{ fontSize: '10px' }}>{f.category}</span>
              </div>
              <div className="finding-reason">{f.reason}</div>
            </div>
          ))}

          <div className="alert alert-info" style={{ marginTop: '16px', marginBottom: 0 }}>
            ℹ️ <strong>Note:</strong> Unexpected or failed tests indicate the API behavior did not match the expected response codes.
            A 500 error is flagged for investigation but may not be a security vulnerability.
          </div>
        </div>
      )}
    </>
  );
}

function getResultBadge(result) {
  const map = {
    'PASSED': 'badge-passed',
    'FAILED': 'badge-failed',
    'ERROR': 'badge-error',
    'UNEXPECTED': 'badge-unexpected'
  };
  return map[result] || 'badge-pending';
}

function getStatusCodeColor(code) {
  if (!code) return '';
  if (code >= 200 && code < 300) return 'stat-passed';
  if (code >= 400 && code < 500) return 'stat-failed';
  if (code >= 500) return 'stat-unexpected';
  return '';
}

export default ResultsDashboard;
