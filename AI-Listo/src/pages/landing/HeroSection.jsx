import React from "react";
import {
  Zap,
  CheckCircle,
  Users,
  BarChart3,
  MessageCircle,
  Calendar,
  DollarSign,
  Percent,
  Phone,
  Send,
  ShieldCheck,
  Filter,
  Download,
  Home,
  LayoutDashboard,
  UserRound,
  Bot,
  Plug,
  Target,
  LineChart,
  Activity,
  CircleDollarSign,
  ArrowUpRight,
} from "lucide-react";

export default function HeroSection() {
  const heroChecks = [
    "Your AI Agent finds, captures, and qualifies leads automatically",
    "Connect WhatsApp and let AI take over conversations instantly",
    "Calls, texts, follow-ups, and appointment booking run 24/7",
    "Pipeline Intelligence, revenue forecasting, and every deal in one connected dashboard.",
  ];

  const sidebarItems = [
    ["Dashboard", LayoutDashboard, true],
    ["WhatsApp", MessageCircle],
    ["Leads", Users],
    ["Pipeline", LineChart],
    ["Properties", Home],
    ["Analytics", BarChart3],
    ["Team", UserRound],
    ["AI Command Center", Bot],
    ["Apps & Integrations", Plug],
    ["Lead Generator", Target],
  ];

  const kpis = [
    ["New Leads", "248", "+24% vs last week", Users],
    ["Active Deals", "$2.48M", "+15% vs last week", ShieldCheck],
    ["Revenue", "$680K", "+17% vs last week", DollarSign],
    ["Conversion Rate", "21.8%", "+2.3% vs last week", Percent],
    ["AI Conversations", "326", "+31% vs last week", MessageCircle],
    ["Appointments", "18", "+12% vs last week", Calendar],
  ];

  const leads = [
    ["Maria Lopez", "Miami, FL Luxury", 65],
    ["Carlos Ortega", "Orlando, FL", 62],
    ["David Kimrá", "Fort Lauderdale, FL", 61],
    ["Priya Verma", "Tampa, FL Interested", 58],
    ["Sofia Williams", "Austin, TX", 56],
  ];

  const pipeline = [
    ["Luxury Penthouse", "$1.2M", "Proposal", "Hot"],
    ["Downtown Apartment", "$850K", "Proposal", "Warm"],
    ["Beachfront Condo", "$650K", "Qualified", "Warm"],
    ["Golf Course Condo", "$825K", "Negotiation", "Hot"],
  ];

  return (
    <section className="cx-hero-canvas">
      <div className="cx-left">
        <div className="cx-eyebrow">
          <span>AI POWERED</span>
          <strong>REAL ESTATE AGENTS &amp; TEAMS</strong>
        </div>

        <h1>
          Get Instant Leads.
          <br />
          Close More Deals.
          <br />
          <span>24/7.</span>
        </h1>

        <p className="cx-copy">
          CORTEXA is the all-in-one AI CRM that finds leads, engages instantly,
          nurtures automatically, and helps you close more deals—on autopilot.
        </p>

        <div className="cx-cta-row">
          <button className="cx-cta">
            <Zap size={21} />
            Start Your Free Trial
          </button>
          <span>Unlock your potential today!</span>
        </div>

        <div className="cx-checks">
          {heroChecks.map((text) => (
            <div className="cx-check" key={text}>
              <CheckCircle size={18} />
              <span>{text}</span>
            </div>
          ))}
        </div>

        <div className="cx-trust">
          <div className="cx-avatars">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>

          <div>
            <div className="cx-stars">★★★★★</div>
            <p>
              Trusted by 2,000+ real estate professionals to grow and scale
              their business.
            </p>
          </div>
        </div>
      </div>

      <div className="cx-dashboard-wrap">
        <div className="cx-dashboard-frame">
          <aside className="cx-sidebar">
            <div className="cx-mini-logo">
              <div className="cx-mini-mark" />
              <span>CORTEXA</span>
            </div>

            <nav>
              {sidebarItems.map(([label, Icon, active]) => (
                <div className={`cx-side-item ${active ? "active" : ""}`} key={label}>
                  <Icon size={14} />
                  <span>{label}</span>
                  {["Leads", "Pipeline", "Properties", "Analytics"].includes(label) && (
                    <b>›</b>
                  )}
                </div>
              ))}
            </nav>

            <div className="cx-ai-card">
              <strong>AI Command Center</strong>
              <div className="cx-ai-cube">
                <Bot size={31} />
              </div>
              <p>Your AI Copilot is Active</p>
              <small>Always learning. Always winning.</small>
              <button>Open Command Center</button>
            </div>
          </aside>

          <main className="cx-main">
            <header className="cx-topbar">
              <div>
                <h2>Dashboard Overview</h2>
                <p>Real-time overview of your pipeline, performance, and AI activity.</p>
              </div>

              <div className="cx-actions">
                <button>
                  <Calendar size={13} />
                  May 12 - May 18, 2025
                </button>
                <button>
                  <Filter size={13} />
                  Filters
                </button>
                <button className="export">
                  <Download size={13} />
                  Export
                </button>
              </div>
            </header>

            <section className="cx-kpis">
              {kpis.map(([label, value, growth, Icon]) => (
                <div className="cx-kpi" key={label}>
                  <div className="cx-kpi-icon">
                    <Icon size={16} />
                  </div>
                  <div>
                    <small>{label}</small>
                    <strong>{value}</strong>
                    <p>{growth}</p>
                  </div>
                </div>
              ))}
            </section>

            <section className="cx-command">
              <div className="cx-command-left">
                <div className="cx-command-orb">
                  <Bot size={21} />
                </div>
                <div>
                  <small>AI Command Center</small>
                  <h3>You have 3 high-intent leads ready to close.</h3>
                  <p>Next best action: AI Smart Closer now.</p>
                  <span>★ 2 tasks require immediate follow-up</span>
                </div>
              </div>

              <div className="cx-command-stats">
                <div>
                  <small>AI Confidence</small>
                  <strong>92%</strong>
                  <i className="spark green" />
                </div>
                <div>
                  <small>Pipeline Value</small>
                  <strong>$3.30K</strong>
                  <i className="spark orange" />
                </div>
                <div>
                  <small>Next Best Action</small>
                  <strong>Call Maria Lopez</strong>
                </div>
              </div>

              <div className="cx-command-buttons">
                <button>
                  <Phone size={12} />
                  Call
                </button>
                <button className="whatsapp">
                  <MessageCircle size={12} />
                  WhatsApp
                </button>
                <button className="assign">
                  <Users size={12} />
                  Assign
                </button>
                <button className="follow">
                  <ArrowUpRight size={12} />
                  Follow up
                </button>
              </div>
            </section>

            <section className="cx-grid">
              <div className="cx-panel">
                <div className="panel-head">
                  <h4>Top Leads</h4>
                  <a>View all ›</a>
                </div>

                {leads.map(([name, city, score], index) => (
                  <div className="lead-row" key={name}>
                    <div className={`face face-${index}`} />
                    <div>
                      <strong>{name}</strong>
                      <small>{city}</small>
                    </div>
                    <b>{score}</b>
                  </div>
                ))}
              </div>

              <div className="cx-panel">
                <div className="panel-head">
                  <h4>Revenue &amp; Pipeline Trend</h4>
                </div>

                <div className="tabs">
                  <span className="active">Revenue</span>
                  <span>Pipeline</span>
                  <span>Deals</span>
                </div>

                <div className="line-chart">
                  <svg viewBox="0 0 360 190" preserveAspectRatio="none">
                    <path
                      d="M0 120 C40 90, 65 105, 95 82 C125 58, 145 135, 185 88 C225 28, 245 82, 280 62 C315 40, 330 34, 360 18"
                      fill="none"
                      stroke="url(#cxBlueLine)"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="cxBlueLine" x1="0" x2="1">
                        <stop offset="0%" stopColor="#2979ff" />
                        <stop offset="100%" stopColor="#5638ff" />
                      </linearGradient>
                    </defs>
                  </svg>

                  <div className="chart-callout">
                    <strong>$680K</strong>
                    <span>↑ 17%</span>
                    <small>vs last week</small>
                  </div>
                </div>
              </div>

              <div className="cx-panel">
                <div className="panel-head">
                  <h4>Pipeline by Stage</h4>
                </div>

                <div className="funnel">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>

                <div className="funnel-stats">
                  <div>
                    <small>Total Deals</small>
                    <strong>1,518</strong>
                  </div>
                  <div>
                    <small>Pipeline Value</small>
                    <strong>$2.48M</strong>
                  </div>
                </div>
              </div>

              <div className="cx-panel">
                <div className="panel-head">
                  <h4>AI Insights</h4>
                  <a>View all ›</a>
                </div>

                <div className="insight">
                  <CheckCircle size={13} />
                  <p>3 high-intent leads identified via AI score and behavior</p>
                </div>
                <div className="insight orange">
                  <Activity size={13} />
                  <p>Follow-up opportunities ready to close</p>
                </div>
                <div className="insight red">
                  <Percent size={13} />
                  <p>Best time to contact prospects</p>
                </div>
                <div className="insight">
                  <CircleDollarSign size={13} />
                  <p>Revenue opportunity: $117K in potential deals</p>
                </div>
              </div>

              <div className="cx-panel whatsapp-panel">
                <div className="panel-head">
                  <h4>AI Messaging &amp; WhatsApp</h4>
                  <span className="active-badge">Active</span>
                </div>

                <div className="chat-person">
                  <div className="face face-chat" />
                  <div>
                    <strong>Maria Lopez Luxury Bound</strong>
                    <small>AI Typing...</small>
                  </div>
                </div>

                <div className="bubble left">
                  Hi Maria! The new property we reviewed the other day is available...
                  <small>9:30 AM</small>
                </div>

                <div className="bubble right">
                  Hi Maria! I found 3 new listings that match your criteria and budget.
                  Want to schedule a quick tour?
                  <small>9:30 AM</small>
                </div>

                <div className="typing">AI is typing...</div>

                <div className="chat-input">
                  <span>Type a message or use AI Assist...</span>
                  <Send size={14} />
                </div>
              </div>

              <div className="cx-panel forecast">
                <div className="panel-head">
                  <h4>Forecast &amp; Performance</h4>
                  <a>View full goals ›</a>
                </div>

                <div className="mini-kpis">
                  <div>
                    <small>Forecasted Revenue</small>
                    <strong>$2.51M</strong>
                    <p>↑ 19% vs last month</p>
                  </div>
                  <div>
                    <small>Win Rate</small>
                    <strong>24%</strong>
                    <p>↑ 6% vs last month</p>
                  </div>
                  <div>
                    <small>Pipeline Velocity</small>
                    <strong>1.42x</strong>
                    <p>↑ 14% vs last month</p>
                  </div>
                </div>

                <div className="bar-chart">
                  {[55, 82, 38, 76, 42, 62, 33, 71].map((height, index) => (
                    <span key={index} style={{ height: `${height}%` }} />
                  ))}
                  <svg viewBox="0 0 520 120" preserveAspectRatio="none">
                    <path
                      d="M0 80 C60 70, 90 25, 150 52 C220 83, 260 61, 315 68 C380 77, 430 42, 520 18"
                      fill="none"
                      stroke="#2563ff"
                      strokeWidth="4"
                    />
                  </svg>
                </div>
              </div>

              <div className="cx-panel active-pipeline">
                <div className="panel-head">
                  <h4>Active Pipeline</h4>
                  <a>View full pipeline ›</a>
                </div>

                {pipeline.map(([name, amount, stage, temp]) => (
                  <div className="deal-row" key={name}>
                    <div className="face small" />
                    <div>
                      <strong>{name}</strong>
                      <small>Miami</small>
                    </div>
                    <b>{amount}</b>
                    <span>{stage}</span>
                    <em className={temp.toLowerCase()}>{temp}</em>
                  </div>
                ))}

                <div className="pipeline-total">
                  <span>Total Pipeline Value</span>
                  <strong>$2.48M</strong>
                </div>
              </div>

              <div className="cx-panel leadgen">
                <div className="panel-head">
                  <h4>Lead Generator</h4>
                  <a>View all ›</a>
                </div>

                <div className="donut">
                  <div>
                    <strong>32</strong>
                    <span>New Leads Today</span>
                  </div>
                </div>

                <div className="donut-legend">
                  <p>
                    <i className="hot" /> Hot 70-100 <b>15</b>
                  </p>
                  <p>
                    <i className="warm" /> Warm 40-70 <b>10</b>
                  </p>
                  <p>
                    <i className="cold" /> Cold 0-40 <b>7</b>
                  </p>
                </div>

                <button>
                  <Zap size={14} />
                  Generate More Leads
                </button>
              </div>
            </section>
          </main>
        </div>
      </div>

      <div className="cx-bottom-strip">
        <div>
          <Users size={20} />
          <span>One AI Platform.<br />Everything Connected.</span>
        </div>
        <div>
          <Bot size={20} />
          <span>AI Auto Follow-Ups<br />24/7</span>
        </div>
        <div>
          <ShieldCheck size={20} />
          <span>Smart Nurturing<br />That Converts</span>
        </div>
        <div>
          <BarChart3 size={20} />
          <span>Pipeline Intelligence<br />That Closes</span>
        </div>
        <div>
          <MessageCircle size={20} />
          <span>WhatsApp Integration<br />Built-In</span>
        </div>
        <div>
          <ShieldCheck size={20} />
          <span>Secure. Reliable. Built<br />for Real Estate.</span>
        </div>
      </div>

      <style>{`
        html,
        body {
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
        }

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        img,
        video,
        svg {
          max-width: 100%;
        }

        .cx-hero-canvas {
          position: relative;
          isolation: isolate;
          width: 100%;
          max-width: 100vw;
          min-height: 100svh;
          overflow: hidden;
          color: #071126;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background:
            radial-gradient(circle at 92% 10%, rgba(82, 60, 255, 0.28), transparent 31%),
            radial-gradient(circle at 76% 74%, rgba(37, 99, 255, 0.14), transparent 36%),
            linear-gradient(135deg, #ffffff 0%, #f8fbff 38%, #eef4ff 70%, #ffffff 100%);
          display: grid;
          grid-template-columns: minmax(300px, 0.78fr) minmax(0, 1.22fr);
          align-items: center;
          gap: clamp(26px, 4vw, 64px);
          padding: clamp(54px, 7vw, 92px) clamp(18px, 5vw, 80px) clamp(28px, 4vw, 54px);
        }

        .cx-hero-canvas::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background:
            linear-gradient(90deg, rgba(255,255,255,.98) 0%, rgba(255,255,255,.9) 31%, rgba(255,255,255,.42) 50%, transparent 80%),
            radial-gradient(circle at 7% 41%, rgba(255,255,255,.97), transparent 34%);
        }

        .cx-hero-canvas::after {
          content: "";
          position: absolute;
          right: -8vw;
          top: -30px;
          width: min(520px, 42vw);
          height: 88%;
          z-index: -2;
          pointer-events: none;
          background:
            radial-gradient(circle at 65% 18%, rgba(90,70,255,.34), transparent 29%),
            linear-gradient(135deg, transparent 0%, rgba(76, 89, 255, .1) 42%, rgba(38, 82, 255, .32) 74%, rgba(82, 55, 255, .42) 100%);
        }

        .cx-left {
          position: relative;
          z-index: 5;
          width: 100%;
          max-width: 535px;
          min-width: 0;
        }

        .cx-eyebrow {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-bottom: 22px;
        }

        .cx-eyebrow span {
          color: #135fff;
          font-size: clamp(13px, 1.1vw, 18px);
          font-weight: 950;
        }

        .cx-eyebrow strong {
          color: #071126;
          font-size: clamp(13px, 1.1vw, 18px);
          font-weight: 950;
        }

        .cx-left h1 {
          margin: 0;
          font-size: clamp(42px, 4.2vw, 61px);
          line-height: 1.02;
          letter-spacing: clamp(-3.6px, -0.22vw, -1.5px);
          font-weight: 950;
        }

        .cx-left h1 span {
          background: linear-gradient(90deg, #0b63ff, #743cff);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .cx-copy {
          margin: 25px 0 24px;
          width: 100%;
          max-width: 520px;
          font-size: clamp(15px, 1.1vw, 18px);
          line-height: 1.5;
          color: #17233c;
          font-weight: 500;
        }

        .cx-cta-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 14px 24px;
          margin-bottom: 30px;
        }

        .cx-cta {
          min-height: 54px;
          border: 0;
          border-radius: 9px;
          padding: 0 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 13px;
          color: white;
          font-size: clamp(15px, 1.15vw, 19px);
          font-weight: 850;
          background: linear-gradient(100deg, #0b63ff, #7b42ff);
          box-shadow: 0 18px 34px rgba(70, 62, 255, 0.27);
          white-space: nowrap;
          cursor: pointer;
        }

        .cx-cta-row > span {
          font-size: 14px;
          font-weight: 800;
          color: #11192d;
        }

        .cx-checks {
          display: grid;
          gap: 14px;
        }

        .cx-check {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          color: #11192d;
          font-size: clamp(13px, 0.95vw, 15.5px);
          font-weight: 750;
          line-height: 1.35;
        }

        .cx-check svg {
          color: #5044ff;
          fill: #5044ff;
          stroke: white;
          flex: 0 0 auto;
          margin-top: 2px;
        }

        .cx-trust {
          margin-top: 34px;
          width: 100%;
          max-width: 470px;
          min-height: 84px;
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 15px 20px;
          background: rgba(255,255,255,0.86);
          border: 1px solid rgba(30,81,190,0.12);
          border-radius: 14px;
          box-shadow: 0 18px 45px rgba(49,91,176,0.13);
          backdrop-filter: blur(10px);
        }

        .cx-avatars {
          display: flex;
          min-width: 120px;
        }

        .cx-avatars i {
          width: 35px;
          height: 35px;
          border-radius: 50%;
          border: 3px solid white;
          margin-left: -10px;
          background: linear-gradient(135deg, #ffd5bc, #3e5c8d);
        }

        .cx-avatars i:first-child {
          margin-left: 0;
        }

        .cx-avatars i:nth-child(2) { background: linear-gradient(135deg, #f8c8a8, #111827); }
        .cx-avatars i:nth-child(3) { background: linear-gradient(135deg, #ffe6ab, #2d6cdf); }
        .cx-avatars i:nth-child(4) { background: linear-gradient(135deg, #f5b0a9, #101827); }
        .cx-avatars i:nth-child(5) { background: linear-gradient(135deg, #ffd3a2, #476cff); }

        .cx-stars {
          color: #ffb000;
          font-size: 17px;
          letter-spacing: 2px;
          margin-bottom: 2px;
        }

        .cx-trust p {
          margin: 0;
          font-size: 12px;
          line-height: 1.38;
          color: #17233c;
          font-weight: 750;
        }

        .cx-dashboard-wrap {
          position: relative;
          z-index: 4;
          width: 100%;
          max-width: 990px;
          min-width: 0;
          justify-self: end;
        }

        .cx-dashboard-wrap::before {
          content: "";
          position: absolute;
          inset: -14px;
          border: 2px solid rgba(73, 96, 255, 0.34);
          border-radius: 18px;
          clip-path: polygon(5% 0, 100% 0, 100% 100%, 4% 100%, 0 92%, 0 8%);
          pointer-events: none;
          box-shadow: 0 0 45px rgba(55,91,255,.12);
        }

        .cx-dashboard-wrap::after {
          content: "";
          position: absolute;
          inset: -28px;
          border: 1px solid rgba(91,96,255,.16);
          border-radius: 24px;
          clip-path: polygon(5% 0, 100% 0, 100% 100%, 4% 100%, 0 92%, 0 8%);
          pointer-events: none;
        }

        .cx-dashboard-frame {
          position: relative;
          display: grid;
          grid-template-columns: clamp(138px, 15vw, 176px) minmax(0, 1fr);
          width: 100%;
          border-radius: 16px;
          background: rgba(255,255,255,0.9);
          border: 1px solid rgba(51,104,255,0.2);
          box-shadow:
            0 35px 80px rgba(39,61,145,0.2),
            0 0 0 8px rgba(255,255,255,0.32) inset;
          overflow: hidden;
        }

        .cx-sidebar {
          min-width: 0;
          padding: 22px 13px 16px;
          background: linear-gradient(180deg, rgba(255,255,255,0.94), rgba(244,248,255,0.86));
          border-right: 1px solid rgba(28,90,210,0.12);
          border-radius: 16px 0 0 16px;
        }

        .cx-mini-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 17px 9px;
          font-size: clamp(9px, 0.8vw, 13px);
          font-weight: 950;
          letter-spacing: clamp(2px, 0.35vw, 5px);
        }

        .cx-mini-mark {
          width: 25px;
          height: 25px;
          border-radius: 8px;
          border: 2px solid #1aa7ff;
          position: relative;
          flex: 0 0 auto;
        }

        .cx-mini-mark::after {
          content: "";
          position: absolute;
          right: -8px;
          top: 7px;
          width: 14px;
          height: 2px;
          background: #5638ff;
          box-shadow: 0 7px 0 #5638ff;
        }

        .cx-side-item {
          min-height: 29px;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 10px;
          border-radius: 8px;
          color: #101b33;
          font-size: clamp(8px, 0.65vw, 10px);
          font-weight: 850;
          margin-bottom: 5px;
          min-width: 0;
        }

        .cx-side-item span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .cx-side-item svg { color: #183363; flex: 0 0 auto; }
        .cx-side-item b { margin-left: auto; color: #3f65c9; }

        .cx-side-item.active {
          color: white;
          background: linear-gradient(100deg, #0b63ff, #7641ff);
          box-shadow: 0 10px 22px rgba(72,72,255,0.22);
        }

        .cx-side-item.active svg {
          color: white;
        }

        .cx-ai-card {
          margin-top: 24px;
          padding: 12px;
          border-radius: 13px;
          background: linear-gradient(180deg, #eef5ff, #ffffff);
          border: 1px solid rgba(53,103,255,0.12);
          box-shadow: 0 16px 35px rgba(49,91,176,0.12);
        }

        .cx-ai-card strong {
          display: block;
          color: #145fff;
          font-size: 10px;
          margin-bottom: 8px;
        }

        .cx-ai-cube {
          height: 70px;
          display: grid;
          place-items: center;
          margin-bottom: 7px;
          border-radius: 12px;
          color: #175fff;
          background:
            radial-gradient(circle at center, rgba(37,99,255,.22), transparent 46%),
            linear-gradient(135deg, rgba(0,174,255,.1), rgba(118,65,255,.12));
        }

        .cx-ai-card p {
          margin: 0 0 6px;
          font-size: 10px;
          font-weight: 750;
        }

        .cx-ai-card small {
          display: block;
          color: #536079;
          font-size: 9px;
          margin-bottom: 10px;
        }

        .cx-ai-card button {
          width: 100%;
          min-height: 31px;
          border: 0;
          border-radius: 8px;
          color: white;
          font-size: 10px;
          font-weight: 850;
          background: linear-gradient(100deg, #0b63ff, #7542ff);
        }

        .cx-main {
          padding: clamp(14px, 1.4vw, 21px) clamp(12px, 1.4vw, 20px) 18px;
          min-width: 0;
          overflow: hidden;
        }

        .cx-topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 15px;
          min-width: 0;
        }

        .cx-topbar h2 {
          margin: 0 0 5px;
          font-size: clamp(14px, 1.2vw, 19px);
          line-height: 1;
          font-weight: 950;
          color: #09142a;
        }

        .cx-topbar p {
          margin: 0;
          color: #42506a;
          font-size: clamp(8px, 0.7vw, 10px);
          font-weight: 750;
        }

        .cx-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 8px;
          min-width: 0;
        }

        .cx-actions button {
          min-height: 30px;
          padding: 0 10px;
          border-radius: 8px;
          border: 1px solid rgba(44,88,204,.16);
          background: white;
          color: #1b2942;
          font-weight: 850;
          font-size: 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 8px 20px rgba(52,85,158,0.06);
          white-space: nowrap;
        }

        .cx-actions .export {
          color: white;
          border: 0;
          background: linear-gradient(100deg, #0b63ff, #7342ff);
        }

        .cx-kpis {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 9px;
          margin-bottom: 13px;
        }

        .cx-kpi {
          min-height: 60px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px;
          border-radius: 10px;
          background: white;
          border: 1px solid rgba(28,79,190,0.12);
          box-shadow: 0 12px 28px rgba(62,92,158,0.08);
          min-width: 0;
        }

        .cx-kpi-icon {
          width: 25px;
          height: 25px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: #145fff;
          background: #edf4ff;
          flex: 0 0 auto;
        }

        .cx-kpi small {
          display: block;
          color: #576278;
          font-size: 7.5px;
          font-weight: 850;
          margin-bottom: 3px;
        }

        .cx-kpi strong {
          display: block;
          font-size: 15px;
          font-weight: 950;
          color: #061129;
          line-height: 1;
        }

        .cx-kpi p {
          margin: 4px 0 0;
          color: #0ba65a;
          font-size: 7.5px;
          font-weight: 850;
        }

        .cx-command {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1.48fr) minmax(0, 1.05fr);
          gap: 13px;
          min-height: 88px;
          padding: 13px 15px;
          margin-bottom: 13px;
          color: white;
          background: linear-gradient(135deg, rgba(1,18,60,.96), rgba(3,23,82,.95));
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 24px 44px rgba(4,22,86,0.24);
          clip-path: polygon(2% 0, 100% 0, 98% 100%, 0 100%, 0 16%);
        }

        .cx-command::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 10% 35%, rgba(0,153,255,.26), transparent 18%);
          pointer-events: none;
        }

        .cx-command-left {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .cx-command-orb {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: radial-gradient(circle, rgba(0,155,255,.35), rgba(3,15,49,1));
          border: 1px solid rgba(89,162,255,.65);
          box-shadow: 0 0 35px rgba(0,132,255,.35);
          flex: 0 0 auto;
        }

        .cx-command small {
          font-size: 9px;
          color: #c8d6ff;
          font-weight: 850;
        }

        .cx-command h3 {
          margin: 3px 0;
          font-size: 14px;
          line-height: 1.15;
        }

        .cx-command p {
          margin: 0 0 5px;
          color: #dce6ff;
          font-size: 9px;
          font-weight: 650;
        }

        .cx-command span {
          font-size: 8.5px;
          color: #ffd36d;
          font-weight: 850;
        }

        .cx-command-stats {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 7px;
          min-width: 0;
        }

        .cx-command-stats > div {
          min-height: 48px;
          padding: 8px;
          border-radius: 8px;
          background: rgba(5,18,55,0.74);
          border: 1px solid rgba(80,120,255,0.18);
          min-width: 0;
        }

        .cx-command-stats strong {
          display: block;
          margin-top: 3px;
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .spark {
          display: block;
          margin-top: 5px;
          height: 11px;
          border-radius: 10px;
        }

        .spark.green {
          background: linear-gradient(135deg, transparent 40%, #25d366 41% 48%, transparent 49% 100%);
        }

        .spark.orange {
          background: linear-gradient(135deg, transparent 40%, #ff9900 41% 48%, transparent 49% 100%);
        }

        .cx-command-buttons {
          position: relative;
          z-index: 1;
          grid-column: 2;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 7px;
          min-width: 0;
        }

        .cx-command-buttons button {
          min-height: 27px;
          border: 0;
          border-radius: 8px;
          background: white;
          color: #12203a;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          font-weight: 850;
          font-size: 8.5px;
          min-width: 0;
        }

        .cx-command-buttons .whatsapp {
          color: white;
          background: linear-gradient(100deg, #18c76f, #20b468);
        }

        .cx-command-buttons .assign {
          color: white;
          background: linear-gradient(100deg, #3859ff, #7a42ff);
        }

        .cx-command-buttons .follow {
          color: white;
          background: linear-gradient(100deg, #0875ff, #364fff);
        }

        .cx-grid {
          display: grid;
          grid-template-columns: 1.1fr 1.35fr 1.05fr 1.1fr 1.38fr;
          grid-auto-rows: minmax(148px, auto);
          gap: 9px;
          min-width: 0;
        }

        .cx-panel {
          background: rgba(255,255,255,0.94);
          border: 1px solid rgba(28,79,190,0.12);
          border-radius: 12px;
          box-shadow: 0 14px 30px rgba(62,92,158,0.08);
          padding: 10px;
          min-width: 0;
          overflow: hidden;
        }

        .panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 8px;
          min-width: 0;
        }

        .panel-head h4 {
          margin: 0;
          font-size: 9px;
          color: #08142a;
          font-weight: 950;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .panel-head a {
          font-size: 8px;
          color: #145fff;
          font-weight: 850;
          text-decoration: none;
          white-space: nowrap;
        }

        .lead-row {
          display: grid;
          grid-template-columns: 26px minmax(0, 1fr) 24px;
          align-items: center;
          gap: 7px;
          margin-bottom: 7px;
          min-width: 0;
        }

        .face {
          width: 25px;
          height: 25px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ffd4bd, #16213e);
          flex: 0 0 auto;
        }

        .face-1 { background: linear-gradient(135deg, #daab85, #17223b); }
        .face-2 { background: linear-gradient(135deg, #f7cfaa, #253d78); }
        .face-3 { background: linear-gradient(135deg, #f3b2a7, #101a2e); }
        .face-4 { background: linear-gradient(135deg, #ffd1a7, #526cff); }

        .lead-row strong,
        .deal-row strong,
        .chat-person strong {
          display: block;
          font-size: 8px;
          color: #101a2f;
          font-weight: 900;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .lead-row small,
        .deal-row small,
        .chat-person small {
          display: block;
          font-size: 7px;
          color: #516078;
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .lead-row b {
          width: 23px;
          height: 23px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #09a85b;
          font-size: 8px;
          border: 2px solid #36d17c;
        }

        .tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 8px;
        }

        .tabs span {
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid rgba(36,91,200,.12);
          font-size: 7.5px;
          font-weight: 850;
          color: #536079;
        }

        .tabs .active {
          color: white;
          border-color: transparent;
          background: linear-gradient(100deg, #0b63ff, #7542ff);
        }

        .line-chart {
          position: relative;
          height: 105px;
          border-radius: 10px;
          overflow: hidden;
          background:
            linear-gradient(to right, rgba(51,91,190,.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(51,91,190,.08) 1px, transparent 1px);
          background-size: 30px 22px;
        }

        .line-chart svg {
          width: 100%;
          height: 100%;
        }

        .chart-callout {
          position: absolute;
          right: 14px;
          top: 45px;
          padding: 6px 8px;
          border-radius: 9px;
          background: white;
          box-shadow: 0 10px 22px rgba(41,86,160,.16);
        }

        .chart-callout strong {
          display: block;
          font-size: 12px;
          font-weight: 950;
        }

        .chart-callout span,
        .chart-callout small {
          display: block;
          color: #05a456;
          font-size: 7.5px;
          font-weight: 850;
        }

        .funnel {
          height: 95px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          margin-top: 2px;
        }

        .funnel span {
          height: 15px;
          max-width: 100%;
          border-radius: 3px;
          background: linear-gradient(90deg, #145fff, #7442ff);
          clip-path: polygon(0 0, 100% 0, 88% 100%, 12% 100%);
        }

        .funnel span:nth-child(1) { width: 96px; }
        .funnel span:nth-child(2) { width: 83px; opacity: .86; }
        .funnel span:nth-child(3) { width: 68px; opacity: .76; }
        .funnel span:nth-child(4) {
          width: 50px;
          background: linear-gradient(90deg, #0ea5ff, #10b981);
        }
        .funnel span:nth-child(5) {
          width: 34px;
          background: #19b96e;
        }

        .funnel-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 7px;
        }

        .funnel-stats small,
        .mini-kpis small {
          display: block;
          color: #536079;
          font-size: 7px;
          font-weight: 800;
        }

        .funnel-stats strong {
          font-size: 12px;
          font-weight: 950;
        }

        .insight {
          display: flex;
          gap: 6px;
          margin-bottom: 8px;
          color: #0ba65a;
        }

        .insight.orange { color: #ff8a00; }
        .insight.red { color: #ff4646; }

        .insight p {
          margin: 0;
          color: #27324a;
          font-size: 7.2px;
          line-height: 1.32;
          font-weight: 750;
        }

        .whatsapp-panel {
          grid-column: span 1;
          grid-row: span 2;
          min-height: 350px;
        }

        .active-badge {
          padding: 3px 6px;
          border-radius: 999px;
          background: #eafff2;
          color: #10a45a;
          font-size: 7px;
          font-weight: 900;
        }

        .chat-person {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 9px;
          min-width: 0;
        }

        .bubble {
          max-width: 92%;
          padding: 9px;
          border-radius: 12px;
          background: #f2f6ff;
          color: #27324a;
          font-size: 7.2px;
          line-height: 1.4;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .bubble.right {
          margin-left: auto;
          background: #eef2ff;
        }

        .bubble small {
          display: block;
          text-align: right;
          margin-top: 4px;
          color: #7c879b;
          font-size: 6.5px;
        }

        .typing {
          color: #145fff;
          font-size: 8px;
          font-weight: 850;
          margin: 10px 0 8px;
        }

        .chat-input {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 28px;
          border-radius: 999px;
          background: #f6f8fd;
          padding: 0 6px 0 10px;
          color: #8a94a8;
          font-size: 7px;
          font-weight: 750;
          min-width: 0;
        }

        .chat-input span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .chat-input svg {
          width: 21px;
          height: 21px;
          padding: 5px;
          border-radius: 50%;
          color: white;
          background: linear-gradient(100deg, #0b63ff, #7442ff);
          flex: 0 0 auto;
        }

        .forecast,
        .active-pipeline {
          grid-column: span 2;
          min-height: 180px;
        }

        .mini-kpis {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-bottom: 9px;
        }

        .mini-kpis strong {
          display: block;
          margin-top: 3px;
          font-size: 14px;
          font-weight: 950;
        }

        .mini-kpis p {
          margin: 3px 0 0;
          color: #08a85a;
          font-size: 7px;
          font-weight: 800;
        }

        .bar-chart {
          position: relative;
          display: flex;
          align-items: flex-end;
          gap: clamp(6px, 1vw, 13px);
          height: 74px;
          padding: 0 8px;
          border-radius: 10px;
          background:
            linear-gradient(to right, rgba(51,91,190,.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(51,91,190,.08) 1px, transparent 1px);
          background-size: 39px 20px;
        }

        .bar-chart span {
          width: 11px;
          border-radius: 6px 6px 0 0;
          background: linear-gradient(180deg, #1f68ff, #9ec2ff);
        }

        .bar-chart svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .deal-row {
          display: grid;
          grid-template-columns: 23px minmax(0, 1fr) 44px 50px 34px;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
          min-width: 0;
        }

        .face.small {
          width: 21px;
          height: 21px;
        }

        .deal-row b {
          color: #101a2f;
          font-size: 8px;
          white-space: nowrap;
        }

        .deal-row span {
          padding: 3px 5px;
          border-radius: 999px;
          background: #edf3ff;
          color: #145fff;
          font-size: 6.5px;
          font-weight: 900;
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .deal-row em {
          padding: 3px 5px;
          border-radius: 999px;
          font-size: 6.5px;
          font-style: normal;
          font-weight: 900;
          text-align: center;
          white-space: nowrap;
        }

        .deal-row em.hot {
          color: #ff3b3b;
          background: #fff0f0;
        }

        .deal-row em.warm {
          color: #ff8a00;
          background: #fff6e8;
        }

        .pipeline-total {
          margin-top: 10px;
          padding-top: 10px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          border-top: 1px solid rgba(35,79,190,.1);
        }

        .pipeline-total span {
          color: #526078;
          font-size: 9px;
          font-weight: 800;
        }

        .pipeline-total strong {
          font-size: 15px;
          font-weight: 950;
        }

        .leadgen {
          grid-column: span 1;
          min-height: 180px;
        }

        .donut {
          width: 86px;
          height: 86px;
          border-radius: 50%;
          margin: 6px auto 8px;
          display: grid;
          place-items: center;
          background:
            radial-gradient(circle, #fff 0 50%, transparent 51%),
            conic-gradient(#15b86a 0 42%, #ff8a00 42% 72%, #fb3b3b 72% 100%);
        }

        .donut div {
          text-align: center;
        }

        .donut strong {
          display: block;
          font-size: 16px;
          font-weight: 950;
        }

        .donut span {
          display: block;
          width: 44px;
          color: #536079;
          font-size: 6.5px;
          font-weight: 800;
        }

        .donut-legend p {
          display: flex;
          align-items: center;
          gap: 5px;
          margin: 4px 0;
          color: #48566f;
          font-size: 7px;
          font-weight: 800;
        }

        .donut-legend b {
          margin-left: auto;
          color: #111a2f;
        }

        .donut-legend i {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          display: inline-block;
        }

        .donut-legend .hot { background: #15b86a; }
        .donut-legend .warm { background: #ff8a00; }
        .donut-legend .cold { background: #fb3b3b; }

        .leadgen button {
          width: 100%;
          min-height: 31px;
          border: 0;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: white;
          font-size: 9px;
          font-weight: 900;
          background: linear-gradient(100deg, #144fff, #7b42ff);
          box-shadow: 0 13px 25px rgba(75,65,255,.23);
        }

        .cx-bottom-strip {
          position: relative;
          z-index: 6;
          grid-column: 1 / -1;
          width: min(100%, 1185px);
          margin: clamp(18px, 2.5vw, 38px) auto 0;
          min-height: 64px;
          display: grid;
          grid-template-columns: 1.35fr repeat(4, 1fr) 1.2fr;
          background: rgba(255,255,255,.84);
          border: 1px solid rgba(41,89,196,.12);
          border-radius: 15px;
          box-shadow: 0 18px 42px rgba(49,91,176,.12);
          backdrop-filter: blur(12px);
          overflow: hidden;
        }

        .cx-bottom-strip div {
          min-height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 7px 12px;
          border-right: 1px solid rgba(42,75,145,.1);
          min-width: 0;
        }

        .cx-bottom-strip div:last-child {
          border-right: 0;
        }

        .cx-bottom-strip svg {
          color: #3b48ff;
          flex: 0 0 auto;
        }

        .cx-bottom-strip span {
          color: #111c32;
          font-size: 10px;
          line-height: 1.22;
          font-weight: 900;
        }

        @media (max-width: 1320px) {
          .cx-hero-canvas {
            grid-template-columns: minmax(280px, 0.72fr) minmax(0, 1.28fr);
            padding-left: 34px;
            padding-right: 34px;
            gap: 28px;
          }

          .cx-kpis {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .cx-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .forecast,
          .active-pipeline {
            grid-column: span 2;
          }

          .whatsapp-panel {
            grid-row: span 2;
          }
        }

        @media (max-width: 1100px) {
          .cx-hero-canvas {
            grid-template-columns: 1fr;
            align-items: start;
            padding-top: 54px;
          }

          .cx-left {
            max-width: 760px;
            margin: 0 auto;
            text-align: center;
          }

          .cx-copy {
            margin-left: auto;
            margin-right: auto;
          }

          .cx-cta-row,
          .cx-check,
          .cx-trust {
            justify-content: center;
          }

          .cx-checks {
            max-width: 620px;
            margin: 0 auto;
            text-align: left;
          }

          .cx-trust {
            margin-left: auto;
            margin-right: auto;
            text-align: left;
          }

          .cx-dashboard-wrap {
            justify-self: center;
            max-width: 960px;
          }
        }

        @media (max-width: 860px) {
          .cx-hero-canvas {
            padding: 46px 16px 28px;
          }

          .cx-dashboard-frame {
            grid-template-columns: 1fr;
          }

          .cx-sidebar {
            display: none;
          }

          .cx-topbar {
            flex-direction: column;
          }

          .cx-actions {
            justify-content: flex-start;
          }

          .cx-kpis {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .cx-command {
            grid-template-columns: 1fr;
            clip-path: none;
            border-radius: 14px;
          }

          .cx-command-buttons {
            grid-column: 1;
          }

          .cx-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .forecast,
          .active-pipeline,
          .whatsapp-panel {
            grid-column: span 2;
            grid-row: auto;
          }

          .cx-bottom-strip {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .cx-bottom-strip div {
            border-bottom: 1px solid rgba(42,75,145,.1);
          }
        }

        @media (max-width: 560px) {
          .cx-left {
            text-align: left;
          }

          .cx-cta {
            width: 100%;
          }

          .cx-cta-row > span {
            width: 100%;
            text-align: center;
          }

          .cx-trust {
            flex-direction: column;
            align-items: flex-start;
          }

          .cx-dashboard-wrap::before,
          .cx-dashboard-wrap::after {
            display: none;
          }

          .cx-main {
            padding: 14px 10px;
          }

          .cx-actions button {
            width: 100%;
            justify-content: center;
          }

          .cx-kpis,
          .cx-command-stats,
          .cx-command-buttons,
          .cx-grid,
          .mini-kpis,
          .funnel-stats,
          .cx-bottom-strip {
            grid-template-columns: 1fr;
          }

          .forecast,
          .active-pipeline,
          .whatsapp-panel,
          .leadgen {
            grid-column: span 1;
          }

          .deal-row {
            grid-template-columns: 23px minmax(0, 1fr) 44px;
          }

          .deal-row span,
          .deal-row em {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
