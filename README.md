# QuantumProof Ops MVP (CLI)

Minimal build-first MVP from PRD:
- CLI input flow
- simulated private computation
- proof generation + verification
- verification-gated output
- JSON + Markdown export

## Run

```bash
python3 app/main.py run --input "sample-sensitive-data" --scenario "exchange-wallet-stack-v1"
```

Optional fallback mode:

```bash
python3 app/main.py run --input "sample-sensitive-data" --scenario "exchange-wallet-stack-v1" --fallback
```

Outputs are written to `outputs/` by default.

## Notes

- Raw sensitive input is used in-memory only.
- Artifacts store only hashed fingerprints and metadata.
