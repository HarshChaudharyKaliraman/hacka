// src/components/ApiConfig.jsx

import React, { useState } from 'react';

function ApiConfig({ onGenerate, onRun, isGenerating, isRunning, hasTestCases }) {
  const [apiUrl, setApiUrl] = useState('');
  const [method, setMethod] = useState('POST');
  const [bodyText, setBodyText] = useState('');
  const [jsonError, setJsonError] = useState('');

  // Validate and parse the JSON body text
  function parseBody() {
    try {
      const parsed = JSON.parse(bodyText);
      setJsonError('');
      return parsed;
    } catch (e) {
      setJsonError('Invalid JSON: ' + e.message);
      return null;
    }
  }

  function handleGenerate() {
    const body = parseBody();
    if (!body) return;
    if (!apiUrl.trim()) {
      setJsonError('API URL cannot be empty.');
      return;
    }
    onGenerate({ apiUrl: apiUrl.trim(), method, requestBody: body });
  }

  function handleRun() {
    const body = parseBody();
    if (!body) return;
    onRun({ apiUrl: apiUrl.trim(), method, originalBody: body });
  }

  const supportsBody = ['POST', 'PUT', 'PATCH'].includes(method);

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-icon">⚙️</span>
        <div>
          <h2>API Configuration</h2>
          <p>Enter your API details below</p>
        </div>
      </div>


      {/* ── API URL ──────────────────────────────────────────────────────── */}
      <div className="form-group">
        <label className="form-label" htmlFor="api-url">Target API URL</label>
        <input
          id="api-url"
          type="text"
          className="form-input"
          value={apiUrl}
          onChange={e => setApiUrl(e.target.value)}
          placeholder="http://localhost:5000/api/products"
        />
      </div>

      {/* ── HTTP Method ──────────────────────────────────────────────────── */}
      <div className="form-group">
        <label className="form-label" htmlFor="http-method">HTTP Method</label>
        <select
          id="http-method"
          className="form-select"
          value={method}
          onChange={e => setMethod(e.target.value)}
        >
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="GET">GET</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>

      {/* ── JSON Body ────────────────────────────────────────────────────── */}
      {supportsBody && (
        <div className="form-group">
          <label className="form-label" htmlFor="request-body">
            JSON Request Body
          </label>
          <textarea
            id="request-body"
            className="form-textarea"
            value={bodyText}
            onChange={e => {
              setBodyText(e.target.value);
              setJsonError('');
            }}
            placeholder='{"name": "Laptop", "price": 45000}'
            spellCheck={false}
          />
          {jsonError && (
            <div className="alert alert-error" style={{ marginTop: '8px', marginBottom: 0 }}>
              ⚠️ {jsonError}
            </div>
          )}
        </div>
      )}

      {/* ── Anomaly hint ─────────────────────────────────────────────────── */}
      <div className="alert alert-info" style={{ marginBottom: '16px' }}>
        💡 <strong>Anomaly tips:</strong>{' '}
        Products → <code style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>"price": 99999</code> triggers a 500.{' '}
        Users → <code style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>"role": "superadmin"</code> triggers a 500.
      </div>

      {/* ── Action Buttons ───────────────────────────────────────────────── */}
      <div className="btn-row">
        <button
          id="btn-generate"
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={isGenerating || isRunning}
        >
          {isGenerating ? (
            <><span className="spinner" /> Generating...</>
          ) : (
            '⚡ Generate Test Cases'
          )}
        </button>

        <button
          id="btn-run"
          className="btn btn-success"
          onClick={handleRun}
          disabled={!hasTestCases || isRunning || isGenerating}
          title={!hasTestCases ? 'Generate test cases first' : 'Run all test cases'}
        >
          {isRunning ? (
            <><span className="spinner" /> Running Tests...</>
          ) : (
            '▶ Run Tests'
          )}
        </button>
      </div>
    </div>
  );
}

export default ApiConfig;
