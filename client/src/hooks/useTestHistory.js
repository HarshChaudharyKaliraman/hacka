// src/hooks/useTestHistory.js
// Custom hook that persists test run history in browser localStorage.
// Stores up to MAX_RUNS entries (most recent first).
// Each run is self-contained so the full results dashboard can be restored.

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'apiFuzzer_testHistory';
const MAX_RUNS = 50;

/**
 * Read runs from localStorage, returning [] on any parse error.
 */
function readFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * useTestHistory
 * Returns:
 *   runs        — array of saved test run objects (newest first)
 *   addRun      — fn(runData) → saves a new run and returns the generated id
 *   getRunById  — fn(id)      → finds a single run by id
 *   clearHistory— fn()        → wipes all saved runs
 *   refresh     — fn()        → re-reads localStorage into state
 */
export default function useTestHistory() {
  const [runs, setRuns] = useState(() => readFromStorage());

  const refresh = useCallback(() => {
    setRuns(readFromStorage());
  }, []);

  /**
   * addRun — saves a completed test run into localStorage.
   * @param {object} runData — should contain: apiUrl, method, originalBody, summary, results
   * @returns {string} the generated id for the new run
   */
  const addRun = useCallback((runData) => {
    const id = `run_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newRun = {
      id,
      createdAt: new Date().toISOString(),
      apiUrl: runData.apiUrl,
      method: runData.method,
      originalBody: runData.originalBody || null,
      totalTests: runData.summary?.totalTests ?? 0,
      passedTests: runData.summary?.passedTests ?? 0,
      failedTests: runData.summary?.failedTests ?? 0,
      errorTests: runData.summary?.errorTests ?? 0,
      unexpectedTests: runData.summary?.unexpectedTests ?? 0,
      summary: runData.summary,
      results: runData.results
    };

    setRuns(prev => {
      const updated = [newRun, ...prev].slice(0, MAX_RUNS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        // localStorage quota exceeded — drop oldest entry and retry
        const trimmed = [newRun, ...prev].slice(0, Math.max(1, prev.length - 5));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        return trimmed;
      }
      return updated;
    });

    return id;
  }, []);

  /**
   * getRunById — finds a run in the current state by id.
   * @param {string} id
   * @returns {object|undefined}
   */
  const getRunById = useCallback((id) => {
    return readFromStorage().find(r => r.id === id);
  }, []);

  /**
   * clearHistory — removes all stored runs.
   */
  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRuns([]);
  }, []);

  return { runs, addRun, getRunById, clearHistory, refresh };
}
