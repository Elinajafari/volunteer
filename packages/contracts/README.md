# Volunteer - GenLayer Intelligent Contract

[`volunteer.py`](./volunteer.py) is the whole protocol: an organisation opens
a task with its criteria, a stipend per volunteer, how many volunteers it
will pay and a window, and pays stipend x volunteers in; a volunteer reports
once, and validators decide in the same call, in two orders, whether the
report shows the criteria were met; a done report is paid at once; when the
window closes, anyone may return what is left to the organisation.

## Core rule

```
the criteria, the stipend and the window are frozen at open(), before the first report
a report is judged against two options the contract wrote: done or not_done; the model never sees money or people
done pays the volunteer the stipend at once; not_done pays nothing; the two orders must agree, else not_done
a report after the window closes is refused before any model: a late report is never judged
once the window closes, anyone may settle: whatever is left goes back to the organisation
```

## Lifecycle

```
org:        open(title, criteria, stipend, max_volunteers, window)   stipend x max_volunteers paid in, everything frozen
volunteer:  report(task, text)              [validators, both orders] -> done: paid the stipend at once
                                                                          not_done: nothing paid
                                             after the window: refused before any model
anyone:     settle(task)                    after the window -> whatever is left goes to the organisation
anyone:     count, held_total, status, task, reports_of
```

Judgment fails **closed**: an unusable model answer is retried once inside
the block and then raised as `[LLM_ERROR]`, which no validator agrees with.
It never moves money. Every waiting state has a clock, and every clock ends
in the pool being settled.

## Deploy

```bash
pnpm install                          # from the repo root
pnpm deploy:contract                  # studionet, a deployer key made for this run
pnpm seed:contract                    # the demo, recorded in deployments/studionet.json
pnpm e2e:contract                     # the record checked against the chain
pnpm verify:contract                  # deployed source == volunteer.py, and genvm-lint on it
pnpm evidence:contract                # EVIDENCE.md at the repo root, from the chain
```

Every script reads a transaction's outcome from the leader's result
(`return` or `rollback`), never from `ACCEPTED` alone: the committee accepts a
refusal too. Sends are nonce-guarded, and a send whose answer was lost is
found again in StudioNet's own index rather than sent twice. On studionet the
organisation is funded from the StudioNet faucet, and the payouts are checked
by reading every wallet's balance from the chain after the stipend pool was
paid in and once every payout has landed. Why each rule is the way it is:
[DECISIONS.md](DECISIONS.md).

## Surface

| Write | Caller | Why |
|---|---|---|
| `open(title, criteria, stipend, max_volunteers, window)` *payable* | anyone, paying stipend x max_volunteers | the caller becomes the organisation |
| `report(task, text)` | anyone but the organisation, once per task | only a volunteer can say what they did |
| `settle(task)` | anyone, deliberately, after the window | it reads no model and returns only what the clock already says is left |

| View | Returns |
|---|---|
| `count()` | number of tasks |
| `held_total()` | wei held for open tasks |
| `status(task)` | `open` or `closed`: one word for another contract |
| `task(id)` | the frozen title, criteria, stipend and clock, and how many reports it has taken |
| `reports_of(task)` | every report, its verdict, its payment, and the leader's own reason (not consensus) |

## Threat model

| Attack | What stops it |
|---|---|
| Criteria edited after a report | they are frozen at `open()`, before the first report |
| The model deciding who deserves the money | it never sees the stipend, the volunteer or the organisation, and only picks one of two options the contract wrote |
| A report that is only done when "done" is listed first | both orders inside one block; a difference is `not_done` |
| The organisation reporting on its own task | `report()` refuses the organisation's own address, before any model |
| A volunteer reporting twice | keyed `"task:volunteer"`, refused for free |
| A report after the window closes | refused before any model: a late report is never judged |
| A task that never pays out its pool | anyone may `settle()` once the window closes |
| A broken model moves money by failing | an unusable answer is retried once, then raised as `[LLM_ERROR]` |
| Prompt injection inside criteria or a report | `fence()` replaces `< > [ ]` at the prompt boundary and the contract numbers the options itself |

## Tests

The suite runs on [`tests/glsim.py`](tests/glsim.py), a small GenVM stand-in
that executes the real contract file, gives the leader and the validator
their own mock answers, can make a leader lie, sets the chain's clock,
carries the value a call sends and the transfers it makes, and refuses what
GenVM refuses. What each file covers, and what every demo transaction proves,
is in [tests/README.md](tests/README.md).

<!-- measured:tests:start -->
Measured: **135 passed**, 0 skipped, including the checks of the live record in `deployments/studionet.json`, which run once `pnpm seed:contract` has written it. The same record is checked against the chain itself by `pnpm e2e:contract`.
<!-- measured:tests:end -->

**The tests have teeth.** [`scripts/mutate.py`](scripts/mutate.py) removes every
defence one at a time and names the test that caught each mutant. It refuses to
run on a red baseline and exits non-zero if anything escapes.

<!-- measured:mutations:start -->
Measured: **56 mutations, 56 caught, 0 escaped.**

| Mutation | Caught by |
|---|---|
| the organisation may report | `test_the_organisation_cannot_report` |
| a closed task takes a report | `test_a_closed_task_takes_no_report` |
| a closed task settles again | `test_a_task_settles_once` |
| a volunteer reports twice | `test_a_volunteer_reports_once_whatever_the_verdict` |
| reports never close | `test_reports_close_on_the_clock_before_any_model` |
| reports close a second early | `test_reports_close_on_the_clock_before_any_model` |
| settle runs before the window closes | `test_nothing_settles_while_reports_are_open` |
| settle closes a second early | `test_nothing_settles_while_reports_are_open` |
| a title of any length is accepted | `test_the_title_and_criteria_are_bounded` |
| criteria of any length are accepted | `test_the_title_and_criteria_are_bounded` |
| a stipend of zero is accepted | `test_the_stipend_is_bounded` |
| a task pays any number of volunteers | `test_the_number_of_volunteers_is_bounded` |
| the window is unbounded | `test_the_window_is_bounded` |
| the window does not set the clock | `test_a_task_opens_with_its_criteria_frozen_and_every_volunteer_paid_in` |
| any payment is accepted at open | `test_stipend_times_volunteers_is_paid_in_exactly` |
| a report of any length is accepted | `test_the_report_length_bounds` |
| reports continue past every paid volunteer | `test_reports_stop_when_every_paid_volunteer_is_used` |
| a task takes any number of reports | `test_a_task_takes_a_bounded_number_of_reports` |
| control characters are stored | `test_clean_text_collapses_whitespace_and_control_characters` |
| a not_done report pays the volunteer | `test_a_report_that_does_not_show_the_criteria_were_met_is_recorded_and_paid_nothing` |
| a done report pays nothing | `test_a_done_report_is_paid_at_once` |
| the paid count is not kept | `test_a_done_report_is_paid_at_once` |
| the paid total is not kept | `test_a_done_report_is_paid_at_once` |
| the pool is not drawn down on a payout | `test_a_done_report_is_paid_at_once` |
| a leader's reason is stored as sent | `test_the_reason_is_not_compared_and_is_stored_sanitised` |
| a leader's reason is stored uncapped | `test_the_reason_is_not_compared_and_is_stored_sanitised` |
| reports are not linked | `test_every_persistent_field_is_declared_and_every_stored_field_is_read` |
| the report count is not kept | `test_a_done_report_is_paid_at_once` |
| the rest is not returned | `test_settle_returns_what_is_left_to_the_organisation` |
| what was returned is not recorded | `test_settle_returns_what_is_left_to_the_organisation` |
| the held counter is not raised | `test_a_task_opens_with_its_criteria_frozen_and_every_volunteer_paid_in` |
| a payout beyond what is held is sent | `test_a_payout_beyond_what_is_held_is_refused` |
| the held counter is not lowered | `test_a_done_report_is_paid_at_once` |
| the second pass is asked in the forward order | `test_the_options_are_asked_in_both_orders` |
| the reversed order is not reversed | `test_the_options_are_asked_in_both_orders` |
| a disagreement between the orders keeps the forward verdict | `test_a_model_that_always_answers_0_pays_nothing` |
| a disagreement between the orders is done | `test_a_model_that_always_answers_0_pays_nothing` |
| an answer is not read back through its order | `test_a_done_report_is_paid_at_once` |
| an option past the list is accepted | `test_an_unusable_answer_is_an_error_and_never_a_verdict` |
| an answer in words is read as a number | `test_an_unusable_answer_is_an_error_and_never_a_verdict` |
| an unusable answer is not retried | `test_an_unusable_answer_is_an_error_and_never_a_verdict` |
| a bare value is read as if it were an object | `test_an_unusable_answer_is_an_error_and_never_a_verdict` |
| an unusable answer becomes done | `test_an_unusable_answer_is_an_error_and_never_a_verdict` |
| the validator agrees with a leader error | `test_an_unusable_answer_is_an_error_and_never_a_verdict` |
| the validator skips the free structural check | `test_a_verdict_that_is_neither_option_is_refused_for_free` |
| the validator agrees with anything | `test_nodes_that_decide_differently_do_not_agree` |
| the validator agrees when its own model fails | `test_a_validator_whose_model_fails_does_not_agree` |
| agreement ignores the structural check | `test_an_unsound_verdict_does_not_agree_with_itself` |
| any word is a sound verdict | `test_a_verdict_that_is_neither_option_is_refused_for_free` |
| the agreed verdict is not checked again | `test_the_agreed_verdict_is_checked_again_before_it_is_stored` |
| the fence does nothing | `test_caller_text_is_stored_verbatim_and_fenced_only_at_the_prompt` |
| the fence leaves square brackets | `test_caller_text_is_stored_verbatim_and_fenced_only_at_the_prompt` |
| the report reaches the prompt unfenced | `test_caller_text_is_stored_verbatim_and_fenced_only_at_the_prompt` |
| the criteria reach the prompt unfenced | `test_caller_text_is_stored_verbatim_and_fenced_only_at_the_prompt` |
| the title reaches the prompt unfenced | `test_every_value_interpolated_into_the_prompt_is_fenced_or_ours` |
| the prompt judges effort instead of the criteria | `test_the_prompt_tells_the_model_not_to_judge_effort_or_belief` |
<!-- measured:mutations:end -->

## Verified against the live deployment

<!-- measured:deployment:start -->
Deployed on studionet at [`0xC068d7C10Bf232a92546b936409f41AeEAf11cbB`](https://explorer-studio.genlayer.com/address/0xC068d7C10Bf232a92546b936409f41AeEAf11cbB) (deploy [`0x7f2623cf...`](https://explorer-studio.genlayer.com/tx/0x7f2623cfeef769121b84e946c56ba848e8a6305f550b79d5e39c24be2183008e)). Every value below was read back from the chain by `scripts/seed.mjs` and written to [`deployments/studionet.json`](deployments/studionet.json); none of it is typed by hand.

The task: **Trail cleanup at Riverside Park**, a stipend of 0.02 GEN per volunteer, 3 volunteer slots. Its criteria, frozen at open(): *A volunteer's report is done only if it says they personally picked up litter along the river trail for at least an hour and put it in the park's bins. Watching others work, walking the trail without picking anything up, or working somewhere other than the river trail is not done.*

| Report | Verdict | Paid | Reason the leader gave (not consensus) |
|---|---|---|---|
| 0 | **done** | 0.02 GEN | Report says they personally picked up litter on the river trail for just over an hour and put it in the park's bins. |
| 1 | **not_done** | 0 GEN | They only walked and observed litter on the river trail; they explicitly say they did not pick it up or put it in bins. |
| 2 | **done** | 0.02 GEN | They personally picked up litter on the river trail for about ninety minutes and put the filled bags in the park’s bins. |

Every wallet's balance was read from the chain after the stipend pool was paid in and once every payout had landed, against what the contract says it paid:

| Wallet | Before | After | The contract paid |
|---|---|---|---|
| org | 0.94 GEN | 0.96 GEN | 0.02 GEN |
| ann | 0 GEN | 0.02 GEN | 0.02 GEN |
| ben | 0 GEN | 0 GEN | 0 GEN |
| cal | 0 GEN | 0.02 GEN | 0.02 GEN |

Every transaction, in order, refusals included, with the wallet that sent it:

| Step | From | Outcome | Transaction |
|---|---|---|---|
| task 0: Riverside Park trail cleanup, 3 volunteers at 0.02 GEN | org | ok | [`0x3e18d4e7...`](https://explorer-studio.genlayer.com/tx/0x3e18d4e7cc9caa5019fc857e27e9a0c05dd46f0975c01a3ae59b09fc091784c8) |
| the organisation reports on its own task | org | refused: the organisation cannot report on its own task | [`0x7f28a7f7...`](https://explorer-studio.genlayer.com/tx/0x7f28a7f757005a9f92ab4612d7817b7e4a0df83950099c82529eb60efa26df94) |
| report 0: Ann picks up litter for an hour | ann | ok | [`0xcdb56c5b...`](https://explorer-studio.genlayer.com/tx/0xcdb56c5b10326c90e6e6de34c30e071bd000489d99a93d4b4eaf93aa4a8a6cc7) |
| Ann reports a second time | ann | refused: a volunteer reports once per task | [`0xf97f0b4a...`](https://explorer-studio.genlayer.com/tx/0xf97f0b4a07ed7238dce957861d34e4156860f38ca181dcc6b9039ed06a17f1f0) |
| report 1: Ben only looks, does not pick up | ben | ok | [`0x926e132b...`](https://explorer-studio.genlayer.com/tx/0x926e132bab06c7bb211a865e5b90ef5bc3126e1afd68e3310f6be395fae8a60d) |
| report 2: Cal picks up litter for ninety minutes | cal | ok | [`0xc7e49185...`](https://explorer-studio.genlayer.com/tx/0xc7e49185f941d439adeb2ab3b063c18504b0880b9cfbb33a0b14449387c66c92) |
| a settlement before the window closes | stranger | refused: reports are open until 2026-11-08T21:23:58Z | [`0x19fdeb6b...`](https://explorer-studio.genlayer.com/tx/0x19fdeb6be1d549bf84402fa2005ad57f5c74ab89de0a75ed9d01eb7eecfac905) |
| a late report after the window closes | stranger | refused: reports closed at 2026-11-08T21:23:58Z; a late report is never judged | [`0xe5b487ff...`](https://explorer-studio.genlayer.com/tx/0xe5b487ff4ef8011ef745a931fdeeb16a912da3f013849ccae97ec35975796a1a) |
| task 0 settled: the unused third slot returned | stranger | ok | [`0xb2c46905...`](https://explorer-studio.genlayer.com/tx/0xb2c46905a76cb2989bcd6cc80b0e6ef21fbde73d882d9996ab7fcfc487a0f05e) |

`tests/test_runbook.py::TestTheRecord` replays these verdicts through this repository's contract and fails unless it pays exactly as the deployed one did.
<!-- measured:deployment:end -->

On top of the record: `pnpm e2e:contract` asks the chain again for every
transaction, the task and every report and checks each against the record,
along with every wallet's balance, and `pnpm verify:contract` reads the
deployed source back with `gen_getContractCode`, compares it byte for byte
with `packages/contracts/volunteer.py`, and runs genvm-lint on the deployed
bytes.

## Known limits

- Validators judge what the volunteer says they did, not whether it is true; the report is public and permanent next to the payment.
- One person with many wallets can report many times; the number of paid volunteer slots bounds it.
- One stipend per report, the native token only, whole wei.
- On StudioNet the value sent with a refused payable call stays at the contract's address. `held` counts only accepted payments, so that value is never paid out.
- StudioNet is a test network; its state can be reset.

## Path forward

- A photo or location attached to a report, read by the same model alongside the text.
- A partial stipend schedule: more volunteers, a smaller share each, by the clock alone.
- A task board that shows each task's remaining slots and window.
