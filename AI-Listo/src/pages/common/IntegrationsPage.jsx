import React from "react";
import {
  ArrowRight,
  CheckCircle,
  Link2,
  CloudUpload,
  FileSpreadsheet,
  Zap,
  Code2,
  MessageCircle,
  Globe,
  Calendar,
  Mail,
  Users,
  Home,
  Database,
  BarChart3,
  ShieldCheck,
  Plug,
  Workflow,
  BookOpen,
  Headphones,
  PlayCircle,
  Brain,
  MessageSquare,
} from "lucide-react";
import headlogoImg from "../../assets/cortexa/headlogo.png";

import styles from "./IntegrationsPage.module.css";

export default function IntegrationsPage() {
  const quickCards = [
    {
      id: "connect-apps",
      number: "1",
      title: "Connect Your Apps",
      text: "Connect WhatsApp, forms, ads, email, calendars, listings, and more.",
      icon: Link2,
      color: "#5B5CF6",
      bg: "#F1F0FF",
    },
    {
      id: "import-crm",
      number: "2",
      title: "Import Your CRM",
      text: "Move your existing leads, contacts, deals, and notes into CORTEXA.",
      icon: CloudUpload,
      color: "#2563EB",
      bg: "#EEF4FF",
    },
    {
      id: "import-csv",
      number: "3",
      title: "Import CSV / Excel",
      text: "Upload spreadsheets and import leads or contacts in minutes.",
      icon: FileSpreadsheet,
      color: "#059669",
      bg: "#EAFBF2",
    },
    {
      id: "zapier-automations",
      number: "4",
      title: "Zapier & Automations",
      text: "Build automated workflows, lead routing, and follow-up actions.",
      icon: Zap,
      color: "#F97316",
      bg: "#FFF3EA",
    },
    {
      id: "api-webhooks",
      number: "5",
      title: "API & Webhooks",
      text: "Use API and webhooks for custom integrations and advanced workflows.",
      icon: Code2,
      color: "#6D5BFF",
      bg: "#F0ECFF",
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a href="/" className={styles.logoWrap}>
          <img src={headlogoImg} className="cx-logo-img" alt="logo" />
        </a>

        <nav className={styles.nav}>
          <a href="/#features" className={styles.navLink}>
            Features
          </a>
          <a href="/#ai-assistant" className={styles.navLink}>
            AI Assistant
          </a>
          <a href="/#automations" className={styles.navLink}>
            Automations
          </a>
          <a
            href="/integrations"
            className={`${styles.navLink} ${styles.activeNav}`}
          >
            Integrations
          </a>
          <a href="/#analytics" className={styles.navLink}>
            Analytics
          </a>
          <a href="/pricing" className={styles.navLink}>
            Pricing
          </a>
        </nav>

        <div className={styles.headerActions}>
          <a href="/login" className={styles.loginBtn}>
            Log In
          </a>
          <a href="/trial" className={styles.primaryBtn}>
            Start Free Trial
          </a>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.breadcrumb}>
            <a href="/" className={styles.breadcrumbLink}>
              Home
            </a>
            <span>›</span>
            <span>Connect</span>
            <span>›</span>
            <strong>Integrations</strong>
          </div>

          <div className={styles.heroGrid}>
            <div>
              <h1 className={styles.heroTitle}>
                Connect Everything <br />
                <span className={styles.gradientText}>to CORTEXA</span>
              </h1>

              <p className={styles.heroText}>
                Connect your lead sources, import data, automate workflows, and
                sync your business tools into one clean CRM workflow.
              </p>

              <div className={styles.heroButtons}>
                <a href="/trial" className={styles.bigPrimaryBtn}>
                  Start Free Trial <ArrowRight size={18} />
                </a>
                <a href="/setup-guide" className={styles.outlineHeroBtn}>
                  <PlayCircle size={18} /> View Setup Guide
                </a>
              </div>
            </div>

            <div className={styles.integrationVisual}>
              <FloatingApp
                label="WhatsApp"
                icon={<MessageCircle size={20} />}
                style={{ top: 10, left: 110 }}
              />
              <FloatingApp
                label="Website Forms"
                icon={<Globe size={20} />}
                style={{ top: 10, left: 300 }}
              />
              <FloatingApp
                label="Listings"
                icon={<Home size={20} />}
                style={{ top: 10, right: 38 }}
              />
              <FloatingApp
                label="Ads"
                icon={<BarChart3 size={20} />}
                style={{ top: 135, left: 18 }}
              />
              <FloatingApp
                label="Email"
                icon={<Mail size={20} />}
                style={{ top: 128, right: 6 }}
              />
              <FloatingApp
                label="Calendar"
                icon={<Calendar size={20} />}
                style={{ top: 235, left: 10 }}
              />
              <FloatingApp
                label="Teams"
                icon={<Users size={20} />}
                style={{ top: 230, right: 18 }}
              />
              <FloatingApp
                label="CRM"
                icon={<Database size={20} />}
                style={{ bottom: 8, left: 120 }}
              />
              <FloatingApp
                label="CSV / Excel"
                icon={<FileSpreadsheet size={20} />}
                style={{ bottom: 8, left: 300 }}
              />
              <FloatingApp
                label="API / Webhooks"
                icon={<Code2 size={20} />}
                style={{ bottom: 8, right: 30 }}
              />

              <div className={styles.centerMockup}>
                <div className={styles.mockSidebar}>
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>

                <div className={styles.mockMain}>
                  <div className={styles.mockLogo}>CORTEXA</div>

                  <div className={styles.mockStats}>
                    <div className={styles.mockStat}>
                      <span>New Leads</span>
                      <strong>426</strong>
                      <small>+18% vs last week</small>
                    </div>
                    <div className={styles.mockStat}>
                      <span>Appointments</span>
                      <strong>1429</strong>
                      <small>+15% vs last week</small>
                    </div>
                  </div>

                  <div className={styles.mockPanels}>
                    <div className={styles.funnelBox}>
                      <div
                        className={styles.funnelLine}
                        style={{ width: "92%", background: "#2563EB" }}
                      />
                      <div
                        className={styles.funnelLine}
                        style={{ width: "75%", background: "#22C55E" }}
                      />
                      <div
                        className={styles.funnelLine}
                        style={{ width: "58%", background: "#F97316" }}
                      />
                      <div
                        className={styles.funnelLine}
                        style={{ width: "40%", background: "#EF4444" }}
                      />
                    </div>

                    <div className={styles.aiActivity}>
                      <MiniLine label="Follow-ups" value="142" />
                      <MiniLine label="Conversations" value="327" />
                      <MiniLine label="Appointments" value="18" />
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.dottedLineOne} />
              <div className={styles.dottedLineTwo} />
              <div className={styles.dottedLineThree} />
            </div>
          </div>
        </section>

        <section className={styles.quickSection}>
          <div className={styles.quickGrid}>
            {quickCards.map((card) => {
              const Icon = card.icon;
              return (
                <a
                  key={card.id}
                  href={`#${card.id}`}
                  className={styles.quickCard}
                >
                  <div className={styles.iconWrap}>
                    <div
                      className={styles.quickNumber}
                      style={{ background: card.color }}
                    >
                      {card.number}
                    </div>
                    <div
                      className={styles.quickIcon}
                      style={{ background: card.bg }}
                    >
                      <Icon size={26} color={card.color} />
                    </div>
                  </div>
                  <h3 className={styles.quickTitle}>{card.title}</h3>
                  <p className={styles.quickText}>{card.text}</p>
                  <div className={styles.quickArrow}>
                    <ArrowRight size={17} />
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        <section className={styles.detailWrap}>
          <IntegrationSection
            id="connect-apps"
            number="1"
            title="Connect Your Apps"
            bullets={[
              "WhatsApp, website forms, and live chat",
              "Ad leads from Meta, Google, and other sources",
              "Listings, email, calendar, and team tools",
            ]}
            description="Connect all your lead sources and business tools to CORTEXA. Capture leads from multiple channels and sync them into your CRM automatically."
            visual={<ConnectAppsVisual />}
          />

          <IntegrationSection
            id="import-crm"
            number="2"
            title="Import Your CRM"
            bullets={[
              "Migrate contacts, deals, notes, and activities",
              "Keep your data organized and deduplicated",
              "Move into CORTEXA without losing your current records",
            ]}
            description="Move your existing contacts, leads, and deals from another CRM into CORTEXA in a clean and organized way."
            visual={<ImportCrmVisual />}
          />

          <IntegrationSection
            id="import-csv"
            number="3"
            title="Import CSV / Excel"
            bullets={[
              "Supports CSV and Excel-style spreadsheets",
              "Map columns and preview data before importing",
              "Handle duplicates and basic data validation",
            ]}
            description="Have a spreadsheet of leads? Upload your CSV or Excel file and import your leads or contacts into CORTEXA in minutes."
            visual={<CsvVisual />}
          />

          <IntegrationSection
            id="zapier-automations"
            number="4"
            title="Zapier & Automations"
            bullets={[
              "Automate lead routing and assignment",
              "Send WhatsApp, SMS, or email follow-ups",
              "Update pipeline stages based on trigger events",
            ]}
            description="Connect CORTEXA with apps through Zapier or create automated workflows to save time and move leads faster."
            visual={<AutomationVisual />}
          />

          <IntegrationSection
            id="api-webhooks"
            number="5"
            title="API & Webhooks"
            bullets={[
              "REST API for custom CRM access",
              "Webhooks for real-time event updates",
              "Secure, scalable, and developer-friendly",
            ]}
            description="Build custom integrations with CORTEXA using API access and real-time webhooks for advanced workflows."
            visual={<ApiVisual />}
          />
        </section>

        <section className={styles.howItWorks}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <div className={styles.howGrid}>
            <HowCard
              number="1"
              icon={<Plug size={24} />}
              title="Connect Sources"
              text="Connect your apps, forms, ads, and tools."
            />
            <div className={styles.connectorArrow}>→</div>
            <HowCard
              number="2"
              icon={<Database size={24} />}
              title="Sync Data"
              text="Data is securely synced into CORTEXA CRM."
            />
            <div className={styles.connectorArrow}>→</div>
            <HowCard
              number="3"
              icon={<Workflow size={24} />}
              title="Automate Follow-Up"
              text="Build automations and engage leads instantly."
            />
          </div>
        </section>

        <section className={styles.helpCta}>
          <div className={styles.helpIcon}>
            <Headphones size={42} />
          </div>
          <div>
            <h2 className={styles.helpTitle}>
              Need help connecting your tools?
            </h2>
            <p className={styles.helpText}>
              Our team can help you set up integrations, migrate data, and
              automate your workflows.
            </p>
          </div>
          <div className={styles.helpButtons}>
            <a href="/book-demo" className={styles.bigPrimaryBtn}>
              <Calendar size={18} /> Book a Demo
            </a>
            <a href="/contact" className={styles.outlineBtn}>
              <MessageSquare size={18} /> Contact Support
            </a>
          </div>
        </section>
      </main>

      {/*}footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <div className={styles.logoWrapFooter}>
            <img src={headlogoImg} className="cx-logo-img" alt="logo" />
          </div>
          <p className={styles.footerText}>
            The AI-powered CRM that helps you capture leads, automate
            follow-ups, and close more deals faster.
          </p>
        </div>

        <FooterColumn
          title="Product"
          links={[
            ["Features", "/#features"],
            ["AI Assistant", "/#ai-assistant"],
            ["Automations", "/#automations"],
            ["Integrations", "/integrations"],
            ["Analytics", "/#analytics"],
          ]}
        />
        <FooterColumn
          title="Resources"
          links={[
            ["Setup Guide", "/setup-guide"],
            ["Help Center", "/help"],
            ["Community", "/contact"],
            ["API Docs", "/help/api"],
          ]}
        />
        <FooterColumn
          title="Company"
          links={[
            ["About Us", "/about"],
            ["Blog", "/"],
            ["Careers", "/"],
            ["Contact", "/contact"],
          ]}
        />
        <FooterColumn
          title="Legal"
          links={[
            ["Privacy Policy", "/privacy-policy"],
            ["Terms of Service", "/terms"],
            ["Refund Policy", "/refund-policy"],
          ]}
        />
        <div className={styles.footerBrand}>
          <h4 className={styles.footerNewsletterTitle}>Stay Connected</h4>
          <p className={styles.footerNewsletterText}>
            Get product updates and CRM insights straight to your inbox.
          </p>
          <form className={styles.newsletterForm} onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Your email address" 
              className={styles.newsletterInput} 
              required
            />
            <button type="submit" className={styles.newsletterBtn}>
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </footer>*/}
    </div>
  );
}

// Subcomponents nhận style qua CSS Modules
function FloatingApp({ label, icon, style }) {
  return (
    <div className={styles.floatingApp} style={style}>
      <div className={styles.floatingIcon}>{icon}</div>
      <strong>{label}</strong>
    </div>
  );
}

function MiniLine({ label, value }) {
  return (
    <div className={styles.miniLine}>
      <span>{label}</span>
      <strong>{value} ↑</strong>
    </div>
  );
}

function IntegrationSection({
  id,
  number,
  title,
  description,
  bullets,
  visual,
}) {
  return (
    <section id={id} className={styles.integrationSection}>
      <div className={styles.integrationText}>
        <div className={styles.sectionNumber}>{number}</div>
        <h2 className={styles.integrationTitle}>{title}</h2>
        <p className={styles.integrationDesc}>{description}</p>

        <div className={styles.bulletList}>
          {bullets.map((bullet) => (
            <div key={bullet} className={styles.bullet}>
              <CheckCircle size={17} />
              <span>{bullet}</span>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.integrationVisualBox}>{visual}</div>
    </section>
  );
}

function ConnectAppsVisual() {
  const apps = [
    ["WhatsApp", MessageCircle],
    ["Website Forms", Globe],
    ["Ads", BarChart3],
    ["Listings", Home],
    ["Email", Mail],
    ["Calendar", Calendar],
    ["Teams", Users],
  ];

  return (
    <div className={styles.appsVisual}>
      <div className={styles.appIconRow}>
        {apps.map(([label, Icon]) => (
          <div key={label} className={styles.appMiniCard}>
            <Icon size={22} color="#4F46E5" />
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className={styles.downArrow}>↓</div>
      <div className={styles.cortexaBox}>
        <div className={styles.brainIcon}><Brain size={38} /></div>
        <div>
          <strong>CORTEXA</strong>
          <br />
          <span>All leads. One CRM.</span>
        </div>
      </div>
    </div>
  );
}

function ImportCrmVisual() {
  return (
    <div className={styles.importCrmVisual}>
      <div className={styles.crmBox}>
        <span>Your Current CRM</span>
        <strong>HubSpot</strong>
        <strong>Salesforce</strong>
        <strong>Pipedrive</strong>
        <small>+ more</small>
      </div>
      <div className={styles.secureMigration}>
        <ShieldCheck size={22} />
        <span>Secure Migration</span>
        <div className={styles.horizontalArrow}>→</div>
      </div>
      <div className={styles.crmBox}>
        <span>CORTEXA</span>
        <CheckText text="Contacts" />
        <CheckText text="Leads" />
        <CheckText text="Deals" />
        <CheckText text="Activities" />
      </div>
    </div>
  );
}

function CsvVisual() {
  return (
    <div className={styles.csvVisual}>
      <div className={styles.uploadBox}>
        <CloudUpload size={34} color="#4F46E5" />
        <strong>Drag & drop your file here</strong>
        <small>or browse</small>
        <div className={styles.fileRow}>
          <FileSpreadsheet size={16} />
          <span>leads.csv</span>
          <strong>CSV</strong>
        </div>
        <div className={styles.fileRow}>
          <FileSpreadsheet size={16} />
          <span>contacts.xlsx</span>
          <strong>XLSX</strong>
        </div>
      </div>

      <div className={styles.previewTable}>
        <div className={styles.tableTitle}>Preview</div>
        {["Name", "Email", "Phone", "Source"].map((h) => (
          <div key={h} className={styles.tableHeader}>
            {h}
          </div>
        ))}
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className={styles.tableCell}>
            {index % 4 === 0
              ? "Maria"
              : index % 4 === 1
                ? "maria@email.com"
                : index % 4 === 2
                  ? "+593 987 000"
                  : "Website"}
          </div>
        ))}
      </div>
    </div>
  );
}

function AutomationVisual() {
  const flow = [
    ["Trigger", "New Lead Captured"],
    ["Route Lead", "By Source & Rules"],
    ["Assign Agent", "Best Available Agent"],
    ["Send WhatsApp", "Instant Welcome"],
    ["Update Pipeline", "Move to New Lead"],
  ];

  return (
    <div className={styles.automationVisual}>
      {flow.map(([title, text], index) => (
        <React.Fragment key={title}>
          <div className={styles.flowCard}>
            <Zap size={22} color="#F97316" />
            <strong>{title}</strong>
            <span>{text}</span>
          </div>
          {index < flow.length - 1 && <div className={styles.flowArrow}>→</div>}
        </React.Fragment>
      ))}
    </div>
  );
}

function ApiVisual() {
  return (
    <div className={styles.apiVisual}>
      <div className={styles.codePanel}>
        <div className={styles.codeTag}>POST</div>
        <code>https://api.cortexa.com/v1/leads</code>
        <pre>{`{
  "name": "John Doe",
  "email": "john@example.com",
  "source": "Website Form"
}`}</pre>
        <a href="/api-docs" className={styles.apiLink}>
          View API Documentation →
        </a>
      </div>

      <div className={styles.webhookPanel}>
        <strong>Webhook Events</strong>
        <div className={styles.webhookTags}>
          <span>lead.created</span>
          <span>lead.updated</span>
          <span>deal.won</span>
          <span>message.received</span>
        </div>
        <label>Your Webhook URL</label>
        <div className={styles.webhookInput}>
          https://yourdomain.com/webhook/cortexa
        </div>
        <div className={styles.enabledBadge}>Enabled</div>
      </div>
    </div>
  );
}

function CheckText({ text }) {
  return (
    <div className={styles.checkText}>
      <CheckCircle size={15} />
      <span>{text}</span>
    </div>
  );
}

function HowCard({ number, icon, title, text }) {
  return (
    <div className={styles.howCard}>
      <div className={styles.howNumber}>{number}</div>
      <div className={styles.howIcon}>{icon}</div>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div className={styles.footerColumn}>
      <h4>{title}</h4>
      {links.map(([label, href]) => (
        <a key={label} href={href}>
          {label}
        </a>
      ))}
    </div>
  );
}
