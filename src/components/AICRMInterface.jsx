import React, { useState } from "react";

export default function AICRMInterface() {
  // main navigation state
  const [section, setSection] = useState("today");
  // AI panel open
  const [aiOpen, setAiOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#f3f6fb] text-slate-900 flex">
      {/* LEFT COMMAND SIDEBAR */}
      <aside className="w-64 bg-white/90 backdrop-blur border-r border-slate-200 flex flex-col">
        {/* brand */}
        <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-100">
          <div className="h-9 w-9 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
            AI
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Listo Qasa</p>
            <p className="text-[11px] text-slate-400 uppercase tracking-wide">
              Ultimate AI CRM
            </p>
          </div>
        </div>

        {/* nav */}
        <nav className="flex-1 overflow-y-auto py-4">
          <p className="px-5 text-[10px] tracking-[0.3em] uppercase text-slate-400 mb-3">
            Workspace
          </p>
          <SidebarItem
            label="Today"
            active={section === "today"}
            onClick={() => setSection("today")}
          />
          <SidebarItem
            label="Leads"
            active={section === "leads"}
            onClick={() => setSection("leads")}
          />
          <SidebarItem
            label="Properties / MLS"
            active={section === "mls"}
            onClick={() => setSection("mls")}
          />
          <SidebarItem
            label="Tasks"
            active={section === "tasks"}
            onClick={() => setSection("tasks")}
          />
          <SidebarItem
            label="Analytics"
            active={section === "analytics"}
            onClick={() => setSection("analytics")}
          />
          <SidebarItem
            label="Automations"
            active={section === "automations"}
            onClick={() => setSection("automations")}
          />
          <SidebarItem
            label="Reports"
            active={section === "reports"}
            onClick={() => setSection("reports")}
          />
          <SidebarItem
            label="Settings"
            active={section === "settings"}
            onClick={() => setSection("settings")}
          />

          {/* live status */}
          <p className="px-5 text-[10px] tracking-[0.3em] uppercase text-slate-400 mt-6 mb-2">
            Live status
          </p>
          <StatusPill label="MLS: Connected · 21m ago" ok />
          <StatusPill label="PayPal: Webhook OK" ok />
          <StatusPill label="Zapier: 3 flows active" ok />
          <StatusPill label="PWA: Push live" ok />
        </nav>

        {/* footer */}
        <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400">
          Phase 10 · AI CRM · Seats: 3/∞
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP AI COMMAND BAR */}
        <header className="h-16 bg-white/80 backdrop-blur border-b border-slate-200 flex items-center justify-between px-5 gap-4">
          {/* AI search / command */}
          <div className="flex items-center gap-2 flex-1 max-w-2xl bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100">
            <span className="text-slate-400 text-sm">⚡</span>
            <input
              className="bg-transparent text-sm flex-1 outline-none"
              placeholder="Ask AI: “What’s going on?” · “Show me today’s leads.” · “Did MLS import?”"
            />
            <button className="text-[10px] px-2 py-1 rounded bg-white text-slate-500 border border-slate-200">
              /AI
            </button>
          </div>

          {/* actions */}
          <div className="flex items-center gap-3">
            <button className="relative h-9 w-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
              🔔
              <span className="absolute -top-1 -right-1 bg-red-500 text-[9px] text-white rounded-full px-1">
                4
              </span>
            </button>
            <div className="text-right leading-tight">
              <p className="text-xs font-semibold">Agent Workspace</p>
              <p className="text-[10px] text-slate-400">Plan: AI CRM Pro</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-sky-400 text-white flex items-center justify-center text-xs font-semibold">
              AG
            </div>
          </div>
        </header>

        {/* CONTENT + AI RAIL */}
        <div className="flex-1 flex min-h-0 relative">
          {/* MIDDLE CONTENT */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
            {section === "today" && <TodayView />}
            {section === "leads" && <LeadsView />}
            {section === "mls" && <MLSView />}
            {section === "tasks" && <TasksView />}
            {section === "analytics" && <AnalyticsView />}
            {section === "automations" && <AutomationsView />}
            {section === "reports" && <ReportsView />}
            {section === "settings" && <SettingsView />}
          </div>

          {/* RIGHT AI RAIL */}
          <aside
            className={`w-80 bg-white/90 backdrop-blur border-l border-slate-200 flex flex-col transition-transform duration-200 ${
              aiOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold">AI Copilot</p>
                <p className="text-[10px] text-slate-400">
                  Ask about leads, tasks, MLS, payments
                </p>
              </div>
              <button
                onClick={() => setAiOpen(false)}
                className="h-7 w-7 rounded-full bg-slate-100 text-slate-400 text-xs"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
              <p className="text-[11px] text-slate-400 uppercase tracking-[0.2em]">
                Quick actions
              </p>
              <AIChip text="What came in today?" />
              <AIChip text="Show me hot leads (🔥 > 85)" />
              <AIChip text="Did MLS import finish?" />
              <AIChip text="Any failed webhooks?" />
              <AIChip text="What plan is this user on?" />

              <p className="text-[11px] text-slate-400 uppercase tracking-[0.2em] mt-3">
                System health
              </p>
              <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-xs">
                <HealthRow label="MLS connector" status="OK · 21m ago" ok />
                <HealthRow label="PayPal webhook" status="OK" ok />
                <HealthRow label="Zapier automations" status="3 active" ok />
                <HealthRow label="PWA / offline leads" status="OK" ok />
              </div>

              <p className="text-[11px] text-slate-400 uppercase tracking-[0.2em] mt-3">
                Cybars / security
              </p>
              <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-xs">
                <p className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  No anomalies detected
                </p>
                <p className="text-[10px] text-slate-400">
                  Watching: MLS, PayPal, reports, PWA, seat billing
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100">
              <button className="w-full h-11 rounded-lg bg-blue-500 text-white text-sm font-medium flex items-center justify-center gap-2">
                🎙️ Talk to your AI
              </button>
              <p className="text-[10px] text-slate-400 mt-2">
                Say: “Where’s my task?”, “What’s going on?”, “Show me MLS
                errors.”
              </p>
            </div>
          </aside>

          {/* re-open AI rail */}
          {!aiOpen && (
            <button
              onClick={() => setAiOpen(true)}
              className="absolute right-3 top-4 h-9 px-3 rounded-full bg-blue-500 text-white text-xs shadow"
            >
              Open AI
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========== SMALL COMPONENTS ========== */

function SidebarItem({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-5 py-2.5 text-sm transition ${
        active
          ? "bg-blue-50 text-blue-600 border-r-4 border-blue-500"
          : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      <span className="w-5 h-5 rounded bg-slate-100 text-[10px] flex items-center justify-center text-slate-400">
        {label.slice(0, 1)}
      </span>
      <span>{label}</span>
    </button>
  );
}

function StatusPill({ label, ok }) {
  return (
    <div className="flex items-center gap-2 px-5 py-1.5 text-[11px] text-slate-500">
      <span
        className={`h-2 w-2 rounded-full ${ok ? "bg-emerald-400" : "bg-amber-400"}`}
      />
      {label}
    </div>
  );
}

function AIChip({ text }) {
  return (
    <button className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs hover:bg-slate-200 transition">
      {text}
    </button>
  );
}

function HealthRow({ label, status, ok }) {
  return (
    <p className="flex items-center justify-between gap-2">
      <span className="text-slate-500">{label}</span>
      <span
        className={`text-[10px] px-2 py-0.5 rounded-full ${
          ok ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
        }`}
      >
        {status}
      </span>
    </p>
  );
}

function MetricCard({ title, value, sub }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex flex-col gap-1">
      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
        {title}
      </p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}

/* ========== VIEWS ========== */

function TodayView() {
  return (
    <>
      {/* metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Leads today" value="27" sub="+8 vs yesterday" />
        <MetricCard title="New MLS listings" value="14" sub="Imported 30m ago" />
        <MetricCard title="Conversion rate" value="12.4%" sub="7d rolling" />
        <MetricCard title="MRR (PayPal)" value="$7,849" sub="Agents / Dev / Owners" />
      </div>

      {/* today board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* latest leads */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 lg:col-span-2">
          <p className="text-sm font-semibold mb-2">Latest leads (AI scored)</p>
          <p className="text-xs text-slate-400 mb-3">
            🔥 hot · 🌤️ warm · ❄️ cold — auto-matched from your website & landing pages
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-slate-400">
                <th className="py-2">Lead</th>
                <th className="py-2">Interest</th>
                <th className="py-2">AI score</th>
                <th className="py-2 text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["🔥 Carlos Mendoza", "3BR · Quito", "92", "12m ago"],
                ["🌤️ Lucía Paredes", "Rent · Guayaquil", "74", "23m ago"],
                ["❄️ Estate Fund", "Developer · Multi", "48", "42m ago"],
              ].map((row, i) => (
                <tr key={i} className="border-t border-slate-50">
                  <td className="py-2">{row[0]}</td>
                  <td className="py-2">{row[1]}</td>
                  <td className="py-2">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs">
                      {row[2]}
                    </span>
                  </td>
                  <td className="py-2 text-right text-xs text-slate-400">
                    {row[3]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* system health */}
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-sm font-semibold mb-2">System health</p>
          <p className="text-xs text-slate-400 mb-3">
            All core modules running
          </p>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              AI CRM Engine
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              MLS Sync · 21m ago
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              PayPal Checkout / Subscriptions
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              PWA Push / Offline leads
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}

function LeadsView() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Leads</p>
          <p className="text-xs text-slate-400">
            AI scored, auto-assigned to agents, synced to Zapier
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs rounded-lg bg-slate-100 text-slate-600">
            Import
          </button>
          <button className="px-3 py-1.5 text-xs rounded-lg bg-blue-500 text-white">
            + New lead
          </button>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase text-slate-400">
            <th className="py-2">Lead</th>
            <th className="py-2">Budget</th>
            <th className="py-2">Match</th>
            <th className="py-2">AI score</th>
            <th className="py-2">Source</th>
            <th className="py-2">Assigned</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["🔥 Carlos Mendoza", "$180k", "Quito · 3BR", "92", "Agents page", "Ana"],
            ["🌤️ Lucía Paredes", "$900/mo", "Guayaquil · Rent", "74", "Owners", "Admin"],
            ["❄️ Estate Fund", "$1.2M", "Developers", "48", "Investors", "Admin"],
          ].map((row, i) => (
            <tr key={i} className="border-t border-slate-50">
              <td className="py-2">{row[0]}</td>
              <td className="py-2">{row[1]}</td>
              <td className="py-2">{row[2]}</td>
              <td className="py-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs">
                  {row[3]}
                </span>
              </td>
              <td className="py-2 text-xs text-slate-500">{row[4]}</td>
              <td className="py-2 text-xs text-slate-500">{row[5]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MLSView() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">MLS integration</p>
          <p className="text-xs text-slate-400">
            Connected: Ecuador feed · Auto-sync every 30 minutes
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs rounded-lg bg-slate-100">
            View mapping
          </button>
          <button className="px-3 py-1.5 text-xs rounded-lg bg-blue-500 text-white">
            Run import now
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-100 p-4">
        <p className="text-sm font-semibold mb-2">
          Latest properties (from MLS + manual)
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase text-slate-400">
              <th className="py-2">MLS ID</th>
              <th className="py-2">Title</th>
              <th className="py-2">Location</th>
              <th className="py-2">Price</th>
              <th className="py-2">Source</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["EC-92831", "3BR Modern Condo", "Quito", "$185,000", "MLS"],
              ["EC-92812", "Luxury Villa", "Guayaquil", "$399,000", "Manual"],
              ["EC-92790", "Commercial Lot", "Cuenca", "$120,000", "MLS"],
            ].map((row, i) => (
              <tr key={i} className="border-t border-slate-50">
                <td className="py-2 text-xs font-mono text-slate-500">
                  {row[0]}
                </td>
                <td className="py-2">{row[1]}</td>
                <td className="py-2">{row[2]}</td>
                <td className="py-2">{row[3]}</td>
                <td className="py-2 text-xs text-slate-500">{row[4]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TasksView() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Tasks</p>
          <p className="text-xs text-slate-400">
            AI can answer: “Where’s my task?”
          </p>
        </div>
        <button className="px-3 py-1.5 text-xs rounded-lg bg-blue-500 text-white">
          + Task
        </button>
      </div>
      <ul className="space-y-2 text-sm">
        <li className="flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2">
          <div>
            <p className="font-medium text-sm">Call Carlos about 3BR condo</p>
            <p className="text-[11px] text-slate-400">
              Lead: Carlos M. · Due: today 4:30pm
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
            Today
          </span>
        </li>
        <li className="flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2">
          <div>
            <p className="font-medium text-sm">Send proposal to developer</p>
            <p className="text-[11px] text-slate-400">
              Client: La Costa · Due: tomorrow
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
            Tomorrow
          </span>
        </li>
      </ul>
    </div>
  );
}

function AnalyticsView() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Leads (7d)" value="189" sub="+12%" />
        <MetricCard title="Listings imported" value="97" sub="MLS + manual" />
        <MetricCard title="AI matches" value="142" sub="Auto matched" />
        <MetricCard title="Avg. response" value="2m 41s" sub="PWA + push" />
      </div>
      <div className="bg-white rounded-xl border border-slate-100 p-4">
        <p className="text-sm font-semibold mb-1">Funnels</p>
        <p className="text-xs text-slate-400 mb-3">
          Landing → CRM signup → PayPal → Onboard → Active
        </p>
        <div className="flex flex-wrap gap-3 text-xs">
          <FunnelPill label="Landing" value="100%" />
          <FunnelPill label="CRM trial" value="63%" />
          <FunnelPill label="PayPal active" value="44%" />
          <FunnelPill label="Using AI" value="35%" />
          <FunnelPill label="Paying > 30d" value="27%" />
        </div>
      </div>
    </div>
  );
}

function AutomationsView() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-3">
      <p className="text-sm font-semibold">Automations</p>
      <p className="text-xs text-slate-400">
        Zapier + Webhooks + AI routing (lead → agent → notify → CRM)
      </p>
      <ul className="space-y-2 text-sm">
        <li className="flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2">
          <div>
            <p className="text-sm">New Lead → Send to Agent</p>
            <p className="text-[11px] text-slate-400">
              Trigger: Form / Agents page
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
            Active
          </span>
        </li>
        <li className="flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2">
          <div>
            <p className="text-sm">PayPal → Activate Subscription</p>
            <p className="text-[11px] text-slate-400">
              Trigger: Payment successful
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
            Active
          </span>
        </li>
        <li className="flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2">
          <div>
            <p className="text-sm">MLS sync → Normalize listing</p>
            <p className="text-[11px] text-slate-400">
              Trigger: Every 30 minutes
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
            Scheduled
          </span>
        </li>
      </ul>
    </div>
  );
}

function ReportsView() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-3">
      <p className="text-sm font-semibold">Reports</p>
      <p className="text-xs text-slate-400">
        Monthly SLA PDFs + Weekly uptime (from your MVP)
      </p>
      <ul className="space-y-2 text-sm">
        <li className="flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2">
          <div>
            <p className="text-sm">October 2025 SLA Report</p>
            <p className="text-[11px] text-slate-400">
              Uptime: 99.96% · 2 incidents
            </p>
          </div>
          <button className="text-xs text-blue-500">Open</button>
        </li>
        <li className="flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2">
          <div>
            <p className="text-sm">Weekly AI Insights</p>
            <p className="text-[11px] text-slate-400">
              Auto sent to admins (notify.sh)
            </p>
          </div>
          <button className="text-xs text-blue-500">View</button>
        </li>
      </ul>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-4">
      <p className="text-sm font-semibold">Settings</p>
      <p className="text-xs text-slate-400">
        PayPal, MLS credentials, domains, seat billing
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="border border-slate-100 rounded-lg p-3">
          <p className="text-xs font-semibold mb-1">PayPal</p>
          <p className="text-[11px] text-slate-400 mb-2">
            Live mode · Smart Buttons · Webhook OK
          </p>
          <button className="px-3 py-1.5 text-xs rounded-lg bg-slate-100">
            Edit credentials
          </button>
        </div>
        <div className="border border-slate-100 rounded-lg p-3">
          <p className="text-xs font-semibold mb-1">MLS</p>
          <p className="text-[11px] text-slate-400 mb-2">
            Connected · Mapping OK
          </p>
          <button className="px-3 py-1.5 text-xs rounded-lg bg-slate-100">
            Re-map fields
          </button>
        </div>
        <div className="border border-slate-100 rounded-lg p-3">
          <p className="text-xs font-semibold mb-1">Seat billing</p>
          <p className="text-[11px] text-slate-400 mb-2">
            $149.99/mo base + $25/mo per extra seat
          </p>
          <button className="px-3 py-1.5 text-xs rounded-lg bg-blue-500 text-white">
            + Add seat
          </button>
        </div>
      </div>
    </div>
  );
}

function FunnelPill({ label, value }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
      <span className="text-[11px] text-slate-400 uppercase tracking-[0.2em]">
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-700">{value}</span>
    </div>
  );
}
