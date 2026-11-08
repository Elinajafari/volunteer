# DECISIONS

Why Volunteer is built the way it is. Each section names the alternative that
was rejected and what it would have cost.

## The model decides the criteria, never the money

The obvious design asks a model "should this volunteer be paid?". It hands the
model the stipend, the volunteer and the organisation's reputation, and gets
back a judgment about generosity. So the model answers one question: does the
report show the criteria were met. It never sees the stipend, the volunteer,
or how many were already paid. The payment is fixed in advance.
`tests/test_e2e.py::TestStorageShape::test_the_block_never_touches_storage_and_never_sees_money_or_people`
fails if any of them is passed into the block, and
`test_the_model_is_never_shown_an_amount_or_a_volunteer` checks every prompt of
a real report.

## The criteria and the money exist before the first report

The title, the criteria, the stipend, the number of volunteers and the window
are frozen at `open()`, and stipend x volunteers is paid in exactly. Criteria
narrowed after reports arrived could be narrowed to exclude them, and a task
that promises a stipend without holding it is a task that can run dry.

## Two options the contract wrote

The answer is `done` or `not_done`, labelled `[0]` and `[1]` by the contract
inside an `<options>` block, after every caller string has been fenced. A
report cannot forge a third option or close its block.

## Order-dependence is not done

The options are asked in the order done, not_done and then reversed and
renumbered; each answer is read back through the order it was asked in. The
same option both ways stands; anything else is `not_done`. The volunteer who
reports carries the burden of showing their work meets the criteria. A model
that always answers "0" pays nobody, and the tests check it.

## Every condition, nothing else

The prompt says a report is done only if it meets every condition the
criteria give, and tells the model not to judge whether the volunteer tried
hard or whether it believes them. The demo's three reports each change one
thing: one that plainly meets the criteria, one that only looks and does not
act, and a second that plainly meets them too, leaving one of three paid
slots unused.

## Judged in the call that reports

There is no separate "rule" step. The volunteer who reports is the one who
wants the answer, spends the inference, and is paid in the same transaction.
A failed judgment rolls the whole call back, so it never uses up a report.

## Every judgment has a clock

The window is frozen at `open()`. After `closes_at`, `report()` refuses
before any model is asked, and `settle()` returns what is left. An
organisation cannot keep a task open to wait out reports, and nobody can
spend inference on a task that can no longer pay.

## Settled before the model

Everything an answer could not change is refused for free, before a prompt:
the organisation reporting, a second report from the same volunteer, a report
once every paid volunteer slot is used, a report on a closed task, and
anything after the window.

## One report per volunteer

A volunteer is keyed `"task:volunteer"` and reports once, whatever the
verdict. That is not proof against one person with many wallets; the number
of paid slots bounds what that can take, and it is a known limit.

## Money

The pool is paid in at `open()` and counted in `held`. Every payout goes
through one guarded path, after the state that justifies it is written, and a
payout larger than `held` is refused.

## Tagging untrusted text is not a fence

The title, the criteria and every report are written by someone with a
stake. `fence()` replaces `< > [ ]` at the prompt boundary, length preserved.
Stored text is kept verbatim; only the prompt is fenced.

## The reason string is leader-supplied

`because` is stored next to each report, sanitised and capped at 140
characters, and is not part of consensus. Nothing in the contract acts on it,
and the view says so.

## Known limits

- The model judges what the volunteer says they did, not the work itself. Volunteer makes the report public and permanent next to the payment; a false report is a public claim.
- One person with many wallets can report many times; the number of paid volunteer slots bounds it.
- On StudioNet a payment can land a little after the transaction that sent it, so `scripts/demo.py` (and `scripts/seed.mjs` on the live chain) reads each wallet until what the contract sent has arrived.
- StudioNet is a test network; its state can be reset.

## Why the tests are built the way they are

- **Each node gets its own answers**, so a contract that assumes both nodes read the same thing is caught offline.
- **A leader can lie**, so the validator's checks are reachable, and the free layer is measured: a verdict that is neither option must cost the validator zero prompts, and the free refusals before the block must cost everyone zero prompts.
- **Every transfer is recorded**, so a payment sent to the wrong wallet fails a test.
- **The runbook is a test.** The demo is replayed offline from `demo/demo.json` before a transaction is spent, and once `deployments/studionet.json` exists the validators' real verdicts are replayed through this file, and every wallet's gain on chain is compared with what the contract sent.
- **The port is tested against the contract.** `packages/shared/volunteer-vectors.json` is generated from the contract's own functions.
- **Mutation testing.** `scripts/mutate.py` removes each defence and names the test that caught it.

## GenVM constraints this contract obeys

- the runner is pinned (`py-genlayer:1jb45aa8...`), never `test` or `latest`
- the class is named after the product, because `genvm-lint validate` does not see a class named `Contract`; the storage rows are `Task` and `Report`, so no dataclass shares its name
- no `int`, `list`, `dict` or `tuple` as a storage type, and no collection inside a storage dataclass; TreeMap keys are strings
- every persistent field is declared in the class body, and every stored field is read somewhere
- the block returns a flat dict of strings
- `gl.nondet` is reached only from `ask`, called only from inside the block
- payouts use `@gl.evm.contract_interface` and `emit_transfer(value=...)`
- the file is pure ASCII
- `genvm-lint` validates against GenVM `v0.3.0-rc7`, the release that ships the pinned runner; `scripts/verify.mjs` sets `GENVM_VERSION` accordingly

## Not upgradable

There is no owner and no admin method. A task's criteria, stipend and window
are frozen at `open()`, and a verdict on record stays the verdict.
