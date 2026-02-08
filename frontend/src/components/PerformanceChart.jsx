import React from 'react';

export default function PerformanceChart({ data }) {
  const max = Math.max(...data.map((d) => d.time), 1);
  const total = data.reduce((acc, d) => acc + d.time, 0);

  return (
    <div className="performance-chart">
      <div className="chart-header">
        <h3>Performance Breakdown</h3>
        <span className="total-time">Total: {total}ms</span>
      </div>
      <div className="chart-bars">
        {data.map((item) => (
          <div key={item.stage} className="chart-row">
            <span className="stage-label">{item.stage}</span>
            <div className="bar-container">
              <div className="bar" style={{ width: `${(item.time / max) * 100}%` }} />
              <span className="bar-value">{item.time}ms</span>
            </div>
          </div>
        ))}
      </div>
      <div className="chart-insight">
        FHE overhead is expected. Slower runtime is evidence of encrypted compute, not plaintext shortcuts.
      </div>
    </div>
  );
}
