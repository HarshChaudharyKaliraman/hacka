// src/App.jsx
// The main application component.
// History is now stored entirely in browser localStorage via the useTestHistory hook.
//
// DATA FLOW:
// User fills ApiConfig → clicks Generate → App calls /api/tests/generate → stores testCases
// User clicks Run → App calls /api/tests/run → saves run to localStorage → displays in ResultsDashboard

import React, { useState } from 'react';
import ApiConfig from './components/ApiConfig';
import TestCaseList from './components/TestCaseList';
import ResultsDashboard from './components/ResultsDashboard';
import PreviousRuns from './components/PreviousRuns';
import useTestHistory from './hooks/useTestHistory';

function App() {
  // Generated test cases (before running)
  const [testCases, setTestCases] = useState([]);

  // Results and summary (after running)
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);

  // Loading states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Error and success messages
  const [generateError, setGenerateError] = useState('');
  const [runError, setRunError] = useState('');
  const [runSuccess, setRunSuccess] = useState('');

  // Store the current config so we can pass originalBody when running
  const [currentConfig, setCurrentConfig] = useState(null);

  // localStorage-backed history
  const { addRun } = useTestHistory();

  /**
   * handleGenerate
   * Called when user clicks "Generate Test Cases".
   */
  async function handleGenerate(config) {
    setIsGenerating(true);
    setGenerateError('');
    setTestCases([]);
    setResults([]);
    setSummary(null);
    setRunError('');
    setRunSuccess('');
    setCurrentConfig(config);

    try {
      const response = await fetch('/api/tests/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: config.method,
          requestBody: config.requestBody
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate test cases.');
      }

      setTestCases(data.testCases);

    } catch (err) {
      setGenerateError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }

  /**
   * handleRun
   * Called when user clicks "Run Tests".
   * Saves the completed run to localStorage for history.
   */
  async function handleRun(config) {
    if (testCases.length === 0) {
      setRunError('No test cases to run. Please generate test cases first.');
      return;
    }

    setIsRunning(true);
    setRunError('');
    setRunSuccess('');
    setResults([]);
    setSummary(null);

    try {
      const response = await fetch('/api/tests/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl: config.apiUrl,
          method: config.method,
          originalBody: config.originalBody,
          testCases: testCases
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run tests.');
      }

      setResults(data.results);
      setSummary(data.summary);

      // Save to localStorage history
      const runId = addRun({
        apiUrl: config.apiUrl,
        method: config.method,
        originalBody: config.originalBody,
        summary: data.summary,
        results: data.results
      });

      setRunSuccess(`✅ Test run complete! Saved to history (ID: ${runId.slice(0, 16)}…)`);

      // Scroll to results
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);

    } catch (err) {
      setRunError(err.message);
    } finally {
      setIsRunning(false);
    }
  }

  /**
   * handleSelectRun
   * Called when user clicks a previous test run — restores it in the dashboard.
   */
  function handleSelectRun(testRun) {
    setSummary(testRun.summary);
    setResults(testRun.results);
    setRunSuccess(`📂 Loaded past run from ${new Date(testRun.createdAt).toLocaleString()}`);

    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  }

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-title">
            <span className="app-title-icon">🛡️</span>
            <div>
              <h1>Autonomous API Fuzzing Generator</h1>
              <p>Synthetic test case generation · Automated validation · Anomaly detection</p>
            </div>
          </div>
        </div>
      </header>

      <div className="app-wrapper">

        {/* ── Section 1: API Config ────────────────────────────── */}
        <ApiConfig
          onGenerate={handleGenerate}
          onRun={handleRun}
          isGenerating={isGenerating}
          isRunning={isRunning}
          hasTestCases={testCases.length > 0}
        />

        {/* ── Generate Error ───────────────────────────────────── */}
        {generateError && (
          <div className="alert alert-error">⚠️ {generateError}</div>
        )}

        {/* ── Section 2: Generated Test Cases ─────────────────── */}
        <TestCaseList testCases={testCases} />

        {/* ── Run Error / Success ──────────────────────────────── */}
        {runError && (
          <div className="alert alert-error">⚠️ {runError}</div>
        )}
        {runSuccess && (
          <div className="alert alert-success">{runSuccess}</div>
        )}

        {/* ── Section 3: Results Dashboard ─────────────────────── */}
        <div id="results-section">
          <ResultsDashboard summary={summary} results={results} />
        </div>

        {/* ── Section 4: Previous Runs (localStorage) ──────────── */}
        <PreviousRuns onSelectRun={handleSelectRun} />

      </div>
    </div>
  );
}

export default App;
