import assert from "node:assert/strict";
import { orders, referenceExtraction, testCases } from "../lib/data";
import { evaluateImported, extractionPrompt, parseExtraction, replyPrompt } from "../lib/manual-ai";

const tc = testCases[0];
const reference = referenceExtraction(tc);
const json = (changes: Record<string, unknown>) => JSON.stringify({ ...reference, ...changes });

for (const testCase of testCases) {
  const ex = referenceExtraction(testCase);
  assert.deepEqual(parseExtraction(JSON.stringify(ex), orders), ex);
}
assert.deepEqual(parseExtraction(`\`\`\`json\n${JSON.stringify(reference)}\n\`\`\``, orders), reference);
for (const invalid of ["not JSON", "[]", "null", "{}", json({ confidence: 1.1 }),
  json({ confidence: "0.9" }), json({ safety_issue: "false" }), json({ issue_type: "refund" }),
  json({ affected_sku: "FAKE-SKU" }), json({ order_id: null }), json({ decision: "eligible" })]) {
  assert.throws(() => parseExtraction(invalid, orders));
}
const unknownOrder = parseExtraction(json({ order_id: "AO-99999", affected_sku: null }), orders);
assert.equal(evaluateImported(tc, unknownOrder, orders).rules.decision, "needs_info");
assert.equal(evaluateImported(tc, reference, orders).rules.decision, "eligible");
const incomplete = { ...reference, item_condition: "unknown" as const, safety_issue: true };
const result = evaluateImported(tc, incomplete, orders);
assert.equal(result.rules.decision, "needs_info");
assert.equal(result.rules.escalate, true);
assert.ok(result.rules.escalations.some((e) => e.code === "safety_concern"));
const warrantyCase = testCases.find((item) => item.case_id === "TC05")!;
assert.equal(evaluateImported(warrantyCase, { ...referenceExtraction(warrantyCase), damage_cause: "unknown" }, orders).rules.decision, "needs_info");

// Answer keys must never leak into the prompts sent to ChatGPT.
const secret = "ANSWER_KEY_MUST_NOT_LEAK";
const poisoned = { ...tc, expected: { ...tc.expected, order_id: secret }, rationale: secret };
const prompt = extractionPrompt(poisoned, orders);
assert.ok(prompt.includes(tc.message));
assert.ok(prompt.includes("AO-10001"));
assert.ok(!prompt.includes(secret));
assert.ok(!prompt.includes("customer_email"));
const draftPrompt = replyPrompt(poisoned, reference, result.order, result.rules, "TEST POLICY");
assert.ok(!draftPrompt.includes(secret));
assert.ok(draftPrompt.includes("TEST POLICY"));
assert.ok(draftPrompt.includes('"actions_taken": []'));
console.log("Manual AI checks passed: all 25 reference extractions validate; invalid input, missing facts, escalation, and prompt isolation verified.");
