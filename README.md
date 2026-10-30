# Alpine Outdoor – Support Copilot

Course prototype of AI-assisted customer support for a fictional outdoor retailer.
Pattern: **the system suggests, a human decides.** The AI never sends replies or issues refunds.

## Pipeline

1. **Extraction (ChatGPT, manual handoff)**: copy a case prompt, then import the returned JSON.
2. **Rules (TypeScript, deterministic)**: `lib/rules.ts` decides eligibility and escalation from `data/policy.md`.
3. **Draft reply (ChatGPT, manual handoff)**: copy a second prompt grounded in the policy and rules decision, then paste the reply.
4. **Human review**: agent approves, edits, or escalates.

## Project layout

| Path | Purpose |
|------|---------|
| `data/policy.md` | Support policy (source of truth) |
| `data/orders.json` | 15 mock orders |
| `data/test_cases.json` | 25 customer messages with answer keys |
| `lib/rules.ts` | Rules engine (no LLM) |
| `lib/evaluate.ts` | Runs rules on every test case and compares with the answer key |
| `app/page.tsx` | Agent workspace |
| `app/eval/page.tsx` | Rules evaluation results |

## Commands

```bash
npm install
npm run dev          # http://localhost:3000
npm run test:rules   # rules accuracy on the answer-key extraction
npm run test:manual-ai # import validation and prompt isolation
npm run build
```

## Use with ChatGPT without an API key

1. Run `npm install` and `npm run dev`, then open http://localhost:3000.
2. Select a case. Initially its displayed facts are labeled **Answer-key demo**.
3. Choose **1. Copy extraction prompt**. Paste it into a fresh ChatGPT conversation using your existing account. The prompt includes the customer message, a minimal mock order catalog, and the extraction role and field definitions. It excludes expected answers and rationales.
4. Paste ChatGPT's JSON into **ChatGPT extraction JSON**, then choose **2. Import extraction and run rules**. Plain JSON and a single JSON code fence are accepted. Validation errors explain what to correct; the previous imported result remains active until a valid import succeeds.
5. Check the displayed facts against the original message. JSON validation checks structure and order/SKU consistency, not whether the model understood the customer correctly. Confidence is self-reported.
6. Choose **3. Copy reply prompt** and paste it into ChatGPT. This includes the full policy, imported facts, matching order details, and computed decision. Paste the returned customer reply into **Draft reply**, edit it, then approve or escalate as appropriate.

If clipboard access is unavailable, **View prompt** exposes a selectable prompt for manual copying. Imports and drafts remain separate for each case while navigating the inbox. Refreshing the page clears all imported facts, drafts, and review statuses. Importing new facts or restoring the answer-key demo clears that case's prior draft and review status.

Imported claims with an unknown return condition or an unconfirmed warranty defect are marked **needs info** before approval. The original reference evaluation remains unchanged. The Approve button requires imported facts, a nonempty draft, a complete decision, and no supervisor escalation. Requests for missing information can be drafted but have no send action in this prototype.

No model calls are made by the app, no API key is required, and no reply, refund, or replacement is actually sent. A later API integration can replace the copy/paste handoff while preserving validation, rules, and human review. The `/eval` page continues to measure rules on reference facts; it does not measure imported AI accuracy.

## Manual AI implementation

- `lib/manual-ai.ts`: reusable role prompts, JSON validation, order/SKU checks, and imported-fact evaluation.
- `components/case-workspace.tsx`: per-case imports, prompt copying, reply editing, and simulated review controls.
- `scripts/test-manual-ai.ts`: checks valid/invalid imports, unknown facts, escalation preservation, and answer-key exclusion.
