# Volunteer

**A task stipend, paid only when GenLayer validators agree a volunteer's
report shows the criteria were met.** The clock settles what it can; the
validators settle the one thing it cannot.

An organisation opens a task with what counts as done, a stipend per
volunteer, how many volunteers it will pay, and a window, paying the stipend
pool in. A volunteer reports once. GenLayer's validators decide one thing:
does the report show the criteria were met. Done pays the volunteer at once;
not done pays nothing. Once the window closes, anyone may return what is
left to the organisation.

**Live on studionet at [`0xC068d7C10Bf232a92546b936409f41AeEAf11cbB`](https://explorer-studio.genlayer.com/address/0xC068d7C10Bf232a92546b936409f41AeEAf11cbB).**
Intelligent contract + shared type layer + scripts that deploy, seed, verify
and prove it, not a standalone contract.

> Every transaction of the live demo, and the wallet that sent it, read back
> from the chain: **[EVIDENCE.md](EVIDENCE.md)** (written after `pnpm seed:contract`).
> A second round from two new wallets: **[EVIDENCE-ACTIVITY.md](EVIDENCE-ACTIVITY.md)**.

---

## Why this exists

A volunteer stipend is usually approved by the organisation that posted the
task, after the fact, from a report nobody else checked. "Did this person
actually do it?" is answered by the party holding the money. Asking a model
"should this volunteer be paid?" does not fix it: it hands the model the
money and the person at once and gets back whatever seems generous.

### In plain terms

The organisation writes the criteria once, and pays every volunteer slot in
before the first report. A volunteer reports once, describing what they did.
The validators each read the criteria and the report, twice, with the two
options in different orders, and have to agree exactly. If the report meets
every condition, the volunteer is paid the stipend at once; if not, nothing
is paid, but the slot can still be filled by someone else. Once the window
closes, anyone can settle the task and return what is left.

### Why this needs GenLayer specifically

Whether "I picked up litter along the river trail for about an hour" meets
"personally picked up litter along the river trail for at least an hour" is a
judgment in natural language, and the organisation that would keep the
leftover pool is the one party who cannot be trusted to make it. Here the
reading is done by a validator quorum, and everything that is not a
judgment is kept away from the model: the criteria were fixed before the
first report, the stipend and the people are never shown to it, the answer
is one of two options the contract wrote, and the clock settles every case
it can without asking anyone.

### How you actually use it

1. **Open** (the organisation): `open(title, criteria, stipend, max_volunteers, window)`, paying the pool in.
2. **Report** (a volunteer, once): `report(task, text)`.
3. **Settle** (anyone, after the window): `settle(task)` returns what is left.
4. **Rely on it from another contract**: `status(task)` returns one word.

## Stack

| Layer | Tech |
|---|---|
| Contract | GenLayer Intelligent Contract, Python (GenVM): [`packages/contracts/volunteer.py`](packages/contracts/volunteer.py) |
| Consensus | custom leader/validator with `gl.vm.run_nondet_unsafe`: a free structural check, then exact agreement on done or not |
| Money | `open()` is payable; every payout goes through one path, through the external message form with `value` |
| Tests | pytest on a GenVM stand-in that runs the real file, moves the chain's clock and records every transfer, plus a mutation pass that breaks every defence on purpose |
| Chain client | `genlayer-js` 1.1.8: deploy, seed, e2e, verify and evidence scripts; the StudioNet faucet funds the organisation |
| Types | [`packages/shared`](packages/shared): view types, parsers and a port of the contract's deterministic rules, tested against vectors generated from the contract |

---

## Quick start

```bash
pnpm install
pip install -r packages/contracts/requirements-dev.txt

pnpm test               # contract (pytest) + shared (vitest), no chain needed
```

Deploy your own copy and put the whole demo on the explorer:

```bash
pnpm deploy:contract
pnpm seed:contract      # 3 reports, 2 done, 1 not_done, 1 leftover slot returned, 4 refusals
pnpm e2e:contract
pnpm evidence:contract
```

| Command | What it does |
|---|---|
| `pnpm test` | contract and shared suites |
| `pnpm mutate:contract` | removes every defence one at a time; every mutant must be caught by a named test |
| `pnpm measure:contract` | runs the suite and the mutation pass and renders the numbers into the contract README |
| `pnpm seed:contract` | the demo: every route and every refusal, recorded; waits on the chain's clock for the window to close |
| `pnpm seed:activity` | a second round on the deployed contract from two new wallets, recorded apart from the demo |
| `pnpm e2e:contract` | the record checked against the live chain |
| `pnpm verify:contract` | the deployed source, byte for byte against the file, and linted |
| `pnpm evidence:contract` | EVIDENCE.md: every transaction and its sender, from the chain |

On studionet nothing needs configuring: every role gets a wallet made in
memory for the run, no key is ever written to disk, and the organisation is
funded from the StudioNet faucet.

## The live demo

Riverside Park trail cleanup: a 0.02 GEN stipend, three volunteer slots, a
900-second window. Its criteria require personally picking up litter along
the river trail for at least an hour. Three reports:

| Volunteer | What they reported | Verdict | Paid |
|---|---|---|---|
| Ann | picked up litter for about an hour | **done** | yes |
| Ben | only looked, did not pick any up | **not_done** | no |
| Cal | picked up litter for ninety minutes | **done** | yes |

The third slot was never filled, so `settle()` returned it to the
organisation once the window closed. Every wallet's balance was read from
the chain after the stipend pool was paid in and again once every payout had
landed: each moved by exactly what the contract paid it. Full detail, with
every hash: [EVIDENCE.md](EVIDENCE.md) and
[`packages/contracts/README.md`](packages/contracts/README.md#verified-against-the-live-deployment).

### Second round, two new wallets

`pnpm seed:activity` runs on the same contract from two wallets that have
never been used: a new organisation opens a one-volunteer signage-repair
task, a new volunteer reports, the organisation tries to settle before the
window closes and is refused, and once the window closes the organisation
settles again: nothing left to return, the one slot having been paid. Every
hash: [EVIDENCE-ACTIVITY.md](EVIDENCE-ACTIVITY.md).

## Repo layout

```
.
├─ packages/
│  ├─ contracts/                 the Intelligent Contract and everything that proves it
│  │  ├─ volunteer.py            the contract
│  │  ├─ tests/                  pytest on a GenVM stand-in (see tests/README.md)
│  │  ├─ scripts/                deploy · seed · e2e · verify · evidence · lint · mutate · measure
│  │  ├─ demo/demo.json          the demo, read by the seed script AND the tests
│  │  ├─ deployments/            studionet.json, written by the scripts, never by hand
│  │  ├─ lib/                    the report rules, generated from the contract
│  │  └─ DECISIONS.md            why every rule is the way it is
│  └─ shared/                    types, parsers, contract-shape.json, the rules port and its vectors
├─ EVIDENCE.md                   every live transaction and its sender
├─ EVIDENCE-ACTIVITY.md          the second round, two new wallets
└─ package.json · pnpm-workspace.yaml
```

## License

MIT © 2026 Elina ([@Elinajafari](https://github.com/Elinajafari))
