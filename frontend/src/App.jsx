import { useMemo, useState } from 'react';
import { downloadFile, runQuantumProof, toMarkdown } from './lib/quantumProof';

export default function App() {
  const [sensitiveInput, setSensitiveInput] = useState('sample-sensitive-data');
  const [scenario, setScenario] = useState('exchange-wallet-stack-v1');
  const [fallback, setFallback] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const status = useMemo(() => {
    if (error) return 'Verification blocked';
    if (!report) return 'Ready to run';
    return report.proof.verificationResult ? 'Verified' : 'Unverified';
  }, [error, report]);

  function handleRun(e) {
    e.preventDefault();
    setError('');
    try {
      const next = runQuantumProof({ sensitiveInput, scenario, forceFallback: fallback });
      setReport(next);
    } catch (err) {
      setReport(null);
      setError(err.message || 'Run failed');
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
          <h1>Private Compute + Verifiable Proofs</h1>
          <p className="sub">
            Run a CLI-style workflow in-browser: simulate private computation, verify proof output, and export audit-ready artifacts.
          </p>
        </header>

        <section className="layout">
          <form className="panel" onSubmit={handleRun}>
            <h2>Run Scenario</h2>
            <label>
              Sample Sensitive Input
              <textarea value={sensitiveInput} onChange={(e) => setSensitiveInput(e.target.value)} required rows={5} />
            </label>

            <label>
              Scenario
              <input value={scenario} onChange={(e) => setScenario(e.target.value)} required />
            </label>

            <label className="check-row">
              <input type="checkbox" checked={fallback} onChange={(e) => setFallback(e.target.checked)} />
              Force deterministic fallback mode
            </label>

            <button type="submit">Run Workflow</button>
          </form>

          <aside className="panel result">
            <h2>Run Status</h2>
            <div className={`status ${error ? 'error' : report ? 'ok' : ''}`}>{status}</div>

            {error && <p className="error-text">{error}</p>}

            {report && (
              <>
                <dl>
                  <dt>Run ID</dt>
                  <dd>{report.runId}</dd>

                  <dt>Verification</dt>
                  <dd>{String(report.proof.verificationResult)}</dd>

                  <dt>Runtime</dt>
                  <dd>{report.benchmark.runtimeMs} ms</dd>

                  <dt>Risk Reduction</dt>
                  <dd>{report.computeResult.riskReductionPercent}%</dd>

                  <dt>Perf Overhead</dt>
                  <dd>{report.computeResult.performanceOverheadPercent}%</dd>
                </dl>

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
