# QuantumProof Ops — Verifiable Compute on Encrypted Data (FHE + ZK) with Quantum-Aware Modes

**QuantumProof Ops** is a hackathon-ready prototype showing how programmable cryptography can power sensitive decisions without exposing raw user credentials.

It combines:
- **FHE (Fully Homomorphic Encryption)** for computation on encrypted data (Microsoft SEAL via TenSEAL)
- **ZK verification layer** for proof-backed correctness (real Groth16 path supported via Circom/snarkjs)
- **Quantum-aware security modes** to demonstrate how trust systems should adapt as cryptographic assumptions evolve

> **Thesis:** Don’t trust computation. Verify it.

---

## Why This Matters
Current financial and blockchain systems were not originally designed for a quantum-transition future.

A sufficiently capable quantum adversary could threaten some public-key assumptions (for example RSA/ECC-style assumptions), while organizations still need to make private decisions safely today.

QuantumProof Ops is built with a practical philosophy:
- keep sensitive inputs private
- make outputs verifiable
- keep audit artifacts reproducible
- design for upgradeability as cryptography changes

This is a future-oriented architecture, not a “quantum-proof forever” claim.

---

## What the Demo Proves
A lender (or verifier) can receive a **verifiable decision signal** and **audit hash** from sensitive applicant inputs, without seeing raw credentials.

### What the verifier sees
- decision signal / risk output
- proof verification status
- audit hash and run metadata

### What remains private
- credit score
- debt-to-income ratio
- income
- raw applicant input payload

---

## System Flow
`Client Input -> Encrypt -> FHE Compute -> Prove/Verify -> Export Audit`

---

## Quick Start

### 1) Clone and enter repo
```bash
git clone https://github.com/ecemguvener/Programmable-Cryptography.git
cd Programmable-Cryptography
```

### 2) Start backend
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 app/api.py
```

Backend runs at: `http://localhost:5001`

### 3) Start frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

Open the UI and go to **Demo**.

---

## CLI Demo
From repo root:

```bash
python3 app/main.py run --scenario "private-loan-preapproval" --input "loan::750::32::95000::home-loan"
```

Expected output includes:
- run id
- verification status
- runtime metrics
- exported JSON + Markdown artifacts

---

## Cryptography Stack (Reality Check)

### Fully Homomorphic Encryption (Real)
- Library: `tenseal` (Microsoft SEAL wrapper)
- Scheme: CKKS
- Usage: computes on encrypted values

### ZK Verification Layer
- **Real Groth16 path is supported** when `circom/snarkjs` tooling and artifacts are available
- If not available, the app uses a clearly labeled simulated fallback verification mode

### Hashing / Audit
- SHA3-256 fingerprints + proof hash artifacts for reproducible verification logs

---

## Enable Real Groth16 Path (Optional)
If you want real `snarkjs` proof generation in this environment:

```bash
brew install circom
npm install -g snarkjs
./scripts/setup_real_zk.sh
```

Expected artifacts:
- `zk/artifacts/loan_signal_js/loan_signal.wasm`
- `zk/artifacts/loan_signal_final.zkey`
- `zk/artifacts/verification_key.json`

When these exist and `snarkjs` is in `PATH`, `app/main.py` can use the real Groth16 path.

---

## Quantum-Aware Modes (Demo Feature)
The UI includes a simulator to demonstrate posture transitions:
- `NORMAL -> HYBRID -> POST_QUANTUM`

Purpose:
- show adaptive trust posture under changing threat assumptions
- communicate migration strategy, not claim instant universal quantum immunity

---

## Demo Flow for Judges
1. Open UI -> **Demo**
2. Run with normal mode and sample applicant values
3. Trigger quantum simulation (Grover/Shor modes)
4. Re-run and show:
   - verification gate behavior
   - runtime + audit metrics
   - exportable artifacts (JSON/Markdown)

---

## Repo Map
- `app/` - backend API and cryptographic workflow
- `frontend/` - React/Vite UI
- `zk/` - Circom circuits + proof artifacts
- `scripts/` - setup scripts for real ZK path
- `outputs/` - run artifacts
- `docs/planning-artifacts/prd.md` - updated hackathon PRD

---

## Practical Notes
- This is a prototype focused on verifiable architecture and demo reliability.
- It intentionally avoids enterprise/compliance overclaims.
- Messaging uses **quantum-resilient / forward-compatible** language, not “unbreakable forever.”

---

## License
MIT
