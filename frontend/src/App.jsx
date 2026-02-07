import { useMemo, useState, useEffect } from 'react';
import { downloadFile, runQuantumProof, toMarkdown, checkStatus } from './lib/quantumProof';

export default function App() {
  const [sensitiveInput, setSensitiveInput] = useState('credit-score-750');
  const [scenario, setScenario] = useState('web-demo');
  const [fallback, setFallback] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState(null);

  // Check backend status on mount
  useEffect(() => {
    checkStatus()
      .then(status => setBackendStatus(status))
      .catch(err => setError('Backend not available. Start the API server first!'));
  }, []);

  const status = useMemo(() => {
    if (error) return 'Error';
    if (loading) return 'Computing...';
    if (!report) return 'Ready';
    return report.proof.verificationResult ? 'Verified ✅' : 'Failed ❌';
  }, [error, loading, report]);

  async function handleRun(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setReport(null);

    try {
      const next = await runQuantumProof({ sensitiveInput, scenario, forceFallback: fallback });
      setReport(next);
    } catch (err) {
      setReport(null);
      setError(err.message || 'Run failed');
    } finally {
      setLoading(false);
    }
  }

  function exportJson() {
    if (!report) return;
    downloadFile(`${report.runId}.json`, JSON.stringify(report, null, 2), 'application/json');
  }

  function exportMd() {
    if (!report) return;
    downloadFile(`${report.runId}.md`, toMarkdown(report), 'text/markdown');
  }

  return (
    <div className="page">
      <div className="hero-glow" aria-hidden="true" />
      <main className="card">
        <header className="hero">
          <p className="kicker">QuantumProof Ops</p>
          <h1>🔐 Real FHE Computation</h1>
          <p className="sub">
            Privacy-preserving computation using <strong>Microsoft SEAL</strong> (FHE) + Zero-Knowledge Proofs + Quantum-Resistant Primitives
          </p>

          {backendStatus && (
            <div style={{ marginTop: '1rem', padding: '0.5rem', background: backendStatus.fhe_available ? '#0f4' : '#f80', borderRadius: '4px', fontSize: '0.9rem' }}>
              <strong>{backendStatus.fhe_available ? '✅ FHE Available' : '⚠️ FHE Unavailable'}</strong> - {backendStatus.library}
            </div>
          )}
        </header>

        <section className="layout">
          <form className="panel" onSubmit={handleRun}>
            <h2>Run FHE Computation</h2>

            <label>
              Sensitive Input (e.g., credit-score-750)
              <input
                type="text"
                value={sensitiveInput}
                onChange={(e) => setSensitiveInput(e.target.value)}
                required
                placeholder="credit-score-750"
              />
            </label>

            <label>
              Scenario
              <input
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                required
                placeholder="web-demo"
              />
            </label>

            <label className="check-row">
              <input type="checkbox" checked={fallback} onChange={(e) => setFallback(e.target.checked)} />
              Disable FHE (fallback mode)
            </label>

            <button type="submit" disabled={loading || !backendStatus}>
              {loading ? 'Computing...' : 'Run FHE Workflow'}
            </button>
          </form>

          <aside className="panel result">
            <h2>Results</h2>
            <div className={`status ${error ? 'error' : report ? 'ok' : ''}`}>{status}</div>

            {error && <p className="error-text">{error}</p>}

            {loading && (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="spinner"></div>
                <p>Running real FHE computation...</p>
              </div>
            )}

            {report && (
              <>
                <dl>
                  <dt>Run ID</dt>
                  <dd>{report.runId}</dd>

                  <dt>FHE Enabled</dt>
                  <dd>{report.computeResult.fheEnabled ? '✅ Yes' : '❌ No'}</dd>

                  <dt>FHE Scheme</dt>
                  <dd>{report.computeResult.fheScheme}</dd>

                  <dt>Verification</dt>
                  <dd>{report.proof.verificationResult ? '✅ Verified' : '❌ Failed'}</dd>

                  <dt>Total Runtime</dt>
                  <dd>{report.benchmark.runtimeMs} ms</dd>

                  <dt>Encryption Time</dt>
                  <dd>{report.benchmark.encryptionTimeMs} ms</dd>

                  <dt>Computation Time</dt>
                  <dd>{report.benchmark.computationTimeMs} ms</dd>

                  <dt>Risk Score</dt>
                  <dd>{report.computeResult.riskReductionPercent}%</dd>

                  <dt>FHE Overhead</dt>
                  <dd>{report.computeResult.performanceOverheadPercent}%</dd>
                </dl>

                <h3 style={{ marginTop: '1.5rem' }}>Crypto Primitives Used</h3>
                <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                  {report.proof.cryptoPrimitivesUsed.map((p, i) => (
                    <li key={i} style={{ fontSize: '0.9rem' }}>{p}</li>
                  ))}
                </ul>

                <div className="actions">
                  <button type="button" onClick={exportJson}>
                    Export JSON
                  </button>
                  <button type="button" onClick={exportMd}>
                    Export Markdown
                  </button>
                </div>
              </>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
}
