# Evidence: Volunteer, second round on GenLayer StudioNet

Every row below was read back from the chain by `scripts/evidence.mjs`: the
sender, the status and the outcome come from the node's answer for each hash,
not from the deployment record. Every outcome on chain matches the record.

- **Contract:** [`0xC068d7C10Bf232a92546b936409f41AeEAf11cbB`](https://explorer-studio.genlayer.com/address/0xC068d7C10Bf232a92546b936409f41AeEAf11cbB)
- **Round:** new wallets on the contract already deployed; no deploy in this round
- **The deployment itself:** [EVIDENCE.md](EVIDENCE.md)
- **Transactions:** 4, from 2 different wallets
- **Generated:** 2026-11-08 21:35 UTC

## Wallets

Each wallet was made in memory for this run, and its key was never written
anywhere. Click an address to see every transaction it sent.

| Role | Address | Transactions sent |
|---|---|---|
| org | [`0x27E8C72A91A0f58Db797DB688a9304536c687064`](https://explorer-studio.genlayer.com/address/0x27E8C72A91A0f58Db797DB688a9304536c687064) | 3 |
| volunteer | [`0xDBC3Fb642B76Ce0b2715eaeA7b2d457e977b2ABA`](https://explorer-studio.genlayer.com/address/0xDBC3Fb642B76Ce0b2715eaeA7b2d457e977b2ABA) | 1 |

## Transactions, in order

"refused" is a transaction the contract was meant to refuse: the committee
agreed on the refusal, and the sentence is the contract's own.

| # | Step | Sent by | Method | On chain | Outcome | Tx |
|---|---|---|---|---|---|---|
| 0 | task 1: a new organisation opens a one-volunteer task | org [`0x27E8…7064`](https://explorer-studio.genlayer.com/address/0x27E8C72A91A0f58Db797DB688a9304536c687064) | `open` | FINALIZED · MAJORITY_AGREE | executed | [`0x0d6bddff…f84e`](https://explorer-studio.genlayer.com/tx/0x0d6bddff158859237bbfc67fdc9137e0c81e10aa9701facd67075d394522f84e) |
| 1 | report for task 1: a new volunteer reports (expected done) | volunteer [`0xDBC3…2ABA`](https://explorer-studio.genlayer.com/address/0xDBC3Fb642B76Ce0b2715eaeA7b2d457e977b2ABA) | `report` | FINALIZED · MAJORITY_AGREE | executed | [`0x4b7cef5d…1059`](https://explorer-studio.genlayer.com/tx/0x4b7cef5df10468bc5cc15197707e36a4116960ac04430a336ff26b5f752e1059) |
| 2 | the organisation tries to settle before the window closes | org [`0x27E8…7064`](https://explorer-studio.genlayer.com/address/0x27E8C72A91A0f58Db797DB688a9304536c687064) | `settle` | FINALIZED · MAJORITY_AGREE | refused: reports are open until 2026-11-08T21:34:50Z | [`0xf01c8c11…80b7`](https://explorer-studio.genlayer.com/tx/0xf01c8c1165ef750652a5faeb50ed9e7464501c1040594431073205541dae80b7) |
| 3 | task 1 settled | org [`0x27E8…7064`](https://explorer-studio.genlayer.com/address/0x27E8C72A91A0f58Db797DB688a9304536c687064) | `settle` | ACCEPTED · MAJORITY_AGREE | executed | [`0xc5d98b86…f4f8`](https://explorer-studio.genlayer.com/tx/0xc5d98b864329a20ffa39377c873aed35729c0db98a285466be177d118d16f4f8) |
