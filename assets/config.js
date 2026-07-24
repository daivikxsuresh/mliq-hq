/* ============================================================================
   MLiQ HQ — Configuration
   ----------------------------------------------------------------------------
   1) Create a free Supabase project at https://supabase.com
   2) Project Settings → API → copy the Project URL + the "anon / publishable" key
   3) Paste them below (the anon key is SAFE to ship in a public page — it only
      grants what your Row-Level-Security policies allow)
   4) Run the SQL in README.md → "Database setup" inside Supabase SQL Editor
   ========================================================================== */

window.MLIQ_CONFIG = {
  // ---- Supabase ----------------------------------------------------------
  SUPABASE_URL:      "YOUR_SUPABASE_PROJECT_URL",   // e.g. https://abcd1234.supabase.co
  SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_KEY",      // the public anon / publishable key

  // ---- Access gate -------------------------------------------------------
  // Shared passphrase your teammates type once to get in (light obscurity,
  // not hard security). Change it to whatever the team agrees on.
  TEAM_PASSPHRASE: "huncho",

  // ---- North-star deadline (kept for reference) --------------------------
  // The hero countdown now auto-targets the NEAREST future milestone below.
  FINAL_PRESENTATION: "2027-05-10T09:00:00",
};

/* ============================================================================
   Milestones — drive the hero countdown. It auto-selects the nearest one in
   the future, so the deck always shows the most pressing deadline. Keep sorted
   or not — the app sorts by date at render time.
   ========================================================================== */
window.MLIQ_MILESTONES = [
  { at: "2026-08-14T14:00:00", label: "Prof check-in call" },
  { at: "2026-08-17T17:45:00", label: "August checkpoint" },
  { at: "2027-04-19T09:00:00", label: "Module 6 prep" },
  { at: "2027-05-10T09:00:00", label: "Final presentation" },
];

/* ============================================================================
   THE BRIEF — consolidated from the client working session (Jul 24, 2026).
   Rendered as a static, always-visible section so every teammate sees the same
   canonical summary regardless of their local task state. Edit freely.
   Each point is { k: "bold lead-in", v: "the detail" }  (k optional).
   ========================================================================== */
window.MLIQ_BRIEF = {
  updated: "Jul 24, 2026 working session",
  cards: [
    {
      icon: "⚙️",
      title: "How the engine works",
      blurb: "It's a dynamic-pricing problem, not just prediction. Two models, stacked.",
      points: [
        { k: "Stage 1 — Demand", v: "For each “product” (event type × duration, e.g. Corporate 1-day, Social 3-day), predict the probability of a request on any calendar day. Features: day-of-week, month, seasonality." },
        { k: "Willingness-to-pay", v: "Second dimension of the demand model — how much a given lead will accept for their event type and timing. Feeds the optimizer, not the final output." },
        { k: "Stage 2 — Optimization", v: "Each date carries an opportunity cost = odds of a future, more valuable booking. Multi-day request cost = sum of the daily costs. Output: accept/reject + a suggested price floor per lead." },
        { k: "The intuition", v: "A 1-day Friday social is weighed against the chance a 3-day corporate wants that same Friday. If corporate is likely, the social booking's opportunity cost is high." },
        { k: "Ancillaries excluded", v: "Beverage and studio/AV are airline-style add-ons — additive at quote time only. The venue is the constrained resource, so ancillaries stay out of the opportunity-cost math." },
      ],
    },
    {
      icon: "🗄️",
      title: "The data",
      blurb: "Salesforce history, Central Park pilot only.",
      points: [
        { k: "Structure", v: "Lead → Opportunity (event) → Reservation (one row per event day, 1–5 days). ~57 fields on Opportunity; some multiply per reservation, some don't." },
        { k: "Volume", v: "~1,000 events at the event level; ~8,000–10,000 rows at the day level." },
        { k: "Data dictionary", v: "Doesn't exist yet — must be built: the Lead→Opp→Reservation flow, field types, primary/foreign keys, and product definitions." },
        { k: "Scope", v: "Central Park location only for the pilot. Other NYC + Miami sites use different CRMs — port the method after, per the professor." },
        { k: "Revenue streams", v: "Venue rental (primary) + beverage (Glass House) + studio/AV (sister company). Venue + beverage data in hand; studio data obtainable but not yet included. Model on total venue-side revenue." },
      ],
    },
    {
      icon: "🚧",
      title: "Blockers & access",
      blurb: "Two things gate the analytical work.",
      points: [
        { k: "Legal waiver", v: "All six teammates must sign before company legal releases the historical event data. The cleaned data is ready on their side — the waiver is the ONLY blocker." },
        { k: "Competitive pricing", v: "No public benchmark exists (NYU library confirmed). Plan: outreach emails + in-person recon at comparable NYC venues posing as prospective bookers. Small, directional sample by nature." },
        { k: "Drive reshare", v: "The professor never received the original share link — resend access to the folder (holds glasshouse_SF_data_schema.html and all materials)." },
        { k: "Current pricing", v: "Today it's 100% manual: sales directors bump a spreadsheet by a fixed % yearly, adjusting informally for season / event type / day-of-week. No external benchmark, no model." },
      ],
    },
    {
      icon: "🎯",
      title: "August checkpoint",
      blurb: "In-person NYC. A checkpoint, not the final.",
      points: [
        { k: "Format", v: "~8 min + 2 min Q&A, single slide. Prove all data, resources, and access are in place to formally begin — plus a roadmap with milestones (data dictionary → competitive analysis → demand model → optimization model)." },
        { k: "Audience", v: "Mike & India should leave with a clear understanding of the project and confidence the team can execute." },
        { k: "Aug 14 (Fri) check-in", v: "Pre-presentation call with the professor (calendar invite coming). By then: first full draft of the project doc, competitive data gathered, data dictionary done." },
      ],
    },
  ],
};

/* ============================================================================
   Static team roster — pulled from the capstone charter.
   This is hardcoded (not synced) because it rarely changes. Edit freely.
   `key` is used to tag presence + task ownership.
   ========================================================================== */
window.MLIQ_TEAM = [
  {
    key: "daivik", name: "Daivik Suresh", role: "Narrative & Client Comms",
    skills: "Presentation · Public Speaking · Storytelling · Copyediting",
    email: "ds8607@stern.nyu.edu", initials: "DS",
  },
  {
    key: "katy", name: "Katy Arons", role: "Project Management",
    skills: "Project Mgmt · Presentation · Public Speaking · Storytelling",
    email: "kha6892@stern.nyu.edu", initials: "KA",
  },
  {
    key: "kim", name: "Kim Miller", role: "Writing & Editing",
    skills: "Writing · Copyediting · Public Speaking · Storytelling",
    email: "km7213@stern.nyu.edu", initials: "KM",
  },
  {
    key: "luka", name: "Luka Kvirikadze", role: "Lead Modeler / Engineer",
    skills: "Econometrics · ML · Data Mining · R · Python · SQL · Shiny",
    email: "lk3584@stern.nyu.edu", initials: "LK",
  },
  {
    key: "nicole", name: "Nicole Ng", role: "Docs & Coordination",
    skills: "Writing · Copyediting · Project Management",
    email: "nn3150@stern.nyu.edu", initials: "NN",
  },
  {
    key: "suky", name: "Sucaina (Suky) Thyma", role: "Docs & Coordination",
    skills: "Writing · Copyediting · Project Management",
    email: "st6076@stern.nyu.edu", initials: "ST",
  },
];

/* ============================================================================
   CRISP-DM phases — the spine of the checklist + timeline ribbon.
   ========================================================================== */
window.MLIQ_PHASES = [
  { key: "business",  n: "01", name: "Business Understanding", blurb: "Frame the decision & success metric with The Glasshouses." },
  { key: "data",      n: "02", name: "Data Understanding",     blurb: "Explore the Salesforce history; profile held & lost leads." },
  { key: "prep",      n: "03", name: "Data Preparation",       blurb: "Pull, clean & feature-engineer; recover lost leads." },
  { key: "model",     n: "04", name: "Modeling",               blurb: "Train the value & demand-probability models." },
  { key: "eval",      n: "05", name: "Evaluation",             blurb: "Backtest against the baseline; calibrate the rule." },
  { key: "deploy",    n: "06", name: "Deployment",             blurb: "Wire into the app & back to Salesforce; hand to sales." },
];

/* ============================================================================
   Seed checklist — only used to populate an EMPTY board on first run.
   Once tasks exist in Supabase, this is ignored. Edit before first launch.
   Refreshed Jul 24 from the client working session → the real next steps.
   ========================================================================== */
window.MLIQ_SEED_TASKS = [
  // ---- Business Understanding (the immediate August push) ----------------
  { phase: "business", title: "Reshare the Google Drive folder with the professor (original link never landed)", owner: "nicole", due_date: "2026-07-28", sort: 1 },
  { phase: "business", title: "All 6 sign the legal waiver — unblocks release of the historical Salesforce data", owner: "katy", due_date: "2026-08-01", sort: 2 },
  { phase: "business", title: "Document full business context in the project file (revenue streams, ancillary rationale, manual pricing, product definitions)", owner: "kim", due_date: "2026-08-10", sort: 3 },
  { phase: "business", title: "Send the ChatGPT-assisted Glass House business plan to the professor", owner: "daivik", due_date: "2026-08-10", sort: 4 },
  { phase: "business", title: "Pre-presentation check-in call with the professor", owner: null, due_date: "2026-08-14", sort: 5 },
  { phase: "business", title: "Build the single-slide August checkpoint + roadmap milestones", owner: "daivik", due_date: "2026-08-16", sort: 6 },
  { phase: "business", title: "August checkpoint presentation — 8 min + 2 Q&A (in-person NYC)", owner: null, due_date: "2026-08-17", sort: 7 },

  // ---- Data Understanding ------------------------------------------------
  { phase: "data", title: "Build the data dictionary — Lead→Opportunity→Reservation, field types, PK/FK, product (event type × duration) defs", owner: "luka", due_date: "2026-08-14", sort: 1 },
  { phase: "data", title: "Gather competitive pricing — outreach emails + in-person recon at comparable NYC venues (small, directional sample)", owner: "suky", due_date: "2026-08-14", sort: 2 },
  { phase: "data", title: "Profile held vs. lost opportunities + seasonality by event type", owner: "luka", due_date: null, sort: 3 },

  // ---- Data Preparation --------------------------------------------------
  { phase: "prep", title: "Once the waiver clears: pull & clean the day-level dataset (~8–10k reservation rows / ~1k events)", owner: "luka", due_date: null, sort: 1 },

  // ---- Modeling ----------------------------------------------------------
  { phase: "model", title: "Stage 1 — demand model: P(request) per product per calendar day + willingness-to-pay", owner: "luka", due_date: null, sort: 1 },
  { phase: "model", title: "Stage 2 — pricing optimization: daily opportunity cost → accept/reject + price floor", owner: "luka", due_date: null, sort: 2 },

  // ---- Evaluation --------------------------------------------------------
  { phase: "eval", title: "Backtest recommendations vs. the current manual-pricing baseline", owner: "luka", due_date: null, sort: 1 },

  // ---- Deployment --------------------------------------------------------
  { phase: "deploy", title: "Wire model output into the client's calendar/capacity dashboard front-end", owner: "daivik", due_date: null, sort: 1 },
  { phase: "deploy", title: "Module 6 capstone prep begins", owner: null, due_date: "2027-04-19", sort: 2 },
  { phase: "deploy", title: "Capstone Final Presentation (NYC, faculty & stakeholders)", owner: null, due_date: "2027-05-10", sort: 3 },
  { phase: "deploy", title: "Final Report & all supporting materials due", owner: null, due_date: "2027-05-11", sort: 4 },
];
