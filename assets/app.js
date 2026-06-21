/* ============================================================================
   MLiQ HQ — app logic
   - Store abstraction: SupabaseStore (live team sync) OR LocalStore (demo mode,
     no keys yet). Same interface, so the UI never changes.
   - Renders: team, checklist (CRISP-DM phases), message board, meetings, ribbon.
   - Realtime, presence, confetti, toasts, .ics export.
   ========================================================================== */
(function () {
  "use strict";
  const CFG    = window.MLIQ_CONFIG || {};
  const TEAM   = window.MLIQ_TEAM   || [];
  const PHASES = window.MLIQ_PHASES || [];
  const SEED   = window.MLIQ_SEED_TASKS || [];

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const memberOf = (k) => TEAM.find((m) => m.key === k) || null;
  const escapeHtml = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let ME = localStorage.getItem("mliq-me") || null;

  const CONFIGURED = CFG.SUPABASE_URL && !String(CFG.SUPABASE_URL).startsWith("YOUR_") &&
                     CFG.SUPABASE_ANON_KEY && !String(CFG.SUPABASE_ANON_KEY).startsWith("YOUR_");

  /* ======================================================================
     STORE ABSTRACTION
     ====================================================================== */
  function SupabaseStore() {
    const sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
    const orderMap = { tasks: ["sort", true], messages: ["created_at", false], meetings: ["starts_at", true] };
    return {
      mode: "live", sb,
      async list(table) {
        const [col, asc] = orderMap[table] || ["created_at", true];
        const { data, error } = await sb.from(table).select("*").order(col, { ascending: asc });
        if (error) { console.error(error); return []; }
        return data || [];
      },
      async insert(table, row) { const { data, error } = await sb.from(table).insert(row).select(); if (error) throw error; return data && data[0]; },
      async update(table, id, patch) { const { error } = await sb.from(table).update(patch).eq("id", id); if (error) throw error; },
      async remove(table, id) { const { error } = await sb.from(table).delete().eq("id", id); if (error) throw error; },
      subscribe(table, cb) {
        sb.channel("rt-" + table)
          .on("postgres_changes", { event: "*", schema: "public", table }, cb)
          .subscribe();
      },
    };
  }

  function LocalStore() {
    const KEY = (t) => "mliq-" + t;
    const bc = ("BroadcastChannel" in window) ? new BroadcastChannel("mliq") : null;
    const read = (t) => { try { return JSON.parse(localStorage.getItem(KEY(t)) || "[]"); } catch { return []; } };
    const write = (t, rows) => localStorage.setItem(KEY(t), JSON.stringify(rows));
    const subs = {};
    const fire = (t) => { (subs[t] || []).forEach((cb) => cb()); if (bc) bc.postMessage(t); };
    if (bc) bc.onmessage = (e) => (subs[e.data] || []).forEach((cb) => cb());
    window.addEventListener("storage", (e) => { const t = (e.key || "").replace("mliq-", ""); if (subs[t]) (subs[t]).forEach((cb) => cb()); });
    const sort = (t, rows) => {
      if (t === "tasks") rows.sort((a, b) => (a.sort || 0) - (b.sort || 0));
      else if (t === "messages") rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      else if (t === "meetings") rows.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
      return rows;
    };
    return {
      mode: "demo",
      async list(t) { return sort(t, read(t)); },
      async insert(t, row) { const rows = read(t); const r = Object.assign({ id: "loc-" + Date.now() + Math.random().toString(36).slice(2, 6), created_at: new Date().toISOString() }, row); rows.push(r); write(t, rows); fire(t); return r; },
      async update(t, id, patch) { const rows = read(t).map((r) => r.id === id ? Object.assign(r, patch) : r); write(t, rows); fire(t); },
      async remove(t, id) { write(t, read(t).filter((r) => r.id !== id)); fire(t); },
      subscribe(t, cb) { (subs[t] = subs[t] || []).push(cb); },
    };
  }

  const store = CONFIGURED ? SupabaseStore() : LocalStore();

  /* ======================================================================
     TOAST + CONFETTI
     ====================================================================== */
  let toastT;
  function toast(html) {
    const el = $("#toast"); el.innerHTML = html; el.hidden = false;
    requestAnimationFrame(() => el.classList.add("show"));
    clearTimeout(toastT); toastT = setTimeout(() => { el.classList.remove("show"); setTimeout(() => (el.hidden = true), 300); }, 2600);
  }

  function confettiBurst() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cv = $("#confetti"); const ctx = cv.getContext("2d");
    cv.width = innerWidth; cv.height = innerHeight;
    const colors = ["#A57C2E", "#8C6824", "#CBBF9F", "#5E7D52", "#181510"];
    const N = 130, parts = [];
    for (let i = 0; i < N; i++) parts.push({
      x: innerWidth / 2 + (Math.random() - .5) * 240, y: innerHeight / 3,
      vx: (Math.random() - .5) * 11, vy: Math.random() * -13 - 4,
      g: .32 + Math.random() * .15, s: 4 + Math.random() * 6, rot: Math.random() * 6.28,
      vr: (Math.random() - .5) * .35, c: colors[(Math.random() * colors.length) | 0], life: 0,
    });
    let raf;
    (function frame() {
      ctx.clearRect(0, 0, cv.width, cv.height); let alive = false;
      parts.forEach((p) => {
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life++;
        if (p.y < cv.height + 30) alive = true;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
        ctx.globalAlpha = Math.max(0, 1 - p.life / 130); ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); ctx.restore();
      });
      if (alive) raf = requestAnimationFrame(frame); else { ctx.clearRect(0, 0, cv.width, cv.height); cancelAnimationFrame(raf); }
    })();
  }

  /* ======================================================================
     MODAL
     ====================================================================== */
  function openModal(html) {
    $("#modalBody").innerHTML = html; $("#modal").hidden = false;
    const f = $("#modalBody").querySelector("input,textarea,select"); if (f) setTimeout(() => f.focus(), 60);
  }
  function closeModal() { $("#modal").hidden = true; }
  $("#modalX").onclick = closeModal;
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  /* ======================================================================
     GATE + IDENTITY
     ====================================================================== */
  function setIdentity(k) {
    ME = k; localStorage.setItem("mliq-me", ME);
    const me = memberOf(ME);
    const mc = $("#meChip"); if (mc) mc.textContent = me ? me.name.split(" ")[0] : "Set name";
    const dn = $("#deckName"); if (dn) dn.textContent = me ? ", " + me.name.split(" ")[0] : "";
    if (booted) {
      renderTeam(); renderMessages(); renderMeetings(); updateComposer();
      if (store.mode !== "live") updatePresenceUI(ME ? [ME] : []);
    }
  }

  function updateComposer() {
    const me = memberOf(ME); const ta = $("#msgInput");
    if (ta) ta.placeholder = me ? `Share something with the team, ${me.name.split(" ")[0]}…` : "Share something with the team…";
  }

  function renderGatePeople() {
    $("#gatePeople").innerHTML = TEAM.map((m, i) =>
      `<button class="who-card ${m.key === ME ? "sel" : ""}" data-k="${m.key}" style="animation-delay:${(i * 0.05).toFixed(2)}s">
        <span class="who-av">${escapeHtml(m.initials)}</span>
        <span class="who-name">${escapeHtml(m.name.split(" ")[0])}</span>
        <span class="who-role">${escapeHtml(m.role)}</span>
      </button>`).join("");
    $$("#gatePeople .who-card").forEach((b) => b.onclick = () => { setIdentity(b.dataset.k); enterApp(); });
  }

  function enterApp() {
    const g = $("#gate"); g.classList.add("hide");
    setTimeout(() => { g.style.display = "none"; }, 600);
    $("#topbar").hidden = false; $("#app").hidden = false;
    boot();
  }

  /* ======================================================================
     RENDER — TEAM
     ====================================================================== */
  function renderTeam() {
    $("#teamGrid").innerHTML = TEAM.map((m) => `
      <div class="member ${m.key === ME ? "you" : ""}" data-k="${m.key}">
        <div class="member-top">
          <div class="avatar" data-av="${m.key}">${escapeHtml(m.initials)}</div>
          <div><div class="member-name">${escapeHtml(m.name)}${m.key === ME ? ' <span class="you-badge">You</span>' : ""}</div><div class="member-role">${escapeHtml(m.role)}</div></div>
        </div>
        <div class="member-skills">${escapeHtml(m.skills)}</div>
        <a class="member-email" href="mailto:${escapeHtml(m.email)}">${escapeHtml(m.email)}</a>
      </div>`).join("");
  }

  /* ======================================================================
     RENDER — CHECKLIST
     ====================================================================== */
  let TASKS = [];
  function dueTag(d) {
    if (!d) return "";
    const due = new Date(d + "T00:00:00"); const now = new Date(); now.setHours(0, 0, 0, 0);
    const days = Math.round((due - now) / 864e5);
    const soon = days <= 14;
    const label = due.toLocaleDateString("en-US", { month: "short", day: "numeric", year: due.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
    return `<span class="tag tag-due ${soon ? "soon" : ""}">📅 ${label}${days < 0 ? " · overdue" : ""}</span>`;
  }
  function renderChecklist() {
    const host = $("#phases");
    const openState = {}; $$(".phase", host).forEach((p) => openState[p.dataset.p] = p.classList.contains("open"));
    host.innerHTML = PHASES.map((ph, i) => {
      const ts = TASKS.filter((t) => t.phase === ph.key);
      const done = ts.filter((t) => t.done).length;
      const pct = ts.length ? Math.round(done / ts.length * 100) : 0;
      const isOpen = openState[ph.key] !== undefined ? openState[ph.key] : (i < 3);
      return `
      <div class="phase ${isOpen ? "open" : ""}" data-p="${ph.key}">
        <div class="phase-head">
          <span class="phase-n">${ph.n}</span>
          <div class="phase-meta"><div class="phase-name">${escapeHtml(ph.name)}</div><div class="phase-blurb">${escapeHtml(ph.blurb)}</div></div>
          <span class="phase-count">${done}/${ts.length}</span>
          <span class="phase-mini"><span class="phase-mini-fill" style="width:${pct}%"></span></span>
          <span class="phase-chev">▾</span>
        </div>
        <div class="phase-body"><div class="phase-tasks">
          ${ts.map((t) => taskRow(t)).join("") || `<div class="phase-tasks" style="color:var(--taupe);font-size:12px;padding:8px">No tasks yet.</div>`}
          <div class="add-task-row"><button class="add-task-btn" data-add="${ph.key}">+ Add a task to ${escapeHtml(ph.name)}</button></div>
        </div></div>
      </div>`;
    }).join("");
    wireChecklist();
    updateProgress();
  }
  function taskRow(t) {
    const o = memberOf(t.owner);
    return `
    <div class="task ${t.done ? "done" : ""}" data-id="${t.id}">
      <button class="check" data-check="${t.id}" aria-label="toggle"><svg viewBox="0 0 14 14"><polyline points="2,7 6,11 12,3"/></svg></button>
      <div class="task-main">
        <div class="task-title">${escapeHtml(t.title)}</div>
        <div class="task-tags">
          ${o ? `<span class="tag tag-owner">● ${escapeHtml(o.name.split(" ")[0])}</span>` : ""}
          ${dueTag(t.due_date)}
        </div>
      </div>
      <div class="task-actions">
        <button class="icon-btn" data-edit="${t.id}" title="Edit">✎</button>
        <button class="icon-btn" data-del="${t.id}" title="Delete">🗑</button>
      </div>
    </div>`;
  }
  function wireChecklist() {
    $$(".phase-head").forEach((h) => h.onclick = (e) => { if (e.target.closest("button")) return; h.parentElement.classList.toggle("open"); });
    $$("[data-check]").forEach((b) => b.onclick = async () => {
      const id = b.dataset.check; const t = TASKS.find((x) => x.id === id); if (!t) return;
      const row = b.closest(".task"); const willDo = !t.done;
      row.classList.add("just-checked"); setTimeout(() => row.classList.remove("just-checked"), 420);
      t.done = willDo; row.classList.toggle("done", willDo); updateProgress();
      try { await store.update("tasks", id, { done: willDo }); } catch (e) { toast("⚠ Couldn't save"); }
      checkPhaseComplete(t.phase);
    });
    $$("[data-edit]").forEach((b) => b.onclick = () => editTask(b.dataset.edit));
    $$("[data-del]").forEach((b) => b.onclick = async () => {
      const id = b.dataset.del; if (!confirm("Delete this task?")) return;
      await store.remove("tasks", id); toast("Task deleted");
    });
    $$("[data-add]").forEach((b) => b.onclick = () => editTask(null, b.dataset.add));
  }
  function checkPhaseComplete(phaseKey) {
    const ts = TASKS.filter((t) => t.phase === phaseKey);
    if (ts.length && ts.every((t) => t.done)) {
      const ph = PHASES.find((p) => p.key === phaseKey);
      confettiBurst(); toast(`🎉 <b>${escapeHtml(ph ? ph.name : "Phase")}</b> complete!`);
    }
  }
  function editTask(id, phaseKey) {
    const t = id ? TASKS.find((x) => x.id === id) : null;
    openModal(`
      <div class="modal-title">${t ? "Edit task" : "New task"}</div>
      <div class="field"><label>Task</label><textarea id="f-title" rows="2" placeholder="What needs doing?">${t ? escapeHtml(t.title) : ""}</textarea></div>
      <div class="field"><label>Phase</label><select id="f-phase">${PHASES.map((p) => `<option value="${p.key}" ${((t && t.phase) || phaseKey) === p.key ? "selected" : ""}>${escapeHtml(p.name)}</option>`).join("")}</select></div>
      <div class="field"><label>Owner</label><select id="f-owner"><option value="">— unassigned —</option>${TEAM.map((m) => `<option value="${m.key}" ${t && t.owner === m.key ? "selected" : ""}>${escapeHtml(m.name)}</option>`).join("")}</select></div>
      <div class="field"><label>Due date (optional)</label><input id="f-due" type="date" value="${t && t.due_date ? t.due_date : ""}" /></div>
      <div class="modal-actions"><button class="btn-primary" id="f-save">${t ? "Save" : "Add task"}</button><button class="btn-ghost" id="f-cancel">Cancel</button></div>`);
    $("#f-cancel").onclick = closeModal;
    $("#f-save").onclick = async () => {
      const title = $("#f-title").value.trim(); if (!title) { $("#f-title").focus(); return; }
      const row = { title, phase: $("#f-phase").value, owner: $("#f-owner").value || null, due_date: $("#f-due").value || null };
      try {
        if (t) { await store.update("tasks", id, row); toast("Task updated"); }
        else { row.sort = (TASKS.filter((x) => x.phase === row.phase).length + 1); row.done = false; await store.insert("tasks", row); toast("Task added"); }
        closeModal();
      } catch (e) { toast("⚠ Couldn't save"); }
    };
  }

  function updateProgress() {
    const total = TASKS.length, done = TASKS.filter((t) => t.done).length;
    const pct = total ? Math.round(done / total * 100) : 0;
    $("#overallFill").style.width = pct + "%"; $("#overallPct").textContent = pct + "%";
    animateCount($("#tPct"), pct);
  }

  /* ======================================================================
     RENDER — MESSAGES
     ====================================================================== */
  let MSGS = [];
  function timeAgo(iso) {
    const s = (Date.now() - new Date(iso)) / 1000;
    if (s < 60) return "just now"; if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  function renderMessages() {
    const sorted = [...MSGS].sort((a, b) => (b.pinned - a.pinned) || (new Date(b.created_at) - new Date(a.created_at)));
    const host = $("#messages");
    if (!sorted.length) { host.innerHTML = `<div style="color:var(--taupe);font-size:13px;padding:8px">No messages yet — be the first to post.</div>`; return; }
    host.innerHTML = sorted.map((m) => {
      const author = memberOf(m.author);
      const init = author ? author.initials : (m.author || "?").slice(0, 2).toUpperCase();
      const name = author ? author.name : m.author;
      const mine = m.author === ME;
      return `
      <div class="msg ${m.pinned ? "pinned" : ""}">
        <div class="msg-top">
          <div class="msg-avatar">${escapeHtml(init)}</div>
          <span class="msg-author">${escapeHtml(name)}</span>
          <span class="msg-time">${timeAgo(m.created_at)}</span>
          ${m.pinned ? `<span class="msg-pin-badge">Pinned</span>` : ""}
        </div>
        <div class="msg-body">${escapeHtml(m.body)}</div>
        <div class="msg-actions">
          <button class="msg-act" data-pin="${m.id}">${m.pinned ? "Unpin" : "Pin"}</button>
          ${mine ? `<button class="msg-act msg-mine" data-delmsg="${m.id}">Delete</button>` : ""}
        </div>
      </div>`;
    }).join("");
    $$("[data-pin]").forEach((b) => b.onclick = async () => { const m = MSGS.find((x) => x.id === b.dataset.pin); await store.update("messages", m.id, { pinned: !m.pinned }); });
    $$("[data-delmsg]").forEach((b) => b.onclick = async () => { if (confirm("Delete your message?")) { await store.remove("messages", b.dataset.delmsg); toast("Message deleted"); } });
  }
  $("#msgForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = $("#msgInput").value.trim(); if (!body) return;
    const pinned = $("#msgPin").checked;
    $("#msgInput").value = ""; $("#msgPin").checked = false;
    try { await store.insert("messages", { author: ME, body, pinned }); toast("Posted ✓"); }
    catch (e) { toast("⚠ Couldn't post"); }
  });

  /* ======================================================================
     RENDER — MEETINGS
     ====================================================================== */
  let MEETINGS = [];
  function renderMeetings() {
    const host = $("#meetingsList");
    const now = Date.now();
    const sorted = [...MEETINGS].sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
    if (!sorted.length) { host.innerHTML = `<div style="color:var(--taupe);font-size:13px;padding:8px">No meetings scheduled. Hit “Schedule a meeting”.</div>`; updateNextTile(); return; }
    host.innerHTML = sorted.map((m) => {
      const d = new Date(m.starts_at); const past = d.getTime() < now;
      const rsvps = Array.isArray(m.rsvps) ? m.rsvps : [];
      const iAmIn = rsvps.includes(ME);
      return `
      <div class="meeting ${past ? "past" : ""}" data-id="${m.id}">
        <div class="meeting-when">
          <span class="meeting-date">${d.getDate()}</span>
          <span class="meeting-dow">${d.toLocaleDateString("en-US", { weekday: "short", month: "short" })}</span>
        </div>
        <div class="meeting-title">${escapeHtml(m.title)}</div>
        <div class="meeting-time">${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}${m.recurring ? "" : ""} · ${d.getFullYear()}</div>
        ${m.recurring ? `<span class="meeting-recurring">↻ Weekly</span>` : ""}
        <div class="meeting-links">
          ${m.zoom_link ? `<a class="mlink zoom" href="${escapeHtml(m.zoom_link)}" target="_blank" rel="noopener">Join Zoom</a>` : ""}
          <button class="mlink" data-ics="${m.id}">Add to calendar</button>
          <button class="mlink" data-delmtg="${m.id}">Delete</button>
        </div>
        <div class="rsvp-row">
          <span class="rsvp-lab">Going</span>
          <span class="rsvp-avatars">${rsvps.map((k) => { const mm = memberOf(k); return `<span class="rsvp-av" title="${mm ? escapeHtml(mm.name) : k}">${mm ? escapeHtml(mm.initials) : "?"}</span>`; }).join("") || `<span style="font-size:11px;color:var(--taupe)">nobody yet</span>`}</span>
          <button class="rsvp-btn ${iAmIn ? "in" : ""}" data-rsvp="${m.id}">${iAmIn ? "✓ I'm in" : "RSVP"}</button>
        </div>
      </div>`;
    }).join("");
    $$("[data-rsvp]").forEach((b) => b.onclick = async () => {
      const m = MEETINGS.find((x) => x.id === b.dataset.rsvp); let r = Array.isArray(m.rsvps) ? [...m.rsvps] : [];
      r = r.includes(ME) ? r.filter((k) => k !== ME) : [...r, ME];
      await store.update("meetings", m.id, { rsvps: r });
    });
    $$("[data-ics]").forEach((b) => b.onclick = () => downloadICS(MEETINGS.find((x) => x.id === b.dataset.ics)));
    $$("[data-delmtg]").forEach((b) => b.onclick = async () => { if (confirm("Delete this meeting?")) { await store.remove("meetings", b.dataset.delmtg); toast("Meeting deleted"); } });
    updateNextTile();
  }
  function addMeeting() {
    const def = new Date(Date.now() + 86400e3); def.setHours(18, 0, 0, 0);
    const pad = (n) => String(n).padStart(2, "0");
    const local = `${def.getFullYear()}-${pad(def.getMonth() + 1)}-${pad(def.getDate())}T${pad(def.getHours())}:${pad(def.getMinutes())}`;
    openModal(`
      <div class="modal-title">Schedule a meeting</div>
      <div class="field"><label>Title</label><input id="m-title" placeholder="e.g. Weekly sync" value="Weekly MLiQ sync" /></div>
      <div class="field"><label>When</label><input id="m-when" type="datetime-local" value="${local}" /></div>
      <div class="field"><label>Zoom link (optional)</label><input id="m-zoom" placeholder="https://zoom.us/j/…" /></div>
      <div class="field"><label><input type="checkbox" id="m-rec" style="width:auto;margin-right:8px;vertical-align:middle" />Recurring weekly</label></div>
      <div class="modal-actions"><button class="btn-primary" id="m-save">Schedule</button><button class="btn-ghost" id="m-cancel">Cancel</button></div>`);
    $("#m-cancel").onclick = closeModal;
    $("#m-save").onclick = async () => {
      const title = $("#m-title").value.trim(); const when = $("#m-when").value; if (!title || !when) return;
      try {
        await store.insert("meetings", { title, starts_at: new Date(when).toISOString(), zoom_link: $("#m-zoom").value.trim() || null, recurring: $("#m-rec").checked, rsvps: ME ? [ME] : [] });
        toast("Meeting scheduled ✓"); closeModal();
      } catch (e) { toast("⚠ Couldn't save"); }
    };
  }
  $("#addMeetingBtn").onclick = addMeeting;

  function downloadICS(m) {
    if (!m) return;
    const dt = (d) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const start = new Date(m.starts_at); const end = new Date(start.getTime() + 3600e3);
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MLiQ HQ//EN", "BEGIN:VEVENT",
      "UID:" + m.id + "@mliq-hq", "DTSTAMP:" + dt(new Date()), "DTSTART:" + dt(start), "DTEND:" + dt(end),
      "SUMMARY:" + (m.title || "MLiQ meeting"), m.zoom_link ? "URL:" + m.zoom_link : "",
      m.zoom_link ? "DESCRIPTION:Zoom: " + m.zoom_link : "", m.recurring ? "RRULE:FREQ=WEEKLY" : "",
      "END:VEVENT", "END:VCALENDAR"].filter(Boolean).join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = (m.title || "meeting").replace(/\s+/g, "-").toLowerCase() + ".ics"; a.click();
    toast("📅 Calendar file downloaded");
  }

  function updateNextTile() {
    const now = Date.now();
    const next = [...MEETINGS].filter((m) => new Date(m.starts_at).getTime() >= now).sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))[0];
    if (!next) { $("#tNextTitle").textContent = "—"; $("#tNextWhen").textContent = "nothing scheduled yet"; return; }
    const d = new Date(next.starts_at);
    $("#tNextTitle").textContent = next.title;
    $("#tNextWhen").textContent = d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) + " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  /* ======================================================================
     RENDER — RIBBON (timeline)
     ====================================================================== */
  function renderRibbon() {
    let currentIdx = 0;
    PHASES.forEach((ph, i) => { const ts = TASKS.filter((t) => t.phase === ph.key); if (ts.length && ts.every((t) => t.done)) currentIdx = i + 1; });
    $("#ribbon").innerHTML = PHASES.map((ph, i) => {
      const ts = TASKS.filter((t) => t.phase === ph.key); const done = ts.length && ts.every((t) => t.done);
      const now = i === currentIdx;
      const state = done ? "Complete" : now ? "In progress" : "Upcoming";
      return `<div class="rib ${done ? "done" : ""} ${now ? "now" : ""}"><div class="rib-n">${ph.n}</div><div class="rib-name">${escapeHtml(ph.name)}</div><div class="rib-blurb">${escapeHtml(ph.blurb)}</div><div class="rib-state">${done ? "✓ " : ""}${state}</div></div>`;
    }).join("");
  }

  /* ======================================================================
     COUNTERS + COUNTDOWN
     ====================================================================== */
  function animateCount(el, target) {
    if (!el) return;
    const from = parseFloat(el.dataset.count || "0"); const dur = 900; const t0 = performance.now();
    function step(t) {
      const k = Math.min(1, (t - t0) / dur); const eased = 1 - Math.pow(1 - k, 3);
      const val = Math.round(from + (target - from) * eased);
      el.textContent = val; if (k < 1) requestAnimationFrame(step); else el.dataset.count = target;
    }
    requestAnimationFrame(step);
  }
  function daysToFinal() {
    const d = new Date(CFG.FINAL_PRESENTATION); return Math.max(0, Math.ceil((d - Date.now()) / 864e5));
  }

  /* ======================================================================
     PRESENCE
     ====================================================================== */
  function updatePresenceUI(activeKeys) {
    const set = new Set(activeKeys);
    $$(".avatar[data-av]").forEach((a) => a.classList.toggle("online", set.has(a.dataset.av)));
    const row = $("#presenceRow");
    row.innerHTML = [...set].map((k) => { const m = memberOf(k); return m ? `<span class="rsvp-av" title="${escapeHtml(m.name)}">${escapeHtml(m.initials)}</span>` : ""; }).join("");
    animateCount($("#tOnline"), set.size);
  }
  function startPresence() {
    if (store.mode === "live") {
      const ch = store.sb.channel("presence-room", { config: { presence: { key: ME || "anon" } } });
      ch.on("presence", { event: "sync" }, () => {
        const state = ch.presenceState(); const keys = Object.values(state).flat().map((p) => p.key || (p.presence_ref ? null : null)).filter(Boolean);
        const all = Object.keys(state); updatePresenceUI(all.length ? all : keys);
      }).subscribe(async (status) => { if (status === "SUBSCRIBED") await ch.track({ key: ME, at: Date.now() }); });
    } else {
      // demo: just show myself
      updatePresenceUI(ME ? [ME] : []);
    }
  }

  /* ======================================================================
     NAV SCROLLSPY
     ====================================================================== */
  function scrollspy() {
    const links = $$(".nav a"); const ids = links.map((l) => l.getAttribute("href").slice(1));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { const id = e.target.id; links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + id)); } });
    }, { rootMargin: "-40% 0px -55% 0px" });
    ids.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  }

  /* ======================================================================
     LOAD + WIRE REALTIME
     ====================================================================== */
  async function loadTasks() {
    TASKS = await store.list("tasks");
    if (!TASKS.length && !localStorage.getItem("mliq-seeded-" + (CONFIGURED ? "live" : "demo"))) {
      for (const s of SEED) { try { await store.insert("tasks", Object.assign({ done: false }, s)); } catch (e) {} }
      localStorage.setItem("mliq-seeded-" + (CONFIGURED ? "live" : "demo"), "1");
      TASKS = await store.list("tasks");
    }
    $("#taskSkeleton") && ($("#taskSkeleton").style.display = "none");
    renderChecklist(); renderRibbon();
  }
  async function loadMessages() { MSGS = await store.list("messages"); renderMessages(); }
  async function loadMeetings() { MEETINGS = await store.list("meetings"); renderMeetings(); animateCount($("#tDays"), daysToFinal()); }

  function setSync(ok) { const d = $("#syncDot"); d.className = "sync-dot " + (ok ? "ok" : "off"); d.title = ok ? (store.mode === "live" ? "Live · synced" : "Demo mode (local only)") : "Offline"; }

  /* ======================================================================
     BOOT
     ====================================================================== */
  let booted = false;
  async function boot() {
    if (booted) return; booted = true;

    // me chip
    const me = memberOf(ME);
    $("#meChip").textContent = me ? me.name.split(" ")[0] : "Set name";
    $("#meChip").title = "Switch teammate";
    $("#meChip").onclick = () => { const g = $("#gate"); g.style.display = "flex"; g.classList.remove("hide"); renderGatePeople(); };
    $("#deckName").textContent = me ? ", " + me.name.split(" ")[0] : "";

    renderTeam();
    updateComposer();
    scrollspy();
    setSync(true);

    const meName = me ? me.name.split(" ")[0] : "team";
    setTimeout(() => toast(`Welcome to MLiQ HQ, <b>${escapeHtml(meName)}</b>`), 450);

    await Promise.all([loadTasks(), loadMessages(), loadMeetings()]);
    startPresence();

    // realtime
    store.subscribe("tasks", () => loadTasks());
    store.subscribe("messages", () => loadMessages());
    store.subscribe("meetings", () => loadMeetings());

    // refresh "time ago" + next tile periodically
    setInterval(() => { renderMessages(); updateNextTile(); animateCount($("#tDays"), daysToFinal()); }, 60000);
  }

  /* ======================================================================
     INIT
     ====================================================================== */
  renderGatePeople();
  if (ME) { enterApp(); }
})();
