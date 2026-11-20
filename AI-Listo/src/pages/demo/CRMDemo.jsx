import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './crm-demo.css';

// This route deliberately imports no production CRM pages, auth providers, APIs or storage.
// Every record and action is in-memory and disappears on refresh.
const seedLeads = [
  { id: 1, name: 'Sofia Martinez', company: 'Northstar Studio', email: 'sofia@example.test', stage: 'New', value: 4200, source: 'Website' },
  { id: 2, name: 'James Wilson', company: 'Horizon Group', email: 'james@example.test', stage: 'Contacted', value: 7800, source: 'Referral' },
  { id: 3, name: 'Emily Chen', company: 'Bloom & Co', email: 'emily@example.test', stage: 'Qualified', value: 12400, source: 'Google Ads' },
  { id: 4, name: 'Daniel Rivera', company: 'Summit Realty', email: 'daniel@example.test', stage: 'Proposal', value: 6500, source: 'Website' },
  { id: 5, name: 'Olivia Brooks', company: 'Brightside Health', email: 'olivia@example.test', stage: 'Won', value: 9800, source: 'Organic' },
];
const seedMessages = [
  { id: 1, name: 'Sofia Martinez', channel: 'WhatsApp', messages: [{ from: 'contact', text: 'Hi! Can I schedule a product demo?' }, { from: 'ai', text: 'Absolutely! I can help you find a time. Would Tuesday or Thursday work better?' }] },
  { id: 2, name: 'James Wilson', channel: 'Email', messages: [{ from: 'contact', text: 'Could you send over the pricing options?' }, { from: 'ai', text: 'Of course. I can walk you through our plans and help you choose the best fit.' }] },
  { id: 3, name: 'Emily Chen', channel: 'Web chat', messages: [{ from: 'contact', text: 'Does Cortexa support automated follow-ups?' }, { from: 'ai', text: 'Yes! Follow-up sequences can be configured for different pipeline stages.' }] },
];
const seedAppointments = [
  { id: 1, title: 'Product demo — Sofia', day: 'Tuesday', time: '10:00 AM', type: 'Demo' },
  { id: 2, title: 'Discovery call — James', day: 'Wednesday', time: '2:30 PM', type: 'Call' },
  { id: 3, title: 'Proposal review — Daniel', day: 'Thursday', time: '11:00 AM', type: 'Meeting' },
];
const stages = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won'];
const navigation = [
  ['Overview', '▦'], ['Conversations', '◉'], ['Leads', '◎'], ['Clients', '♧'],
  ['Pipeline', '▤'], ['Appointments', '▦'], ['Analytics', '▥'], ['AI Assistant', '✧'], ['Settings', '⚙'],
];
const money = n => '$' + Number(n).toLocaleString('en-US');

export default function CRMDemo() {
  const [section, setSection] = useState('Overview');
  const [leads, setLeads] = useState(seedLeads);
  const [conversations, setConversations] = useState(seedMessages);
  const [appointments, setAppointments] = useState(seedAppointments);
  const [activeChat, setActiveChat] = useState(1);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [settings, setSettings] = useState({ followups: true, ai: true, notifications: true });
  const [newLead, setNewLead] = useState(false);
  const [newAppointment, setNewAppointment] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiReply, setAiReply] = useState('');
  const total = useMemo(() => leads.reduce((sum, lead) => sum + lead.value, 0), [leads]);
  const filtered = leads.filter(lead => [lead.name, lead.company, lead.stage, lead.email].some(x => x.toLowerCase().includes(query.toLowerCase())));
  const selectedChat = conversations.find(c => c.id === activeChat) || conversations[0];
  const notify = msg => setNotice(msg + ' · Demo only — no real action performed');
  const navigate = name => { setSection(name); setMobileMenu(false); setQuery(''); setNotice(''); };
  const moveLead = (id, stage) => { setLeads(prev => prev.map(l => l.id === id ? { ...l, stage } : l)); notify('Pipeline updated'); };
  const sendMessage = () => {
    if (!draft.trim()) return;
    setConversations(prev => prev.map(c => c.id === activeChat ? { ...c, messages: [...c.messages, { from: 'me', text: draft.trim() }, { from: 'ai', text: 'Thanks! This is a simulated conversation. A teammate will follow up shortly.' }] } : c));
    setDraft(''); notify('Simulated message added');
  };
  const addLead = e => { e.preventDefault(); const data = new FormData(e.currentTarget); setLeads(prev => [...prev, { id: Date.now(), name: String(data.get('name')), company: String(data.get('company')), email: 'demo@example.test', stage: 'New', value: 2500, source: 'Demo' }]); setNewLead(false); notify('Sample lead created'); };
  const addAppointment = e => { e.preventDefault(); const data = new FormData(e.currentTarget); setAppointments(prev => [...prev, { id: Date.now(), title: String(data.get('title')), day: String(data.get('day')), time: '10:00 AM', type: 'Demo' }]); setNewAppointment(false); notify('Sample appointment created'); };
  const askAI = e => { e.preventDefault(); if (!aiQuestion.trim()) return; setAiReply('Example AI response: I would qualify this lead, suggest a convenient meeting time, and schedule a follow-up. This response is predefined and no AI service was contacted.'); };
  return <div className="cx-demo">
    <aside className={'cx-demo-sidebar ' + (mobileMenu ? 'is-open' : '')}>
      <div className="cx-demo-brand"><span className="cx-demo-brandmark">◈</span> CORTEXA <small>AGENTIC CRM</small></div>
      <div className="cx-demo-workspace">✦ Business Suite <span>DEMO</span></div>
      <div className="cx-demo-nav-label">WORKSPACE</div>
      <nav aria-label="Demo navigation">{navigation.map(([name, icon]) => <button type="button" key={name} className={section === name ? 'active' : ''} onClick={() => navigate(name)}><span>{icon}</span>{name}</button>)}</nav>
      <div className="cx-demo-sidebar-bottom"><strong>Sample workspace</strong><p>Fictional records. Nothing is saved.</p><Link to="/">← Back to website</Link></div>
    </aside>
    <div className="cx-demo-main">
      <header className="cx-demo-topbar"><button className="cx-demo-hamburger" onClick={() => setMobileMenu(v => !v)} aria-label="Toggle navigation">☰</button><div><strong>{section}</strong><span> / Interactive CRM Preview</span></div><div className="cx-demo-top-actions"><span className="cx-demo-live">● Simulation mode</span><span className="cx-demo-avatar">DM</span></div></header>
      <main className="cx-demo-content">
        <div className="cx-demo-banner"><strong>Interactive product demo</strong><span> All records are fictional. Actions are simulated and reset when you refresh this page. No live CRM, messages, payments, integrations or AI requests.</span></div>
        {notice && <div className="cx-demo-notice" role="status">{notice} <button onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
        {section === 'Overview' && <><div className="cx-demo-heading"><div><h1>Welcome to your workspace</h1><p>Here’s what your sample business looks like today.</p></div><button className="cx-demo-primary" onClick={() => navigate('Leads')}>Explore leads →</button></div><div className="cx-demo-stats">{[['New Leads', leads.filter(l => l.stage === 'New').length, '+20%'], ['Pipeline Value', money(total), '+14%'], ['Appointments', appointments.length, '+10%'], ['Deals Won', leads.filter(l => l.stage === 'Won').length, '+12%']].map(([label, value, delta]) => <div className="cx-demo-stat" key={label}><span>{label}</span><strong>{value}</strong><small>{delta} vs last month</small></div>)}</div><div className="cx-demo-two"><section className="cx-demo-panel"><h2>Pipeline at a glance</h2>{stages.map(s => <div className="cx-demo-stage-row" key={s}><span>{s}</span><div><i style={{width: `${Math.max(8, leads.filter(l => l.stage === s).length / Math.max(leads.length, 1) * 100)}%`}} /></div><b>{leads.filter(l => l.stage === s).length}</b></div>)}<button className="cx-demo-textbutton" onClick={() => navigate('Pipeline')}>View pipeline →</button></section><section className="cx-demo-panel"><h2>Upcoming appointments</h2>{appointments.slice(0, 4).map(a => <div className="cx-demo-listrow" key={a.id}><span>▣</span><div><strong>{a.title}</strong><small>{a.day} · {a.time}</small></div></div>)}<button className="cx-demo-textbutton" onClick={() => navigate('Appointments')}>View calendar →</button></section></div></>}
        {(section === 'Leads' || section === 'Clients') && <><div className="cx-demo-heading"><div><h1>{section}</h1><p>Explore and manage fictional {section.toLowerCase()}.</p></div><button className="cx-demo-primary" onClick={() => setNewLead(true)}>+ Add sample lead</button></div><div className="cx-demo-panel"><input className="cx-demo-search" aria-label="Search records" placeholder="Search names, companies or stages..." value={query} onChange={e => setQuery(e.target.value)} /><div className="cx-demo-table-wrap"><table><thead><tr><th>Name</th><th>Company</th><th>Stage</th><th>Value</th><th>Action</th></tr></thead><tbody>{filtered.filter(l => section === 'Leads' || ['Qualified','Proposal','Won'].includes(l.stage)).map(l => <tr key={l.id}><td><strong>{l.name}</strong><small>{l.email}</small></td><td>{l.company}</td><td><span className="cx-demo-pill">{l.stage}</span></td><td>{money(l.value)}</td><td><button className="cx-demo-textbutton" onClick={() => { setActiveChat(conversations[0].id); navigate('Conversations'); }}>Open inbox →</button></td></tr>)}</tbody></table></div></div></>}
        {section === 'Pipeline' && <><div className="cx-demo-heading"><div><h1>Sales Pipeline</h1><p>Move sample deals between stages.</p></div><span className="cx-demo-total">Total value {money(total)}</span></div><div className="cx-demo-kanban">{stages.map(stage => <div className="cx-demo-column" key={stage}><h2>{stage} <span>{leads.filter(l => l.stage === stage).length}</span></h2>{leads.filter(l => l.stage === stage).map(l => <article key={l.id}><strong>{l.company}</strong><p>{l.name}</p><b>{money(l.value)}</b><select aria-label={'Move ' + l.company} value={l.stage} onChange={e => moveLead(l.id, e.target.value)}>{stages.map(s => <option key={s}>{s}</option>)}</select></article>)}</div>)}</div></>}
        {section === 'Conversations' && <><div className="cx-demo-heading"><div><h1>Conversations</h1><p>Explore the simulated unified inbox and example AI replies.</p></div><span className="cx-demo-pill">AI agent · Preview</span></div><div className="cx-demo-inbox"><div className="cx-demo-chat-list"><h2>Inbox <span>{conversations.length}</span></h2>{conversations.map(c => <button key={c.id} className={c.id === activeChat ? 'selected' : ''} onClick={() => setActiveChat(c.id)}><span className="cx-demo-chat-avatar">{c.name.split(' ').map(s => s[0]).join('')}</span><span><strong>{c.name}</strong><small>{c.channel} · {c.messages[c.messages.length - 1].text.slice(0, 43)}...</small></span></button>)}</div><div className="cx-demo-chat"><div className="cx-demo-chat-head"><span className="cx-demo-chat-avatar">{selectedChat.name.split(' ').map(s => s[0]).join('')}</span><div><strong>{selectedChat.name}</strong><small>{selectedChat.channel} · Fictional contact</small></div><button onClick={() => notify('Call simulated')}>☎ Call</button></div><div className="cx-demo-messages">{selectedChat.messages.map((m, i) => <div className={'cx-demo-bubble ' + m.from} key={i}><small>{m.from === 'ai' ? '✧ AI example' : m.from === 'me' ? 'You · simulated' : selectedChat.name}</small><p>{m.text}</p></div>)}</div><form className="cx-demo-compose" onSubmit={e => {e.preventDefault(); sendMessage();}}><input aria-label="Sample message" placeholder="Type a simulated reply..." value={draft} onChange={e => setDraft(e.target.value)} /><button className="cx-demo-primary" type="submit">Send →</button></form></div></div></>}
        {section === 'Appointments' && <><div className="cx-demo-heading"><div><h1>Appointments</h1><p>Sample meetings and scheduling.</p></div><button className="cx-demo-primary" onClick={() => setNewAppointment(true)}>+ New appointment</button></div><div className="cx-demo-panel">{appointments.map(a => <div className="cx-demo-appointment" key={a.id}><div className="cx-demo-calendar-icon">▣</div><div><strong>{a.title}</strong><small>{a.day} · {a.time} · {a.type}</small></div><span className="cx-demo-pill">Scheduled</span><button onClick={() => {setAppointments(prev => prev.filter(x => x.id !== a.id)); notify('Appointment removed');}}>Cancel</button></div>)}</div></>}
        {section === 'Analytics' && <><div className="cx-demo-heading"><div><h1>Analytics</h1><p>Illustrative performance metrics based on sample records.</p></div></div><div className="cx-demo-stats">{[['Pipeline', money(total)], ['Contacts', leads.length], ['Won deals', leads.filter(l => l.stage === 'Won').length], ['Meetings', appointments.length]].map(([k,v]) => <div className="cx-demo-stat" key={k}><span>{k}</span><strong>{v}</strong></div>)}</div><section className="cx-demo-panel"><h2>Deals by stage</h2><div className="cx-demo-bars">{stages.map(s => <div key={s}><div style={{height: `${Math.max(18, leads.filter(l => l.stage === s).length * 65)}px`}} /><span>{s}</span></div>)}</div></section></>}
        {section === 'AI Assistant' && <><div className="cx-demo-heading"><div><h1>AI Assistant</h1><p>Preview an example response without calling an AI model.</p></div></div><section className="cx-demo-panel cx-demo-ai"><div className="cx-demo-ai-icon">✧</div><h2>How can I help your business?</h2><p>Try a sample prompt such as “How should I follow up with a new lead?”</p><form onSubmit={askAI}><input value={aiQuestion} onChange={e => setAiQuestion(e.target.value)} placeholder="Ask a question..." aria-label="Sample AI prompt" /><button className="cx-demo-primary">Generate example</button></form>{aiReply && <div className="cx-demo-ai-answer">{aiReply}</div>}</section></>}
        {section === 'Settings' && <><div className="cx-demo-heading"><div><h1>Settings</h1><p>These switches only change the current demo screen.</p></div></div><section className="cx-demo-panel cx-demo-settings">{[['ai','AI assistant enabled'],['followups','Automated follow-ups'],['notifications','Notifications']].map(([key,label]) => <label key={key}><span>{label}</span><input type="checkbox" checked={settings[key]} onChange={e => {setSettings(s => ({...s,[key]:e.target.checked})); notify('Demo preference updated');}} /></label>)}</section></>}
      </main>
    </div>
    {(newLead || newAppointment) && <div className="cx-demo-modal-backdrop" role="presentation" onClick={() => {setNewLead(false);setNewAppointment(false);}}><form className="cx-demo-modal" onClick={e => e.stopPropagation()} onSubmit={newLead ? addLead : addAppointment}><h2>{newLead ? 'Add sample lead' : 'Add sample appointment'}</h2><label>{newLead ? 'Full name' : 'Meeting title'}<input name={newLead ? 'name' : 'title'} required autoFocus /></label><label>{newLead ? 'Company' : 'Day'}<input name={newLead ? 'company' : 'day'} required placeholder={newLead ? 'Example Company' : 'Friday'} /></label><div><button type="button" onClick={() => {setNewLead(false);setNewAppointment(false);}}>Cancel</button><button type="submit" className="cx-demo-primary">Create sample</button></div></form></div>}
  </div>;
}
