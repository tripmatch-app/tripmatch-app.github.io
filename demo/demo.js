/**
 * TripMatch demo mode — the whole backend, in the page.
 *
 * Opening the board with ?demo runs the production worker (worker/worker.js,
 * imported unmodified) against a SQLite database compiled to WebAssembly,
 * created from the production schema (worker/schema.sql) and filled by
 * demo/seed.js. So the demo isn't a mock-up of the product: the validation,
 * the seat cap, the ownership checks and the audit log are the real code,
 * answering the same requests the real front-end makes. Only two things are
 * stood in for — Cloudflare's D1 (by the shim below) and Google sign-in (by
 * a persona picker).
 *
 * Nothing leaves the browser. The database lives in localStorage so the
 * board and the admin log see the same data, and is rebuilt each calendar
 * day so the trips on it are always upcoming.
 */
import worker from "../worker/worker.js";
import { buildSeed, pacificDay, PERSONAS, ADMIN_EMAIL } from "./seed.js";
import { mintDemoSession } from "./session.js";

const DB_KEY = "tripmatch-demo-db-v1";
const PERSONA_KEY = "tripmatch-demo-persona";
const here = (path) => new URL(path, import.meta.url).href;

const env = {
  DB: null,
  GOOGLE_CLIENT_ID: "demo",
  ALLOWED_ORIGINS: location.origin,
  ALLOWED_HD: "berkeley.edu",
  SESSION_SECRET: "tripmatch-demo-not-a-secret",
  ADMIN_EMAILS: ADMIN_EMAIL,
};

// ---------------------------------------------------------------- D1 shim
//
// The three methods the worker uses, over sql.js. Same shape as the shim the
// test suite runs the worker against (worker/test/harness.mjs).

class Stmt {
  constructor(db, sql) { this.db = db; this.sql = sql; this.args = []; }
  bind(...a) { this.args = a.map((v) => (v === undefined ? null : v)); return this; }
  async run() {
    this.db.run(this.sql, this.args);
    return { success: true, meta: { changes: this.db.getRowsModified() } };
  }
  rows() {
    const st = this.db.prepare(this.sql);
    try {
      st.bind(this.args);
      const out = [];
      while (st.step()) out.push(st.getAsObject());
      return out;
    } finally { st.free(); }
  }
  async first() { const r = this.rows(); return r.length ? r[0] : null; }
  async all() { return { results: this.rows(), success: true }; }
}

// ------------------------------------------------------------ the database

let SQL = null;
let db = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error("couldn't load " + src));
    document.head.appendChild(s);
  });
}

function toB64(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function fromB64(s) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function persist() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify({ day: pacificDay(Date.now(), 0), data: toB64(db.export()) }));
  } catch (e) {
    // Private windows and full storage both land here. The demo still works
    // for this page view; it just won't carry over to the next one.
    console.warn("TripMatch demo: couldn't save the demo database", e);
  }
}

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(DB_KEY) || "null");
    // Yesterday's board has aged: its "tomorrow" is today. Start over.
    if (!saved || saved.day !== pacificDay(Date.now(), 0)) return false;
    db = new SQL.Database(fromB64(saved.data));
    db.exec("SELECT COUNT(*) FROM posts"); // throws if the blob isn't ours
    return true;
  } catch (e) {
    return false;
  }
}

async function seed() {
  const schema = await (await fetch(here("../worker/schema.sql"), { cache: "no-cache" })).text();
  db = new SQL.Database();
  db.exec(schema);
  db.exec("BEGIN");
  for (const [sql, params] of buildSeed(Date.now()).statements) db.run(sql, params);
  db.exec("COMMIT");
  persist();
}

// ------------------------------------------------------------- the "API"

/**
 * Drop-in for fetch(): hands the request to the worker's own fetch handler
 * and returns its Response. The pages call this exactly as they call the
 * network, so every code path after it is the one production runs.
 */
async function demoFetch(url, init) {
  init = init || {};
  const request = new Request(url, { method: init.method || "GET", headers: init.headers, body: init.body });
  request.cf = { country: "US" };
  const response = await worker.fetch(request, env, {});
  // Reads get logged too when they're refused, so save after everything.
  persist();
  return response;
}

const personaFor = (email) => PERSONAS.find((p) => p.email === email) || PERSONAS[0];

async function sessionFor(persona) {
  const user = { email: persona.email, name: persona.name };
  return { token: await mintDemoSession(env.SESSION_SECRET, user), user };
}

/** What the worker's recordLogin does, for a persona stepping in. */
function recordLogin(persona) {
  const now = Date.now();
  db.run(
    `INSERT INTO users (email, name, picture, first_seen_at, last_seen_at, login_count) VALUES (?, ?, NULL, ?, ?, 1)
     ON CONFLICT(email) DO UPDATE SET last_seen_at = excluded.last_seen_at, login_count = users.login_count + 1`,
    [persona.email, persona.name, now, now]
  );
  db.run(
    `INSERT INTO audit_log (ts, actor_email, actor_name, action, entity_type, entity_id, country, user_agent)
     VALUES (?, ?, ?, 'login', 'session', ?, 'US', ?)`,
    [now, persona.email, persona.name, persona.email, navigator.userAgent.slice(0, 300)]
  );
  persist();
}

// ------------------------------------------------------------- the ribbon

const CSS = `
  #demoBar { background: #fdb515; color: #1c2530; font: 500 13px/1.35 Inter, system-ui, sans-serif; }
  #demoBar .demo-in { max-width: 1100px; margin: 0 auto; padding: 7px 16px; display: flex; flex-wrap: wrap;
    align-items: center; gap: 6px 14px; }
  #demoBar .demo-tag { background: #1c2530; color: #fdb515; font-weight: 700; font-size: 11px; letter-spacing: .08em;
    padding: 2px 7px; border-radius: 4px; }
  #demoBar .demo-note { flex: 1 1 220px; }
  #demoBar label { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
  #demoBar select, #demoBar button, #demoBar a.demo-btn { font: inherit; color: #1c2530; background: rgba(255,255,255,.55);
    border: 1px solid rgba(28,37,48,.35); border-radius: 6px; padding: 3px 9px; cursor: pointer; text-decoration: none; }
  #demoBar select:hover, #demoBar button:hover, #demoBar a.demo-btn:hover { background: rgba(255,255,255,.85); }
  @media (max-width: 640px) {
    #demoBar .demo-in { padding: 6px 12px; gap: 6px 8px; }
    #demoBar .demo-note { flex: 1 1 auto; font-size: 12px; }
    #demoBar .demo-long { display: none; }
  }
  .demo-enter { font: 600 15px Inter, system-ui, sans-serif; color: #fff; background: #003057; border: 0;
    border-radius: 8px; padding: 12px 22px; cursor: pointer; }
`;

function mountBar(page, current, onSwitch) {
  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);

  const bar = document.createElement("div");
  bar.id = "demoBar";
  bar.setAttribute("role", "note");
  const admin = personaFor(ADMIN_EMAIL);

  bar.innerHTML =
    '<div class="demo-in">' +
      '<span class="demo-tag">DEMO</span>' +
      '<span class="demo-note">Sample data<span class="demo-long"> — invented people and trips, stored only in this browser</span>. Not the live board.</span>' +
      (page === "board"
        ? '<label><span class="demo-long">Viewing as</span> <select id="demoPersona" aria-label="Demo account">' +
            PERSONAS.map((p) => `<option value="${p.email}">${p.name} · ${p.blurb}</option>`).join("") +
          "</select></label>" +
          '<a class="demo-btn" href="logs.html?demo">Admin log</a>'
        : `<span>Signed in as ${admin.name} · admin</span>` +
          '<a class="demo-btn" href="./?demo">Back to the board</a>') +
      '<button type="button" id="demoReset" title="Throw away changes and rebuild the sample data">Reset</button>' +
    "</div>";
  document.body.insertBefore(bar, document.body.firstChild);

  const select = bar.querySelector("#demoPersona");
  if (select) {
    select.value = current.email;
    select.addEventListener("change", () => onSwitch(personaFor(select.value)));
  }
  bar.querySelector("#demoReset").addEventListener("click", () => {
    try { localStorage.removeItem(DB_KEY); localStorage.removeItem(PERSONA_KEY); } catch (e) {}
    location.reload();
  });
  return select;
}

// -------------------------------------------------------------------- boot

/**
 * Start the demo for a page. `page` is "board" or "logs"; the log viewer is
 * always opened as the admin, since that's the only account that can read it.
 * `onSession({ token, user })` fires when the persona changes.
 */
export async function boot({ page, onSession }) {
  if (!SQL) {
    await loadScript(here("./lib/sql-wasm.js"));
    SQL = await window.initSqlJs({ locateFile: (f) => here("./lib/" + f) });
  }
  if (!restore()) await seed();
  env.DB = { prepare: (sql) => new Stmt(db, sql) };

  let saved = null;
  try { saved = localStorage.getItem(PERSONA_KEY); } catch (e) {}
  let persona = page === "logs" ? personaFor(ADMIN_EMAIL) : personaFor(saved);

  async function enter(next) {
    persona = next;
    try { localStorage.setItem(PERSONA_KEY, persona.email); } catch (e) {}
    recordLogin(persona);
    if (select) select.value = persona.email;
    if (onSession) await onSession(await sessionFor(persona));
  }

  const select = mountBar(page, persona, enter);

  return {
    fetch: demoFetch,
    session: await sessionFor(persona),
    /** Stands in for the Google button on the sign-in gate. */
    mountGate(target, hint) {
      target.innerHTML = "";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "demo-enter";
      btn.textContent = "Enter the demo as " + persona.name;
      btn.addEventListener("click", () => enter(persona));
      target.appendChild(btn);
      if (hint) hint.textContent = "Demo mode — the live board asks for a berkeley.edu Google account here.";
    },
  };
}
