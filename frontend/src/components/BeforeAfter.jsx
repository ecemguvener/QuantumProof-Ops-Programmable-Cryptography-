import React from 'react';

export default function BeforeAfter({ plaintextSummary, encryptedFingerprint, riskScore }) {
  return (
    <div className="before-after-container">
      <div className="before-after-section">
        <h3>Without Privacy Layer</h3>
        <div className="comparison-box danger">
          <p className="label">Server sees plaintext:</p>
          <code className="exposed-data">{plaintextSummary}</code>
          <p className="warning">Sensitive values exposed</p>
        </div>
      </div>

      <div className="vs-divider">VS</div>

      <div className="before-after-section">
        <h3>With QuantumProof Ops</h3>
        <div className="comparison-box safe">
          <p className="label">Server sees fingerprint/proof view:</p>
          <code className="encrypted-data">{encryptedFingerprint}</code>
          <p className="success">Data kept private</p>
          <p className="result">Risk output: {riskScore}%</p>
        </div>
      </div>
    </div>
  );
}
