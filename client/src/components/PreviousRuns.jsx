// src/components/PreviousRuns.jsx
// Shows all past test runs saved in browser localStorage.
// No server requests needed — everything is read from localStorage.
// The user can click any run to restore it in the ResultsDashboard,
// or clear the entire history with one button.

import React, { useState, useCallback } from 'react';
import useTestHistory from '../hooks/useTestHistory';

function PreviousRuns({ onSelectRun }) {
  const { runs, getRunById, clearHistory, refresh } = useTestHistory();
  const [selectedId, setSelectedId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Select a run and pass it up to App.jsx
  const handleSelectRun = useCallback((runId) => {
    if (selectedId === runId) {
      setSelectedId(null);
      return;
    }
    setSelectedId(runId);
    const run = getRunById(runId);
    if (run && onSelectRun) onSelectRun(run);
  }, [selectedId, getRunById, onSelectRun]);

  // Clear all history
  const handleClear = useCallback(() => {
    clearHistory();
    setSelectedId(null);
    setShowClearConfirm(false);
  }, [clearHistory]);

  // Format timestamp for display
  function formatDate(dateString) {
    const d = new Date(dateString);
    return d.toLocaleString();
  }

  // Relative time label (e.g. "2 min ago")
  function relativeTime(dateString) {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-icon">🗂️</span>
        <div>
          <h2>Previous Test Runs</h2>
          <p>
            {runs.length === 0
              ? 'No runs yet — results will be saved here automatically'
              : `${runs.length} run${runs.length !== 1 ? 's' : ''} stored in browser cache`}
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="btn btn-outline"
            onClick={refresh}
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            ↺ Refresh
          </button>

          {runs.length > 0 && !showClearConfirm && (
            <button
              className="btn btn-outline"
              onClick={() => setShowClearConfirm(true)}
              style={{ padding: '6px 12px', fontSize: '12px', borderColor: 'var(--danger, #f87171)', color: 'var(--danger, #f87171)' }}
            >
              🗑 Clear All
            </button>
          )}

          {showClearConfirm && (
            <>
              <span style={{ fontSize: '12px', opacity: 0.7 }}>Are you sure?</span>
              <button
                className="btn btn-outline"
                onClick={handleClear}
                style={{ padding: '6px 12px', fontSize: '12px', borderColor: 'var(--danger, #f87171)', color: 'var(--danger, #f87171)' }}
              >
                Yes, clear
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setShowClearConfirm(false)}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Storage info banner */}
      {runs.length > 0 && (
        <div style={{
          padding: '8px 16px',
          background: 'rgba(99,102,241,0.08)',
          borderBottom: '1px solid rgba(99,102,241,0.15)',
          fontSize: '12px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>💾</span>
          <span>Stored in <strong>localStorage</strong> — persists across page reloads. Max 50 runs.</span>
        </div>
      )}

      {/* No runs yet */}
      {runs.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <p>No test runs saved yet.<br />Run some tests and they will appear here automatically.</p>
        </div>
      )}

      {/* Run list */}
      {runs.length > 0 && (
        <div className="runs-list">
          {runs.map(run => {
            const passRate = run.totalTests > 0
              ? Math.round((run.passedTests / run.totalTests) * 100)
              : 0;
            const isSelected = selectedId === run.id;

            return (
              <div
                key={run.id}
                className="run-item"
                onClick={() => handleSelectRun(run.id)}
                style={{ borderColor: isSelected ? 'var(--accent)' : undefined, cursor: 'pointer' }}
              >
                {/* Left: URL, date, relative time */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ opacity: 0.6, marginRight: '6px' }}>{run.method}</span>
                    {run.apiUrl}
                  </div>
                  <div className="run-meta" style={{ marginTop: '2px', display: 'flex', gap: '8px' }}>
                    <span>{formatDate(run.createdAt)}</span>
                    <span style={{ opacity: 0.5 }}>·</span>
                    <span>{relativeTime(run.createdAt)}</span>
                  </div>
                </div>

                {/* Right: Stats badges + pass rate */}
                <div className="run-stats" style={{ flexShrink: 0 }}>
                  {/* Pass rate pill */}
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: passRate === 100
                      ? 'rgba(34,197,94,0.15)'
                      : passRate >= 70
                        ? 'rgba(234,179,8,0.15)'
                        : 'rgba(239,68,68,0.15)',
                    color: passRate === 100
                      ? '#22c55e'
                      : passRate >= 70
                        ? '#ca8a04'
                        : '#ef4444',
                    marginRight: '4px'
                  }}>
                    {passRate}% pass
                  </span>

                  <span className="badge badge-info">{run.totalTests} tests</span>
                  <span className="badge badge-passed">✅ {run.passedTests}</span>
                  <span className="badge badge-failed">❌ {run.failedTests}</span>
                  {run.unexpectedTests > 0 && (
                    <span className="badge badge-unexpected">⚠️ {run.unexpectedTests}</span>
                  )}
                  {run.errorTests > 0 && (
                    <span className="badge badge-error">💜 {run.errorTests}</span>
                  )}

                  {isSelected && (
                    <span style={{ fontSize: '11px', opacity: 0.6, marginLeft: '4px' }}>← viewing</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PreviousRuns;
