/**
 * TripMatch demo data.
 *
 * Builds a believable four-week history for the board — people signing up,
 * posting, claiming seats, commenting, sending feedback, trips ageing out —
 * plus a live board for the next nine days, as a list of SQL statements
 * against the real schema (worker/schema.sql).
 *
 * Three properties matter here:
 *
 *   * Everything is relative to `now`, so the demo looks current whenever it
 *     is opened, and deterministic for a given day, so two people looking at
 *     it at the same time see the same board.
 *   * Every row is shaped exactly as the worker would have written it, audit
 *     trail included, so the admin log tells the same story as the board.
 *   * Nobody here is real. The addresses use the reserved `.example` domain,
 *     which can never deliver mail to anyone.
 *
 * Pure and environment-free: the browser demo and the Node test both call it.
 */

const DAY = 86400000;
const HOUR = 3600000;
const MIN = 60000;

const HISTORY_DAYS = 28;

const REGION = {
  Berkeley: "East Bay / Campus", Oakland: "East Bay / Campus",
  Emeryville: "East Bay / Campus", Albany: "East Bay / Campus",
  "San Francisco": "San Francisco",
  "Palo Alto": "Peninsula", "Menlo Park": "Peninsula", "Redwood City": "Peninsula",
  "San Mateo": "Peninsula", Burlingame: "Peninsula", "Foster City": "Peninsula",
  "Mountain View": "South Bay", Sunnyvale: "South Bay", "Santa Clara": "South Bay",
  "San Jose": "South Bay", Cupertino: "South Bay", Milpitas: "South Bay",
};
const regionOf = (city) => REGION[city] || "Other";

const emailOf = (name) =>
  name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "") + "@berkeley.example";

// The three accounts the demo bar can switch between. Jordan is the default
// viewer and is woven through the live board below — two posts of their own,
// a seat in someone else's car — so every state of a card is on screen.
export const PERSONAS = [
  { name: "Jordan Lee", email: emailOf("Jordan Lee"), blurb: "student" },
  { name: "Priya Raghunathan", email: emailOf("Priya Raghunathan"), blurb: "driver" },
  { name: "Sam Okafor", email: emailOf("Sam Okafor"), blurb: "admin" },
];
export const ADMIN_EMAIL = PERSONAS[2].email;

const NAMES = [
  "Sam Okafor", "Priya Raghunathan", "Marcus Bell", "Chen Wei", "Amara Nwosu", "Sofia Marchetti",
  "Jordan Lee", "Jonas Lindqvist", "Ravi Krishnan", "Elena Duarte", "Tom Whelan", "Nadia Hassan",
  "Yuki Tanaka", "Daniel Osei", "Mei Lin", "Carlos Mendoza", "Hannah Fischer", "Arjun Mehta",
  "Leila Farahani", "Ben Carter", "Isabella Rossi", "Kwame Asante", "Grace Park", "Diego Alvarez",
  "Aisha Khan", "Lucas Moreau", "Tanvi Shah", "Noah Goldberg", "Fatima Zahra", "Oliver Bennett",
  "Min-jun Kim", "Camila Torres", "Ethan Brooks", "Zara Ahmed", "Viktor Petrov", "Naomi Sato",
  "Rahul Verma", "Emma Lindholm",
];

const USER_AGENTS = [
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
];

// Weighted by how often the corridor is actually driven: campus ↔ the city
// dominates, then the trek destinations down the Peninsula and South Bay.
const CORRIDORS = [
  ["Berkeley", "San Francisco", 6], ["San Francisco", "Berkeley", 5],
  ["Berkeley", "Palo Alto", 3], ["Palo Alto", "Berkeley", 2],
  ["Berkeley", "Mountain View", 3], ["Mountain View", "Berkeley", 2],
  ["Berkeley", "San Jose", 2], ["San Jose", "Berkeley", 2],
  ["Berkeley", "Burlingame", 2], ["Oakland", "San Francisco", 1],
  ["San Francisco", "Palo Alto", 1], ["Berkeley", "Sunnyvale", 1],
  ["Berkeley", "Menlo Park", 1], ["Cupertino", "Berkeley", 1],
  ["San Francisco", "Mountain View", 1], ["Berkeley", "Oakland", 1],
  ["Emeryville", "Santa Clara", 1], ["Redwood City", "Berkeley", 1],
];

const PAST_NOTES = [
  "Leaving from the Haas courtyard. Happy to drop near BART.",
  "Company visit — back by early evening.",
  "Flexible by 15 minutes either way.",
  "Airport run, room for one big bag each.",
  "Will chip in for gas and bridge toll.",
  "Carpool lane both ways if we fill the car.",
  "",
];

const PAST_COMMENTS = [
  "Where are you leaving from?",
  "Could you do 15 minutes later?",
  "Grabbing a seat — thank you!",
  "I can meet you at North Gate.",
  "Is there room for a carry-on?",
  "Happy to split gas and the toll.",
  "Works for me, see you then.",
  "Leaving from the Haas courtyard, grey Civic.",
  "Could you drop me at the Caltrain station instead?",
  "Running five minutes behind, sorry!",
  "Perfect, I'm in.",
  "Thanks for driving!",
];

/* The live board. `d` is days from today; `ago` is how many hours ago the
   post went up. Driver posts list `takers` (name, or [name, partySize]) and
   never exceed their seats; rider posts list `plus`. */
const LIVE = [
  { who: "Carlos Mendoza", role: "driver", seats: 3, d: 0, time: "17:30", from: "Berkeley", to: "San Francisco", ago: 26,
    notes: "Driving in for the consulting club dinner. Can drop near Embarcadero or Civic Center.",
    takers: ["Aisha Khan"],
    comments: [["Aisha Khan", "Civic Center would be perfect, thank you!"]] },
  { who: "Hannah Fischer", role: "driver", seats: 2, d: 0, time: "18:15", from: "Berkeley", to: "Oakland", ago: 20,
    notes: "Heading to Jack London Square for the alumni mixer, leaving from the Haas courtyard.",
    takers: ["Lucas Moreau", "Tanvi Shah"],
    comments: [["Tanvi Shah", "Grabbed the last seat — see you at 6:10."]] },
  { who: "Daniel Osei", role: "rider", d: 0, time: "21:00", from: "San Francisco", to: "Berkeley", ago: 5,
    notes: "Coming back after dinner in the Mission tonight — happy to split gas.",
    plus: ["Grace Park"], comments: [] },

  { who: "Arjun Mehta", role: "driver", seats: 4, d: 1, time: "07:00", from: "Berkeley", to: "Burlingame", ago: 40,
    notes: "SFO run — International terminal. Four seats in the minivan and room for big bags.",
    takers: [["Fatima Zahra", 2]],
    comments: [["Fatima Zahra", "My sister's flying out with me, so I took two seats. Two suitcases total."],
               ["Arjun Mehta", "No problem at all — plenty of trunk space."]] },
  { who: "Leila Farahani", role: "rider", party: 2, d: 1, time: "07:45", from: "Berkeley", to: "San Francisco", ago: 30,
    notes: "Two of us need to get to the Salesforce Tower trek — will bring coffee for the driver.",
    plus: ["Ben Carter"],
    comments: [["Priya Raghunathan", "I've got one seat left on my 8:30 if you two end up splitting across cars."]] },
  { who: "Priya Raghunathan", role: "driver", seats: 3, d: 1, time: "08:30", from: "Berkeley", to: "San Francisco", ago: 46,
    notes: "Heading to the Salesforce Tower trek, back around 4. Can drop at Embarcadero BART.",
    takers: ["Daniel Osei", "Jordan Lee"],
    comments: [["Daniel Osei", "Perfect, I'll be at North Gate by 8:25."],
               ["Priya Raghunathan", "Great — I'm in a grey Corolla."],
               ["Jordan Lee", "Same, North Gate works for me. Thanks for driving!"]] },
  { who: "Marcus Bell", role: "driver", seats: 2, d: 1, time: "17:45", from: "San Francisco", to: "Berkeley", ago: 44,
    notes: "Return leg after the trek. Two spots, no big luggage please.",
    takers: ["Daniel Osei", "Yuki Tanaka"],
    comments: [["Yuki Tanaka", "Grabbing the second seat, thanks!"]] },

  { who: "Chen Wei", role: "driver", seats: 4, d: 2, time: "07:15", from: "Berkeley", to: "Mountain View", ago: 52,
    notes: "Google office visit. Leaving from Unit 1, plenty of room for bags.",
    takers: ["Sofia Marchetti", "Tom Whelan"], comments: [] },
  { who: "Jordan Lee", role: "driver", seats: 3, d: 2, time: "08:00", from: "Berkeley", to: "San Jose", ago: 33,
    notes: "Driving down for the Adobe office visit — leaving from the Haas courtyard, back by 6. Can swing by SJC.",
    takers: [["Mei Lin", 2]],
    comments: [["Mei Lin", "Bringing my partner along, so I claimed two seats — hope that's okay!"],
               ["Jordan Lee", "Of course. Grey Subaru, I'll be at the courtyard by 7:50."],
               ["Kwame Asante", "Any chance you're passing through Santa Clara on the way?"]] },
  { who: "Jonas Lindqvist", role: "driver", seats: 1, d: 2, time: "", from: "Berkeley", to: "Palo Alto", ago: 28,
    notes: "Flexible on timing — comment here. One seat only.",
    takers: ["Camila Torres"], comments: [] },
  { who: "Isabella Rossi", role: "rider", d: 2, time: "16:00", from: "Berkeley", to: "San Francisco", ago: 9,
    notes: "Interview at 5 in SoMa and I can't be late — anyone heading over the bridge mid-afternoon?",
    plus: [], comments: [] },
  { who: "Amara Nwosu", role: "rider", d: 2, time: "19:00", from: "Mountain View", to: "Berkeley", ago: 50,
    notes: "Need a ride back after the Google visit — happy to split gas.",
    plus: ["Sofia Marchetti", "Tom Whelan", "Jordan Lee"],
    comments: [["Chen Wei", "I'm driving back around 7:30 if that works?"],
               ["Amara Nwosu", "That works, thank you!"]] },

  { who: "Grace Park", role: "driver", seats: 2, d: 3, time: "09:15", from: "Oakland", to: "Palo Alto", ago: 22,
    notes: "Case competition at Stanford — leaving from Temescal. Coming back around 7pm with the same seats.",
    takers: ["Noah Goldberg"], comments: [] },
  { who: "Ravi Krishnan", role: "rider", d: 3, time: "10:00", from: "Berkeley", to: "San Jose", ago: 36,
    notes: "SJC flight at 13:00, need to be there by noon. Will absolutely chip in.",
    plus: ["Nadia Hassan"],
    comments: [["Nadia Hassan", "Same flight window — want to split a ride if nobody's driving?"]] },
  { who: "Tom Whelan", role: "rider", d: 3, time: "11:30", from: "Berkeley", to: "Oakland", ago: 12,
    notes: "Just need a lift to Rockridge BART, five minutes out of the way.",
    plus: [], comments: [] },
  { who: "Elena Duarte", role: "driver", seats: 3, d: 3, time: "16:30", from: "San Jose", to: "Berkeley", ago: 18,
    notes: "Coming back up after a family thing. Happy to detour via Fremont BART.",
    takers: [], comments: [] },

  { who: "Sofia Marchetti", role: "driver", seats: 2, d: 4, time: "09:00", from: "San Francisco", to: "Palo Alto", ago: 31,
    notes: "Doing a Peninsula loop — can drop anywhere along the 101 corridor. Leaving from the Mission.",
    takers: ["Ravi Krishnan"],
    comments: [["Ravi Krishnan", "Could you drop at Menlo Park instead? Happy either way."],
               ["Sofia Marchetti", "Menlo Park is fine, it's on the way."]] },
  { who: "Yuki Tanaka", role: "driver", seats: 2, d: 4, time: "13:00", from: "Davis", to: "Berkeley", ago: 15,
    notes: "Driving down from Davis after the weekend, two seats going spare.",
    takers: ["Marcus Bell"], comments: [] },
  { who: "Nadia Hassan", role: "rider", d: 4, time: "", from: "Palo Alto", to: "San Francisco", ago: 24,
    notes: "No fixed time, anywhere between noon and evening works.",
    plus: ["Amara Nwosu"], comments: [] },

  { who: "Kwame Asante", role: "driver", seats: 4, d: 5, time: "06:30", from: "Berkeley", to: "Santa Clara", ago: 42,
    notes: "Nvidia HQ visit, early start. The carpool lane makes this 50 minutes — leaving from Clark Kerr.",
    takers: ["Rahul Verma", "Min-jun Kim", "Emma Lindholm"],
    comments: [["Rahul Verma", "6:30 sharp, got it. I'll bring pastries."]] },
  { who: "Jordan Lee", role: "rider", d: 5, time: "21:30", from: "San Francisco", to: "Berkeley", ago: 14,
    notes: "Recruiting dinner in FiDi wraps around 9 — would love to skip the late BART.",
    plus: ["Zara Ahmed", "Ethan Brooks"],
    comments: [["Oliver Bennett", "I'm driving back from the same dinner at 9:45 — posting it now."],
               ["Jordan Lee", "Amazing, thank you!"]] },
  { who: "Oliver Bennett", role: "driver", seats: 3, d: 5, time: "21:45", from: "San Francisco", to: "Berkeley", ago: 13,
    notes: "Leaving FiDi after the recruiting dinner. Dropping along Shattuck and Southside.",
    takers: ["Zara Ahmed"], comments: [] },

  { who: "Camila Torres", role: "rider", party: 3, d: 6, time: "10:30", from: "Berkeley", to: "Sunnyvale", ago: 8,
    notes: "Three of us heading to a LinkedIn info session — fine to split across cars.",
    plus: ["Viktor Petrov"], comments: [] },
  { who: "Diego Alvarez", role: "driver", seats: 2, d: 6, time: "15:00", from: "Berkeley", to: "Burlingame", ago: 6,
    notes: "SFO drop for a 6pm flight. Leaving from Northside.",
    takers: [], comments: [] },

  { who: "Naomi Sato", role: "driver", seats: 3, d: 8, time: "08:00", from: "Berkeley", to: "Menlo Park", ago: 4,
    notes: "Sand Hill Road VC trek. Three seats, leaving from the Haas courtyard.",
    takers: ["Tanvi Shah"], comments: [] },
  { who: "Aisha Khan", role: "rider", d: 8, time: "18:30", from: "Menlo Park", to: "Berkeley", ago: 3,
    notes: "Ride back after the VC trek — I'll be near the Rosewood.",
    plus: ["Tanvi Shah"], comments: [] },
];

// [days ago, hour, kind, author, body]
const FEEDBACK = [
  [26, 21, "bug", "Marcus Bell",
   "Opened the link from the class WhatsApp group and the Google sign-in just showed a blank white page. Worked fine once I copied the link into Safari, but most people won't think to do that."],
  [24, 9, "idea", "Sofia Marchetti",
   "Could a driver post say how many seats are left instead of just the +1 count? Six people +1'd my three-seat car last week and I had to sort it out in the comments."],
  [21, 18, "idea", "Leila Farahani",
   "I often travel with my partner who isn't at Berkeley. It'd be great to claim two seats in one go rather than asking the driver in a comment."],
  [17, 13, "other", "Chen Wei",
   "Just wanted to say this saved our whole section a lot of group-chat scrolling for the Google visit. Four cars filled in an afternoon."],
  [14, 8, "bug", "Grace Park",
   "My post for today disappeared from the board around 5pm even though the trip wasn't until 8. Looks like a timezone thing?"],
  [11, 22, "idea", "Ravi Krishnan",
   "Once there are a lot of posts it's hard to find a specific day. A row of date filters at the top would help — I only care about Thursday."],
  [8, 16, "idea", "Jordan Lee",
   "Would love an optional reminder the evening before a trip I've claimed a seat on. Even a calendar link on the post would do."],
  [5, 11, "bug", "Tanvi Shah",
   "On my phone the time picker defaults to 12:00 AM, so I nearly posted a midnight ride. Defaulting to the next hour would be safer."],
  [2, 19, "other", "Kwame Asante",
   "Is there a plan to open this up to the wider MBA association or other schools? A few people outside our program asked me for the link."],
  [1, 10, "idea", "Naomi Sato",
   "A 'return trip' button that duplicates my post with the cities swapped would save retyping everything for the way back."],
];

// ---------------------------------------------------------------- helpers

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pacificDay(now, offsetDays) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(now + (offsetDays || 0) * DAY));
}

const pad = (n) => String(n).padStart(2, "0");

// ------------------------------------------------------------------ build

export function buildSeed(now) {
  now = now || Date.now();
  const today = pacificDay(now, 0);

  // Seeded from the calendar day, so the board is stable through a day of
  // reloads and resets but isn't frozen into one arrangement forever.
  const rnd = mulberry32(Number(today.replace(/-/g, "")));
  const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const chance = (p) => rnd() < p;
  // Fisher–Yates rather than sort(() => rnd() - 0.5): a random comparator
  // draws a different number of values in each JS engine, and the board would
  // then differ between Chrome and Safari.
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const hex8 = () => Math.floor(rnd() * 0xffffffff).toString(16).padStart(8, "0");
  const newId = (ts) => ts.toString(36) + "-" + hex8();

  // Wall-clock time on a Pacific calendar day. The fixed offset is an hour
  // out during daylight saving, which only shifts a made-up timestamp.
  const stamp = (offsetDays, h, m) =>
    Date.parse(`${pacificDay(now, offsetDays)}T${pad(h)}:${pad(m)}:00-08:00`);

  // k sorted moments strictly inside (a, b).
  const between = (a, b, k) => {
    const out = [];
    for (let i = 0; i < k; i++) out.push(Math.floor(a + (b - a) * (0.04 + rnd() * 0.92)));
    return out.sort((x, y) => x - y);
  };

  // ---- people ----------------------------------------------------------

  const users = NAMES.map((name, i) => {
    // Six people on launch day, then a steady trickle as word gets round.
    const joinDay = i < 6 ? -HISTORY_DAYS
      : -HISTORY_DAYS + 1 + Math.round((HISTORY_DAYS - 4) * Math.pow((i - 6) / (NAMES.length - 7), 0.85));
    return {
      name, email: emailOf(name), joinDay,
      joinTs: stamp(joinDay, int(8, 22), int(0, 59)),
      ua: USER_AGENTS[i % USER_AGENTS.length],
      viaRedirect: i % 4 === 1, // the ones who arrive through an in-app browser
      firstAction: Infinity,
    };
  });
  const byName = new Map(users.map((u) => [u.name, u]));
  const person = (name) => {
    const u = byName.get(name);
    if (!u) throw new Error("demo seed: unknown person " + name);
    return u;
  };

  // ---- accumulators ----------------------------------------------------

  const posts = [], plusOnes = [], comments = [], feedback = [], events = [];

  function log(ts, actor, action, entityType, entityId, detail) {
    if (actor && ts < actor.firstAction) actor.firstAction = ts;
    events.push({ ts, actor, action, entityType, entityId, detail: detail || null });
  }

  /**
   * One post and everything that happened on it, in order. `until` bounds
   * the activity: the trip itself for a past post, a few minutes ago for a
   * live one.
   */
  function addPost(p) {
    const id = newId(p.created);
    const row = {
      id, author: p.author, role: p.role, seats: p.role === "driver" ? p.seats : 0,
      party: p.role === "rider" ? p.party || 1 : 1,
      date: p.date, time: p.time, notes: p.notes, from: p.from, to: p.to,
      created: p.created, updated: p.created, deleted: null,
    };
    posts.push(row);

    const detail = { role: row.role, route: `${row.from} → ${row.to}`, date: row.date, time: row.time, seats: row.seats };
    if (row.party > 1) detail.partySize = row.party;
    log(p.created, p.author, "post.create", "post", id, detail);

    // Interleave joins and comments so the thread reads like a conversation
    // rather than every claim landing before anyone says a word.
    const steps = [];
    const n = Math.max(p.joins.length, p.comments.length);
    for (let i = 0; i < n; i++) {
      if (p.joins[i]) steps.push({ join: p.joins[i] });
      if (p.comments[i]) steps.push({ comment: p.comments[i] });
    }
    const times = between(p.created + 3 * MIN, p.until, steps.length);

    let taken = 0;
    steps.forEach((s, i) => {
      const ts = times[i];
      if (s.join) {
        const j = s.join;
        if (row.role === "driver") {
          if (taken + j.party > row.seats) throw new Error("demo seed: over capacity on " + row.notes);
          taken += j.party;
          log(ts, j.user, "seat.claim", "post", id, { driver: p.author.name, seats: row.seats, party: j.party });
        } else {
          log(ts, j.user, "plusone.add", "post", id, { rider: p.author.name, party: j.party });
        }
        plusOnes.push({ postId: id, user: j.user, party: j.party, ts });
      } else {
        const cid = newId(ts);
        comments.push({ id: cid, postId: id, user: s.comment.user, text: s.comment.text, ts });
        log(ts, s.comment.user, "comment.create", "comment", cid, { postId: id, text: s.comment.text });
      }
    });

    row.taken = taken;
    row.lastActivity = times.length ? times[times.length - 1] : p.created;
    return row;
  }

  // ---- four weeks of history -------------------------------------------

  const corridorBag = [];
  CORRIDORS.forEach(([from, to, w]) => { for (let i = 0; i < w; i++) corridorBag.push([from, to]); });

  for (let d = -HISTORY_DAYS + 1; d <= -1; d++) {
    // Usage climbs over the month: a post or two a day at launch, four or
    // five by the most recent week.
    const ramp = (d + HISTORY_DAYS) / HISTORY_DAYS;
    const count = Math.max(1, Math.round(1 + 3.4 * ramp + (rnd() - 0.5) * 1.6));

    for (let k = 0; k < count; k++) {
      const lead = int(1, 3);
      const createdDay = Math.max(d - lead, -HISTORY_DAYS);
      const joined = users.filter((u) => u.joinDay <= createdDay);
      const author = pick(joined);
      const others = joined.filter((u) => u !== author);

      const role = chance(0.58) ? "driver" : "rider";
      const [from, to] = pick(corridorBag);
      const hour = pick([7, 7, 8, 8, 9, 10, 12, 15, 16, 17, 18, 19, 21]);
      const time = chance(0.12) ? "" : `${pad(hour)}:${pick(["00", "15", "30", "45"])}`;
      const seats = role === "driver" ? pick([1, 2, 2, 3, 3, 3, 4]) : 0;

      const created = stamp(createdDay, int(8, 23), int(0, 59));
      const tripTs = stamp(d, time ? hour : 12, 0);

      const pool = shuffle(others);
      const joins = [];
      if (role === "driver") {
        let room = seats;
        const want = int(0, seats);
        while (joins.length < want && room > 0 && pool.length) {
          const party = room >= 2 && chance(0.15) ? 2 : 1;
          joins.push({ user: pool.pop(), party });
          room -= party;
        }
      } else {
        const want = pick([0, 0, 1, 1, 2, 3]);
        while (joins.length < want && pool.length) joins.push({ user: pool.pop(), party: 1 });
      }

      const talkers = [author, ...joins.map((j) => j.user), ...pool.slice(0, 1)];
      const nComments = pick([0, 0, 1, 1, 2, 3]);
      const cmts = [];
      for (let c = 0; c < nComments && talkers.length > 1; c++) {
        cmts.push({ user: talkers[(c + 1) % talkers.length], text: pick(PAST_COMMENTS) });
      }

      const row = addPost({
        author, role, seats, party: role === "rider" && chance(0.12) ? 2 : 1,
        date: pacificDay(now, d), time, notes: pick(PAST_NOTES), from, to,
        created, until: tripTs - 20 * MIN, joins, comments: cmts,
      });

      // A full car still gets asked for: the cap holding is part of the story.
      if (role === "driver" && row.taken === seats && pool.length && chance(0.35)) {
        log(row.lastActivity + int(10, 90) * MIN, pool.pop(), "seat.claim.full", "post", row.id,
          { driver: author.name, wanted: 1, free: 0 });
      }

      // A few plans change before the day.
      if (time && chance(0.1)) {
        const was = `${pad(Math.max(6, hour - 1))}:30`;
        row.updated = row.lastActivity + int(5, 40) * MIN;
        log(row.updated, author, "post.update", "post", row.id, { changed: { time: { from: was, to: time } } });
      } else if (chance(0.07)) {
        row.deleted = row.updated = row.lastActivity + int(20, 120) * MIN;
        log(row.deleted, author, "post.delete", "post", row.id,
          { role, route: `${from} → ${to}`, date: row.date, author: author.name });
      }
    }
  }

  // The nightly cron archives whatever is past its date and leaves one line.
  for (let d = -HISTORY_DAYS + 2; d <= 0; d++) {
    const ts = stamp(d, 0, 10);
    if (ts >= now) continue;
    const before = pacificDay(now, d);
    const aged = posts.filter((p) => p.deleted === null && p.date === pacificDay(now, d - 1));
    aged.forEach((p) => { p.deleted = ts; });
    if (aged.length) {
      events.push({ ts, actor: null, system: true, action: "post.expire", entityType: "post", entityId: null,
        detail: { count: aged.length, before } });
    }
  }
  // Midnight to ten past, Pacific: yesterday's trips are off the board but the
  // cron hasn't run. Mark them anyway so no past post is left looking live.
  posts.forEach((p) => { if (p.deleted === null && p.date < today) p.deleted = now - MIN; });

  // One moderation action, so the log shows what an admin edit looks like.
  const admin = person(PERSONAS[2].name);
  const dupe = posts.find((p) => p.author !== admin && p.created > stamp(-12, 0, 0) && p.created < stamp(-6, 0, 0));
  if (dupe) {
    const ts = dupe.created + 45 * MIN;
    dupe.deleted = dupe.updated = ts;
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i];
      const onPost = e.entityId === dupe.id || (e.detail && e.detail.postId === dupe.id);
      if (onPost && e.ts > ts) events.splice(i, 1);
    }
    const gone = (r) => !(r.postId === dupe.id && r.ts > ts);
    plusOnes.splice(0, plusOnes.length, ...plusOnes.filter(gone));
    comments.splice(0, comments.length, ...comments.filter(gone));
    log(ts, admin, "post.delete", "post", dupe.id,
      { role: dupe.role, route: `${dupe.from} → ${dupe.to}`, date: dupe.date, author: dupe.author.name, asAdmin: true });
  }

  // ---- the live board ---------------------------------------------------

  const asJoin = (j) => (Array.isArray(j) ? { user: person(j[0]), party: j[1] } : { user: person(j), party: 1 });

  LIVE.forEach((p) => {
    addPost({
      author: person(p.who), role: p.role, seats: p.seats, party: p.party,
      date: pacificDay(now, p.d), time: p.time, notes: p.notes, from: p.from, to: p.to,
      created: now - p.ago * HOUR - int(0, 50) * MIN,
      until: now - 5 * MIN,
      joins: (p.role === "driver" ? p.takers : p.plus).map(asJoin),
      comments: p.comments.map(([name, text]) => ({ user: person(name), text })),
    });
  });

  // ---- feedback, and the requests that were turned away -------------------

  FEEDBACK.forEach(([daysAgo, hour, kind, who, body]) => {
    const u = person(who);
    const ts = stamp(-daysAgo, hour, int(0, 59));
    const id = newId(ts);
    feedback.push({ id, user: u, kind, body, ts });
    log(ts, u, "feedback.create", "feedback", id, { kind, preview: body.slice(0, 120) });
  });

  [[-27, 20], [-22, 9], [-16, 14], [-9, 23], [-4, 12], [-1, 18]].forEach(([d, h], i) => {
    events.push({ ts: stamp(d, h, int(0, 59)), actor: null, action: "login.rejected", entityType: "session", entityId: null,
      detail: i % 3 === 2 ? { reason: "wrong_domain", via: "redirect" } : { reason: "wrong_domain" },
      ua: USER_AGENTS[i % USER_AGENTS.length] });
  });
  log(stamp(-13, 15, 22), person("Ben Carter"), "logs.denied", null, null, null);
  log(stamp(-3, 22, 41), person("Viktor Petrov"), "logs.denied", null, null, null);

  // ---- sign-ins -----------------------------------------------------------

  // A session lasts fourteen days, so people sign in when they arrive, when
  // it lapses, and now and then from a second device.
  users.forEach((u) => {
    if (u.firstAction - 2 * MIN < u.joinTs) u.joinTs = u.firstAction - int(2, 25) * MIN;
    u.logins = [u.joinTs];
    for (let t = u.joinTs + int(9, 14) * DAY; t < now - HOUR; t += int(9, 14) * DAY) u.logins.push(t + int(0, 600) * MIN);
    if (chance(0.35)) u.logins.push(Math.floor(u.joinTs + rnd() * (now - HOUR - u.joinTs)));
    u.logins = u.logins.filter((t) => t < now - MIN).sort((a, b) => a - b);
    u.logins.forEach((ts) => {
      events.push({ ts, actor: u, action: "login", entityType: "session", entityId: u.email,
        detail: u.viaRedirect ? { via: "redirect" } : null });
    });
  });

  // ---- to SQL ---------------------------------------------------------------

  const out = [];
  const add = (sql, ...params) => out.push([sql, params]);

  users.forEach((u) => {
    add(`INSERT INTO users (email, name, picture, first_seen_at, last_seen_at, login_count) VALUES (?, ?, NULL, ?, ?, ?)`,
      u.email, u.name, u.logins[0], u.logins[u.logins.length - 1], u.logins.length);
  });

  posts.forEach((p) => {
    add(`INSERT INTO posts (id, author_email, author_name, role, seats, trip_date, trip_time, notes, party_size,
           origin_city, dest_city, origin_region, dest_region, created_at, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      p.id, p.author.email, p.author.name, p.role, p.seats, p.date, p.time, p.notes, p.party,
      p.from, p.to, regionOf(p.from), regionOf(p.to), p.created, p.updated, p.deleted);
  });

  plusOnes.forEach((o) => {
    add(`INSERT INTO plus_ones (post_id, author_email, author_name, party_size, created_at) VALUES (?, ?, ?, ?, ?)`,
      o.postId, o.user.email, o.user.name, o.party, o.ts);
  });

  comments.forEach((c) => {
    add(`INSERT INTO comments (id, post_id, author_email, author_name, body, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      c.id, c.postId, c.user.email, c.user.name, c.text, c.ts);
  });

  feedback.forEach((f) => {
    add(`INSERT INTO feedback (id, author_email, author_name, kind, body, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      f.id, f.user.email, f.user.name, f.kind, f.body, f.user.ua, f.ts);
  });

  // Chronological, so the autoincrement id runs the same way the clock does.
  events.sort((a, b) => a.ts - b.ts);
  events.forEach((e) => {
    add(`INSERT INTO audit_log (ts, actor_email, actor_name, action, entity_type, entity_id, detail, ip, country, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
      e.ts, e.actor ? e.actor.email : null, e.actor ? e.actor.name : e.system ? "system" : null,
      e.action, e.entityType, e.entityId, e.detail ? JSON.stringify(e.detail) : null,
      e.system ? null : "US", e.actor ? e.actor.ua : e.ua || null);
  });

  return {
    today,
    statements: out,
    stats: {
      users: users.length,
      posts: posts.length,
      livePosts: posts.filter((p) => p.deleted === null).length,
      seatsClaimed: plusOnes.length,
      comments: comments.length,
      feedback: feedback.length,
      events: events.length,
    },
  };
}
