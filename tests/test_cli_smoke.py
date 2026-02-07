import json
import subprocess
from pathlib import Path


def test_cli_run_exports_json_and_markdown(tmp_path: Path):
    out_dir = tmp_path / "out"
    cmd = [
        "python3",
        "app/main.py",
        "run",
        "--input",
        "demo-sensitive",
        "--scenario",
        "test-scenario",
        "--output-dir",
        str(out_dir),
    ]
    completed = subprocess.run(cmd, check=True, capture_output=True, text=True)
    assert "Verification: True" in completed.stdout

    files = list(out_dir.iterdir())
    assert any(f.suffix == ".json" for f in files)
    assert any(f.suffix == ".md" for f in files)

    json_file = next(f for f in files if f.suffix == ".json")
    payload = json.loads(json_file.read_text())
    assert payload["proof"]["verification_result"] is True
    assert "input_fingerprint" in payload["proof"]
