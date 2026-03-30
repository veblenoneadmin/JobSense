'use client';

import React, { useState, useCallback, useMemo } from 'react';

// ============================================
// JOBSENSE — Active Job Execution Hub
// ============================================

const T = {
  // VS Code Dark+ exact colors
  bg: '#1E1E1E',           // editor background
  sidebar: '#252526',      // sidebar / activity bar background
  card: '#252526',         // panel backgrounds
  cardHover: '#2A2D2E',   // list hover
  cardSolid: '#252526',
  border: '#3E3E42',       // panel borders
  borderLight: '#303031',  // subtle borders
  accent: '#007ACC',       // VS Code blue accent
  accentLight: '#1177BB',
  accentDark: '#0E639C',
  accentDim: 'rgba(0,122,204,0.15)',
  white: '#D4D4D4',        // editor foreground
  text: '#CCCCCC',         // menu/sidebar text
  textMuted: '#858585',    // line numbers, muted
  textDark: '#5A5A5A',     // very muted
  green: '#4EC9B0',        // teal green (VS Code token)
  greenDim: 'rgba(78,201,176,0.12)',
  red: '#F44747',          // VS Code red
  redDim: 'rgba(244,71,71,0.12)',
  amber: '#DCDCAA',        // VS Code yellow token
  amberDim: 'rgba(220,220,170,0.12)',
  blue: '#569CD6',         // VS Code blue token
  blueDim: 'rgba(86,156,214,0.12)',
  mauve: '#C586C0',        // VS Code pink/mauve token
  mauveDim: 'rgba(197,134,192,0.12)',
  purple: '#B267E6',       // purple
  purpleDim: 'rgba(178,103,230,0.12)',
  statusBar: '#007ACC',    // status bar blue
  tabActive: '#1E1E1E',   // active tab = editor bg
  tabInactive: '#2D2D30', // inactive tab
  selection: '#264F78',    // selection blue
  listActive: '#37373D',  // active list item
  listHover: '#2A2D2E',   // hover list item
  badge: '#007ACC',        // badge blue
  inputBg: '#3C3C3C',     // input background
  inputBorder: '#3C3C3C', // input border
  focus: '#007FD4',        // focus ring
};

interface TimeLog { person: string; hours: number; task: string; }
interface Expense { desc: string; amount: number; }
interface ActivityItem { date: string; src: string; text: string; }
interface Job {
  id: string; client: string; contact: string; phone: string; email: string;
  type: string; status: string; quoted: number; scheduledDate: string;
  location: string; shooter: string | null; editor: string | null;
  timeLogs: TimeLog[]; expenses: Expense[]; notes: string;
  created: string; invoice: string; callSummary: string | null;
  activity: ActivityItem[]; recurring?: boolean;
}
interface TeamMember { id: string; name: string; role: string; rate: number; color: string; }
interface ServiceItem { id: string; label: string; price: number; stdRate: number; cost: number; team: string; hours: string; note?: string; }
interface ServiceCategory { cat: string; items: ServiceItem[]; }
interface QuoteItem extends ServiceItem { qty: number; }

const STATUSES = [
  { key: 'booked', label: 'Booked', color: '#569CD6', bg: 'rgba(86,156,214,0.15)' },
  { key: 'scheduled', label: 'Scheduled', color: '#4EC9B0', bg: 'rgba(78,201,176,0.15)' },
  { key: 'on_site', label: 'On Site', color: '#DCDCAA', bg: 'rgba(220,220,170,0.15)' },
  { key: 'uploaded', label: 'Uploaded', color: '#C586C0', bg: 'rgba(197,134,192,0.15)' },
  { key: 'in_edit', label: 'In Edit', color: '#569CD6', bg: 'rgba(86,156,214,0.15)' },
  { key: 'qc_review', label: 'QC Review', color: '#CE9178', bg: 'rgba(206,145,120,0.15)' },
  { key: 'delivered', label: 'Delivered', color: '#4EC9B0', bg: 'rgba(78,201,176,0.15)' },
  { key: 'approved', label: 'Approved', color: '#6A9955', bg: 'rgba(106,153,85,0.15)' },
  { key: 'invoiced', label: 'Invoiced', color: '#C586C0', bg: 'rgba(197,134,192,0.15)' },
  { key: 'paid', label: 'Paid', color: '#B5CEA8', bg: 'rgba(181,206,168,0.15)' },
];
const getSt = (k: string) => STATUSES.find((s) => s.key === k) || { label: k, color: '#555', bg: 'rgba(85,85,85,0.1)' };

const TYPES = [
  { key: 'video', label: 'Video', price: 849 },
  { key: 'full_media', label: 'Full Media', price: 1650 },
  { key: 'photos_video', label: 'Photos+Video', price: 1484 },
  { key: 'website', label: 'Website', price: 2000 },
  { key: 'ghl_build', label: 'GHL Build', price: 650 },
  { key: 'ad_setup', label: 'Ad Setup', price: 600 },
  { key: 'ad_management', label: 'Ad Mgmt', price: 1300 },
  { key: 'youtube', label: 'YouTube', price: 2000 },
  { key: 'social_media', label: 'Social', price: 99 },
  { key: 'consulting', label: 'Consulting', price: 250 },
];
const getTy = (k: string) => TYPES.find((t) => t.key === k) || { label: k, price: 0 };

const TEAM: TeamMember[] = [
  { id: 'zac', name: 'Zac', role: 'Director', rate: 64.19, color: '#D4845A' },
  { id: 'jev', name: 'Jev', role: 'Shooter', rate: 34.42, color: '#5B9BD5' },
  { id: 'gen', name: 'Gen', role: 'Dev', rate: 7.97, color: '#6DAF8D' },
  { id: 'gab', name: 'Gab', role: 'GHL/CRM', rate: 7.75, color: '#8B7EC8' },
  { id: 'hanif', name: 'Hanif', role: 'Creative', rate: 8.52, color: '#E8A87C' },
  { id: 'wayan', name: 'Wayan', role: 'Editor', rate: 6.37, color: '#C27BA0' },
  { id: 'pran', name: 'Pran', role: 'Editor', rate: 4.2, color: '#5CB85C' },
  { id: 'ridho', name: 'Ridho', role: 'Editor', rate: 4.2, color: '#E05050' },
  { id: 'risna', name: 'Risna', role: 'Web Dev', rate: 5.22, color: '#E8A84C' },
  { id: 'mimi', name: 'Mimi', role: 'Social', rate: 4.75, color: '#5BCBD5' },
  { id: 'julian', name: 'Julian', role: 'Ext. Shooter', rate: 85, color: '#999' },
];
const getP = (id: string): TeamMember | undefined => TEAM.find((t) => t.id === id);

const $ = (n: number) => '$' + Math.abs(n).toLocaleString('en-AU', { maximumFractionDigits: 0 });
const $x = (n: number) => '$' + Math.abs(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function jCost(j: Job) {
  const lab = (j.timeLogs || []).reduce((s, l) => { const p = getP(l.person); return s + (p ? p.rate * l.hours : 0); }, 0);
  const exp = (j.expenses || []).reduce((s, e) => s + e.amount, 0);
  return { labour: lab, expenses: exp, total: lab + exp };
}
function jProfit(j: Job) {
  const c = jCost(j).total;
  const pre = j.quoted - c;
  const tax = pre > 0 ? pre * 0.25 : 0;
  return { rev: j.quoted, cost: c, net: pre - tax, margin: j.quoted > 0 ? ((pre - tax) / j.quoted) * 100 : 0 };
}
function mc(m: number) { return m >= 50 ? T.green : m >= 35 ? T.amber : T.red; }
function sla(t: string): number { return ({ video: 5, full_media: 7, photos_video: 5, website: 5, ghl_build: 10, ad_setup: 3, youtube: 10 } as Record<string, number>)[t] || 5; }
function dd(a: string, b: string) { return Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000); }

const INIT: Job[] = [
  { id: 'JOB-0001', client: 'Ray White Burleigh', contact: 'Sarah Mitchell', phone: '0412 345 678', email: 'sarah@rwburleigh.com.au', type: 'video', status: 'paid', quoted: 849, scheduledDate: '2026-03-10', location: '42 Hedges Ave, Mermaid Beach', shooter: 'jev', editor: 'wayan', timeLogs: [{ person: 'jev', hours: 5.5, task: 'Shoot' }, { person: 'jev', hours: 2, task: 'Notes' }, { person: 'wayan', hours: 7.5, task: 'Edit' }], expenses: [], notes: 'Waterfront. Client loved it.', created: '2026-03-08', invoice: 'paid', callSummary: 'Agent wants cinematic style. Budget confirmed $849. Wants it for Domain listing next week.', activity: [{ date: '2026-03-08', src: 'hubspot', text: 'Deal closed - job auto-created' }, { date: '2026-03-10', src: 'eversense', text: 'Jev logged 5.5h shoot' }, { date: '2026-03-12', src: 'eversense', text: 'Wayan started edit' }, { date: '2026-03-15', src: 'jobsense', text: 'Delivered to client' }, { date: '2026-03-15', src: 'xero', text: 'Invoice #1038 sent' }, { date: '2026-03-18', src: 'xero', text: 'Payment received' }] },
  { id: 'JOB-0002', client: 'Kollosche', contact: "James D'Arcy", phone: '0423 456 789', email: 'james@kollosche.com.au', type: 'full_media', status: 'delivered', quoted: 1650, scheduledDate: '2026-03-18', location: '1 Admiralty Dr, Paradise Waters', shooter: 'jev', editor: 'hanif', timeLogs: [{ person: 'jev', hours: 5.5, task: 'Shoot' }, { person: 'jev', hours: 2, task: 'Notes' }, { person: 'hanif', hours: 12, task: 'Edit' }, { person: 'hanif', hours: 4, task: 'VFX' }, { person: 'pran', hours: 3, task: 'Floor plan' }], expenses: [{ desc: 'Bruno Photos', amount: 330 }, { desc: 'Bruno Drone', amount: 150 }], notes: 'Luxury waterfront. Twilight shoot.', created: '2026-03-14', invoice: 'sent', callSummary: 'Premium listing $4.2M. Wants full package including twilight. Happy with $1,650. Mentioned 3 more listings coming.', activity: [{ date: '2026-03-14', src: 'hubspot', text: 'Deal closed' }, { date: '2026-03-18', src: 'eversense', text: 'Shoot completed' }, { date: '2026-03-20', src: 'eversense', text: 'Hanif started VFX edit' }, { date: '2026-03-24', src: 'jobsense', text: 'Delivered to client' }, { date: '2026-03-24', src: 'xero', text: 'Invoice #1041 sent - awaiting payment' }] },
  { id: 'JOB-0003', client: 'LJ Hooker Broadbeach', contact: 'Tim Nguyen', phone: '0434 567 890', email: 'tim@ljh.com.au', type: 'video', status: 'in_edit', quoted: 849, scheduledDate: '2026-03-24', location: 'Surfers Paradise', shooter: 'jev', editor: 'wayan', timeLogs: [{ person: 'jev', hours: 5.5, task: 'Shoot' }, { person: 'jev', hours: 1.5, task: 'Notes' }, { person: 'wayan', hours: 3, task: 'Edit (in progress)' }], expenses: [], notes: 'High-rise apartment. Good views.', created: '2026-03-20', invoice: 'none', callSummary: 'First time client. Saw our Instagram. Wants to try one video, if good will do all listings.', activity: [{ date: '2026-03-20', src: 'hubspot', text: 'Deal closed' }, { date: '2026-03-20', src: 'fireflies', text: '10-min qual call - qualified' }, { date: '2026-03-24', src: 'eversense', text: 'Shoot completed' }, { date: '2026-03-25', src: 'eversense', text: 'Wayan editing - 3h logged' }] },
  { id: 'JOB-0004', client: 'Master Tint', contact: 'Dave Wilson', phone: '0445 678 901', email: 'dave@mastertint.com.au', type: 'ghl_build', status: 'in_edit', quoted: 650, scheduledDate: '2026-03-20', location: 'Remote', shooter: null, editor: null, timeLogs: [{ person: 'gab', hours: 16, task: 'GHL build (67%)' }], expenses: [], notes: 'Full GHL. Pipelines, automations, booking widget.', created: '2026-03-18', invoice: 'none', callSummary: 'Tradie. No CRM currently. Using pen and paper. Wants booking system and follow-up automation. Budget confirmed.', activity: [{ date: '2026-03-18', src: 'hubspot', text: 'Deal closed' }, { date: '2026-03-18', src: 'fireflies', text: 'Qual call - needs full build' }, { date: '2026-03-18', src: 'eversense', text: 'Gab assigned' }, { date: '2026-03-22', src: 'eversense', text: '16h logged - 67% complete' }] },
  { id: 'JOB-0005', client: 'RE/MAX Gold Coast', contact: 'Lisa Chen', phone: '0456 789 012', email: 'lisa@remax.com.au', type: 'video', status: 'scheduled', quoted: 849, scheduledDate: '2026-03-28', location: '88 Surf Pde, Broadbeach', shooter: 'jev', editor: 'ridho', timeLogs: [], expenses: [], notes: 'Agent wants to appear in video.', created: '2026-03-25', invoice: 'none', callSummary: 'Experienced agent. 10+ listings/month. If this goes well, wants ongoing relationship. Interested in ad management too.', activity: [{ date: '2026-03-25', src: 'hubspot', text: 'Deal closed' }, { date: '2026-03-25', src: 'fireflies', text: 'Qual call - high potential' }, { date: '2026-03-25', src: 'jobsense', text: 'Scheduled for Mar 28' }] },
  { id: 'JOB-0006', client: 'ADV Painting', contact: 'Anthony', phone: '0467 890 123', email: 'anthony@adv.com.au', type: 'ad_management', status: 'on_site', quoted: 1300, scheduledDate: '2026-03-01', location: 'Remote', shooter: null, editor: null, timeLogs: [{ person: 'jev', hours: 8, task: 'March ads management' }], expenses: [], notes: 'Monthly Meta ads. $300/wk.', created: '2026-03-01', invoice: 'sent', recurring: true, callSummary: null, activity: [{ date: '2026-03-01', src: 'jobsense', text: 'Monthly retainer started' }, { date: '2026-03-21', src: 'eversense', text: 'Week 3 optimisation done' }, { date: '2026-03-01', src: 'xero', text: 'Invoice #1035 sent' }] },
  { id: 'JOB-0007', client: 'Harcourts Coastal', contact: 'Rachel Torres', phone: '0478 901 234', email: 'rachel@harcourts.com.au', type: 'photos_video', status: 'booked', quoted: 1484, scheduledDate: '2026-04-02', location: 'Mermaid Beach', shooter: 'julian', editor: 'wayan', timeLogs: [], expenses: [], notes: 'Julian shooting with drone.', created: '2026-03-26', invoice: 'none', callSummary: 'New client from referral (Sarah at Ray White). Wants photos + video for $2.1M listing.', activity: [{ date: '2026-03-26', src: 'hubspot', text: 'Deal from referral' }, { date: '2026-03-26', src: 'fireflies', text: 'Qual call - referred by JOB-0001 client' }] },
  { id: 'JOB-0008', client: 'NT Trailers', contact: 'Mark', phone: '0489 012 345', email: 'mark@ntt.com.au', type: 'website', status: 'qc_review', quoted: 2000, scheduledDate: '2026-03-17', location: 'Remote', shooter: null, editor: null, timeLogs: [{ person: 'risna', hours: 35, task: 'Build' }, { person: 'hanif', hours: 12, task: 'Design' }, { person: 'gen', hours: 8, task: 'Dev + Xero integration' }], expenses: [], notes: 'Needs Xero integration.', created: '2026-03-14', invoice: 'none', callSummary: 'Existing retainer client. Website refresh needed. Must integrate with Xero for online payments.', activity: [{ date: '2026-03-14', src: 'hubspot', text: 'Website job created' }, { date: '2026-03-17', src: 'eversense', text: 'Risna started build' }, { date: '2026-03-25', src: 'eversense', text: 'QC review started' }] },
  { id: 'JOB-0009', client: 'LCMB Group', contact: 'Luke', phone: '0490 123 456', email: 'luke@lcmb.com.au', type: 'video', status: 'uploaded', quoted: 849, scheduledDate: '2026-03-25', location: 'Nerang', shooter: 'jev', editor: 'pran', timeLogs: [{ person: 'jev', hours: 5.5, task: 'Shoot' }, { person: 'jev', hours: 2, task: 'Notes' }], expenses: [], notes: 'Monthly retainer shoot.', created: '2026-03-22', invoice: 'none', callSummary: null, recurring: true, activity: [{ date: '2026-03-22', src: 'jobsense', text: 'Monthly shoot created' }, { date: '2026-03-25', src: 'eversense', text: 'Shoot done + footage uploaded' }] },
  { id: 'JOB-0010', client: 'Coastal RE', contact: 'Ben Taylor', phone: '0401 234 567', email: 'ben@coastal.com.au', type: 'video', status: 'booked', quoted: 849, scheduledDate: '2026-04-04', location: 'Tugun', shooter: 'jev', editor: 'wayan', timeLogs: [], expenses: [], notes: '', created: '2026-03-27', invoice: 'none', callSummary: 'Cold lead from Meta ad. First time using video. Wants to test with one property.', activity: [{ date: '2026-03-27', src: 'hubspot', text: 'Lead from Meta ad - deal created' }, { date: '2026-03-27', src: 'fireflies', text: 'Qual call - confirmed booking' }] },
];

const SRC: Record<string, string> = { hubspot: 'H', eversense: 'E', xero: 'X', fireflies: 'F', jobsense: 'J', content: 'C' };
const SRC_COLOR: Record<string, string> = { hubspot: '#CE9178', eversense: '#569CD6', xero: '#4EC9B0', fireflies: '#C586C0', jobsense: T.accent, content: '#6A9955' };

const INV_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  none: { label: 'No Invoice', color: '#5A5A5A', bg: '#2D2D30' },
  draft: { label: 'Draft', color: '#858585', bg: '#2D2D30' },
  sent: { label: 'Sent', color: '#DCDCAA', bg: 'rgba(220,220,170,0.12)' },
  overdue: { label: 'Overdue', color: '#F44747', bg: 'rgba(244,71,71,0.12)' },
  paid: { label: 'Paid', color: '#4EC9B0', bg: 'rgba(78,201,176,0.12)' },
};

// --- UI Components ---
function Dot({ color, size = 6 }: { color: string; size?: number }) {
  return <span style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />;
}

function Chip({ children, color, bg, small }: { children: React.ReactNode; color?: string; bg?: string; small?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: bg || '#3C3C3C', color: color || T.text, padding: small ? '1px 6px' : '2px 8px', borderRadius: 3, fontSize: small ? 10 : 11, fontWeight: 500, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

function Av({ id, size = 24 }: { id: string; size?: number }) {
  const p = getP(id);
  if (!p) return null;
  return (
    <div title={`${p.name} - ${p.role} - ${$x(p.rate)}/hr`} style={{ width: size, height: size, borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
      {p.name[0]}
    </div>
  );
}

function SLAChip({ job }: { job: Job }) {
  if (['paid', 'approved', 'invoiced', 'delivered'].includes(job.status)) return null;
  const rem = sla(job.type) - dd(job.scheduledDate, '2026-03-27');
  const c = rem < 0 ? T.red : rem <= 1 ? '#DCDCAA' : T.green;
  const bg = rem < 0 ? T.redDim : rem <= 1 ? T.amberDim : T.greenDim;
  return <Chip color={c} bg={bg} small>{rem < 0 ? Math.abs(rem) + 'd overdue' : rem + 'd left'}</Chip>;
}

function InvBadge({ status }: { status: string }) {
  const cfg = INV_CONFIG[status] || INV_CONFIG.none;
  return <Chip color={cfg.color} bg={cfg.bg} small>{cfg.label}</Chip>;
}

function SrcIcon({ src }: { src: string }) {
  return (
    <span style={{ width: 16, height: 16, borderRadius: 2, background: SRC_COLOR[src] || '#555', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
      {SRC[src] || '?'}
    </span>
  );
}

function MarginBar({ job }: { job: Job }) {
  const p = jProfit(job);
  const pct = Math.min(Math.max(p.margin, 0), 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ flex: 1, height: 3, borderRadius: 1, background: '#3C3C3C' }}>
        <div style={{ width: pct + '%', height: '100%', borderRadius: 1, background: mc(p.margin) }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: mc(p.margin), minWidth: 28 }}>{p.margin.toFixed(0)}%</span>
    </div>
  );
}

// --- Create Job Modal ---
function CreateJobModal({ onClose, onCreate }: { onClose: () => void; onCreate: (job: Job) => void }) {
  const [client, setClient] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState('video');
  const [date, setDate] = useState('2026-04-01');
  const [location, setLocation] = useState('');
  const [shooter, setShooter] = useState('jev');
  const [editor, setEditor] = useState('wayan');
  const [notes, setNotes] = useState('');

  const quoted = getTy(type).price;

  const handleCreate = () => {
    if (!client) return;
    onCreate({
      id: 'JOB-' + String(Math.floor(Math.random() * 9000) + 1000),
      client, contact, email, phone, type, status: 'booked', quoted,
      scheduledDate: date, location, shooter: shooter || null, editor: editor || null,
      timeLogs: [], expenses: [], notes, created: '2026-03-27', invoice: 'none',
      callSummary: null,
      activity: [{ date: '2026-03-27', src: 'jobsense', text: 'Job created manually' }],
    });
    onClose();
  };

  const inputStyle: React.CSSProperties = { background: T.inputBg, border: '1px solid ' + T.inputBorder, borderRadius: 2, padding: '6px 8px', fontSize: 13, color: T.white, width: '100%', outline: 'none', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { fontSize: 11, color: T.text, fontWeight: 400, marginBottom: 4, display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: T.sidebar, border: '1px solid ' + T.border, borderRadius: 0, padding: 0, width: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 5px 30px rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid ' + T.border }}>
          <h2 style={{ fontSize: 14, fontWeight: 400, color: T.white, margin: 0 }}>New Job</h2>
        </div>
        <div style={{ padding: '16px 20px' }}>

        <label style={labelStyle}>Client</label>
        <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client or company name" style={{ ...inputStyle, marginBottom: 12 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div><label style={labelStyle}>Contact Name</label><input value={contact} onChange={(e) => setContact(e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Phone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} /></div>
        </div>

        <label style={labelStyle}>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...inputStyle, marginBottom: 12 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Job Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} style={{ ...inputStyle, appearance: 'auto' }}>
              {TYPES.map((t) => <option key={t.key} value={t.key}>{t.label} - {$(t.price)}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Scheduled Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <label style={labelStyle}>Location</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Property address or Remote" style={{ ...inputStyle, marginBottom: 12 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Assign Shooter</label>
            <select value={shooter} onChange={(e) => setShooter(e.target.value)} style={{ ...inputStyle, appearance: 'auto' }}>
              <option value="">None</option>
              {TEAM.filter((t) => ['jev', 'julian'].includes(t.id)).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Assign Editor</label>
            <select value={editor} onChange={(e) => setEditor(e.target.value)} style={{ ...inputStyle, appearance: 'auto' }}>
              <option value="">None</option>
              {TEAM.filter((t) => ['wayan', 'hanif', 'pran', 'ridho'].includes(t.id)).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>

        <label style={labelStyle}>Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ ...inputStyle, marginBottom: 16, resize: 'vertical' }} />

        <div style={{ background: T.bg, borderRadius: 0, padding: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: T.textMuted }}>Quoted Price</span>
          <span style={{ fontSize: 18, fontWeight: 600, color: T.accent }}>{$(quoted)}</span>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'transparent', color: T.text, border: '1px solid ' + T.border, borderRadius: 0, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleCreate} style={{ background: T.accentDark, color: '#fff', border: 'none', borderRadius: 0, padding: '6px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Create Job</button>
        </div>
        </div>
      </div>
    </div>
  );
}

// --- Job Detail Panel ---
function JobPanel({ job, onClose, onMove }: { job: Job; onClose: () => void; onMove: (id: string, status: string) => void }) {
  const [tab, setTab] = useState('overview');
  const p = jProfit(job);
  const c = jCost(job);
  const st = getSt(job.status);
  const ty = getTy(job.type);
  const sIdx = STATUSES.findIndex((s) => s.key === job.status);
  const next = sIdx < STATUSES.length - 1 ? STATUSES[sIdx + 1] : null;

  const tabs = ['overview', 'financials', 'activity'];
  if (job.callSummary) tabs.splice(1, 0, 'call');

  return (
    <div style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', boxShadow: 'none' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid ' + T.border }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: T.textDark, fontWeight: 700, fontFamily: 'monospace' }}>{job.id}</span>
            <Chip color={st.color} bg={st.bg}><Dot color={st.color} size={5} /> {st.label}</Chip>
            <InvBadge status={job.invoice} />
            {job.recurring && <Chip color={T.blue} bg={T.blueDim} small>Recurring</Chip>}
          </div>
          <button onClick={onClose} style={{ background: '#3C3C3C', border: '1px solid #3C3C3C', color: T.textMuted, fontSize: 14, cursor: 'pointer', lineHeight: 1, width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>×</button>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: T.white, margin: '0 0 3px' }}>{job.client}</h2>
        <div style={{ fontSize: 12, color: T.textMuted }}>{job.contact} · {job.phone}</div>
        {next && (
          <button onClick={() => onMove(job.id, next.key)} style={{ marginTop: 10, background: T.accent, color: '#fff', border: 'none', borderRadius: 2, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', width: '100%', transition: 'all 0.2s' }}>
            Move to {next.label} →
          </button>
        )}
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid ' + T.border, padding: '0 20px' }}>
        {tabs.map((t) => (
          <div key={t} onClick={() => setTab(t)} style={{ padding: '10px 14px', fontSize: 12, fontWeight: tab === t ? 600 : 400, color: tab === t ? T.accent : T.textMuted, borderBottom: tab === t ? '2px solid ' + T.accent : '2px solid transparent', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s' }}>
            {t}
          </div>
        ))}
      </div>

      <div style={{ padding: '16px 20px', flex: 1, overflowY: 'auto' }}>
        {tab === 'overview' && (
          <div>
            <div style={{ background: '#2D2D30', borderRadius: 2, padding: 14, marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, border: '1px solid ' + T.border }}>
              {[
                { l: 'Quoted', v: $(p.rev), c: T.accent },
                { l: 'Cost', v: $(p.cost), c: T.text },
                { l: 'Profit', v: (p.net < 0 ? '-' : '') + $(p.net), c: p.net >= 0 ? T.green : T.red },
                { l: 'Margin', v: p.margin.toFixed(1) + '%', c: mc(p.margin) },
              ].map((m, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{m.l}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: m.c }}>{m.v}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {[
                { l: 'Type', v: ty.label },
                { l: 'SLA', v: null, chip: true },
                { l: 'Scheduled', v: job.scheduledDate },
                { l: 'Location', v: job.location },
              ].map((item, i) => (
                <div key={i} style={{ background: '#2D2D30', borderRadius: 2, padding: '8px 10px', border: '1px solid ' + T.borderLight }}>
                  <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{item.l}</div>
                  {item.chip ? <SLAChip job={job} /> : <div style={{ fontSize: 12, color: T.white, fontWeight: 500 }}>{item.v}</div>}
                </div>
              ))}
            </div>

            <div style={{ fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Team</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {[job.shooter, job.editor, ...(job.timeLogs || []).map((l) => l.person)]
                .filter((v, i, a): v is string => !!v && a.indexOf(v) === i)
                .map((id) => {
                  const pr = getP(id);
                  if (!pr) return null;
                  const hrs = (job.timeLogs || []).filter((l) => l.person === id).reduce((s, l) => s + l.hours, 0);
                  return (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#3C3C3C', borderRadius: 2, padding: '6px 10px', border: '1px solid ' + T.borderLight }}>
                      <Av id={id} size={22} />
                      <div>
                        <div style={{ fontSize: 11, color: T.white, fontWeight: 600 }}>{pr.name}</div>
                        <div style={{ fontSize: 9, color: T.textMuted }}>{hrs > 0 ? hrs.toFixed(1) + 'h' : 'Assigned'}</div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {job.notes && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</div>
                <div style={{ fontSize: 12, color: T.textMuted, background: '#2D2D30', borderRadius: 2, padding: 10, lineHeight: 1.6, border: '1px solid ' + T.borderLight }}>{job.notes}</div>
              </div>
            )}
          </div>
        )}

        {tab === 'call' && job.callSummary && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <SrcIcon src="fireflies" />
              <span style={{ fontSize: 11, fontWeight: 600, color: T.white }}>Qualification Call Summary</span>
            </div>
            <div style={{ background: T.bg, borderRadius: 6, padding: 12, fontSize: 12, color: T.text, lineHeight: 1.6, borderLeft: '3px solid ' + SRC_COLOR.fireflies }}>
              {job.callSummary}
            </div>
          </div>
        )}

        {tab === 'financials' && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
                <span style={{ color: T.textMuted }}>Budget consumed</span>
                <span style={{ color: mc(p.margin), fontWeight: 600 }}>{p.rev > 0 ? ((p.cost / p.rev) * 100).toFixed(0) : 0}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: '#3C3C3C' }}>
                <div style={{ width: Math.min(p.rev > 0 ? (p.cost / p.rev) * 100 : 0, 100) + '%', height: '100%', borderRadius: 3, background: p.rev > 0 && p.cost / p.rev > 0.7 ? T.red : p.cost / p.rev > 0.5 ? T.amber : T.green }} />
              </div>
            </div>

            {(job.timeLogs || []).length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.text, marginBottom: 6 }}>Time Logged (EverSense)</div>
                {job.timeLogs.map((l, i) => {
                  const pr = getP(l.person);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '1px solid ' + T.border }}>
                      <Av id={l.person} size={16} />
                      <span style={{ fontSize: 10, color: T.text, flex: 1 }}>{pr ? pr.name : ''} — {l.task}</span>
                      <span style={{ fontSize: 10, color: T.textMuted }}>{l.hours}h</span>
                      <span style={{ fontSize: 10, color: T.accent, fontWeight: 600, minWidth: 45, textAlign: 'right' }}>{$x(l.hours * (pr ? pr.rate : 0))}</span>
                    </div>
                  );
                })}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '6px 0', fontSize: 10, fontWeight: 700 }}>
                  <span style={{ color: T.textMuted }}>Labour: {$x(c.labour)}</span>
                  {c.expenses > 0 && <span style={{ color: T.textMuted }}>Exp: {$x(c.expenses)}</span>}
                  <span style={{ color: T.accent }}>Total: {$x(c.total)}</span>
                </div>
              </div>
            )}

            {(job.expenses || []).length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.text, marginBottom: 6 }}>Expenses</div>
                {job.expenses.map((e, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid ' + T.border, fontSize: 11 }}>
                    <span style={{ color: T.text }}>{e.desc}</span>
                    <span style={{ color: T.red, fontWeight: 600 }}>{$(e.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <SrcIcon src="xero" />
                <span style={{ fontSize: 10, fontWeight: 600, color: T.text }}>Invoice (Xero)</span>
              </div>
              <div style={{ background: T.bg, borderRadius: 6, padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <InvBadge status={job.invoice} />
                <span style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>{$(job.quoted)}</span>
              </div>
            </div>
          </div>
        )}

        {tab === 'activity' && (
          <div>
            {(job.activity || []).slice().reverse().map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16 }}>
                  <SrcIcon src={a.src} />
                  {i < (job.activity || []).length - 1 && <div style={{ width: 1, flex: 1, background: T.border, margin: '3px 0' }} />}
                </div>
                <div style={{ paddingBottom: 12 }}>
                  <div style={{ fontSize: 11, color: T.white }}>{a.text}</div>
                  <div style={{ fontSize: 9, color: T.textDark, marginTop: 1 }}>{a.date} via {a.src}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- TODAY page ---
function TodayPage({ jobs, onSelect }: { jobs: Job[]; onSelect: (job: Job) => void }) {
  const mo = jobs.filter((j) => j.created >= '2026-03-01');
  const rev = mo.reduce((s, j) => s + j.quoted, 0);
  const profit = mo.reduce((s, j) => s + jProfit(j).net, 0);
  const avgM = mo.length ? mo.reduce((s, j) => s + jProfit(j).margin, 0) / mo.length : 0;
  const outstanding = jobs.filter((j) => ['delivered', 'approved', 'invoiced'].includes(j.status)).reduce((s, j) => s + j.quoted, 0);
  const overdue = jobs.filter((j) => { if (['paid', 'approved', 'invoiced', 'delivered'].includes(j.status)) return false; return dd(j.scheduledDate, '2026-03-27') > sla(j.type); });
  const needsAttention = jobs.filter((j) => ['uploaded', 'qc_review', 'delivered'].includes(j.status));
  const inProgress = jobs.filter((j) => ['in_edit', 'on_site'].includes(j.status));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.white, margin: 0 }}>Today</h1>
          <p style={{ color: T.textMuted, fontSize: 12, margin: '4px 0 0' }}>Thursday 27 March 2026</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { l: 'Revenue', v: $(rev), c: T.white },
          { l: 'Profit', v: $(profit), c: T.green, s: avgM.toFixed(0) + '% avg' },
          { l: 'Active', v: jobs.filter((j) => !['paid'].includes(j.status)).length, c: T.accent, s: $(jobs.filter((j) => !['paid'].includes(j.status)).reduce((s, j) => s + j.quoted, 0)) + ' value' },
          { l: 'Outstanding', v: $(outstanding), c: T.amber },
        ].map((m, i) => (
          <div key={i} style={{ background: T.sidebar, border: '1px solid ' + T.border, borderRadius: 0, padding: '14px 16px', boxShadow: 'none' }}>
            <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.l}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: m.c, marginTop: 4 }}>{m.v}</div>
            {m.s && <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{m.s}</div>}
          </div>
        ))}
      </div>

      {overdue.length > 0 && (
        <div style={{ background: 'rgba(245,101,101,0.08)', border: '1px solid rgba(245,101,101,0.2)', borderRadius: 2, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, backdropFilter: 'blur(8px)' }}>
          <Dot color={T.red} size={8} />
          <span style={{ color: T.red, fontSize: 12, fontWeight: 600 }}>{overdue.length} overdue</span>
          <span style={{ color: T.textMuted, fontSize: 11 }}>— {overdue.map((j) => j.client).join(', ')}</span>
        </div>
      )}

      {inProgress.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Dot color={T.accent} size={7} /> Active Right Now
          </div>
          {inProgress.map((j) => {
            const pr = jProfit(j);
            void pr;
            return (
              <div key={j.id} onClick={() => onSelect(j)} style={{ background: T.sidebar, border: '1px solid ' + T.border, borderRadius: 0, padding: 14, marginBottom: 8, cursor: 'pointer', borderLeft: '4px solid ' + getSt(j.status).color, transition: 'all 0.2s', boxShadow: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, color: T.textDark, fontWeight: 700, fontFamily: 'monospace' }}>{j.id}</span>
                  <Chip color={getSt(j.status).color} bg={getSt(j.status).bg} small><Dot color={getSt(j.status).color} size={4} /> {getSt(j.status).label}</Chip>
                  <Chip small>{getTy(j.type).label}</Chip>
                  <SLAChip job={j} />
                  <InvBadge status={j.invoice} />
                  <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: T.accent }}>{$(j.quoted)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.white }}>{j.client}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>{j.location}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: -4 }}>
                    {[j.shooter, j.editor, ...(j.timeLogs || []).map((l) => l.person)].filter((v, i, a): v is string => !!v && a.indexOf(v) === i).map((id) => <Av key={id} id={id} size={24} />)}
                  </div>
                </div>
                <div style={{ marginTop: 8 }}><MarginBar job={j} /></div>
              </div>
            );
          })}
        </div>
      )}

      {needsAttention.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.amber, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Dot color={T.amber} size={7} /> Needs Attention
          </div>
          {needsAttention.map((j) => (
            <div key={j.id} onClick={() => onSelect(j)} style={{ background: T.sidebar, border: '1px solid ' + T.border, borderRadius: 2, padding: '10px 14px', marginBottom: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s' }}>
              <Chip color={getSt(j.status).color} bg={getSt(j.status).bg} small><Dot color={getSt(j.status).color} size={4} /> {getSt(j.status).label}</Chip>
              <span style={{ fontSize: 12, color: T.white, flex: 1, fontWeight: 500 }}>{j.client}</span>
              <SLAChip job={j} />
              <InvBadge status={j.invoice} />
              <span style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>{$(j.quoted)}</span>
            </div>
          ))}
        </div>
      )}

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Upcoming</div>
        {jobs.filter((j) => ['booked', 'scheduled'].includes(j.status)).sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()).map((j) => (
          <div key={j.id} onClick={() => onSelect(j)} style={{ background: '#2D2D30', border: '1px solid ' + T.borderLight, borderRadius: 2, padding: '10px 14px', marginBottom: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s' }}>
            <Chip color={getSt(j.status).color} bg={getSt(j.status).bg} small>{getSt(j.status).label}</Chip>
            <span style={{ fontSize: 12, color: T.white, flex: 1, fontWeight: 500 }}>{j.client}</span>
            <span style={{ fontSize: 10, color: T.textMuted }}>{j.scheduledDate}</span>
            {j.shooter && <Av id={j.shooter} size={20} />}
            <Chip small>{getTy(j.type).label}</Chip>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>{$(j.quoted)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Board ---
function BoardPage({ jobs, onSelect }: { jobs: Job[]; onSelect: (job: Job) => void }) {
  const cols = ['booked', 'scheduled', 'on_site', 'uploaded', 'in_edit', 'qc_review', 'delivered', 'invoiced', 'paid'];
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: T.white, margin: '0 0 18px' }}>Job Board</h1>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 16 }}>
        {cols.map((col) => {
          const st = getSt(col);
          const cj = jobs.filter((j) => j.status === col);
          return (
            <div key={col} style={{ minWidth: 210, flex: '0 0 220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '6px 10px', background: `${st.bg}`, borderRadius: 2, border: '1px solid ' + T.borderLight }}>
                <Dot color={st.color} size={7} />
                <span style={{ fontSize: 11, fontWeight: 600, color: T.white }}>{st.label}</span>
                <span style={{ fontSize: 10, color: T.textMuted, marginLeft: 'auto', background: '#3C3C3C', padding: '1px 7px', borderRadius: 10, fontWeight: 700 }}>{cj.length}</span>
              </div>
              {cj.map((j) => (
                <div key={j.id} onClick={() => onSelect(j)} style={{ background: T.sidebar, border: '1px solid ' + T.border, borderRadius: 2, padding: 12, marginBottom: 6, cursor: 'pointer', borderLeft: '4px solid ' + st.color, transition: 'all 0.2s', boxShadow: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 9, color: T.textDark, fontWeight: 700, fontFamily: 'monospace' }}>{j.id}</span>
                    <SLAChip job={j} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.white, marginBottom: 6 }}>{j.client}</div>
                  <MarginBar job={j} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[j.shooter, j.editor].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).map((id) => id && <Av key={id} id={id} size={20} />)}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.accent }}>{$(j.quoted)}</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- All Jobs ---
function JobsPage({ jobs, onSelect }: { jobs: Job[]; onSelect: (job: Job) => void }) {
  const [q, setQ] = useState('');
  const [fs, setFs] = useState('all');
  const filtered = useMemo(() => jobs.filter((j) => {
    if (fs !== 'all' && j.status !== fs) return false;
    if (q && !j.client.toLowerCase().includes(q.toLowerCase()) && !j.id.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }).sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()), [jobs, q, fs]);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: T.white, margin: '0 0 16px' }}>All Jobs ({filtered.length})</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search client or job ID..." style={{ background: '#3C3C3C', border: '2px solid #3C3C3C', borderRadius: 2, padding: '8px 14px', fontSize: 12, color: T.white, width: 240, outline: 'none', transition: 'border-color 0.2s' }} />
        <select value={fs} onChange={(e) => setFs(e.target.value)} style={{ background: '#3C3C3C', border: '2px solid #3C3C3C', borderRadius: 2, padding: '8px 12px', fontSize: 11, color: T.text, outline: 'none' }}>
          <option value="all">All Statuses</option>
          {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>
      <div style={{ background: T.sidebar, border: '1px solid ' + T.border, borderRadius: 0, overflow: 'hidden', boxShadow: 'none' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '56px 90px 1fr 80px 72px 60px 36px', gap: 0, padding: '10px 16px', borderBottom: '1px solid ' + T.border }}>
          {['ID', 'Status', 'Client', 'Invoice', 'Quoted', 'Margin', ''].map((h, i) => (
            <span key={i} style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
          ))}
        </div>
        {filtered.map((j) => {
          const pr = jProfit(j);
          const st = getSt(j.status);
          return (
            <div key={j.id} onClick={() => onSelect(j)} style={{ display: 'grid', gridTemplateColumns: '56px 90px 1fr 80px 72px 60px 36px', alignItems: 'center', gap: 0, padding: '10px 16px', borderBottom: '1px solid ' + T.borderLight, cursor: 'pointer', transition: 'background 0.15s' }}>
              <span style={{ fontSize: 10, color: T.textDark, fontWeight: 700, fontFamily: 'monospace' }}>{j.id}</span>
              <Chip color={st.color} bg={st.bg} small><Dot color={st.color} size={4} /> {st.label}</Chip>
              <div>
                <div style={{ fontSize: 12, color: T.white, fontWeight: 500 }}>{j.client}</div>
                <div style={{ fontSize: 10, color: T.textMuted }}>{j.scheduledDate} · {getTy(j.type).label}</div>
              </div>
              <InvBadge status={j.invoice} />
              <span style={{ fontSize: 12, fontWeight: 600, color: T.accent }}>{$(j.quoted)}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: mc(pr.margin) }}>{pr.margin.toFixed(0)}%</span>
              <span style={{ fontSize: 12, color: T.textMuted }}>›</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Finance ---
function FinPage({ jobs, onSelect }: { jobs: Job[]; onSelect: (job: Job) => void }) {
  const mo = jobs.filter((j) => j.created >= '2026-03-01');
  const rev = mo.reduce((s, j) => s + j.quoted, 0);
  const cost = mo.reduce((s, j) => s + jCost(j).total, 0);
  const profit = mo.reduce((s, j) => s + jProfit(j).net, 0);
  const avgM = mo.length ? mo.reduce((s, j) => s + jProfit(j).margin, 0) / mo.length : 0;
  const outs = jobs.filter((j) => j.invoice === 'sent').reduce((s, j) => s + j.quoted, 0);

  const bt: Record<string, { cnt: number; rev: number; profit: number }> = {};
  mo.forEach((j) => { if (!bt[j.type]) bt[j.type] = { cnt: 0, rev: 0, profit: 0 }; bt[j.type].cnt++; bt[j.type].rev += j.quoted; bt[j.type].profit += jProfit(j).net; });
  const mx = Math.max(...Object.values(bt).map((v) => v.rev), 1);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <SrcIcon src="xero" />
        <h1 style={{ fontSize: 24, fontWeight: 800, color: T.white, margin: 0 }}>Finance</h1>
        <span style={{ fontSize: 11, color: T.textMuted }}>March 2026</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 10, marginBottom: 18 }}>
        {[
          { l: 'Revenue', v: $(rev), c: T.white },
          { l: 'Cost', v: $(cost), c: T.red },
          { l: 'Profit', v: $(profit), c: T.green },
          { l: 'Avg Margin', v: avgM.toFixed(1) + '%', c: mc(avgM) },
          { l: 'Awaiting', v: $(outs), c: T.amber },
        ].map((m, i) => (
          <div key={i} style={{ background: T.sidebar, border: '1px solid ' + T.border, borderRadius: 0, padding: '14px 14px', boxShadow: 'none' }}>
            <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.l}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: m.c, marginTop: 4 }}>{m.v}</div>
          </div>
        ))}
      </div>

      <div style={{ background: T.sidebar, border: '1px solid ' + T.border, borderRadius: 0, padding: 18, marginBottom: 16, boxShadow: 'none' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.white, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue by Service</div>
        {Object.entries(bt).sort((a, b) => b[1].rev - a[1].rev).map(([type, d]) => {
          const m = d.rev > 0 ? (d.profit / d.rev) * 100 : 0;
          return (
            <div key={type} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                <span style={{ color: T.white }}>{getTy(type).label} ×{d.cnt}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: T.accent, fontWeight: 600 }}>{$(d.rev)}</span>
                  <span style={{ color: T.green, fontWeight: 600 }}>{$(d.profit)}</span>
                  <span style={{ color: mc(m), fontWeight: 700, minWidth: 28 }}>{m.toFixed(0)}%</span>
                </div>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: '#3C3C3C' }}>
                <div style={{ width: (d.rev / mx) * 100 + '%', height: '100%', borderRadius: 2, background: T.accent, transition: 'width 0.3s' }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: T.sidebar, border: '1px solid ' + T.border, borderRadius: 0, overflow: 'hidden', boxShadow: 'none' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.white, padding: '12px 16px', borderBottom: '1px solid ' + T.border, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Job P&L</div>
        {jobs.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()).map((j) => {
          const pr = jProfit(j);
          return (
            <div key={j.id} onClick={() => onSelect(j)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderBottom: '1px solid ' + T.border, cursor: 'pointer' }}>
              <span style={{ fontSize: 9, color: T.textDark, fontWeight: 600, minWidth: 50 }}>{j.id}</span>
              <span style={{ fontSize: 10, color: T.white, flex: 1 }}>{j.client}</span>
              <InvBadge status={j.invoice} />
              <span style={{ fontSize: 10, fontWeight: 600, color: T.accent }}>{$(j.quoted)}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: pr.net >= 0 ? T.green : T.red }}>{$(pr.net)}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: mc(pr.margin), minWidth: 28 }}>{pr.margin.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- QuoteSense ---
const SERVICES: ServiceCategory[] = [
  {
    cat: 'VIDEO',
    items: [
      { id: 'video', label: 'Cinematic Property Video (60-90s)', price: 849, stdRate: 2122, cost: 302, team: 'Jev shoots + Wayan edits', hours: '15.5h' },
      { id: 'video_vfx', label: 'VFX / AI Video', price: 940, stdRate: 2350, cost: 314, team: 'Jev shoots + Wayan edits + VFX', hours: '17.5h' },
      { id: 'youtube', label: 'YouTube Video (11 min cinematic)', price: 2000, stdRate: 5000, cost: 419, team: 'Jev shoots + Hanif edits', hours: '24.5h' },
    ],
  },
  {
    cat: 'ADD-ONS',
    items: [
      { id: 'reel_1', label: 'Extra Social Media Reel (1)', price: 70, stdRate: 175, cost: 6, team: 'Wayan', hours: '1h' },
      { id: 'reel_2', label: 'Extra Reels ×2 (10% off)', price: 126, stdRate: 315, cost: 12, team: 'Wayan', hours: '2h' },
      { id: 'reel_3', label: 'Extra Reels ×3 (20% off)', price: 168, stdRate: 420, cost: 18, team: 'Wayan', hours: '3h' },
      { id: 'drone', label: 'Drone Aerials', price: 95, stdRate: 238, cost: 0, team: 'Jev (on site)', hours: '0h extra' },
      { id: 'drone_bundle', label: 'Drone + Reel Bundle (15% off drone)', price: 81, stdRate: 203, cost: 0, team: 'Jev', hours: '0h extra' },
      { id: 'floor_plan', label: 'Floor Plan (1 level)', price: 40, stdRate: 100, cost: 24, team: 'Hanif 3h or Fiverr $50', hours: '3h' },
    ],
  },
  {
    cat: 'MEDIA PACKAGES',
    items: [
      { id: 'photos_video', label: 'Photos + Video Package', price: 1484, stdRate: 3405, cost: 937, team: 'Jev + Wayan + Bruno photos + drone', hours: '15.5h + Bruno' },
      { id: 'full_media', label: 'Veblen Full Media', price: 1650, stdRate: 4125, cost: 1011, team: 'Jev + Editor + Bruno + floor plan + VFX + twilight + reel', hours: '19.5h + Bruno' },
    ],
  },
  {
    cat: 'LEAD GENERATION',
    items: [
      { id: 'ad_setup', label: 'Ad Campaign Setup (Meta or Google)', price: 600, stdRate: 1500, cost: 199, team: 'Jev 4h + Zac 1h', hours: '5h' },
      { id: 'ad_weekly', label: 'Ad Management (per week)', price: 300, stdRate: 750, cost: 68, team: 'Jev 2h/wk', hours: '2h/wk', note: 'Recurring' },
      { id: 'ad_monthly', label: 'Ad Management (per month)', price: 1300, stdRate: 3250, cost: 292, team: 'Jev 8.7h/mo', hours: '8.7h/mo', note: 'Recurring' },
    ],
  },
  {
    cat: 'GHL / CRM',
    items: [
      { id: 'ghl_build', label: 'GHL Full CRM Build (48h quoted)', price: 650, stdRate: 1200, cost: 186, team: 'Gab 24h actual', hours: '24h (quoted 48h @ $9.90/hr)', note: 'Display $9.90/hr' },
      { id: 'ghl_monthly', label: 'GHL Monthly Management', price: 230, stdRate: 2300, cost: 67, team: 'Gab 2h/wk', hours: '8.66h/mo', note: '$200 mgmt + $30 Zapier' },
      { id: 'ghl_extra_hr', label: 'GHL Extra Hour (beyond 2h/wk)', price: 19.80, stdRate: 100, cost: 7.75, team: 'Gab', hours: '1h (quoted as 2h @ $9.90)', note: 'Display $9.90/hr, double hours' },
    ],
  },
  {
    cat: 'WEBSITE',
    items: [
      { id: 'website', label: 'Professional Website (5-day build)', price: 2000, stdRate: 5000, cost: 689, team: 'Risna 40h + Hanif 16h + Gen 12h', hours: '68h' },
    ],
  },
  {
    cat: 'SOCIAL MEDIA',
    items: [
      { id: 'social', label: 'Monthly Social Media Management', price: 99, stdRate: 250, cost: 14, team: 'Mimi 3h/mo', hours: '3h/mo', note: 'Recurring' },
    ],
  },
  {
    cat: 'CONSULTING',
    items: [
      { id: 'consult_1h', label: 'Consulting — 1 Hour', price: 250, stdRate: 625, cost: 0, team: 'Zac', hours: '1h', note: 'Pure margin (cash view)' },
      { id: 'consult_half', label: 'Consulting — Half Day (4h)', price: 750, stdRate: 1875, cost: 0, team: 'Zac', hours: '4h', note: 'Pure margin (cash view)' },
      { id: 'consult_full', label: 'Consulting — Full Day (8h)', price: 1500, stdRate: 3750, cost: 0, team: 'Zac', hours: '8h', note: 'Pure margin (cash view)' },
    ],
  },
  {
    cat: 'RETAINER PACKAGES',
    items: [
      { id: 'ret_starter', label: 'Starter Retainer (Ads + GHL + Social)', price: 1600, stdRate: 4000, cost: 507, team: 'Jev ads 2h/wk + Gab GHL 2h/wk + Mimi + Zac strategy', hours: '22.3h/mo', note: 'Monthly' },
      { id: 'ret_growth', label: 'Growth Retainer (2 shoots + Ads + GHL)', price: 3800, stdRate: 9500, cost: 1139, team: 'Jev shoots + edits + ads + Gab GHL + Mimi + Zac', hours: '55.3h/mo', note: 'Monthly' },
      { id: 'ret_full', label: 'Full Service Retainer (4 shoots + everything)', price: 5497, stdRate: 13743, cost: 1957, team: 'Full team allocation', hours: '98.3h/mo', note: 'Monthly' },
    ],
  },
];

function QuoteSensePage() {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [showStandard, setShowStandard] = useState(true);
  const [expandedCat, setExpandedCat] = useState('VIDEO');

  const addItem = (service: ServiceItem) => {
    const existing = items.find((i) => i.id === service.id);
    if (existing) {
      setItems(items.map((i) => i.id === service.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setItems([...items, { ...service, qty: 1 }]);
    }
  };

  const removeItem = (id: string) => setItems(items.filter((i) => i.id !== id));
  const updateQty = (id: string, qty: number) => { if (qty <= 0) return removeItem(id); setItems(items.map((i) => i.id === id ? { ...i, qty } : i)); };

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const discountAmt = subtotal * (discount / 100);
  const total = subtotal - discountAmt;
  const totalStd = items.reduce((s, i) => s + i.stdRate * i.qty, 0);
  const totalCost = items.reduce((s, i) => s + i.cost * i.qty, 0);
  const preTaxProfit = total - totalCost;
  const afterTaxProfit = preTaxProfit > 0 ? preTaxProfit * 0.75 : preTaxProfit;
  const margin = total > 0 ? (afterTaxProfit / total) * 100 : 0;

  const inputStyle: React.CSSProperties = { background: '#3C3C3C', border: '2px solid #3C3C3C', borderRadius: 2, padding: '8px 12px', fontSize: 12, color: T.white, outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.2s' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: T.white, margin: 0 }}>QuoteSense</h1>
          <p style={{ color: T.textMuted, fontSize: 12, margin: '4px 0 0' }}>Build quotes with live margin tracking</p>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: T.textMuted, cursor: 'pointer' }}>
          <input type="checkbox" checked={showStandard} onChange={(e) => setShowStandard(e.target.checked)} />
          Show standard rates
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* LEFT — Service Menu */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 9, color: T.textDark, fontWeight: 600, textTransform: 'uppercase' as const, display: 'block', marginBottom: 3 }}>Client</label>
              <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client name" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 9, color: T.textDark, fontWeight: 600, textTransform: 'uppercase' as const, display: 'block', marginBottom: 3 }}>Email</label>
              <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="Email" style={inputStyle} />
            </div>
          </div>

          {SERVICES.map((cat) => (
            <div key={cat.cat} style={{ marginBottom: 8 }}>
              <div onClick={() => setExpandedCat(expandedCat === cat.cat ? '' : cat.cat)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: T.card, border: '1px solid ' + T.border, borderRadius: 6, cursor: 'pointer', marginBottom: 2 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.accent, letterSpacing: '0.06em' }}>{cat.cat}</span>
                <span style={{ fontSize: 10, color: T.textDark }}>{expandedCat === cat.cat ? '▾' : '▸'} {cat.items.length}</span>
              </div>
              {expandedCat === cat.cat && (
                <div style={{ border: '1px solid ' + T.border, borderRadius: 6, overflow: 'hidden' }}>
                  {cat.items.map((svc) => {
                    const inQuote = items.some((i) => i.id === svc.id);
                    const svcMargin = svc.price > 0 ? (((svc.price - svc.cost) * 0.75) / svc.price) * 100 : 100;
                    return (
                      <div key={svc.id} onClick={() => !inQuote && addItem(svc)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderBottom: '1px solid ' + T.border, cursor: inQuote ? 'default' : 'pointer', background: inQuote ? 'rgba(212,132,90,0.06)' : 'transparent', opacity: inQuote ? 0.7 : 1 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, color: T.white, fontWeight: 500 }}>{svc.label}</div>
                          <div style={{ fontSize: 9, color: T.textDark, marginTop: 1 }}>{svc.team} · {svc.hours}</div>
                          {svc.note && <div style={{ fontSize: 8, color: T.amber, marginTop: 1 }}>{svc.note}</div>}
                        </div>
                        <div style={{ textAlign: 'right', minWidth: 70 }}>
                          {showStandard && <div style={{ fontSize: 9, color: T.textDark, textDecoration: 'line-through' }}>{$(svc.stdRate)}</div>}
                          <div style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>{$(svc.price)}</div>
                          <div style={{ fontSize: 8, color: mc(svcMargin), fontWeight: 600 }}>{svcMargin.toFixed(0)}% margin</div>
                        </div>
                        <div style={{ width: 24, height: 24, borderRadius: 5, background: inQuote ? T.green : T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: inQuote ? 10 : 14, fontWeight: 700, flexShrink: 0 }}>
                          {inQuote ? '✓' : '+'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* RIGHT — Quote Builder */}
        <div>
          <div style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 8, padding: 16, position: 'sticky', top: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 4 }}>{clientName || 'New Quote'}</div>
            {clientEmail && <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 12 }}>{clientEmail}</div>}

            {items.length === 0 && (
              <div style={{ padding: '30px 0', textAlign: 'center', color: T.textDark, fontSize: 12 }}>
                Click services on the left to add them to this quote
              </div>
            )}

            {items.length > 0 && (
              <div>
                {items.map((item) => {
                  const lineTotal = item.price * item.qty;
                  const lineStd = item.stdRate * item.qty;
                  return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0', borderBottom: '1px solid ' + T.border }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: T.white }}>{item.label}</div>
                        {showStandard && <div style={{ fontSize: 9, color: T.textDark, textDecoration: 'line-through' }}>{$(lineStd)}</div>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ width: 20, height: 20, borderRadius: 4, background: '#252525', border: 'none', color: T.text, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                        <span style={{ fontSize: 11, color: T.white, minWidth: 16, textAlign: 'center' }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ width: 20, height: 20, borderRadius: 4, background: '#252525', border: 'none', color: T.text, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.accent, minWidth: 56, textAlign: 'right' }}>{$(lineTotal)}</span>
                      <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: T.red, fontSize: 14, cursor: 'pointer', padding: '2px 4px' }}>×</button>
                    </div>
                  );
                })}

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '1px solid ' + T.border }}>
                  <span style={{ fontSize: 10, color: T.textMuted, flex: 1 }}>Discount %</span>
                  <input type="number" value={discount} onChange={(e) => setDiscount(Math.max(0, Math.min(100, Number(e.target.value))))} style={{ ...inputStyle, width: 60, textAlign: 'right' }} />
                  {discount > 0 && <span style={{ fontSize: 11, color: T.red }}>-{$(discountAmt)}</span>}
                </div>

                <div style={{ paddingTop: 12 }}>
                  {showStandard && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: T.textDark }}>Standard Rate</span>
                      <span style={{ fontSize: 12, color: T.textDark, textDecoration: 'line-through' }}>{$(totalStd)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.white }}>TOTAL</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: T.accent }}>{$(total)}</span>
                  </div>
                  {showStandard && (
                    <div style={{ background: T.greenDim, borderRadius: 5, padding: '6px 10px', textAlign: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: T.green }}>Client saves {$(totalStd - total)}</span>
                    </div>
                  )}
                </div>

                {/* Internal P&L */}
                <div style={{ background: T.bg, borderRadius: 6, padding: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: 9, color: T.textDark, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>INTERNAL — not shown to client</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4 }}>
                    {[
                      { l: 'Revenue', v: $(total), c: T.white },
                      { l: 'Cost', v: $(totalCost), c: T.text },
                      { l: 'Profit', v: (afterTaxProfit < 0 ? '-' : '') + $(afterTaxProfit), c: afterTaxProfit >= 0 ? T.green : T.red },
                      { l: 'Margin', v: margin.toFixed(1) + '%', c: mc(margin) },
                    ].map((m, i) => (
                      <div key={i}>
                        <div style={{ fontSize: 7, color: T.textDark, fontWeight: 600, textTransform: 'uppercase' }}>{m.l}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: m.c }}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: '#3C3C3C' }}>
                    <div style={{ width: Math.min(Math.max(margin, 0), 100) + '%', height: '100%', borderRadius: 2, background: mc(margin) }} />
                  </div>
                  {margin < 50 && margin > 0 && (
                    <div style={{ fontSize: 9, color: T.amber, marginTop: 4 }}>Below 50% target. Raise total to hit margin goal.</div>
                  )}
                  {margin < 0 && (
                    <div style={{ fontSize: 9, color: T.red, marginTop: 4 }}>This quote loses money.</div>
                  )}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 9, color: T.textDark, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Team required</div>
                  {items.map((item) => (
                    <div key={item.id} style={{ fontSize: 10, color: T.textMuted, padding: '2px 0' }}>
                      {item.team} · {item.hours}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={{ flex: 1, background: T.accent, color: '#fff', border: 'none', borderRadius: 6, padding: '10px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Create Job from Quote
                  </button>
                  <button style={{ background: '#252525', color: T.text, border: 'none', borderRadius: 6, padding: '10px 14px', fontSize: 11, cursor: 'pointer' }}>
                    PDF
                  </button>
                  <button onClick={() => { setItems([]); setDiscount(0); setClientName(''); setClientEmail(''); }} style={{ background: 'transparent', color: T.textDark, border: '1px solid ' + T.borderLight, borderRadius: 6, padding: '10px 14px', fontSize: 11, cursor: 'pointer' }}>
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// === MAIN ===
export default function JobSensePage() {
  const [page, setPage] = useState('today');
  const [jobs, setJobs] = useState<Job[]>(INIT);
  const [sel, setSel] = useState<Job | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const move = useCallback((id: string, ns: string) => {
    const newActivity: ActivityItem = { date: '2026-03-27', src: 'jobsense', text: 'Moved to ' + getSt(ns).label };
    setJobs((p) => p.map((j) => j.id !== id ? j : { ...j, status: ns, activity: [...(j.activity || []), newActivity] }));
    setSel((p) => p && p.id === id ? { ...p, status: ns, activity: [...(p.activity || []), newActivity] } : p);
  }, []);

  const create = useCallback((job: Job) => {
    setJobs((p) => [...p, job]);
  }, []);

  const tabs = [
    { id: 'today', label: 'Today', icon: '📅' },
    { id: 'board', label: 'Board', icon: '📋' },
    { id: 'jobs', label: 'Jobs', icon: '📁' },
    { id: 'quotes', label: 'Quotes', icon: '💰' },
    { id: 'finance', label: 'Finance', icon: '📊' },
  ];

  const activeTab = tabs.find(t => t.id === page) || tabs[0];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: T.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: T.text }}>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: T.cardSolid, borderRight: '1px solid ' + T.border, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Brand */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid ' + T.border }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 2, background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 15 }}>J</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>JobSense</div>
              <div style={{ fontSize: 10, color: T.textMuted }}>Veblen Group</div>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <div style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setPage(t.id)}
              style={{
                width: '100%', border: 'none', borderRadius: 0, padding: '12px 20px',
                background: page === t.id ? 'rgba(0,122,204,0.2)' : 'transparent',
                color: page === t.id ? T.accent : T.textMuted,
                fontSize: 13, fontWeight: page === t.id ? 600 : 400,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                borderLeft: page === t.id ? '3px solid ' + T.accent : '3px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid ' + T.border }}>
          <button onClick={() => setShowCreate(true)} style={{ width: '100%', background: T.accent, color: '#fff', border: 'none', borderRadius: 2, padding: '10px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            + New Job
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Bar */}
        <div style={{ height: 48, background: T.cardSolid, borderBottom: '1px solid ' + T.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.white }}>{activeTab.label}</span>
            <span style={{ fontSize: 11, color: T.textMuted, padding: '2px 8px', background: '#3C3C3C', borderRadius: 2 }}>
              {jobs.filter(j => !['paid'].includes(j.status)).length} active
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {['HubSpot', 'Xero', 'Fireflies', 'EverSense'].map((s) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: T.textMuted }}>
                <Dot color={T.green} size={5} />
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content + Detail Split */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Page Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
            {page === 'today' && <TodayPage jobs={jobs} onSelect={setSel} />}
            {page === 'board' && <BoardPage jobs={jobs} onSelect={setSel} />}
            {page === 'jobs' && <JobsPage jobs={jobs} onSelect={setSel} />}
            {page === 'quotes' && <QuoteSensePage />}
            {page === 'finance' && <FinPage jobs={jobs} onSelect={setSel} />}
          </div>

          {/* Right Detail Panel */}
          {sel && (
            <div style={{ width: 400, background: T.cardSolid, borderLeft: '1px solid ' + T.border, display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
              <JobPanel job={sel} onClose={() => setSel(null)} onMove={move} />
            </div>
          )}
        </div>
      </div>

      </div>
      {/* Status Bar — VS Code blue */}
      <div style={{ height: 22, background: T.statusBar, display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 11, color: '#fff', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>Jobs: {jobs.length}</span>
          <span>Active: {jobs.filter(j => !['paid', 'approved', 'invoiced'].includes(j.status)).length}</span>
          <span>MTD: {$(jobs.reduce((s, j) => s + j.quoted, 0))}</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {['HubSpot', 'Xero', 'Fireflies', 'EverSense'].map((s) => (
            <span key={s}>{s} ✓</span>
          ))}
        </div>
      </div>

      {showCreate && <CreateJobModal onClose={() => setShowCreate(false)} onCreate={create} />}
    </div>
  );
}
