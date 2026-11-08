import { describe, expect, it } from "vitest";
import demo from "../../contracts/demo/demo.json";
import record from "../../contracts/deployments/studionet.json";
import shape from "../contract-shape.json";
import { parseReport, parseTask } from "./index";

// The live deployment's own answers, as packages/contracts/scripts/seed.mjs
// read them back from studionet. If the contract ever returned a shape these
// parsers refuse, a client built on this package would break on real data;
// this is where that shows up first.

describe("the parsers accept everything the live deployment returned", () => {
  it("the task and every report, with exactly the fields the contract describes", () => {
    expect(Object.keys(parseTask(record.tasks[0])).sort()).toEqual(shape.views.task.fields);
    for (const x of record.reports) {
      expect(Object.keys(parseReport(x)).sort()).toEqual(shape.views.reports_of.row_fields);
    }
  });

  it("the task's criteria and stipend are the ones the demo opened with", () => {
    const t = parseTask(record.tasks[0]);
    expect(t.criteria).toBe(demo.task.criteria);
    expect(t.stipend).toBe(BigInt(demo.task.stipend));
  });

  it("every done report was paid the stipend, and every not_done report nothing", () => {
    for (const r of record.reports.map(parseReport)) {
      expect(r.paid).toBe(r.verdict === "done" ? t_stipend() : 0n);
    }
    function t_stipend() {
      return BigInt(demo.task.stipend);
    }
  });

  it("the wallets moved by exactly what the contract paid them", () => {
    const b = record.balances as Record<string, string>;
    for (const [who, owed] of Object.entries(record.owed)) {
      expect(BigInt(b[`${who}_after`]) - BigInt(b[`${who}_before`])).toBe(BigInt(owed));
    }
  });
});
