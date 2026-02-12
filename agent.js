// agent.js — جسر بين تعليقاتك و GitHub/Supabase عبر OpenAI
// يقرأ الأمر من تعليق PR، يحلل الـdiff، يقترح SQL، وينفّذ فقط عند confirm=true

import OpenAI from "openai";
import { Octokit } from "@octokit/rest";
import { createClient } from "@supabase/supabase-js";

// مفاتيحك تجي من Secrets تلقائيًا عبر GitHub Actions
const openai   = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const octokit  = new Octokit({ auth: process.env.GH_TOKEN || process.env.GITHUB_TOKEN });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// أداة مساعدة: قراءة ملفات الـ PR كـ diff
async function getPRDiff(owner, repo, pr) {
  const files = await octokit.pulls.listFiles({ owner, repo, pull_number: pr });
  return files.data.map(f => `--- ${f.filename}\n${f.patch ?? ""}`).join("\n");
}

// أداة مساعدة: تنفيذ SQL عبر RPC exec_sql (أنشئها مرة في Supabase)
async function runSQL(sql) {
  // حراسة بسيطة
  if (/DROP\s+TABLE|TRUNCATE|DELETE\s+FROM\s+\w+\s*;?$/i.test(sql)) {
    throw new Error("Unsafe SQL blocked.");
  }
  const { data, error } = await supabase.rpc("exec_sql", { _q: sql });
  if (error) throw error;
  return data;
}

// تحليل نص التعليق: key=value
function parseArgs(body = "") {
  const pairs = [...body.matchAll(/(\w+)=(".*?"|\S+)/g)].map(m => [m[1], m[2].replaceAll('"','')]);
  return Object.fromEntries(pairs);
}

async function main() {
  const owner = process.env.INPUT_OWNER || (process.env.GITHUB_REPOSITORY || "").split("/")[0];
  const repo  = process.env.INPUT_REPO  || (process.env.GITHUB_REPOSITORY || "").split("/")[1];
  const pr    = Number(process.env.INPUT_PR || 0);
  const body  = process.env.INPUT_BODY || "";  // نص تعليقك

  const args = parseArgs(body);                 // task="..." confirm=true/false

  // 1) جيب الـ diff
  const diff = await getPRDiff(owner, repo, pr);

  // 2) خلّي النموذج يقترح خطة + SQL + Rollback
  const prompt = `
أنت مساعد تقني لمشروع Next.js/Supabase.
اعطِ:
- ملخص التغيير
- تحليل المخاطر
- SQL Migration داخل كتلة \`\`\`sql ... \`\`\`
- خطة رجوع (Rollback) داخل كتلة \`\`\`sql ... \`\`\`

الـ DIFF:
${diff}
`;
  const resp = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: prompt
  });
  const plan = String(resp.output_text || "");

  // 3) نفّذ فقط إذا confirm=true
  let executionNote = "⏸️ Pending manual approval (add confirm=true).";
  if (String(args.confirm) === "true") {
    const m = plan.match(/```sql([\s\S]*?)```/);
    if (m && m[1]) {
      try { await runSQL(m[1].trim()); executionNote = "✅ Executed successfully."; }
      catch (e) { executionNote = "❌ Execution failed: " + e.message; }
    } else {
      executionNote = "❌ No SQL block found.";
    }
  }

  // 4) علّق بالنتيجة على نفس الـ PR
  const comment = [
    `**Task:** ${args.task || "N/A"}`,
    "",
    "### Plan / Migration",
    plan || "_no plan_",
    "",
    `**Execution:** ${executionNote}`
  ].join("\n");

  await octokit.issues.createComment({ owner, repo, issue_number: pr, body: comment.slice(0, 65500) });
  console.log("Comment posted.");
}

main().catch(err => { console.error(err); process.exit(1); });
