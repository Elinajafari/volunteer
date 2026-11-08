"""
The demo, replayed offline.

scripts/seed.mjs puts the demo on StudioNet from demo/demo.json, step by step.
This file replays the same steps through the real contract in the simulator,
so a demo that could not succeed is caught before a transaction is spent on it.

When deployments/studionet.json exists, the replay goes further: it feeds the
simulator the verdicts the validators actually agreed on, and checks that this
repository's contract pays exactly as the deployed one did and refuses exactly
where it refused.

    pytest tests/test_runbook.py -v
"""

import collections
import hashlib
import json
import pathlib

import pytest

import glsim as S

CONTRACT_PATH = "volunteer.py"
M = S.load_contract(CONTRACT_PATH)
RECORD = pathlib.Path("deployments/studionet.json")

import demo as D  # noqa: E402

WHO = {"org": "0x" + "a1" * 20, "ann": "0x" + "b2" * 20, "ben": "0x" + "c3" * 20, "cal": "0x" + "d4" * 20,
       "stranger": "0x" + "07" * 20}
T0 = 1_790_000_000
TASK = D.TASK
PAID = ("org", "ann", "ben", "cal")


def call_for(step):
    """The method, arguments and value seed.mjs sends for one step."""
    m = step["method"]
    if m == "open":
        return [TASK["title"], TASK["criteria"], TASK["stipend"], TASK["max_volunteers"], TASK["window"]], TASK["stipend"] * TASK["max_volunteers"]
    if m == "report":
        return [step["id"], D.REPORTS[step["text"]]], 0
    return [step["id"]], 0


def replay(verdicts, who=WHO):
    """Run the steps. `verdicts` are what the judged reports come back with, in order."""
    c = S.deploy(CONTRACT_PATH)
    S.reset_transfers()
    outcomes = []
    clock = T0
    queue = list(verdicts)
    for step in D.STEPS:
        clock += 30
        if "after" in step:
            field, k = step["after"]
            clock = max(clock, M.seconds(c.task(k)[field]) + 20)
        S.set_time(M.iso(clock))
        S.set_mocks()
        judged = step["method"] == "report" and step["expect"] == "ok"
        if judged:
            want = queue.pop(0)
            S.set_mocks(leader_prompts={
                "[0] done:": {"option": str(M.FORWARD.index(want)), "because": "replayed"},
                "[0] not_done:": {"option": str(M.REVERSED.index(want)), "because": "replayed"}})
        args, value = call_for(step)
        S.set_sender(who[step["who"]])
        try:
            S.call(c, step["method"], *args, value=value)
            outcomes.append(("ok", ""))
        except S.UserError as e:
            outcomes.append(("refused", e.message))
    return c, outcomes


def received(who=WHO):
    by = {a.lower(): n for n, a in who.items()}
    out = collections.Counter()
    for to, v in S.transfers():
        out[by[str(to).lower()]] += v
    return out


class TestDemoData:
    def test_every_string_and_amount_the_demo_sends_passes_the_bounds(self):
        assert M.bounded(M.clean_text(TASK["title"]), M.MIN_TITLE, M.MAX_TITLE)
        assert M.bounded(M.clean_text(TASK["criteria"]), M.MIN_CRITERIA, M.MAX_CRITERIA)
        assert M.MIN_WINDOW <= TASK["window"] <= M.MAX_WINDOW
        assert 1 <= TASK["max_volunteers"] <= M.MAX_VOLUNTEERS
        for text in D.REPORTS.values():
            assert M.bounded(M.clean_text(text), M.MIN_REPORT, M.MAX_REPORT_TEXT)

    def test_each_report_changes_one_thing(self):
        """The criteria require personally picking up litter; Ann and Cal did,
        Ben only looked."""
        assert "personally picked up" in TASK["criteria"]
        assert "did not pick any of it up" in D.REPORTS["ben"]

    def test_there_is_one_unfilled_slot_for_settle_to_return(self):
        judged = [s for s in D.STEPS if s["method"] == "report" and s["expect"] == "ok"]
        paid = sum(1 for v in D.EXPECTED_VERDICTS if v == "done")
        assert len(judged) == len(D.EXPECTED_VERDICTS) and paid < TASK["max_volunteers"]


class TestReplay:
    def test_the_demo_succeeds_and_refuses_exactly_where_it_says(self):
        _, outcomes = replay(D.EXPECTED_VERDICTS)
        assert [o for o, _ in outcomes] == [s["expect"] for s in D.STEPS]

    def test_the_refusals_say_why(self):
        _, outcomes = replay(D.EXPECTED_VERDICTS)
        msgs = [m for o, m in outcomes if o == "refused"]
        wants = ["cannot report on its own task", "reports once per task", "reports are open until",
                 "reports closed at"]
        assert len(msgs) == len(wants)
        for msg, want in zip(msgs, wants):
            assert want in msg, (want, msg)

    def test_the_expected_verdicts_pay_every_party_its_due(self):
        c, _ = replay(D.EXPECTED_VERDICTS)
        rows = c.reports_of(0)["reports"]
        assert [(r["volunteer"], r["verdict"]) for r in rows] == [
            (WHO["ann"], "done"), (WHO["ben"], "not_done"), (WHO["cal"], "done")]
        s = TASK["stipend"]
        assert received() == {"ann": s, "cal": s, "org": s}
        assert c.held_total() == 0


@pytest.mark.skipif(not RECORD.exists(), reason="no deployment recorded yet: pnpm deploy:contract && pnpm seed:contract")
class TestTheRecord:
    def _record(self):
        return json.loads(RECORD.read_text(encoding="utf-8"))

    def test_the_record_is_of_this_source(self):
        here = hashlib.sha256(pathlib.Path(CONTRACT_PATH).read_bytes().replace(b"\r\n", b"\n")).hexdigest()
        assert self._record()["source_sha256"] == here, "the deployed contract is not this file; redeploy"

    def test_every_step_on_chain_did_what_the_demo_expected(self):
        steps = [s for s in self._record()["steps"] if s["step"] != "deploy"]
        assert [("ok" if s["ok"] else "refused") for s in steps] == [s["expect"] for s in D.STEPS]

    def test_this_contract_pays_as_the_deployed_one_did(self):
        rec = self._record()
        verdicts = [x["verdict"] for x in rec["reports"] if x["verdict"] in ("done", "not_done")]
        c, outcomes = replay(verdicts)
        assert [o for o, _ in outcomes] == [s["expect"] for s in D.STEPS]
        rows = c.reports_of(0)["reports"]
        for x in rec["reports"]:
            mine = rows[x["id"]]
            for f in ("verdict", "paid", "report"):
                assert mine[f] == x[f], (x["id"], f)

    def test_the_payouts_reached_the_wallets(self):
        rec = self._record()
        b = rec["balances"]
        for who in rec["owed"]:
            assert int(b[f"{who}_after"]) - int(b[f"{who}_before"]) == int(rec["owed"][who]), who
        assert rec["held_after"] == "0"
