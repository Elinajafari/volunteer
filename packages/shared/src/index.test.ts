import { describe, expect, it } from "vitest";
import vectors from "../volunteer-vectors.json";
import {
  FORWARD,
  REVERSED,
  cleanText,
  fold,
  normaliseChoice,
  optionOf,
  parseReport,
  parseTask,
  verdictSound,
} from "./index";

// volunteer-vectors.json is generated from the contract's own functions
// (see packages/contracts/tests/test_vectors.py), so every case below is the
// contract's answer, not a hand-written expectation.

describe("the port agrees with the contract on every vector", () => {
  it.each(vectors.clean_text)("clean_text %#", ({ raw, clean }) => expect(cleanText(raw)).toBe(clean));
  it.each(vectors.normalise_choice)("normalise_choice %#", ({ raw, n, choice }) => expect(normaliseChoice(raw, n)).toBe(choice));
  it.each(vectors.option_of)("option_of %#", ({ choice, order, option }) => expect(optionOf(choice, order)).toBe(option));
  it.each(vectors.fold)("fold %#", ({ forward, reverse, folded }) => expect(fold(forward, reverse)).toBe(folded));
  it.each(vectors.verdict_sound)("verdict_sound %#", ({ verdict, sound }) => expect(verdictSound(verdict)).toBe(sound));
});

describe("the two orders", () => {
  it("are each other's reverse", () => {
    expect([...REVERSED]).toEqual([...FORWARD].reverse());
  });
});

describe("parsers refuse what the contract never returns", () => {
  const task = {
    title: "Trail cleanup", criteria: "Pick up litter for an hour.", org: "0x" + "11".repeat(20),
    stipend: "20000000000000000", max_volunteers: 3, pool: "60000000000000000", left: "20000000000000000",
    paid_total: "40000000000000000", returned: "0", status: "open", reports: 2, paid: 2,
    opened_at: "t", closes_at: "t2", closed_at: "",
  };
  const report = {
    id: 0, task: 0, volunteer: "0x" + "22".repeat(20), report: "I picked up litter for an hour.", at: "t",
    verdict: "done", why: "", paid: "20000000000000000", reason_is_leader_supplied: true,
  };
  it("parses a task and a report from an object or a Map, with amounts as bigint", () => {
    expect(parseTask(task).stipend).toBe(2n * 10n ** 16n);
    expect(parseReport(report).paid).toBe(2n * 10n ** 16n);
    expect(parseReport(new Map(Object.entries(report))).verdict).toBe("done");
  });
  it("refuses a status or a verdict the contract never returns", () => {
    expect(() => parseTask({ ...task, status: "pending" })).toThrow("unexpected status");
    expect(() => parseReport({ ...report, verdict: "maybe" })).toThrow("unexpected verdict");
    expect(() => parseReport({ ...report, paid: "2e16" })).toThrow("amount of wei");
  });
  it("refuses a payout that contradicts the verdict", () => {
    expect(() => parseReport({ ...report, verdict: "not_done", paid: "1" })).toThrow();
    expect(() => parseReport({ ...report, verdict: "", paid: "1" })).toThrow();
    expect(parseReport({ ...report, verdict: "not_done", paid: "0" }).verdict).toBe("not_done");
  });
});
