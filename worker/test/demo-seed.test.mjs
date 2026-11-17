// Demo data check: loads demo/seed.js into a real SQLite database built from
// schema.sql, then reads it back through the real worker — the same pairing
// the browser demo runs. Catches a schema change that the seed hasn't
// followed before it turns into a blank demo in front of someone.
//
//   cd worker/test && node demo-seed.test.mjs
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import worker from "../worker.js";
import { buildSeed, PERSONAS, ADMIN_EMAIL } from "../../demo/seed.js";
import { mintDemoSession } from "../../demo/session.js";

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log("  ✓ " + name); }
  else { fail++; console.log("  ✗ " + name + (extra !== undefined ? "  → " + JSON.stringify(extra) : "")); }
};

const db = new DatabaseSync(":memory:");
db.exec("PRAGMA foreign_keys = ON");
db.exec(readFileSync(new URL("../schema.sql", import.meta.url), "utf8"));

const now = Date.now();
const seed = buildSeed(now);
let seedError = null;
try {
  db.exec("BEGIN");
  for (const [sql, params] of seed.statements) db.prepare(sql).run(...params);
  db.exec("COMMIT");
} catch (e) { seedError = e.message; }
ok("every seed statement fits the schema", seedError === null, seedError);

const again = buildSeed(now);
ok("the same moment always builds the same demo",
  JSON.stringify(again.statements) === JSON.stringify(seed.statements));

const one = (sql) => Object.values(db.prepare(sql).get())[0];
ok("nothing is dated in the future", one(`SELECT COUNT(*) FROM audit_log WHERE ts > ${now}`) === 0);
ok("no car is over capacity", one(
  `SELECT COUNT(*) FROM posts p WHERE role = 'driver' AND seats <
     (SELECT COALESCE(SUM(party_size), 0) FROM plus_ones o WHERE o.post_id = p.id)`) === 0);
ok("nobody has joined their own trip", one(
  `SELECT COUNT(*) FROM plus_ones o JOIN posts p ON p.id = o.post_id WHERE p.author_email = o.author_email`) === 0);
ok("nobody acts before their first sign-in", one(
  `SELECT COUNT(*) FROM audit_log a JOIN users u ON u.email = a.actor_email WHERE a.ts < u.first_seen_at`) === 0);
ok("sign-in counts match the log", one(
  `SELECT COUNT(*) FROM users u WHERE login_count !=
     (SELECT COUNT(*) FROM audit_log a WHERE a.actor_email = u.email AND a.action = 'login')`) === 0);
ok("every address is on the reserved .example domain",
  one(`SELECT COUNT(*) FROM users WHERE email NOT LIKE '%@berkeley.example'`) === 0);

// The worker's view of it.
class Stmt {
  constructor(sql) { this.sql = sql; this.args = []; }
  bind(...a) { this.args = a.map((v) => (v === undefined ? null : v)); return this; }
  run() { const r = db.prepare(this.sql).run(...this.args); return { success: true, meta: { changes: Number(r.changes) } }; }
  first() { return db.prepare(this.sql).get(...this.args) ?? null; }
  all() { return { results: db.prepare(this.sql).all(...this.args), success: true }; }
}
const env = {
  DB: { prepare: (sql) => new Stmt(sql) },
  ALLOWED_ORIGINS: "https://tripmatch-app.github.io", ALLOWED_HD: "berkeley.edu",
  SESSION_SECRET: "demo-test", ADMIN_EMAILS: ADMIN_EMAIL,
};
const get = async (path, persona) => {
  const token = await mintDemoSession(env.SESSION_SECRET, persona);
  const res = await worker.fetch(new Request("https://demo.test" + path, { headers: { Authorization: "Bearer " + token } }), env, {});
  return { status: res.status, data: await res.json() };
};

const [jordan, priya, admin] = PERSONAS;
let r = await get("/api/board", jordan);
const board = r.data.posts || [];
ok("the worker accepts a demo session and serves the board", r.status === 200 && board.length === seed.stats.livePosts, r.status);
ok("the board spans several days", new Set(board.map((p) => p.date)).size >= 5);
ok("both kinds of post are on it", board.some((p) => p.role === "driver") && board.some((p) => p.role === "rider"));
ok("it shows an open car, a part-filled car and a full one",
  board.some((p) => p.role === "driver" && p.seatsTaken === 0) &&
  board.some((p) => p.role === "driver" && p.seatsTaken > 0 && p.seatsTaken < p.seats) &&
  board.some((p) => p.role === "driver" && p.seatsTaken === p.seats));
ok("the default viewer has posts of their own", board.filter((p) => p.mine).length >= 2);
ok("the default viewer holds a seat in someone else's car",
  board.some((p) => p.role === "driver" && !p.mine && p.plusOnes.some((o) => o.mine)));
ok("a claim covering two travellers is on the board", board.some((p) => p.plusOnes.some((o) => o.party > 1)));
ok("a non-admin can't manage other people's posts", board.every((p) => p.canManage === p.mine));

r = await get("/api/board", admin);
ok("the admin can manage every post", r.data.posts.every((p) => p.canManage));

r = await get("/api/logs?limit=5000", priya);
ok("the log is closed to a non-admin", r.status === 403);
r = await get("/api/logs?limit=5000", admin);
ok("the admin reads the whole log", r.status === 200 && r.data.rows.length === seed.stats.events + 1, r.data.rows && r.data.rows.length);
ok("the log's details all parse", r.data.rows.every((x) => { try { x.detail && JSON.parse(x.detail); return true; } catch { return false; } }));
r = await get("/api/feedback", admin);
ok("the feedback inbox is populated", r.status === 200 && r.data.rows.length === seed.stats.feedback);

console.log(`\n${pass} passed, ${fail} failed  ·  ${JSON.stringify(seed.stats)}`);
process.exit(fail ? 1 : 0);
