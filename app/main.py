#!/usr/bin/env python3
"""QuantumProof Ops MVP CLI.

Quick flow:
1) take sample sensitive input (memory only)
2) run simulated private compute
3) generate + verify proof
4) block output if verify fails
5) export JSON + Markdown
"""

from __future__ import annotations

import argparse
import hashlib
import json
import time
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

APP_VERSION = "0.1.0"
CIRCUIT_VERSION = "demo-circuit-v1"


@dataclass
class BenchmarkMetrics:
    runtime_ms: int
    compute_mode: str


@dataclass
class ProofArtifact:
    proof_hash: str
    verification_result: bool
    circuit_version: str
    input_fingerprint: str


@dataclass
class RunResult:
    run_id: str
    timestamp_utc: str
    scenario: str
    compute_result: dict[str, Any]
    risk_context: str
    trust_model_comparison: str
    benchmark: BenchmarkMetrics
    proof: ProofArtifact


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def stable_hash(payload: str) -> str:
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def compute_input_fingerprint(sensitive_input: str) -> str:
    return stable_hash(f"fingerprint::{sensitive_input}")


def simulate_private_compute(sensitive_input: str, scenario: str, force_fallback: bool) -> tuple[dict[str, Any], str]:
    mode = "fallback-deterministic" if force_fallback else "simulated-private-compute"
    # Keep this deterministic so demo runs are repeatable.
    numeric_signal = int(stable_hash(sensitive_input + scenario)[:8], 16) % 100
    risk_reduction_estimate = 20 + (numeric_signal % 61)  # range: 20..80
    performance_overhead_estimate = 2 + (numeric_signal % 19)  # range: 2..20

    result = {
        "risk_reduction_percent": risk_reduction_estimate,
        "performance_overhead_percent": performance_overhead_estimate,
        "recommended_rollout": "phased",
    }
    return result, mode


def generate_proof(input_fingerprint: str, compute_result: dict[str, Any], scenario: str) -> str:
    proof_payload = json.dumps(
        {
            "input_fingerprint": input_fingerprint,
            "compute_result": compute_result,
            "scenario": scenario,
            "circuit_version": CIRCUIT_VERSION,
        },
        sort_keys=True,
    )
    return stable_hash(f"proof::{proof_payload}")


def verify_proof(proof_hash: str, input_fingerprint: str, compute_result: dict[str, Any], scenario: str) -> bool:
    expected = generate_proof(input_fingerprint, compute_result, scenario)
    return proof_hash == expected


def trust_model_comparison() -> str:
    return (
        "Traditional model relies on operator/process trust; "
        "quantum-resilient model adds cryptographic verifiability and auditable proof artifacts."
    )


def quantum_risk_context() -> str:
    return (
        "This run shows a quantum-resilient workflow by coupling private computation signals "
        "with proof-backed verification and exportable audit metadata."
    )


def run_once(sensitive_input: str, scenario: str, force_fallback: bool) -> RunResult:
    start = time.perf_counter()
    input_fingerprint = compute_input_fingerprint(sensitive_input)

    compute_result, mode = simulate_private_compute(sensitive_input, scenario, force_fallback)
    proof_hash = generate_proof(input_fingerprint, compute_result, scenario)
    verified = verify_proof(proof_hash, input_fingerprint, compute_result, scenario)

    runtime_ms = int((time.perf_counter() - start) * 1000)
    run_id = f"run-{stable_hash(utc_now_iso())[:10]}"

    if not verified:
        raise RuntimeError("Proof verification failed. Output is blocked by verification gate.")

    return RunResult(
        run_id=run_id,
        timestamp_utc=utc_now_iso(),
        scenario=scenario,
        compute_result=compute_result,
        risk_context=quantum_risk_context(),
        trust_model_comparison=trust_model_comparison(),
        benchmark=BenchmarkMetrics(runtime_ms=runtime_ms, compute_mode=mode),
        proof=ProofArtifact(
            proof_hash=proof_hash,
            verification_result=verified,
            circuit_version=CIRCUIT_VERSION,
            input_fingerprint=input_fingerprint,
        ),
    )


def export_json(result: RunResult, output_dir: Path) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / f"{result.run_id}.json"
    serializable = asdict(result)
    path.write_text(json.dumps(serializable, indent=2), encoding="utf-8")
    return path


def export_markdown(result: RunResult, output_dir: Path) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / f"{result.run_id}.md"
    md = f"""# QuantumProof Ops Report

- Run ID: `{result.run_id}`
- Timestamp (UTC): `{result.timestamp_utc}`
- Scenario: `{result.scenario}`
- Circuit Version: `{result.proof.circuit_version}`
- Verification: `{result.proof.verification_result}`

## Computation Result

- Risk Reduction Estimate: `{result.compute_result['risk_reduction_percent']}%`
- Performance Overhead Estimate: `{result.compute_result['performance_overhead_percent']}%`
- Recommended Rollout: `{result.compute_result['recommended_rollout']}`

## Quantum-Risk Context

{result.risk_context}

## Trust Model Comparison

{result.trust_model_comparison}

## Audit Bundle

- Proof Hash: `{result.proof.proof_hash}`
- Input Fingerprint (hashed): `{result.proof.input_fingerprint}`
- Runtime (ms): `{result.benchmark.runtime_ms}`
- Compute Mode: `{result.benchmark.compute_mode}`
"""
    path.write_text(md, encoding="utf-8")
    return path


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="QuantumProof Ops MVP CLI")
    parser.add_argument("run", nargs="?", default="run", help="Run a single computation workflow")
    parser.add_argument("--input", required=True, help="Sample sensitive input (used in-memory only)")
    parser.add_argument("--scenario", default="baseline", help="Scenario label")
    parser.add_argument("--fallback", action="store_true", help="Force deterministic fallback compute mode")
    parser.add_argument("--output-dir", default="outputs", help="Output directory for JSON/Markdown artifacts")
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    if args.run != "run":
        parser.error("Only 'run' command is supported in MVP")

    try:
        result = run_once(sensitive_input=args.input, scenario=args.scenario, force_fallback=args.fallback)
    except RuntimeError as exc:
        print(f"ERROR: {exc}")
        return 1

    out_dir = Path(args.output_dir)
    json_path = export_json(result, out_dir)
    md_path = export_markdown(result, out_dir)

    print("QuantumProof Ops MVP run complete")
    print(f"Run ID: {result.run_id}")
    print(f"Verification: {result.proof.verification_result}")
    print(f"Runtime: {result.benchmark.runtime_ms}ms")
    print(f"JSON export: {json_path}")
    print(f"Markdown export: {md_path}")
    print(f"App Version: {APP_VERSION}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
