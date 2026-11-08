# Contract tests

Volunteer is tested at four levels, from the cheapest to the one that costs
real transactions. Each level has one command.

| Level | Command | Needs | What it proves |
|---|---|---|---|
| 1. Offline suite | `pnpm test:contract` | Python + pytest | the contract file itself behaves as specified, including against a lying leader, a moving clock and real payouts |
| 2. Mutation pass | `pnpm mutate:contract` | same | every defence is covered by a test that fails without it |
| 3. Live demo | `pnpm deploy:contract && pnpm seed:contract` | Node 20+ | the same behaviour happens on StudioNet, with real validators, real models, real GEN and the chain's own clock |
| 4. Chain checks | `pnpm e2e:contract`, `pnpm verify:contract`, `pnpm evidence:contract` | Node 20+ | what the record claims is what the chain holds, and what is deployed is this file |

## 1. The offline suite

```bash
pip install -r requirements-dev.txt
pnpm test:contract   # from the repo root, or here: python -m pytest tests -q
```

| File | What it covers |
|---|---|
| [`test_logic.py`](test_logic.py) | the pure rules: text cleaning, reading a model's answer back through its order, the fold, the agreement, the fence and the prompt, and that `lib/volunteer_consensus.py` is exactly the contract's code |
| [`test_e2e.py`](test_e2e.py) | the contract executed: `open` and its bounds; `report` (not the organisation, once per volunteer, the window exactly, every bound, the model never sees money or people, an order-dependent answer is not_done, a lying or malformed leader refused, a malformed one for free, an `[LLM_ERROR]` never agreed with); `settle` on every boundary; money; and static checks over the parsed source |
| [`test_runbook.py`](test_runbook.py) | the live demo replayed offline from [`demo/demo.json`](../demo/demo.json), with the clock moved past the window, before any transaction is spent; and once `deployments/studionet.json` exists, the validators' real verdicts are replayed through this file, which must pay exactly as the deployed contract did |
| [`test_vectors.py`](test_vectors.py) | `packages/shared/volunteer-vectors.json` is exactly what this contract computes, so the TypeScript port is tested against the contract's own answers (`UPDATE_VECTORS=1` regenerates it) |
| [`test_shape.py`](test_shape.py) | `packages/shared/contract-shape.json` describes every public write and view, its parameters and types, and the fields the live deployment returned, exactly |

## 2. The mutation pass

```bash
pnpm mutate:contract
```

[`scripts/mutate.py`](../scripts/mutate.py) makes small edits to a copy of the
contract, each one removing a defence ("reports never close", "a not_done
report pays the volunteer", "the organisation may report", "a disagreement
between the orders is done", ...), runs the suite against each, and names the
test that failed. A mutant that survives is a missing test, and the script
exits non-zero.

## 3. The live demo

```bash
pnpm install
pnpm deploy:contract
pnpm seed:contract
```

Five wallets, one role each, all made in memory for the run; the organisation
is funded from the StudioNet faucet:

| Wallet | Does |
|---|---|
| deployer | deploys the contract, nothing else |
| org | opens the Riverside Park task, tries to report on its own task |
| ann | reports: picked up litter for an hour |
| ben | reports: only looked, did not pick any up |
| cal | reports: picked up litter for ninety minutes |
| stranger | settles too early, reports late, settles after the window |

Every transaction, in order, and what it proves. The steps are
[`demo/demo.json`](../demo/demo.json), read by the seed script and by
`test_runbook.py`.

| # | Sent by | Call | Expected | What it proves |
|---|---|---|---|---|
| 1 | org | `open` | executed | the criteria, the 0.02 GEN stipend and the window are frozen; 0.06 GEN paid in |
| 2 | org | `report` | refused | the organisation cannot report on its own task |
| 3 | ann | `report`: picked up litter for an hour | **done** | the criteria are met: paid at once |
| 4 | ann | `report` again | refused | a volunteer reports once per task |
| 5 | ben | `report`: only looked | **not_done** | the criteria are not met: nothing paid |
| 6 | cal | `report`: picked up litter for ninety minutes | **done** | the criteria are met: paid at once |
| 7 | stranger | `settle` | refused | reports are open until the window closes |
| 8 | stranger | `report` after the window closes | refused | a late report is never judged |
| 9 | stranger | `settle` | ok | the unused third slot is returned to the organisation |

## 4. Checking the chain, not the record

```bash
pnpm e2e:contract
pnpm verify:contract
pnpm evidence:contract
```

`e2e` fetches every recorded transaction again and checks that the chain
still says what the record says, then re-reads the task and every report;
nothing may still be held, and every balance must have moved by exactly what
the contract paid. `verify` compares the deployed source byte for byte with
`volunteer.py` and lints it. `evidence` builds
[EVIDENCE.md](../../../EVIDENCE.md) from the chain's answers alone.

## Measuring

```bash
pnpm measure:contract
```

Runs the suite and the mutation pass now and renders their numbers, and the
live record, into the README. It writes nothing if the suite is red, a
mutant escapes, or the record is of a different contract file.
