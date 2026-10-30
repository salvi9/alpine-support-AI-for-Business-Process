import { readFileSync } from "node:fs";
import path from "node:path";
import { CaseWorkspace, type CaseView } from "@/components/case-workspace";
import { findOrder, orders, referenceExtraction, testCases } from "@/lib/data";
import { rulesFromExtraction } from "@/lib/evaluate";

export default function Home() {
  const cases: CaseView[] = testCases.map((tc) => {
    const extraction = referenceExtraction(tc);
    return {
      testCase: tc,
      order: findOrder(extraction.order_id),
      extraction,
      rules: rulesFromExtraction(tc, extraction),
    };
  });

  const policy = readFileSync(path.join(process.cwd(), "data/policy.md"), "utf8");
  return <CaseWorkspace cases={cases} orders={orders} policy={policy} />;
}
