// Drive multiple claims through the full lifecycle sequentially.
// Same key for both sides (Studionet smoke test, not fairness).
// Use: npx tsx scripts/smoke_all.ts 2 3 4 5

import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runOne(id: number): Promise<{ id: number; ok: boolean; out: string }> {
  return new Promise((resolveP) => {
    const child = spawn("npx", ["tsx", resolve(__dirname, "smoke.ts"), String(id)], {
      shell: true,
      cwd: resolve(__dirname, ".."),
    });
    let out = "";
    child.stdout.on("data", (d) => { out += d.toString(); });
    child.stderr.on("data", (d) => { out += d.toString(); });
    child.on("close", (code) => resolveP({ id, ok: code === 0, out }));
  });
}

(async () => {
  const ids = process.argv.slice(2).map(Number).filter(Number.isFinite);
  if (ids.length === 0) {
    console.error("usage: tsx scripts/smoke_all.ts <claim-id> [<claim-id> ...]");
    process.exit(1);
  }
  console.log(`will resolve claims: ${ids.join(", ")}`);
  const results: { id: number; ok: boolean; verdict?: string }[] = [];
  for (const id of ids) {
    console.log(`\n========== CLAIM #${id} ==========`);
    const r = await runOne(id);
    // Extract verdict from output
    const m = r.out.match(/verdict\s+:\s*(\S+)/);
    const verdict = m ? m[1] : "?";
    results.push({ id, ok: r.ok, verdict });
    console.log(r.ok ? `✓ #${id} resolved as ${verdict}` : `✗ #${id} FAILED`);
    if (!r.ok) {
      // Print last 30 lines of failure for visibility, then continue.
      const tail = r.out.split("\n").slice(-30).join("\n");
      console.log(tail);
    }
  }
  console.log("\n========== SUMMARY ==========");
  for (const r of results) {
    console.log(`  #${r.id}: ${r.ok ? "✓ " + r.verdict : "✗ FAILED"}`);
  }
})();
