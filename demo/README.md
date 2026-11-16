# TripMatch demo mode

A populated copy of TripMatch that anyone can open without a Berkeley account:

**https://tripmatch-app.github.io/demo/** (the same thing as adding `?demo` to the board's address)

## What it is

The demo is the real product with the network unplugged. `demo.js` imports the production API (`worker/worker.js`, unmodified), runs it inside the page against a SQLite database built from the production schema (`worker/schema.sql`), and fills that database from `seed.js`. Every rule you can demonstrate — a full car refusing a fourth passenger, only the author being able to edit a post, the admin-only log — is enforced by the code that runs in production, not by a mock-up.

Two things are stood in for: Cloudflare D1 (by SQLite compiled to WebAssembly, in `lib/`) and Google sign-in (by the account picker in the yellow bar).

**The data is invented.** The yellow bar says so on every page, and it is there on purpose: the demo shows what the product does, not how many people use it. The 38 people use the reserved `.example` domain, so no address in it can reach anyone.

Nothing leaves the browser and the live board is never touched. Changes made while demonstrating are kept in that browser's local storage, so the board and the admin log agree with each other; **Reset** discards them. The data is rebuilt each calendar day so the trips are always upcoming, and it is identical for everyone who opens it on the same day.

## What's in it

| | |
|---|---|
| People | 38, joining over four weeks |
| Trips | about 100 — 26 on the live board across the next nine days, the rest already past |
| Seat claims and +1s | about 125 |
| Comments | about 100 |
| Feedback reports | 10 |
| Activity-log events | about 480 |

Exact history figures vary slightly by day; the live board is always the same 26 trips.

## A five-minute walkthrough

You start signed in as **Jordan Lee**, a student.

1. **The board.** Trips grouped by route and day, colour-coded by corridor. Use the date chips to jump to one day, and the *offering* / *looking* counters to filter by role.
2. **Seat states.** Carlos Mendoza's car today has seats left; Hannah Fischer's is *Full*. Tap **Take a seat** on Carlos's — it asks whether you're bringing someone, then the badge counts down.
3. **Your own posts.** Jordan's drive to San Jose (two days out) shows Edit and Delete, and "Mei Lin +1" — one account claiming two seats. Open its comments and reply.
4. **Post a trip.** *+ Post a trip* — about fifteen seconds, and it lands in the right route group.
5. **The other side.** Switch **Viewing as** to *Priya Raghunathan*: Jordan is now a passenger in her car, and Jordan's posts are no longer editable.
6. **Admin.** Switch to *Sam Okafor · admin*: every post gains Edit/Delete. Open **Admin log** — every sign-in, post, claim and comment from the last four weeks, including the ones you just made, filterable and exportable as CSV. The **Feedback** tab is the in-app inbox.
7. **Sign-in gate.** *Sign out* shows the screen a new visitor sees. (The live board asks for a berkeley.edu Google account there; the demo offers a button instead.)

Press **Reset** before the next audience.

## Files

| File | |
|---|---|
| `index.html` | Redirect, so `/demo/` is a link you can hand out |
| `demo.js` | In-page backend: D1 shim, persistence, account picker, the yellow bar |
| `seed.js` | The sample data, generated relative to today |
| `session.js` | Signs demo sessions with a throwaway key (useless against the real API) |
| `lib/` | sql.js 1.13.0 — SQLite as WebAssembly, MIT licensed |

The hooks in `index.html` and `logs.html` are a `DEMO` flag and an `apiFetch` indirection; with no `?demo` in the address neither page loads any of this.

## Running it locally

Serve the repo root over HTTP (it won't work from `file://`) and open `/demo/`:

```bash
python3 -m http.server 8788
```

Check the sample data against the schema and the worker:

```bash
cd worker/test && node demo-seed.test.mjs
```
