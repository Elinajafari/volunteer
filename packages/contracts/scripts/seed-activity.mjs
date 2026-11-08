// A second round on the deployed contract, from two NEW wallets.
//
//   pnpm seed:activity
//
// The contract in deployments/studionet.json is not redeployed. Two wallets
// made in memory for this run, used by nothing else, run one task from open
// to settle, and each tries once what only the other may do:
//
//   org        opens a second task, a 0.02 GEN stipend, one volunteer slot
//   volunteer  reports
//   org        tries to settle it before the window closes   refused
//   volunteer  waits out the window, the report was judged done (expected ok)
//   org        settles once the window has closed: nothing left to return
//
// Everything goes to deployments/studionet-activity.json, apart from the
// demo's own record, so the demo and the tests that replay it are untouched.
// Then `pnpm evidence:activity` writes EVIDENCE-ACTIVITY.md from the chain.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createAccount, generatePrivateKey } from "genlayer-js";
import { PKG, RECORD_FILE, balanceOf, clientFor, fundAccount, loadEnv, network, readRetry, recorder, sleep } from "./lib.mjs";

loadEnv();
const net = network();
if (net.name !== "studionet") throw new Error("the activity round makes throwaway wallets; run it on studionet");
const address = JSON.parse(readFileSync(RECORD_FILE, "utf8")).contract;
const data = JSON.parse(readFileSync(path.join(PKG, "demo", "activity.json"), "utf8"));
const OUT = path.join(PKG, "deployments", "studionet-activity.json");

const org = createAccount(generatePrivateKey());
const volunteer = createAccount(generatePrivateKey());
const asOrg = clientFor(net, org);
const asVolunteer = clientFor(net, volunteer);
const ro = clientFor(net, null);
const read = (fn, args = []) => readRetry(() => ro.readContract({ address, functionName: fn, args }));
const plain = (v) => JSON.parse(JSON.stringify(v, (_, x) => (typeof x === "bigint" ? Number(x) : x instanceof Map ? Object.fromEntries(x) : x)));

const id = Number(await read("count"));
console.log(`\ncontract ${address} (already deployed, ${id} tasks on it)\n  org        ${org.address}\n  volunteer  ${volunteer.address}`);
await fundAccount(net, ro, org.address, 10n ** 18n);

const T = data.task;
const rec = recorder();
await rec.write(asOrg, org, address, "open", [T.title, T.criteria, BigInt(T.stipend), T.max_volunteers, T.window],
  { step: "task 1: a new organisation opens a one-volunteer task", value: BigInt(T.stipend) * BigInt(T.max_volunteers) });
const before = await balanceOf(ro, volunteer.address);
await rec.write(asVolunteer, volunteer, address, "report", [id, data.report], { step: `report for task ${id}: a new volunteer reports (expected ${data.expected_verdict})` });
await rec.write(asOrg, org, address, "settle", [id], { step: "the organisation tries to settle before the window closes", expect: "refused" });

const closes = Date.parse(plain(await read("task", [id])).closes_at);
for (let left = closes + 20_000 - Date.now(); left > 0; left = closes + 20_000 - Date.now()) {
  console.log(`  waiting ${Math.ceil(left / 1000)} s for the window to close`);
  await sleep(Math.min(left, 30_000));
}
await rec.write(asOrg, org, address, "settle", [id], { step: "task 1 settled" });

const task = plain(await read("task", [id]));
let after = await balanceOf(ro, volunteer.address);
const owed = task.paid === 1 ? BigInt(T.stipend) : 0n;
for (let k = 0; k < 6 && after - before !== owed; k++) {
  await sleep(10_000);
  after = await balanceOf(ro, volunteer.address);
}
writeFileSync(OUT, JSON.stringify({
  network: net.name,
  contract: address,
  accounts: { org: org.address, volunteer: volunteer.address },
  steps: rec.steps,
  tasks: { [id]: task },
  balances: { volunteer_before: String(before), volunteer_after: String(after) },
}, null, 2) + "\n");

console.log(`  task ${id}  ${task.status}  paid ${task.paid}/${task.max_volunteers}`);
console.log(`  written  ${path.relative(PKG, OUT)}\n`);
