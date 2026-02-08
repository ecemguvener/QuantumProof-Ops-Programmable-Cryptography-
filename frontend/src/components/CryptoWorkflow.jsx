import React from 'react';

export default function CryptoWorkflow({ stages }) {
  return (
    <div className="workflow-container">
      {stages.map((stage, idx) => (
        <div key={stage.id} className="workflow-stage">
          <div className={`stage-icon ${stage.status}`}>
            {stage.status === 'complete' ? '✓' : stage.status === 'running' ? <span className="stage-dot" /> : '•'}
          </div>
          <div className="stage-info">
            <h4>{stage.name}</h4>
            {stage.time ? <span className="stage-time">{stage.time}ms</span> : null}
          </div>
          {idx < stages.length - 1 ? (
            <div className={`connector ${stage.status === 'complete' ? 'active' : ''}`} />
          ) : null}
        </div>
      ))}
    </div>
  );
}
