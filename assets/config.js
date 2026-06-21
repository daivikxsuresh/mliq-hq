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

  // ---- North-star deadline (drives the hero countdown) -------------------
  FINAL_PRESENTATION: "2027-05-10T09:00:00",
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
   ========================================================================== */
window.MLIQ_SEED_TASKS = [
  { phase: "business", title: "Finish the Capstone Charter (fill all [TEAM TO CONFIRM] sections)", owner: "katy",   due_date: null,         sort: 1 },
  { phase: "business", title: "Submit formal proposal to capstone co-directors for approval",       owner: "daivik", due_date: null,         sort: 2 },
  { phase: "business", title: "Confirm success metric + price-floor constraints with The Glasshouses", owner: "luka", due_date: null,        sort: 3 },
  { phase: "data",     title: "Get the full Salesforce export & build a data dictionary",           owner: "luka",   due_date: null,         sort: 1 },
  { phase: "data",     title: "Profile held vs. lost leads + seasonality by event type",            owner: "luka",   due_date: null,         sort: 2 },
  { phase: "prep",     title: "Clean & feature-engineer modeling dataset (incl. lost leads)",       owner: "luka",   due_date: null,         sort: 1 },
  { phase: "model",    title: "Train value + demand-probability models",                            owner: "luka",   due_date: null,         sort: 1 },
  { phase: "eval",     title: "Backtest vs. historical baseline; validate the $8.9M opportunity",   owner: "luka",   due_date: null,         sort: 1 },
  { phase: "deploy",   title: "Build the pricing dashboard/demo + final report",                    owner: "daivik", due_date: null,         sort: 1 },
  { phase: "deploy",   title: "Module 6 capstone prep begins",                                      owner: null,     due_date: "2027-04-19", sort: 2 },
  { phase: "deploy",   title: "Capstone Final Presentation (NYC, faculty & stakeholders)",          owner: null,     due_date: "2027-05-10", sort: 3 },
  { phase: "deploy",   title: "Final Report & all supporting materials due",                        owner: null,     due_date: "2027-05-11", sort: 4 },
];
