"""The demo's data, loaded from demo/demo.json.

scripts/seed.mjs sends exactly these strings and these steps to StudioNet, and
tests/test_runbook.py replays them offline, so the demo on the explorer and the
demo the tests check cannot drift apart.

One task, three reports, each a different route:

  ANN  picks up litter for an hour: done, paid at once
  BEN  only looks, does not pick any up: not_done, nothing paid
  CAL  picks up litter for ninety minutes: done, paid at once
  the third of three paid slots is never filled, so settle() returns it
"""

import json
import pathlib

_DATA = json.loads((pathlib.Path(__file__).absolute().parent.parent / "demo" / "demo.json").read_text(encoding="utf-8"))

TASK = {**_DATA["task"], "stipend": int(_DATA["task"]["stipend"])}
REPORTS = _DATA["reports"]
STEPS = _DATA["steps"]

# the verdict each judged report is expected to come back with, in order
EXPECTED_VERDICTS = _DATA["expected_verdicts"]
