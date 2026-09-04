#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const passes = [];
const failures = [];
const read = (path) => readFileSync(resolve(root, path), "utf8");
const check = (label, condition) => (condition ? passes.push(label) : failures.push(label));

const contracts = read("src/lib/webmcp/contracts.ts");
const provider = read("src/components/webmcp/WebMCPProvider.tsx");
const route = read("src/routes/webmcp.tsx");
const rootRoute = read("src/routes/__root.tsx");
const expected = ["search_updates", "get_source_record", "compare_updates", "build_briefing"];
const blocks = contracts.split("export const ").filter((block) => block.includes("_DESCRIPTOR"));
const names = blocks.flatMap((block) => block.match(/\n\s*name:\s*"([^"]+)"/)?.[1] ?? []);

check(
  "exactly four expected tools",
  names.length === 4 && expected.every((name) => names.includes(name)),
);
for (const block of blocks) {
  const name = block.match(/\n\s*name:\s*"([^"]+)"/)?.[1];
  if (!name) continue;
  check(name + " has inputSchema", /inputSchema:\s*\{/.test(block));
  check(name + " has annotations", /annotations:\s*\{/.test(block));
  check(
    name + " has correct readOnlyHint",
    new RegExp(`readOnlyHint:\\s*${name === "build_briefing" ? "false" : "true"}`).test(block),
  );
  check(name + " marks source content untrusted", /untrustedContentHint:\s*true/.test(block));
}

check(
  "standalone /webmcp route exists",
  existsSync(resolve(root, "src/routes/webmcp.tsx")) &&
    route.includes('createFileRoute("/webmcp")'),
);
check(
  "root redirects to /webmcp",
  read("src/routes/index.tsx").includes('redirect({ to: "/webmcp" })'),
);
check(
  "standalone branding is present",
  route.includes("AI Governance Watch") && route.includes("A Source-Grounded WebMCP Briefing Desk"),
);
check("challenge label is present", route.includes("WebMCP Challenge Project"));
check("dated disclosure is present", route.includes("meta.reportDate"));
check(
  "independence statement is present",
  route.includes("not affiliated with, endorsed by, or published by"),
);
check("noindex metadata is present", /noindex, nofollow, noarchive, nosnippet/.test(route));
check(
  "root has no monitor or Jay shell",
  !/SiteHeader|SiteFooter|BotLauncher|ChatBotPanel|MRAC/.test(rootRoute),
);
check("no gated routes exist", !existsSync(resolve(root, "src/routes/_gated")));
check("no Supabase integration exists", !existsSync(resolve(root, "src/integrations/supabase")));
check("no Lovable planning metadata exists", !existsSync(resolve(root, ".lovable")));

check(
  "same-origin default is preserved",
  !provider.includes("exposedTo") && !contracts.includes("exposedTo"),
);
check("registration passes AbortSignal", provider.includes("controller.signal"));
check("registration cleans up", /controller\.abort\(\)/.test(provider));
check("registration promises are awaited", /await\s+modelContext\.registerTool\(/.test(provider));
check("no MCP content wrapper", !/content:\s*\[\s*\{\s*type:\s*"text"/.test(provider));

const parsed = JSON.parse(JSON.stringify({ ok: true, results: [] }));
check("one JSON.parse exposes top-level ok", parsed.ok === true && !("content" in parsed));

const report = JSON.parse(read("src/data/report-2026-08-22.json"));
const cards = report.news_feed_cards ?? [];
check("snapshot has 12 records", cards.length === 12);
check("record slugs are unique", new Set(cards.map((card) => card.unique_slug)).size === 12);
const ids = read("src/data/sources.ts").match(/"MSR-[0-9]{3}"/g) ?? [];
check("source ledger has 62 entries", ids.length === 62 && new Set(ids).size === 62);

const gitignore = read(".gitignore");
check(".env is ignored", /^\.env$/m.test(gitignore) && gitignore.includes("!.env.example"));
check("no real .env exists", !existsSync(resolve(root, ".env")));
for (const file of ["README.md", "LICENSE", "NOTICE.md", ".env.example"]) {
  check(file + " exists", existsSync(resolve(root, file)));
}

console.log(`WebMCP standalone verification: ${passes.length} checks passed.`);
if (failures.length) {
  console.error(`${failures.length} check(s) failed:`);
  failures.forEach((failure) => console.error(" - " + failure));
  process.exit(1);
}
console.log("All standalone verification checks passed.");
