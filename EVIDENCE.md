# Evidence: Volunteer on GenLayer StudioNet

Every row below was read back from the chain by `scripts/evidence.mjs`: the
sender, the status and the outcome come from the node's answer for each hash,
not from the deployment record. Every outcome on chain matches the record.

- **Contract:** [`0xC068d7C10Bf232a92546b936409f41AeEAf11cbB`](https://explorer-studio.genlayer.com/address/0xC068d7C10Bf232a92546b936409f41AeEAf11cbB)
- **Deploy transaction:** [`0x7f2623cf…008e`](https://explorer-studio.genlayer.com/tx/0x7f2623cfeef769121b84e946c56ba848e8a6305f550b79d5e39c24be2183008e)
- **Source sha256:** `50045296fe488f1a7fa1b0891c6f81622297ce80683af190d17ae9944862f3f8`
- **Transactions:** 10, from 6 different wallets
- **Generated:** 2026-11-08 21:26 UTC

## Wallets

Each wallet was made in memory for this run, and its key was never written
anywhere. Click an address to see every transaction it sent.

| Role | Address | Transactions sent |
|---|---|---|
| deployer | [`0x589a3E40167A2Ec54655e4735Fe9EA1B2a329092`](https://explorer-studio.genlayer.com/address/0x589a3E40167A2Ec54655e4735Fe9EA1B2a329092) | 1 |
| org | [`0xb7Dcae6ECF06515b7BAd7EB219fCB4995cefFb59`](https://explorer-studio.genlayer.com/address/0xb7Dcae6ECF06515b7BAd7EB219fCB4995cefFb59) | 2 |
| ann | [`0x5532702D6759996464E8851a014ACf2b2693357F`](https://explorer-studio.genlayer.com/address/0x5532702D6759996464E8851a014ACf2b2693357F) | 2 |
| ben | [`0x7a026644816E9CB5137f48fBc5733B4997B2dAD7`](https://explorer-studio.genlayer.com/address/0x7a026644816E9CB5137f48fBc5733B4997B2dAD7) | 1 |
| cal | [`0x9d55a1b1C34fB52b9f2F1e4dE288E9843B30a54a`](https://explorer-studio.genlayer.com/address/0x9d55a1b1C34fB52b9f2F1e4dE288E9843B30a54a) | 1 |
| stranger | [`0x88B3553d2040C55Cd7AaA96152BdCC6982ecCE5F`](https://explorer-studio.genlayer.com/address/0x88B3553d2040C55Cd7AaA96152BdCC6982ecCE5F) | 3 |

## Transactions, in order

"refused" is a transaction the contract was meant to refuse: the committee
agreed on the refusal, and the sentence is the contract's own.

| # | Step | Sent by | Method | On chain | Outcome | Tx |
|---|---|---|---|---|---|---|
| 0 | deploy | deployer [`0x589a…9092`](https://explorer-studio.genlayer.com/address/0x589a3E40167A2Ec54655e4735Fe9EA1B2a329092) | `deploy` | FINALIZED · MAJORITY_AGREE | executed | [`0x7f2623cf…008e`](https://explorer-studio.genlayer.com/tx/0x7f2623cfeef769121b84e946c56ba848e8a6305f550b79d5e39c24be2183008e) |
| 1 | task 0: Riverside Park trail cleanup, 3 volunteers at 0.02 GEN | org [`0xb7Dc…Fb59`](https://explorer-studio.genlayer.com/address/0xb7Dcae6ECF06515b7BAd7EB219fCB4995cefFb59) | `open` | FINALIZED · MAJORITY_AGREE | executed | [`0x3e18d4e7…84c8`](https://explorer-studio.genlayer.com/tx/0x3e18d4e7cc9caa5019fc857e27e9a0c05dd46f0975c01a3ae59b09fc091784c8) |
| 2 | the organisation reports on its own task | org [`0xb7Dc…Fb59`](https://explorer-studio.genlayer.com/address/0xb7Dcae6ECF06515b7BAd7EB219fCB4995cefFb59) | `report` | FINALIZED · MAJORITY_AGREE | refused: the organisation cannot report on its own task | [`0x7f28a7f7…df94`](https://explorer-studio.genlayer.com/tx/0x7f28a7f757005a9f92ab4612d7817b7e4a0df83950099c82529eb60efa26df94) |
| 3 | report 0: Ann picks up litter for an hour | ann [`0x5532…357F`](https://explorer-studio.genlayer.com/address/0x5532702D6759996464E8851a014ACf2b2693357F) | `report` | FINALIZED · MAJORITY_AGREE | executed | [`0xcdb56c5b…6cc7`](https://explorer-studio.genlayer.com/tx/0xcdb56c5b10326c90e6e6de34c30e071bd000489d99a93d4b4eaf93aa4a8a6cc7) |
| 4 | Ann reports a second time | ann [`0x5532…357F`](https://explorer-studio.genlayer.com/address/0x5532702D6759996464E8851a014ACf2b2693357F) | `report` | FINALIZED · MAJORITY_AGREE | refused: a volunteer reports once per task | [`0xf97f0b4a…f1f0`](https://explorer-studio.genlayer.com/tx/0xf97f0b4a07ed7238dce957861d34e4156860f38ca181dcc6b9039ed06a17f1f0) |
| 5 | report 1: Ben only looks, does not pick up | ben [`0x7a02…dAD7`](https://explorer-studio.genlayer.com/address/0x7a026644816E9CB5137f48fBc5733B4997B2dAD7) | `report` | FINALIZED · MAJORITY_AGREE | executed | [`0x926e132b…a60d`](https://explorer-studio.genlayer.com/tx/0x926e132bab06c7bb211a865e5b90ef5bc3126e1afd68e3310f6be395fae8a60d) |
| 6 | report 2: Cal picks up litter for ninety minutes | cal [`0x9d55…a54a`](https://explorer-studio.genlayer.com/address/0x9d55a1b1C34fB52b9f2F1e4dE288E9843B30a54a) | `report` | FINALIZED · MAJORITY_AGREE | executed | [`0xc7e49185…6c92`](https://explorer-studio.genlayer.com/tx/0xc7e49185f941d439adeb2ab3b063c18504b0880b9cfbb33a0b14449387c66c92) |
| 7 | a settlement before the window closes | stranger [`0x88B3…CE5F`](https://explorer-studio.genlayer.com/address/0x88B3553d2040C55Cd7AaA96152BdCC6982ecCE5F) | `settle` | FINALIZED · MAJORITY_AGREE | refused: reports are open until 2026-11-08T21:23:58Z | [`0x19fdeb6b…c905`](https://explorer-studio.genlayer.com/tx/0x19fdeb6be1d549bf84402fa2005ad57f5c74ab89de0a75ed9d01eb7eecfac905) |
| 8 | a late report after the window closes | stranger [`0x88B3…CE5F`](https://explorer-studio.genlayer.com/address/0x88B3553d2040C55Cd7AaA96152BdCC6982ecCE5F) | `report` | FINALIZED · MAJORITY_AGREE | refused: reports closed at 2026-11-08T21:23:58Z; a late report is never judged | [`0xe5b487ff…6a1a`](https://explorer-studio.genlayer.com/tx/0xe5b487ff4ef8011ef745a931fdeeb16a912da3f013849ccae97ec35975796a1a) |
| 9 | task 0 settled: the unused third slot returned | stranger [`0x88B3…CE5F`](https://explorer-studio.genlayer.com/address/0x88B3553d2040C55Cd7AaA96152BdCC6982ecCE5F) | `settle` | FINALIZED · MAJORITY_AGREE | executed | [`0xb2c46905…f05e`](https://explorer-studio.genlayer.com/tx/0xb2c46905a76cb2989bcd6cc80b0e6ef21fbde73d882d9996ab7fcfc487a0f05e) |
