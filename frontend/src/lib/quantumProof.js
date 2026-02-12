// QuantumProof API Client

const API_BASE = (import.meta.env.VITE_API_URL || 'https://quantumproof-ops-programmable.onrender.com') + '/api';

function normalizePrimitiveName(name) {
  if (!name) return name;
  if (name.toLowerCase().includes('zero-knowledge')) {
    return 'Verifiable computation layer (Circom/SNARK-compatible architecture)';
  }
  return name;
}

export async function checkStatus() {
  const response = await fetch(`${API_BASE}/status`);
  if (!response.ok) throw new Error('Backend not available');
  return await response.json();
}

export async function runQuantumProof({ sensitiveInput, scenario, forceFallback, loanProfile, securityMode }) {
  const response = await fetch(`${API_BASE}/compute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sensitiveInput, scenario, forceFallback, loanProfile, securityMode }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Computation failed');
  }

  const result = data.result;
  return {
    runId: result.run_id,
    timestampUtc: result.timestamp_utc,
    scenario: result.scenario,
    riskContext: result.risk_context,
    trustModelComparison: result.trust_model_comparison,
    computeResult: {
      riskReductionPercent: result.compute_result.risk_reduction_percent,
      performanceOverheadPercent: result.compute_result.performance_overhead_percent,
      recommendedRollout: result.compute_result.recommended_rollout,
      fheEnabled: result.compute_result.fhe_enabled || false,
      fheScheme: result.compute_result.fhe_scheme || 'N/A',
      preapprovalDecision: result.compute_result.preapproval_decision || null,
      decisionReason: result.compute_result.decision_reason || null,
      privacyNote: result.compute_result.privacy_note || null,
      model: result.compute_result.model || null,
      securityMode: result.compute_result.security_mode || 'NORMAL',
      defenseProfile: result.compute_result.defense_profile || 'normal-monitoring-v1',
      securityResponse: result.compute_result.security_response || 'Standard monitoring mode',
    },
    benchmark: {
      runtimeMs: result.benchmark.runtime_ms,
      computeMode: result.benchmark.compute_mode,
      encryptionTimeMs: result.benchmark.encryption_time_ms,
      computationTimeMs: result.benchmark.computation_time_ms,
      proofTimeMs: result.benchmark.proof_time_ms,
    },
    proof: {
      proofHash: result.proof.proof_hash,
      verificationResult: result.proof.verification_result,
      circuitVersion: result.proof.circuit_version,
      inputFingerprint: result.proof.input_fingerprint,
      cryptoPrimitivesUsed: (result.proof.crypto_primitives_used || []).map(normalizePrimitiveName),
      fheParameters: result.proof.fhe_parameters || {},
    },
  };
}

export async function simulateQuantumAttack({ attackType, currentMode }) {
  const response = await fetch(`${API_BASE}/quantum/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attackType, currentMode }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Quantum simulation failed');
  }

  return data.simulation;
}

export function toMarkdown(report) {
  const primitivesList = (report.proof.cryptoPrimitivesUsed || [])
    .map((p) => `  - ${p}`)
    .join('\n');

  const decisionBlock = report.computeResult.preapprovalDecision
    ? `\n## Private Loan Pre-Approval\n- **Decision**: \`${report.computeResult.preapprovalDecision.toUpperCase()}\`\n- **Reason**: ${report.computeResult.decisionReason}\n- **Privacy Note**: ${report.computeResult.privacyNote}\n`
    : '';

  return `# QuantumProof Ops - FHE Computation Report

## Run Metadata
- **Run ID**: \`${report.runId}\`
- **Timestamp**: \`${report.timestampUtc}\`
- **Scenario**: \`${report.scenario}\`
- **Verification**: \`${report.proof.verificationResult ? '✅ VERIFIED' : '❌ FAILED'}\`

## Cryptographic Primitives
${primitivesList}
${decisionBlock}
## Results
- **Risk Score**: \`${report.computeResult.riskReductionPercent}%\`
- **FHE Overhead**: \`${report.computeResult.performanceOverheadPercent}%\`
- **FHE Enabled**: \`${report.computeResult.fheEnabled}\`
- **FHE Scheme**: \`${report.computeResult.fheScheme}\`
- **Security Mode**: \`${report.computeResult.securityMode}\`
- **Security Response**: \`${report.computeResult.securityResponse}\`

## Performance
- **Total Runtime**: \`${report.benchmark.runtimeMs}ms\`
- **Encryption Time**: \`${report.benchmark.encryptionTimeMs}ms\`
- **Computation Time**: \`${report.benchmark.computationTimeMs}ms\`
- **Proof Generation**: \`${report.benchmark.proofTimeMs}ms\`

## Audit Trail
- **ZK Proof Hash**: \`${report.proof.proofHash}\`
- **Input Fingerprint**: \`${report.proof.inputFingerprint}\`
- **Circuit Version**: \`${report.proof.circuitVersion}\`
`;
}

export function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
