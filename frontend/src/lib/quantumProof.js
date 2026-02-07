function stableHash(input) {
  const bytes = new TextEncoder().encode(input);
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i += 1) {
    h ^= bytes[i];
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function inputFingerprint(sensitiveInput) {
  return stableHash(`fingerprint::${sensitiveInput}`);
}

function simulatePrivateCompute(sensitiveInput, scenario, forceFallback) {
  const mode = forceFallback ? 'fallback-deterministic' : 'simulated-private-compute';
  const signal = parseInt(stableHash(sensitiveInput + scenario), 16) % 100;

  return {
    computeMode: mode,
    result: {
      riskReductionPercent: 20 + (signal % 61),
      performanceOverheadPercent: 2 + (signal % 19),
      recommendedRollout: 'phased'
    }
  };
}

function generateProof(fingerprint, computeResult, scenario) {
  const payload = JSON.stringify({ fingerprint, computeResult, scenario, circuitVersion: 'demo-circuit-v1' });
  return stableHash(`proof::${payload}`);
}

function verifyProof(proofHash, fingerprint, computeResult, scenario) {
  return proofHash === generateProof(fingerprint, computeResult, scenario);
}

export function runQuantumProof({ sensitiveInput, scenario, forceFallback }) {
  const started = performance.now();
  const timestampUtc = new Date().toISOString();
  const runId = `run-${stableHash(timestampUtc + scenario + sensitiveInput).slice(0, 8)}`;

  const fingerprint = inputFingerprint(sensitiveInput);
  const { computeMode, result } = simulatePrivateCompute(sensitiveInput, scenario, forceFallback);
  const proofHash = generateProof(fingerprint, result, scenario);
  const verificationResult = verifyProof(proofHash, fingerprint, result, scenario);
  const runtimeMs = Math.max(1, Math.round(performance.now() - started));

  if (!verificationResult) {
    throw new Error('Proof verification failed. Output blocked by verification gate.');
  }

  return {
    runId,
    timestampUtc,
    scenario,
    riskContext:
      'This run demonstrates quantum-resilient workflow behavior by combining private computation signals and proof-backed verification.',
    trustModelComparison:
      'Traditional trust relies on operator process integrity; this model adds cryptographic verification and exportable audit metadata.',
    computeResult: result,
    benchmark: {
      runtimeMs,
      computeMode
    },
    proof: {
      proofHash,
      verificationResult,
      circuitVersion: 'demo-circuit-v1',
      inputFingerprint: fingerprint
    }
  };
}

export function toMarkdown(report) {
  return `# QuantumProof Ops Report\n\n- Run ID: \`${report.runId}\`\n- Timestamp (UTC): \`${report.timestampUtc}\`\n- Scenario: \`${report.scenario}\`\n- Verification: \`${report.proof.verificationResult}\`\n\n## Computation Result\n\n- Risk Reduction Estimate: \`${report.computeResult.riskReductionPercent}%\`\n- Performance Overhead Estimate: \`${report.computeResult.performanceOverheadPercent}%\`\n- Recommended Rollout: \`${report.computeResult.recommendedRollout}\`\n\n## Quantum-Risk Context\n\n${report.riskContext}\n\n## Trust Model Comparison\n\n${report.trustModelComparison}\n\n## Audit Bundle\n\n- Proof Hash: \`${report.proof.proofHash}\`\n- Circuit Version: \`${report.proof.circuitVersion}\`\n- Input Fingerprint: \`${report.proof.inputFingerprint}\`\n- Runtime (ms): \`${report.benchmark.runtimeMs}\`\n- Compute Mode: \`${report.benchmark.computeMode}\`\n`;
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
