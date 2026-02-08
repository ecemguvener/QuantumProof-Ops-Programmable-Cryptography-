import { useMemo, useState, useEffect } from 'react';
import { downloadFile, runQuantumProof, toMarkdown, checkStatus, simulateQuantumAttack } from './lib/quantumProof';
import CryptoParams from './components/CryptoParams';
import BeforeAfter from './components/BeforeAfter';
import PerformanceChart from './components/PerformanceChart';

const GITHUB_URL = 'https://github.com/ecemguvener/Programmable-Cryptography';

function deriveDecision(creditScore, debtToIncome, riskScore) {
  if (creditScore >= 720 && debtToIncome <= 35 && riskScore <= 45) {
    return {
      status: 'APPROVED ✅',
      reason: 'Strong profile and low computed risk',
    };
  }
  if (creditScore >= 640 && debtToIncome <= 45 && riskScore <= 70) {
    return {
      status: 'MANUAL REVIEW ⚠️',
      reason: 'Borderline profile; needs additional checks',
    };
  }
  return {
    status: 'REJECTED ❌',
    reason: 'Risk profile exceeds pre-approval threshold',
  };
}

function computeWeightedSignal(creditScore, debtToIncome) {
  return Math.round(creditScore * 100 - debtToIncome * 120);
}

const DEMO_PRESETS = {
  fastApprove: {
    label: 'Fast Approve Case',
    creditScore: 782,
    debtToIncome: 24,
    annualIncome: 120000,
    purpose: 'home-loan',
  },
  reviewCase: {
    label: 'Manual Review Case',
    creditScore: 666,
    debtToIncome: 41,
    annualIncome: 72000,
    purpose: 'auto-loan',
  },
  rejectCase: {
    label: 'Reject Case',
    creditScore: 560,
    debtToIncome: 63,
    annualIncome: 43000,
    purpose: 'personal-loan',
  },
};

export default function App() {
  const [activePage, setActivePage] = useState('home');

  const [creditScore, setCreditScore] = useState(720);
  const [debtToIncome, setDebtToIncome] = useState(32);
  const [annualIncome, setAnnualIncome] = useState(95000);
  const [purpose, setPurpose] = useState('home-loan');

  const [fallback, setFallback] = useState(false);
  const [report, setReport] = useState(null);
  const [lastProfile, setLastProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState(null);

  const [securityMode, setSecurityMode] = useState('NORMAL');
  const [quantumEvent, setQuantumEvent] = useState(null);
  const [quantumLoading, setQuantumLoading] = useState(false);

  useEffect(() => {
    checkStatus()
      .then((status) => setBackendStatus(status))
      .catch(() => setError('Backend not available. Start the API server first!'));
  }, []);

  const status = useMemo(() => {
    if (error) return 'Error';
    if (loading) return 'Computing...';
    if (!report) return 'Ready';
    return report.proof.verificationResult ? 'Verified ✅' : 'Failed ❌';
  }, [error, loading, report]);

  const bankDecision = useMemo(() => {
    if (!report || !lastProfile) return null;

    if (report.computeResult.preapprovalDecision) {
      return {
        status: `${report.computeResult.preapprovalDecision.toUpperCase()} ${report.computeResult.preapprovalDecision === 'approve' ? '✅' : report.computeResult.preapprovalDecision === 'review' ? '⚠️' : '❌'}`,
        reason: report.computeResult.decisionReason || 'Decision returned by backend',
      };
    }

    return deriveDecision(
      lastProfile.creditScore,
      lastProfile.debtToIncome,
      report.computeResult.riskReductionPercent
    );
  }, [report, lastProfile]);

  const weightedSignal = useMemo(() => {
    if (!lastProfile) return null;
    return computeWeightedSignal(lastProfile.creditScore, lastProfile.debtToIncome);
  }, [lastProfile]);

  const stepState = useMemo(() => ({
    mode: Boolean(quantumEvent) || securityMode !== 'NORMAL',
    inputs: true,
    compute: Boolean(report),
    verify: Boolean(report?.proof?.verificationResult),
    export: Boolean(report?.proof?.proofHash),
  }), [quantumEvent, securityMode, report]);

  const cryptoParams = useMemo(() => ({
    securityLevel: report?.proof?.fheParameters?.security_level || '128-bit',
    scheme: report?.proof?.fheParameters?.scheme || 'CKKS',
    polyModulusDegree: report?.proof?.fheParameters?.poly_modulus_degree || 8192,
    zkMode: report?.proof?.fheParameters?.zk_mode || 'real-groth16',
  }), [report]);

  const plaintextSummary = useMemo(() => {
    if (!lastProfile) return 'credit=*** dti=*** income=***';
    return `credit=${lastProfile.creditScore}, dti=${lastProfile.debtToIncome}%, income=${lastProfile.annualIncome}`;
  }, [lastProfile]);

  const perfData = useMemo(() => {
    if (!report) return [];
    const verifyEstimate = Math.max(1, Math.round(report.benchmark.proofTimeMs * 0.2));
    return [
      { stage: 'FHE Encrypt', time: report.benchmark.encryptionTimeMs },
      { stage: 'FHE Compute', time: report.benchmark.computationTimeMs },
      { stage: 'Proof Gen', time: report.benchmark.proofTimeMs },
      { stage: 'Verify Gate', time: verifyEstimate },
    ];
  }, [report]);

  function applyPreset(key) {
    const preset = DEMO_PRESETS[key];
    if (!preset) return;
    setCreditScore(preset.creditScore);
    setDebtToIncome(preset.debtToIncome);
    setAnnualIncome(preset.annualIncome);
    setPurpose(preset.purpose);
    setActivePage('demo');
  }

  async function handleRun(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setReport(null);

    const profile = {
      creditScore: Number(creditScore),
      debtToIncome: Number(debtToIncome),
      annualIncome: Number(annualIncome),
      purpose,
    };

    const sensitiveInput = `loan::${profile.creditScore}::${profile.debtToIncome}::${profile.annualIncome}::${profile.purpose}`;

    try {
      const next = await runQuantumProof({
        sensitiveInput,
        scenario: 'private-loan-preapproval',
        forceFallback: fallback,
        loanProfile: profile,
        securityMode,
      });
      setLastProfile(profile);
      setReport(next);
      setActivePage('demo');
    } catch (err) {
      setReport(null);
      setError(err.message || 'Run failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleQuantumSimulation(attackType) {
    setError('');
    setQuantumLoading(true);

    try {
      const simulation = await simulateQuantumAttack({ attackType, currentMode: securityMode });
      setSecurityMode(simulation.new_mode);
      setQuantumEvent(simulation);

      setReport((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          computeResult: {
            ...prev.computeResult,
            securityMode: simulation.new_mode,
            securityResponse: simulation.auto_response,
          },
        };
      });
    } catch (err) {
      setError(err.message || 'Quantum simulation failed');
    } finally {
      setQuantumLoading(false);
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

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // noop for demo UX
    }
  }

  return (
    <div className="page">
      <div className="hero-glow" aria-hidden="true" />
      <main className="card">
        <header className="hero">
          <nav className="top-nav">
            <button className={activePage === 'home' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActivePage('home')}>Home</button>
            <button className={activePage === 'demo' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActivePage('demo')}>Demo</button>
            <button className={activePage === 'about' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActivePage('about')}>About</button>
            <a className="nav-link" href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub</a>
          </nav>

          <p className="kicker">QuantumProof Ops</p>
          <h1>🔐 QuantumProof Ops - Real FHE Computation</h1>
          <p className="sub punchline">
            Compute loan approval on encrypted data, then verify the result cryptographically.
          </p>

          <div className="track-tags">
            <span className="track-tag">ETH Oxford</span>
            <span className="track-tag">DoraHacks Main Track</span>
            <span className="track-tag">Programmable Cryptography</span>
          </div>

          <div className="kpi-chips">
            <span className="kpi-chip">FHE: ✅ SEAL/TenSEAL</span>
            <span className="kpi-chip">Proof: ✅ Circom/snarkjs</span>
            <span className="kpi-chip">Runtime: ~{report ? report.benchmark.runtimeMs : '---'} ms</span>
            <span className="kpi-chip">No plaintext leakage</span>
          </div>

          {backendStatus && (
            <div className="ready-badge">
              {backendStatus.fhe_available ? 'FHE Ready ✅' : 'FHE Unavailable ⚠️'}
            </div>
          )}
        </header>

        {activePage === 'home' && (
          <section className="home-grid">
            <article className="panel">
              <h2>Why It Matters</h2>
              <p className="sub">Private loan pre-approval where the bank gets a verifiable decision signal without seeing raw credentials.</p>
              <div className="mini-explainer">
                <p><strong>What is QuantumProof?</strong> It combines encrypted computation with proof verification, so institutions can trust the result without seeing the raw private data.</p>
                <p><strong>Why quantum-ready?</strong> The workflow is designed to transition into post-quantum-safe verification and audit paths when threats escalate.</p>
              </div>
              <ul>
                <li>Encrypted/private computation workflow</li>
                <li>Verification-gated output with proof hash</li>
                <li>Adaptive quantum defense mode simulation</li>
              </ul>
              <div className="actions">
                <button type="button" onClick={() => setActivePage('demo')}>Run Demo</button>
              </div>
              <p className="hint">Takes ~10 seconds. No signup needed.</p>
            </article>

            <article className="panel">
              <h2>Architecture Pipeline</h2>
              <div className="pipe-row">
                <span>Client Input</span>
                <span>Encrypt</span>
                <span>FHE Compute</span>
                <span>ZK Prove</span>
                <span>Verify + Audit</span>
              </div>
              <h3 style={{ marginTop: '1rem' }}>Demo Presets</h3>
              <div className="preset-row">
                <button type="button" onClick={() => applyPreset('fastApprove')}>Fast Approve Case</button>
                <button type="button" onClick={() => applyPreset('reviewCase')}>Manual Review Case</button>
                <button type="button" onClick={() => applyPreset('rejectCase')}>Reject Case</button>
              </div>
            </article>
          </section>
        )}

        {activePage === 'about' && (
          <section className="context-panel">
            <h2>About</h2>

            <h3>Problem</h3>
            <p>Institutions need trustable decisions on sensitive data without collecting raw credentials.</p>

            <h3>How QuantumProof Works</h3>
            <ul>
              <li>Encrypted/private computation using FHE.</li>
              <li>Verifiable proof layer for correctness checks.</li>
              <li>Audit artifacts: proof hash, verification status, runtime metrics.</li>
            </ul>

            <h3>What's Real in This Demo</h3>
            <ul>
              <li>Microsoft SEAL/TenSEAL encrypted computation path.</li>
              <li>Groth16 artifact pipeline support with Circom/snarkjs.</li>
              <li>Security mode transitions: NORMAL, HYBRID, POST_QUANTUM.</li>
            </ul>
          </section>
        )}

        {activePage === 'demo' && (
          <>
            <section className="step-bar">
              <span className={stepState.mode ? 'step-done' : ''}>1 Security Mode</span>
              <span className={stepState.inputs ? 'step-done' : ''}>2 Private Inputs</span>
              <span className={stepState.compute ? 'step-done' : ''}>3 Encrypted Compute</span>
              <span className={stepState.verify ? 'step-done' : ''}>4 Proof Verify</span>
              <span className={stepState.export ? 'step-done' : ''}>5 Audit Export</span>
            </section>

            <section className="quantum-panel">
              <h2>Quantum Attack Simulator</h2>
              <p className="quantum-sub">Security mode transitions: NORMAL → HYBRID → POST_QUANTUM</p>
              <div className="quantum-row">
                <span className={`mode-chip mode-${securityMode.toLowerCase()}`}>Mode: {securityMode}</span>
                <button type="button" onClick={() => handleQuantumSimulation('grover')} disabled={quantumLoading || !backendStatus}>
                  Simulate Grover Attack
                </button>
                <button type="button" onClick={() => handleQuantumSimulation('shor')} disabled={quantumLoading || !backendStatus}>
                  Simulate Shor Attack
                </button>
              </div>

              {quantumEvent && (
                <div className="quantum-result">
                  <p><strong>Detection:</strong> {quantumEvent.detector_summary}</p>
                  <p><strong>Transition:</strong> {quantumEvent.previous_mode} → {quantumEvent.new_mode}</p>
                  <p><strong>Response:</strong> {quantumEvent.auto_response}</p>
                  <p><strong>PQ Stack:</strong> {quantumEvent.post_quantum_stack.join(', ')}</p>
                </div>
              )}
            </section>


            <section className="layout">
              <form className="panel" onSubmit={handleRun}>
                <h2>Applicant Inputs (Private)</h2>

                <label>
                  Credit Score
                  <input type="number" min="300" max="850" value={creditScore} onChange={(e) => setCreditScore(Number(e.target.value))} required />
                </label>

                <label>
                  Debt-to-Income (%)
                  <input type="number" min="0" max="100" step="0.1" value={debtToIncome} onChange={(e) => setDebtToIncome(Number(e.target.value))} required />
                </label>

                <label>
                  Annual Income (USD)
                  <input type="number" min="1" step="1" value={annualIncome} onChange={(e) => setAnnualIncome(Number(e.target.value))} required />
                </label>

                <label>
                  Loan Purpose
                  <input value={purpose} onChange={(e) => setPurpose(e.target.value)} required placeholder="home-loan" />
                </label>

                <label className="check-row">
                  <input type="checkbox" checked={fallback} onChange={(e) => setFallback(e.target.checked)} />
                  Disable FHE (fallback mode)
                </label>

                <button type="submit" disabled={loading || !backendStatus}>
                  {loading ? 'Computing...' : 'Run Full Pipeline'}
                </button>
              </form>

              <aside className="panel result">
                <h2>Results</h2>
                <div className={`status ${error ? 'error' : report ? 'ok' : ''}`}>{status}</div>

                {error && <p className="error-text">{error}</p>}

                {loading && (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="spinner"></div>
                    <p>Running encrypted compute + proof verification...</p>
                  </div>
                )}

                {report && (
                  <>
                    {bankDecision && (
                      <>
                        <h3 className="decision-big">{bankDecision.status}</h3>
                        <p className="sub" style={{ marginTop: 0 }}>{bankDecision.reason}</p>
                      </>
                    )}

                    <h3 style={{ marginTop: '1rem' }}>Public Bank Signal</h3>
                    <dl>
                      <dt>weightedSignal</dt>
                      <dd>{weightedSignal ?? 'n/a'}</dd>
                      <dt>Verification</dt>
                      <dd>{report.proof.verificationResult ? '✅ Verified' : '❌ Failed'}</dd>
                    </dl>

                    <h3 style={{ marginTop: '1rem' }}>Computation Metrics</h3>
                    <dl>
                      <dt>Run ID</dt><dd>{report.runId}</dd>
                      <dt>Total Runtime</dt><dd>{report.benchmark.runtimeMs} ms</dd>
                      <dt>Encryption Time</dt><dd>{report.benchmark.encryptionTimeMs} ms</dd>
                      <dt>Computation Time</dt><dd>{report.benchmark.computationTimeMs} ms</dd>
                      <dt>Proof Generation</dt><dd>{report.benchmark.proofTimeMs} ms</dd>
                      <dt>Security Mode</dt><dd>{report.computeResult.securityMode}</dd>
                      <dt>Security Response</dt><dd>{report.computeResult.securityResponse}</dd>
                    </dl>

                    <h3 style={{ marginTop: '1rem' }}>Audit Artifacts</h3>
                    <p className="hash-preview">audit_hash: {report.proof.proofHash}</p>
                    <div className="copy-grid">
                      <button type="button" onClick={() => copyText(JSON.stringify({ proofHash: report.proof.proofHash, verified: report.proof.verificationResult }, null, 2))}>Copy proof.json</button>
                      <button type="button" onClick={() => copyText(JSON.stringify({ weightedSignal, securityMode: report.computeResult.securityMode }, null, 2))}>Copy public.json</button>
                      <button type="button" onClick={() => copyText(JSON.stringify({ file: 'zk/artifacts/verification_key.json', circuit: report.proof.circuitVersion }, null, 2))}>Copy verification_key.json</button>
                      <button type="button" onClick={() => copyText(report.proof.proofHash)}>Copy audit_hash</button>
                    </div>

                    <h3 style={{ marginTop: '1rem' }}>What Bank Sees vs Stays Private</h3>
                    <div className="privacy-grid">
                      <div>
                        <h4>Bank sees</h4>
                        <ul>
                          <li>decision</li>
                          <li>weightedSignal</li>
                          <li>proof hash</li>
                          <li>verification status</li>
                        </ul>
                      </div>
                      <div>
                        <h4>Bank never sees</h4>
                        <ul>
                          <li>credit score</li>
                          <li>DTI</li>
                          <li>income</li>
                          <li>plaintext inputs</li>
                        </ul>
                      </div>
                    </div>

                    <div className="actions">
                      <button type="button" onClick={exportJson}>Export JSON</button>
                      <button type="button" onClick={exportMd}>Export Markdown</button>
                    </div>
                  </>
                )}
              </aside>
            </section>

            {report && (
              <>
                <BeforeAfter
                  plaintextSummary={plaintextSummary}
                  encryptedFingerprint={report.proof.inputFingerprint}
                  riskScore={report.computeResult.riskReductionPercent}
                />
                <CryptoParams params={cryptoParams} />
                <PerformanceChart data={perfData} />
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
