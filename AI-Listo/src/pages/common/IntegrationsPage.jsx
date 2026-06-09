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
  BarChart3,
  Plug,
  Database,
  Workflow,
  PlayCircle,
  Brain,
  Save,
} from "lucide-react";

import inteTopImg from "../../assets/cortexa/integrations_top.png";
import inteBottomImg from "../../assets/cortexa/integrations_bottom.png";

import styles from "./IntegrationsPage.module.css";

export default function IntegrationsPage() {

  const quickApps = [
    {
        id: "whatsapp",
        title: "WhatsApp",
        text: "Connect WhatsApp and capture leads",
        icon: <MessageCircle size={24} color="#22C55E" />, 
    },
    {
        id: "webforms",
        title: "Website Forms",
        text: "Import leads from webforms and sign-ups",
        icon: <Globe size={24} color="#2563EB" />,
    },
    {
        id: "ads",
        title: "Ads",
        text: "Sync ads, budgets, and ROI in real time",
        icon: <BarChart3 size={24} color="#2563EB" />,
    },
    {
        id: "livechat",
        title: "Live Chat",
        text: "Put chat conversations into your pipeline",
        icon: <Home size={24} color="#2563EB" />, 
    },
    {
        id: "email",
        title: "Email",
        text: "Communicate and nurture in one place",
        icon: <Mail size={24} color="#2563EB" />,
    },
    {
        id: "calendar",
        title: "Calendar",
        text: "Sync appointments and schedules",
        icon: <Calendar size={24} color="#2563EB" />,
    },
    {
        id: "teams",
        title: "Teams",
        text: "Collaborate with your team in real time",
        icon: <Users size={24} color="#2563EB" />,
    },
    ];

  return (
    <div className={styles.page}>
      <main>
        {/* SETUP GUIDE / HERO SECTION */}
        <section className={styles.hero}>
          <div className={styles.setupGuideBadge}>SETUP GUIDE</div>
          <h1 className={styles.heroTitle}>Connect. Ready.</h1>
          <p className={styles.heroText}>
            Connect your lead sources, import data, automate workflows, and sync your business tools into one clean CRM workflow.
          </p>

          <div className={styles.heroChartContainer}>
            <img src={inteTopImg} alt="Cortexa Integrations Dashboard Map" className={styles.cutOutImage} />
          </div>
        </section>
        <section className={styles.quickSection}>
          <div className={styles.quickGrid}>
            {quickApps.map((app) => (
              <div key={app.id} className={styles.quickCard}>
                <div className={styles.quickIconRow}>
                  {app.icon}
                </div>
                <h3 className={styles.quickTitle}>{app.title}</h3>
                <p className={styles.quickText}>{app.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.detailWrap}>
          
          {/* STEP 1 */}
          <div id="connect-apps" className={styles.integrationSection}>
            <div className={styles.integrationText}>
              <div className={styles.sectionNumber}>1</div>
              <div className={styles.integrationTextWrap}>
                <h2 className={styles.integrationTitle}>Connect Your Apps</h2>
                <p className={styles.integrationDesc}>
                    Connect all your lead sources, inboxes, and tools in CORTEXA. Capture leads automatically and sync them into your CRM in real time.
                </p>
                <div className={styles.bulletList}>
                    <div className={styles.bullet}><CheckCircle size={16} /> <span>WhatsApp, website forms, and live chat</span></div>
                    <div className={styles.bullet}><CheckCircle size={16} /> <span>Email, ads, teams, calendar, and other sources</span></div>
                    <div className={styles.bullet}><CheckCircle size={16} /> <span>Unify your pipeline and stop manual work</span></div>
                </div>
              </div>
            </div>
            <img src={inteBottomImg} alt="Connect your app" className={styles.cutOutImage} />
          </div>

          {/* STEP 2 */}
          <div id="import-crm" className={styles.integrationSection}>
            <div className={styles.integrationText}>
              <div className={styles.sectionNumber}>2</div>
              <div className={styles.integrationTextWrap}>
                <h2 className={styles.integrationTitle}>Import Your CRM</h2>
                <p className={styles.integrationDesc}>
                    Move your existing contacts, leads, and deals into CORTEXA to centralize your CRM.
                </p>
                <div className={styles.bulletList}>
                    <div className={styles.bullet}><CheckCircle size={16} /> <span>Migrate contacts, deals, and notes</span></div>
                    <div className={styles.bullet}><CheckCircle size={16} /> <span>Keep your data structure and history</span></div>
                    <div className={styles.bullet}><CheckCircle size={16} /> <span>Map fields easily with step-by-step import preview</span></div>
                </div>
              </div>
            </div>
            <div className={styles.integrationVisualBox}>
              <div className={styles.crmMigrationFlex}>
                <div className={styles.oldCrmBox}>
                  <span className={styles.boxLabel}>Your Current CRM</span>
                  <div className={styles.crmName}>HubSpot</div>
                  <div className={styles.crmName}>Salesforce</div>
                  <div className={styles.crmName}>Pipedrive</div>
                  <span className={styles.moreLabel}>+ more</span>
                </div>
                <div className={styles.migrationArrowCol}>
                  <div className={styles.secureBadge}>Secure Migration</div>
                  <div className={styles.arrowLine}>➔</div>
                </div>
                <div className={styles.newCrmBox}>
                  <span className={styles.boxLabel}>CORTEXA</span>
                  <div className={styles.cortexaField}><CheckCircle size={14} /> <span>Contacts</span></div>
                  <div className={styles.cortexaField}><CheckCircle size={14} /> <span>Leads</span></div>
                  <div className={styles.cortexaField}><CheckCircle size={14} /> <span>Deals</span></div>
                  <div className={styles.cortexaField}><CheckCircle size={14} /> <span>Activities</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3 */}
          <div id="import-csv" className={styles.integrationSection}>
            <div className={styles.integrationText}>
              <div className={styles.sectionNumber}>3</div>
              <div className={styles.integrationTextWrap}>
                <h2 className={styles.integrationTitle}>Import CSV / Excel</h2>
                <p className={styles.integrationDesc}>
                    Quickly import data from CSV or Excel to add contacts, leads, and more in just a few clicks.
                </p>
                <div className={styles.bulletList}>
                    <div className={styles.bullet}><CheckCircle size={16} /> <span>Drag & drop or upload your file</span></div>
                    <div className={styles.bullet}><CheckCircle size={16} /> <span>Map columns and preview your data</span></div>
                    <div className={styles.bullet}><CheckCircle size={16} /> <span>Clean, validate, and import securely</span></div>
                </div>
              </div>
            </div>
            <div className={styles.integrationVisualBox}>
              <div className={styles.csvImportLayout}>
                <div className={styles.dragDropZone}>
                  <CloudUpload size={32} color="#6366f1" />
                  <strong>Drag & drop your file here</strong>
                  <span>or browse</span>
                  <small>CSV, XLSX • Max 50MB</small>
                </div>
                
                <div className={styles.tablePreviewSide}>
                  <div className={styles.arrowLine}>➔</div>
                  <div className={styles.newCrmBox}>
                    <span className={styles.boxLabel}>CORTEXA</span>
                    <div className={styles.cortexaField}><CheckCircle size={14} /> <span>Contacts</span></div>
                    <div className={styles.cortexaField}><CheckCircle size={14} /> <span>Leads</span></div>
                    <div className={styles.cortexaField}><CheckCircle size={14} /> <span>Deals</span></div>
                    <div className={styles.cortexaField}><CheckCircle size={14} /> <span>Activities</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 4 */}
          <div id="zapier-automations" className={styles.integrationSection}>
            <div className={styles.integrationText}>
              <div className={styles.sectionNumber}>4</div>
              <div className={styles.integrationTextWrap}>
                <h2 className={styles.integrationTitle}>Zapier & Automations</h2>
                <p className={styles.integrationDesc}>
                    Connect CORTEXA with 5,000+ apps using Zapier and automate your workflows.
                </p>
                <div className={styles.bulletList}>
                    <div className={styles.bullet}><CheckCircle size={16} /> <span>Trigger on new leads, updates, appointments, and more</span></div>
                    <div className={styles.bullet}><CheckCircle size={16} /> <span>Run actions across your favorite apps</span></div>
                    <div className={styles.bullet}><CheckCircle size={16} /> <span>Save time and reduce manual work</span></div>
                </div>
              </div>
            </div>
            <div className={styles.integrationVisualBox}>
              <div className={styles.automationFlowRow}>
                {/* NODE 1: CORTEXA */}
                <div className={styles.flowNode}>
                    <div className={styles.nodeHeader}>
                    <div className={`${styles.nodeIconBrand} ${styles.brandCortexa}`}>
                        <Brain size={30} color="#2563EB" />
                    </div>
                    
                    </div>
                    <span className={styles.nodeTag}>New Lead in CORTEXA</span>
                    <small>Trigger</small>
                    <div className={styles.nodeBox}>
                    <Save size={14} /> New Lead in Pipeline
                    </div>
                    <span className={styles.timeLabel}>⚡ INSTANT</span>
                </div>

                <div className={styles.flowArrow}>➔</div>

                {/* NODE 2: SLACK */}
                <div className={styles.flowNode}>
                    <div className={styles.nodeHeader}>
                    <div className={`${styles.nodeIconBrand} ${styles.brandSlack}`}>
                        <MessageCircle size={30} color="#E01E5A" />
                    </div>
                    
                    </div>
                    <span className={styles.nodeTag}>Notify Team</span>
                    <small>Action</small>
                    <div className={styles.nodeBox}>
                        Send Message to #leads
                    </div>
                    <span className={styles.timeLabel}>⏱ 2 SEC</span>
                </div>

                <div className={styles.flowArrow}>➔</div>

                {/* NODE 3: GOOGLE SHEETS */}
                <div className={styles.flowNode}>
                    <div className={styles.nodeHeader}>
                    <div className={`${styles.nodeIconBrand} ${styles.brandSheets}`}>
                        <FileSpreadsheet size={30} color="#10B981" />
                    </div>
                    
                    </div>
                    <span className={styles.nodeTag}>Add to Sheet</span>
                    <small>Action</small>
                    <div className={styles.nodeBox}>
                    <FileSpreadsheet size={14} color="#10B981" /> Add Row to Sheet
                    </div>
                </div>

                <div className={styles.flowArrow}>➔</div>

                {/* NODE 4: GMAIL */}
                <div className={styles.flowNode}>
                    <div className={styles.nodeHeader}>
                    <div className={`${styles.nodeIconBrand} ${styles.brandGmail}`}>
                        <Mail size={30} color="#EF4444" />
                    </div>
                    
                    </div>
                    <span className={styles.nodeTag}>Send Email</span>
                    <small>Action</small>
                    <div className={styles.nodeBox}>
                      Email Follow-up to Lead
                    </div>
                </div>

                <div className={styles.flowArrow}>➔</div>

                {/* NODE 5: HUBSPOT / CRM */}
                <div className={styles.flowNode}>
                    <div className={styles.nodeHeader}>
                    <div className={`${styles.nodeIconBrand} ${styles.brandHubspot}`}>
                        <Zap size={30} color="#F97316" />
                    </div>
                    
                    </div>
                    <span className={styles.nodeTag}>Update CRM</span>
                    <small>Action</small>
                    <div className={styles.nodeBox}>
                      Create / Update Contact
                    </div>
                </div>
                </div>
            </div>
          </div>

          {/* STEP 5 */}
          <div id="api-webhooks" className={styles.integrationSection}>
            <div className={styles.integrationText}>
              <div className={styles.sectionNumber}>5</div>
              <div className={styles.integrationTextWrap}>
                <h2 className={styles.integrationTitle}>API & Webhooks</h2>
                <p className={styles.integrationDesc}>
                    Build powerful integrations with our API and webhooks or connect to thousands of tools.
                </p>
                <div className={styles.bulletList}>
                    <div className={styles.bullet}><CheckCircle size={16} /> <span>REST API for real-time CRM access</span></div>
                    <div className={styles.bullet}><CheckCircle size={16} /> <span>Webhooks for instant event updates</span></div>
                    <div className={styles.bullet}><CheckCircle size={16} /> <span>Secure, scalable, and developer-friendly</span></div>
                </div>
              </div>
            </div>
            <div className={styles.integrationVisualBox}>
              <div className={styles.apiGridBlock}>
                <div className={styles.codeSnippetCard}>
                  <span className={styles.apiLabel}>API Access</span>
                  <div className={styles.methodRoute}>
                    <span className={styles.postMethod}>POST</span>
                    <code>https://api.cortexa.com/v1/leads</code>
                  </div>
                  <pre className={styles.jsonBlock}>
{`{
  "name": "John Doe",
  "email": "john@example.com",
  "source": "website"
}`}
                  </pre>
                  <a href="#docs" className={styles.docLink}>View API Documentation</a>
                </div>
                
                <div className={styles.webhookCard}>
                  <span className={styles.apiLabel}>Webhook Events</span>
                  <div className={styles.eventBadgesFlex}>
                    <span className={styles.eventBadge}>lead.created</span>
                    <span className={styles.eventBadge}>lead.updated</span>
                    <span className={styles.eventBadge}>deal.won</span>
                    <span className={styles.eventBadge}>message.received</span>
                  </div>
                  <span className={styles.inputLabel}>Send Webhooks To</span>
                  <div className={styles.fakeInput}>https://yourdomain.com/webhooks/cortexa</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.howItWorksWrapper}>
          <h2 className={styles.howItWorksTitle}>How It Works</h2>
          <div className={styles.howItWorksRow}>
            <div className={styles.howStep}>
              <div className={styles.howBadge}>1</div>
              <div className={styles.howIconWrap}><Plug size={24} /></div>
              <div className={styles.howMeta}>
                <h4>Connect Sources</h4>
                <p>Connect your apps, forms, ads, and tools.</p>
              </div>
            </div>
            <div className={styles.howDividerArrow}>➔</div>
            <div className={styles.howStep}>
              <div className={styles.howBadge}>2</div>
              <div className={styles.howIconWrap}><Database size={24} /></div>
              <div className={styles.howMeta}>
                <h4>Import Data</h4>
                <p>Bring in your CRM, CSV, or spreadsheets.</p>
              </div>
            </div>
            <div className={styles.howDividerArrow}>➔</div>
            <div className={styles.howStep}>
              <div className={styles.howBadge}>3</div>
              <div className={styles.howIconWrap}><Workflow size={24} /></div>
              <div className={styles.howMeta}>
                <h4>Automate Workflows</h4>
                <p>Use Zapier or automations to save time.</p>
              </div>
            </div>
            <div className={styles.howDividerArrow}>➔</div>
            <div className={styles.howStep}>
              <div className={styles.howBadge}>4</div>
              <div className={styles.howIconWrap}><Zap size={24} /></div>
              <div className={styles.howMeta}>
                <h4>Sync Everything</h4>
                <p>All leads and data sync into CORTEXA CRM.</p>
              </div>
            </div>
            <div className={styles.howDividerArrow}>➔</div>
            <div className={styles.howStep}>
              <div className={styles.howBadge}>5</div>
              <div className={styles.howIconWrap}><BarChart3 size={24} /></div>
              <div className={styles.howMeta}>
                <h4>Grow Faster</h4>
                <p>Track, engage, and close more deals.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}