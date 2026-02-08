import React from 'react';

export default function CryptoParams({ params }) {
  const cards = [
    {
      title: 'Security Level',
      value: params.securityLevel || '128-bit',
      detail: 'Cryptographic baseline',
    },
    {
      title: 'FHE Scheme',
      value: params.scheme || 'CKKS',
      detail: 'Microsoft SEAL/TenSEAL',
    },
    {
      title: 'Poly Degree',
      value: String(params.polyModulusDegree || 8192),
      detail: 'Encryption hardness',
    },
    {
      title: 'Proof Path',
      value: params.zkMode || 'real-groth16',
      detail: 'Circom/snarkjs compatible',
    },
  ];

  return (
    <div className="crypto-params-grid">
      {cards.map((card) => (
        <div key={card.title} className="param-card">
          <h4>{card.title}</h4>
          <p>{card.value}</p>
          <span className="param-detail">{card.detail}</span>
        </div>
      ))}
    </div>
  );
}
