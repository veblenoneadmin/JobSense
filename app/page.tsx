'use client';

import React, { useState, useCallback, useMemo } from 'react';

const T = {
  bg: '#0B0B0B', card: '#161616', cardHover: '#1C1C1C', border: '#222222',
  borderLight: '#2A2A2A', accent: '#D4845A', accentLight: '#E8A87C',
  accentDim: 'rgba(212,132,90,0.12)', white: '#EEEEEE', text: '#A0A0A0',
  textMuted: '#666666', textDark: '#444444', green: '#5CB85C',
  greenDim: 'rgba(92,184,92,0.10)', red: '#E05050', redDim: 'rgba(224,80,80,0.10)',
  amber: '#E8A84C', amberDim: 'rgba(232,168,76,0.10)', blue: '#5B9BD5',
  blueDim: 'rgba(91,155,213,0.10)', mauve: '#C27BA0', mauveDim: 'rgba(194,123,160,0.10)',
  purple: '#8B7EC8', purpleDim: 'rgba(139,126,200,0.10)',
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
  { key: 'booked',    label: 'Booked',    color: T.blue,        bg: T.blueDim },
  { key: 'scheduled', label: 'Scheduled', color: '#6DAF8D',     bg: 'rgba(109,175,141,0.10)' },
  { key: 'on_site',   label: 'On Site',   color: T.amber,       bg: T.amberDim },
  { key: 'uploaded',  label: 'Uploaded',  color: T.mauve,       bg: T.mauveDim },
  { key: 'in_edit',   label: 'In Edit',   color: T.accent,      bg: T.accentDim },
  { key: 'qc_review', label: 'QC Review', color: T.accentLight, bg: 'rgba(232,168,124,0.10)' },
  { key: 'delivered', label: 'Delivered', color: T.green,       bg: T.greenDim },
  { key: 'approved',  label: 'Approved',  color: '#4CAF80',     bg: 'rgba(76,175,128,0.10)' },
  { key: 'invoiced',  label: 'Invoiced',  color: T.purple,      bg: T.purpleDim },
  { key: 'paid',      label: 'Paid',      color: '#4ADE80',     bg: 'rgba(74,222,128,0.12)' },
];
const getSt = (k: string) => STATUSES.find(s => s.key === k) || { label: k, color: '#555', bg: 'rgba(85,85,85,0.1)' };

const TYPES = [
  { key: 'video',          label: 'Video',        price: 849 },
  { key: 'full_media',     label: 'Full Media',   price: 1650 },
  { key: 'photos_video',   label: 'Photos+Video', price: 1484 },
  { key: 'website',        label: 'Website',      price: 2000 },
  { key: 'ghl_build',      label: 'GHL Build',    price: 650 },
  { key: 'ad_setup',       label: 'Ad Setup',     price: 600 },
  { key: 'ad_management',  label: 'Ad Mgmt',      price: 1300 },
  { key: 'youtube',        label: 'YouTube',      price: 2000 },
  { key: 'social_media',   label: 'Social',       price: 99 },
  { key: 'consulting',     label: 'Consulting',   price: 250 },
];
const getTy = (k: string) => TYPES.find(t => t.key === k) || { label: k, price: 0 };

const TEAM: TeamMember[] = [
  { id: 'zac',    name: 'Zac',    role: 'Director',     rate: 64.19, color: '#D4845A' },
  { id: 'jev',    name: 'Jev',    role: 'Shooter',      rate: 34.42, color: '#5B9BD5' },
  { id: 'gen',    name: 'Gen',    role: 'Dev',          rate: 7.97,  color: '#6DAF8D' },
  { id: 'gab',    name: 'Gab',    role: 'GHL/CRM',      rate: 7.75,  color: '#8B7EC8' },
  { id: 'hanif',  name: 'Hanif',  role: 'Creative',     rate: 8.52,  color: '#E8A87C' },
  { id: 'wayan',  name: 'Wayan',  role: 'Editor',       rate: 6.37,  color: '#C27BA0' },
  { id: 'pran',   name: 'Pran',   role: 'Editor',       rate: 4.20,  color: '#5CB85C' },
  { id: 'ridho',  name: 'Ridho',  role: 'Editor',       rate: 4.20,  color: '#E05050' },
  { id: 'risna',  name: 'Risna',  role: 'Web Dev',      rate: 5.22,  color: '#E8A84C' },
  { id: 'mimi',   name: 'Mimi',   role: 'Social',       rate: 4.75,  color: '#5BCBD5' },
  { id: 'julian', name: 'Julian', role: 'Ext. Shooter', rate: 85,    color: '#999999' },
];
const getP = (id: string) => TEAM.find(t => t.id === id);

const fmt  = (n: number) => '$' + Math.abs(n).toLocaleString('en-AU', { maximumFractionDigits: 0 });
const fmtD = (n: number) => '$' + Math.abs(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
function sla(t: string): number {
  return ({ video: 5, full_media: 7, photos_video: 5, website: 5, ghl_build: 10, ad_setup: 3, youtube: 10 } as Record<string, number>)[t] || 5;
}
function dayDiff(a: string, b: string) { return Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000); }

const INIT: Job[] = [
  { id: 'JOB-0001', client: 'Ray White Burleigh', contact: 'Sarah Mitchell', phone: '0412 345 678', email: 'sarah@rwburleigh.com.au', type: 'video', status: 'paid', quoted: 849, scheduledDate: '2026-03-10', location: '42 Hedges Ave, Mermaid Beach', shooter: 'jev', editor: 'wayan', timeLogs: [{ person: 'jev', hours: 5.5, task: 'Shoot' }, { person: 'jev', hours: 2, task: 'Notes' }, { person: 'wayan', hours: 7.5, task: 'Edit' }], expenses: [], notes: 'Waterfront. Client loved it.', created: '2026-03-08', invoice: 'paid', callSummary: 'Agent wants cinematic style. Budget confirmed $849. Wants it for Domain listing next week.', activity: [{ date: '2026-03-08', src: 'hubspot', text: 'Deal closed — job auto-created' }, { date: '2026-03-10', src: 'eversense', text: 'Jev logged 5.5h shoot' }, { date: '2026-03-12', src: 'eversense', text: 'Wayan started edit' }, { date: '2026-03-15', src: 'jobsense', text: 'Delivered to client' }, { date: '2026-03-15', src: 'xero', text: 'Invoice #1038 sent' }, { date: '2026-03-18', src: 'xero', text: 'Payment received' }] },
  { id: 'JOB-0002', client: 'Kollosche', contact: "James D'Arcy", phone: '0423 456 789', email: 'james@kollosche.com.au', type: 'full_media', status: 'delivered', quoted: 1650, scheduledDate: '2026-03-18', location: '1 Admiralty Dr, Paradise Waters', shooter: 'jev', editor: 'hanif', timeLogs: [{ person: 'jev', hours: 5.5, task: 'Shoot' }, { person: 'jev', hours: 2, task: 'Notes' }, { person: 'hanif', hours: 12, task: 'Edit' }, { person: 'hanif', hours: 4, task: 'VFX' }, { person: 'pran', hours: 3, task: 'Floor plan' }], expenses: [{ desc: 'Bruno Photos', amount: 330 }, { desc: 'Bruno Drone', amount: 150 }], notes: 'Luxury waterfront. Twilight shoot.', created: '2026-03-14', invoice: 'sent', callSummary: 'Premium listing $4.2M. Wants full package including twilight. Happy with $1,650. Mentioned 3 more listings coming.', activity: [{ date: '2026-03-14', src: 'hubspot', text: 'Deal closed' }, { date: '2026-03-18', src: 'eversense', text: 'Shoot completed' }, { date: '2026-03-20', src: 'eversense', text: 'Hanif started VFX edit' }, { date: '2026-03-24', src: 'jobsense', text: 'Delivered to client' }, { date: '2026-03-24', src: 'xero', text: 'Invoice #1041 sent — awaiting payment' }] },
  { id: 'JOB-0003', client: 'LJ Hooker Broadbeach', contact: 'Tim Nguyen', phone: '0434 567 890', email: 'tim@ljh.com.au', type: 'video', status: 'in_edit', quoted: 849, scheduledDate: '2026-03-24', location: 'Surfers Paradise', shooter: 'jev', editor: 'wayan', timeLogs: [{ person: 'jev', hours: 5.5, task: 'Shoot' }, { person: 'jev', hours: 1.5, task: 'Notes' }, { person: 'wayan', hours: 3, task: 'Edit (in progress)' }], expenses: [], notes: 'High-rise apartment. Good views.', created: '2026-03-20', invoice: 'none', callSummary: 'First time client. Saw our Instagram. Wants to try one video, if good will do all listings.', activity: [{ date: '2026-03-20', src: 'hubspot', text: 'Deal closed' }, { date: '2026-03-20', src: 'fireflies', text: '10-min qual call — qualified' }, { date: '2026-03-24', src: 'eversense', text: 'Shoot completed' }, { date: '2026-03-25', src: 'eversense', text: 'Wayan editing — 3h logged' }] },
  { id: 'JOB-0004', client: 'Master Tint', contact: 'Dave Wilson', phone: '0445 678 901', email: 'dave@mastertint.com.au', type: 'ghl_build', status: 'in_edit', quoted: 650, scheduledDate: '2026-03-20', location: 'Remote', shooter: null, editor: null, timeLogs: [{ person: 'gab', hours: 16, task: 'GHL build (67%)' }], expenses: [], notes: 'Full GHL. Pipelines, automations, booking widget.', created: '2026-03-18', invoice: 'none', callSummary: 'Tradie. No CRM currently. Using pen and paper. Wants booking system and follow-up automation. Budget confirmed.', activity: [{ date: '2026-03-18', src: 'hubspot', text: 'Deal closed' }, { date: '2026-03-18', src: 'fireflies', text: 'Qual call — needs full build' }, { date: '2026-03-18', src: 'eversense', text: 'Gab assigned' }, { date: '2026-03-22', src: 'eversense', text: '16h logged — 67% complete' }] },
  { id: 'JOB-0005', client: 'RE/MAX Gold Coast', contact: 'Lisa Chen', phone: '0456 789 012', email: 'lisa@remax.com.au', type: 'video', status: 'scheduled', quoted: 849, scheduledDate: '2026-03-28', location: '88 Surf Pde, Broadbeach', shooter: 'jev', editor: 'ridho', timeLogs: [], expenses: [], notes: 'Agent wants to appear in video.', created: '2026-03-25', invoice: 'none', callSummary: 'Experienced agent. 10+ listings/month. Interested in ad management too.', activity: [{ date: '2026-03-25', src: 'hubspot', text: 'Deal closed' }, { date: '2026-03-25', src: 'fireflies', text: 'Qual call — high potential' }, { date: '2026-03-25', src: 'jobsense', text: 'Scheduled for Mar 28' }] },
  { id: 'JOB-0006', client: 'ADV Painting', contact: 'Anthony', phone: '0467 890 123', email: 'anthony@adv.com.au', type: 'ad_management', status: 'on_site', quoted: 1300, scheduledDate: '2026-03-01', location: 'Remote', shooter: null, editor: null, timeLogs: [{ person: 'jev', hours: 8, task: 'March ads management' }], expenses: [], notes: 'Monthly Meta ads. $300/wk.', created: '2026-03-01', invoice: 'sent', recurring: true, callSummary: null, activity: [{ date: '2026-03-01', src: 'jobsense', text: 'Monthly retainer started' }, { date: '2026-03-21', src: 'eversense', text: 'Week 3 optimisation done' }, { date: '2026-03-01', src: 'xero', text: 'Invoice #1035 sent' }] },
  { id: 'JOB-0007', client: 'Harcourts Coastal', contact: 'Rachel Torres', phone: '0478 901 234', email: 'rachel@harcourts.com.au', type: 'photos_video', status: 'booked', quoted: 1484, scheduledDate: '2026-04-02', location: 'Mermaid Beach', shooter: 'julian', editor: 'wayan', timeLogs: [], expenses: [], notes: 'Julian shooting with drone.', created: '2026-03-26', invoice: 'none', callSummary: 'New client from referral (Sarah at Ray White). Wants photos + video for $2.1M listing.', activity: [{ date: '2026-03-26', src: 'hubspot', text: 'Deal from referral' }, { date: '2026-03-26', src: 'fireflies', text: 'Qual call — referred by JOB-0001' }] },
  { id: 'JOB-0008', client: 'NT Trailers', contact: 'Mark', phone: '0489 012 345', email: 'mark@ntt.com.au', type: 'website', status: 'qc_review', quoted: 2000, scheduledDate: '2026-03-17', location: 'Remote', shooter: null, editor: null, timeLogs: [{ person: 'risna', hours: 35, task: 'Build' }, { person: 'hanif', hours: 12, task: 'Design' }, { person: 'gen', hours: 8, task: 'Dev + Xero integration' }], expenses: [], notes: 'Needs Xero integration.', created: '2026-03-14', invoice: 'none', callSummary: 'Existing retainer client. Website refresh needed. Must integrate with Xero for online payments.', activity: [{ date: '2026-03-14', src: 'hubspot', text: 'Website job created' }, { date: '2026-03-17', src: 'eversense', text: 'Risna started build' }, { date: '2026-03-25', src: 'eversense', text: 'QC review started' }] },
  { id: 'JOB-0009', client: 'LCMB Group', contact: 'Luke', phone: '0490 123 456', email: 'luke@lcmb.com.au', type: 'video', status: 'uploaded', quoted: 849, scheduledDate: '2026-03-25', location: 'Nerang', shooter: 'jev', editor: 'pran', timeLogs: [{ person: 'jev', hours: 5.5, task: 'Shoot' }, { person: 'jev', hours: 2, task: 'Notes' }], expenses: [], notes: 'Monthly retainer shoot.', created: '2026-03-22', invoice: 'none', recurring: true, callSummary: null, activity: [{ date: '2026-03-22', src: 'jobsense', text: 'Monthly shoot created' }, { date: '2026-03-25', src: 'eversense', text: 'Shoot done + footage uploaded' }] },
  { id: 'JOB-0010', client: 'Coastal RE', contact: 'Ben Taylor', phone: '0401 234 567', email: 'ben@coastal.com.au', type: 'video', status: 'booked', quoted: 849, scheduledDate: '2026-04-04', location: 'Tugun', shooter: 'jev', editor: 'wayan', timeLogs: [], expenses: [], notes: '', created: '2026-03-27', invoice: 'none', callSummary: 'Cold lead from Meta ad. First time using video. Wants to test with one property.', activity: [{ date: '2026-03-27', src: 'hubspot', text: 'Lead from Meta ad — deal created' }, { date: '2026-03-27', src: 'fireflies', text: 'Qual call — confirmed booking' }] },
];

const SRC_ICON: Record<string, string>  = { hubspot: 'H', eversense: 'E', xero: 'X', fireflies: 'F', jobsense: 'J' };
const SRC_COLOR: Record<string, string> = { hubspot: '#FF7A59', eversense: '#5B9BD5', xero: '#13B5EA', fireflies: '#A855F7', jobsense: T.accent };

const INV_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  none:    { label: 'No Invoice', color: T.textDark,  bg: 'rgba(68,68,68,0.15)' },
  draft:   { label: 'Draft',      color: T.textMuted, bg: 'rgba(102,102,102,0.15)' },
  sent:    { label: 'Sent',       color: T.amber,     bg: T.amberDim },
  overdue: { label: 'Overdue',    color: T.red,       bg: T.redDim },
  paid:    { label: 'Paid',       color: T.green,     bg: T.greenDim },
};

// ─── Shared UI ───────────────────────────────────────────────────────────────

function Dot({ color, size = 6 }: { color: string; size?: number }) {
  return <span style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />;
}

function Chip({ children, color, bg, small }: { children: React.ReactNode; color?: string; bg?: string; small?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: bg || 'rgba(255,255,255,0.04)', color: color || T.text, padding: small ? '1px 6px' : '2px 8px', borderRadius: 4, fontSize: small ? 8 : 10, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

function Av({ id, size = 24 }: { id: string; size?: number }) {
  const p = getP(id);
  if (!p) return null;
  return (
    <div title={`${p.name} · ${p.role} · ${fmtD(p.rate)}/hr`} style={{ width: size, height: size, borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: '#fff', flexShrink: 0, border: '2px solid ' + T.bg }}>
      {p.name[0]}
    </div>
  );
}

function SLABadge({ job }: { job: Job }) {
  if (['paid', 'approved', 'invoiced', 'delivered'].includes(job.status)) return null;
  const rem = sla(job.type) - dayDiff(job.scheduledDate, '2026-03-27');
  const c  = rem < 0 ? T.red  : rem <= 1 ? T.amber  : T.green;
  const bg = rem < 0 ? T.redDim : rem <= 1 ? T.amberDim : T.greenDim;
  return <Chip color={c} bg={bg} small>{rem < 0 ? Math.abs(rem) + 'd overdue' : rem + 'd left'}</Chip>;
}

function InvBadge({ status }: { status: string }) {
  const cfg = INV_CONFIG[status] || INV_CONFIG.none;
  return <Chip color={cfg.color} bg={cfg.bg} small>{cfg.label}</Chip>;
}

function SrcDot({ src }: { src: string }) {
  return (
    <span style={{ width: 16, height: 16, borderRadius: 3, background: SRC_COLOR[src] || '#555', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
      {SRC_ICON[src] || '?'}
    </span>
  );
}

function MarginBar({ job }: { job: Job }) {
  const p   = jProfit(job);
  const pct = Math.min(Math.max(p.margin, 0), 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.04)' }}>
        <div style={{ width: pct + '%', height: '100%', borderRadius: 2, background: mc(p.margin) }} />
      </div>
      <span style={{ fontSize: 9, fontWeight: 700, color: mc(p.margin), minWidth: 28 }}>{p.margin.toFixed(0)}%</span>
    </div>
  );
}

// ─── Create Job Modal ─────────────────────────────────────────────────────────

function CreateJobModal({ onClose, onCreate }: { onClose: () => void; onCreate: (j: Job) => void }) {
  const [client,   setClient]   = useState('');
  const [contact,  setContact]  = useState('');
  const [email,    setEmail]    = useState('');
  const [phone,    setPhone]    = useState('');
  const [type,     setType]     = useState('video');
  const [date,     setDate]     = useState('2026-04-01');
  const [location, setLocation] = useState('');
  const [shooter,  setShooter]  = useState('jev');
  const [editor,   setEditor]   = useState('wayan');
  const [notes,    setNotes]    = useState('');

  const quoted = getTy(type).price;

  const inp: React.CSSProperties = { background: '#1a1a1a', border: '1px solid ' + T.borderLight, borderRadius: 6, padding: '8px 10px', fontSize: 12, color: T.white, width: '100%', outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 10, color: T.textMuted, fontWeight: 600, marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 12, padding: 24, width: 480, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: T.white, margin: '0 0 18px' }}>New Job</h2>

        <label style={lbl}>Client</label>
        <input value={client} onChange={e => setClient(e.target.value)} placeholder="Client or company name" style={{ ...inp, marginBottom: 12 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div><label style={lbl}>Contact Name</label><input value={contact} onChange={e => setContact(e.target.value)} style={inp} /></div>
          <div><label style={lbl}>Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} style={inp} /></div>
        </div>

        <label style={lbl}>Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} style={{ ...inp, marginBottom: 12 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={lbl}>Job Type</label>
            <select value={type} onChange={e => setType(e.target.value)} style={{ ...inp, appearance: 'auto' }}>
              {TYPES.map(t => <option key={t.key} value={t.key}>{t.label} — {fmt(t.price)}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Scheduled Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} />
          </div>
        </div>

        <label style={lbl}>Location</label>
        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Property address or Remote" style={{ ...inp, marginBottom: 12 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={lbl}>Shooter</label>
            <select value={shooter} onChange={e => setShooter(e.target.value)} style={{ ...inp, appearance: 'auto' }}>
              <option value="">None</option>
              {TEAM.filter(t => ['jev','julian'].includes(t.id)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Editor</label>
            <select value={editor} onChange={e => setEditor(e.target.value)} style={{ ...inp, appearance: 'auto' }}>
              <option value="">None</option>
              {TEAM.filter(t => ['wayan','hanif','pran','ridho'].includes(t.id)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>

        <label style={lbl}>Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ ...inp, marginBottom: 16, resize: 'vertical' }} />

        <div style={{ background: T.bg, borderRadius: 6, padding: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: T.textMuted }}>Quoted Price</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: T.accent }}>{fmt(quoted)}</span>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'transparent', color: T.text, border: '1px solid ' + T.borderLight, borderRadius: 7, padding: '8px 18px', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => {
            if (!client) return;
            onCreate({ id: 'JOB-' + String(Math.floor(Math.random() * 9000) + 1000), client, contact, email, phone, type, status: 'booked', quoted, scheduledDate: date, location, shooter: shooter || null, editor: editor || null, timeLogs: [], expenses: [], notes, created: '2026-03-27', invoice: 'none', callSummary: null, activity: [{ date: '2026-03-27', src: 'jobsense', text: 'Job created manually' }] });
            onClose();
          }} style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: 7, padding: '8px 24px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Create Job</button>
        </div>
      </div>
    </div>
  );
}

// ─── Job Detail Panel ─────────────────────────────────────────────────────────

function JobPanel({ job, onClose, onMove }: { job: Job; onClose: () => void; onMove: (id: string, ns: string) => void }) {
  const [tab, setTab] = useState('overview');
  const p    = jProfit(job);
  const c    = jCost(job);
  const st   = getSt(job.status);
  const ty   = getTy(job.type);
  const sIdx = STATUSES.findIndex(s => s.key === job.status);
  const next = sIdx < STATUSES.length - 1 ? STATUSES[sIdx + 1] : null;
  const tabs = job.callSummary ? ['overview', 'call', 'financials', 'activity'] : ['overview', 'financials', 'activity'];

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, width: 480, height: '100vh', background: T.card, borderLeft: '1px solid ' + T.border, zIndex: 300, display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 40px rgba(0,0,0,0.6)', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid ' + T.border, position: 'sticky', top: 0, background: T.card, zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: T.textDark, fontWeight: 700 }}>{job.id}</span>
            <Chip color={st.color} bg={st.bg}><Dot color={st.color} size={5} /> {st.label}</Chip>
            <InvBadge status={job.invoice} />
            {job.recurring && <Chip color={T.blue} bg={T.blueDim} small>Recurring</Chip>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.textMuted, fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: T.white, margin: '0 0 2px', fontFamily: 'Georgia, serif' }}>{job.client}</h2>
        <div style={{ fontSize: 11, color: T.textMuted }}>{job.contact} · {job.phone}</div>
        {next && (
          <button onClick={() => onMove(job.id, next.key)} style={{ marginTop: 8, background: T.accent, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer', width: '100%' }}>
            Move to {next.label} →
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid ' + T.border, padding: '0 20px' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 12px', fontSize: 11, fontWeight: tab === t ? 600 : 400, color: tab === t ? T.accent : T.textMuted, borderBottom: tab === t ? '2px solid ' + T.accent : '2px solid transparent', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '14px 20px', flex: 1 }}>
        {tab === 'overview' && (
          <div>
            <div style={{ background: T.bg, borderRadius: 7, padding: 12, marginBottom: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4 }}>
              {[{ l: 'Quoted', v: fmt(p.rev), c: T.accent }, { l: 'Cost', v: fmt(p.cost), c: T.text }, { l: 'Profit', v: (p.net < 0 ? '-' : '') + fmt(p.net), c: p.net >= 0 ? T.green : T.red }, { l: 'Margin', v: p.margin.toFixed(1) + '%', c: mc(p.margin) }].map((m, i) => (
                <div key={i}>
                  <div style={{ fontSize: 8, color: T.textDark, fontWeight: 600, textTransform: 'uppercase' }}>{m.l}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: m.c }}>{m.v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[{ l: 'Type', v: ty.label }, { l: 'SLA', v: null, node: <SLABadge job={job} /> }, { l: 'Scheduled', v: job.scheduledDate }, { l: 'Location', v: job.location }].map((m, i) => (
                <div key={i} style={{ background: T.bg, borderRadius: 5, padding: 8 }}>
                  <div style={{ fontSize: 8, color: T.textDark, fontWeight: 600, textTransform: 'uppercase' }}>{m.l}</div>
                  {m.node ? m.node : <div style={{ fontSize: 12, color: T.white, marginTop: 2 }}>{m.v}</div>}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: T.text, marginBottom: 6 }}>Team</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {[job.shooter, job.editor, ...(job.timeLogs || []).map(l => l.person)]
                .filter((v, i, a): v is string => !!v && a.indexOf(v) === i)
                .map(id => {
                  const pr = getP(id); if (!pr) return null;
                  const hrs = (job.timeLogs || []).filter(l => l.person === id).reduce((s, l) => s + l.hours, 0);
                  return (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 5, background: T.bg, borderRadius: 5, padding: '4px 8px' }}>
                      <Av id={id} size={20} />
                      <div>
                        <div style={{ fontSize: 10, color: T.white, fontWeight: 600 }}>{pr.name}</div>
                        <div style={{ fontSize: 8, color: T.textMuted }}>{hrs > 0 ? hrs.toFixed(1) + 'h' : 'Assigned'}</div>
                      </div>
                    </div>
                  );
                })}
            </div>
            {job.notes && <div style={{ fontSize: 11, color: T.textMuted, background: T.bg, borderRadius: 5, padding: 8, lineHeight: 1.5 }}>{job.notes}</div>}
          </div>
        )}

        {tab === 'call' && job.callSummary && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <SrcDot src="fireflies" />
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
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)' }}>
                <div style={{ width: Math.min(p.rev > 0 ? (p.cost / p.rev) * 100 : 0, 100) + '%', height: '100%', borderRadius: 3, background: p.cost / p.rev > 0.7 ? T.red : p.cost / p.rev > 0.5 ? T.amber : T.green }} />
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
                      <span style={{ fontSize: 10, color: T.text, flex: 1 }}>{pr?.name} — {l.task}</span>
                      <span style={{ fontSize: 10, color: T.textMuted }}>{l.hours}h</span>
                      <span style={{ fontSize: 10, color: T.accent, fontWeight: 600, minWidth: 45, textAlign: 'right' }}>{fmtD(l.hours * (pr?.rate || 0))}</span>
                    </div>
                  );
                })}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '6px 0', fontSize: 10, fontWeight: 700 }}>
                  <span style={{ color: T.textMuted }}>Labour: {fmtD(c.labour)}</span>
                  {c.expenses > 0 && <span style={{ color: T.textMuted }}>Exp: {fmtD(c.expenses)}</span>}
                  <span style={{ color: T.accent }}>Total: {fmtD(c.total)}</span>
                </div>
              </div>
            )}
            {(job.expenses || []).length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.text, marginBottom: 6 }}>Expenses</div>
                {job.expenses.map((e, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid ' + T.border, fontSize: 11 }}>
                    <span style={{ color: T.text }}>{e.desc}</span>
                    <span style={{ color: T.red, fontWeight: 600 }}>{fmt(e.amount)}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <SrcDot src="xero" />
              <span style={{ fontSize: 10, fontWeight: 600, color: T.text }}>Invoice (Xero)</span>
            </div>
            <div style={{ background: T.bg, borderRadius: 6, padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <InvBadge status={job.invoice} />
              <span style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>{fmt(job.quoted)}</span>
            </div>
          </div>
        )}

        {tab === 'activity' && (
          <div>
            {(job.activity || []).slice().reverse().map((a, i, arr) => (
              <div key={i} style={{ display: 'flex', gap: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16 }}>
                  <SrcDot src={a.src} />
                  {i < arr.length - 1 && <div style={{ width: 1, flex: 1, background: T.border, margin: '3px 0' }} />}
                </div>
                <div style={{ paddingBottom: 12 }}>
                  <div style={{ fontSize: 11, color: T.white }}>{a.text}</div>
                  <div style={{ fontSize: 9, color: T.textDark, marginTop: 1 }}>{a.date} · {a.src}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Today ────────────────────────────────────────────────────────────────────

function TodayPage({ jobs, onSelect }: { jobs: Job[]; onSelect: (j: Job) => void }) {
  const mo          = jobs.filter(j => j.created >= '2026-03-01');
  const rev         = mo.reduce((s, j) => s + j.quoted, 0);
  const profit      = mo.reduce((s, j) => s + jProfit(j).net, 0);
  const avgM        = mo.length ? mo.reduce((s, j) => s + jProfit(j).margin, 0) / mo.length : 0;
  const outstanding = jobs.filter(j => ['delivered','approved','invoiced'].includes(j.status)).reduce((s, j) => s + j.quoted, 0);
  const overdue     = jobs.filter(j => !['paid','approved','invoiced','delivered'].includes(j.status) && dayDiff(j.scheduledDate, '2026-03-27') > sla(j.type));
  const inProgress  = jobs.filter(j => ['in_edit','on_site'].includes(j.status));
  const attn        = jobs.filter(j => ['uploaded','qc_review','delivered'].includes(j.status));
  const upcoming    = jobs.filter(j => ['booked','scheduled'].includes(j.status)).sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: T.white, margin: 0 }}>Today</h1>
          <p style={{ color: T.textMuted, fontSize: 11, margin: '2px 0 0' }}>Thursday 27 March 2026</p>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { l: 'Revenue',     v: fmt(rev),       c: T.white,  s: mo.length + ' jobs this month' },
          { l: 'Profit',      v: fmt(profit),    c: T.green,  s: avgM.toFixed(0) + '% avg margin' },
          { l: 'Active Jobs', v: jobs.filter(j => j.status !== 'paid').length, c: T.accent, s: fmt(jobs.filter(j => j.status !== 'paid').reduce((s, j) => s + j.quoted, 0)) + ' in pipeline' },
          { l: 'Outstanding', v: fmt(outstanding), c: T.amber, s: 'awaiting payment' },
        ].map((m, i) => (
          <div key={i} style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontSize: 8, color: T.textDark, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{m.l}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: m.c, margin: '4px 0 2px' }}>{m.v}</div>
            <div style={{ fontSize: 9, color: T.textMuted }}>{m.s}</div>
          </div>
        ))}
      </div>

      {overdue.length > 0 && (
        <div style={{ background: T.redDim, border: '1px solid rgba(224,80,80,0.25)', borderRadius: 7, padding: '9px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: T.red, fontSize: 12, fontWeight: 700 }}>⚠ {overdue.length} job{overdue.length > 1 ? 's' : ''} overdue</span>
          <span style={{ color: T.textMuted, fontSize: 10 }}>— {overdue.map(j => j.client).join(', ')}</span>
        </div>
      )}

      {inProgress.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5, letterSpacing: '0.06em' }}>
            <Dot color={T.accent} size={6} /> ACTIVE RIGHT NOW
          </div>
          {inProgress.map(j => (
            <div key={j.id} onClick={() => onSelect(j)} style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 8, padding: 12, marginBottom: 6, cursor: 'pointer', borderLeft: '3px solid ' + getSt(j.status).color }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 9, color: T.textDark, fontWeight: 600 }}>{j.id}</span>
                <Chip color={getSt(j.status).color} bg={getSt(j.status).bg} small><Dot color={getSt(j.status).color} size={4} /> {getSt(j.status).label}</Chip>
                <Chip small>{getTy(j.type).label}</Chip>
                <SLABadge job={j} />
                <InvBadge status={j.invoice} />
                <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: T.accent }}>{fmt(j.quoted)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.white }}>{j.client}</div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>{j.location}</div>
                </div>
                <div style={{ display: 'flex', gap: 3 }}>
                  {[j.shooter, j.editor, ...(j.timeLogs||[]).map(l => l.person)].filter((v,i,a): v is string => !!v && a.indexOf(v)===i).map(id => <Av key={id} id={id} size={22} />)}
                </div>
              </div>
              <div style={{ marginTop: 8 }}><MarginBar job={j} /></div>
            </div>
          ))}
        </div>
      )}

      {attn.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.amber, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5, letterSpacing: '0.06em' }}>
            <Dot color={T.amber} size={6} /> NEEDS ATTENTION
          </div>
          {attn.map(j => (
            <div key={j.id} onClick={() => onSelect(j)} style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 7, padding: '10px 12px', marginBottom: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Chip color={getSt(j.status).color} bg={getSt(j.status).bg} small><Dot color={getSt(j.status).color} size={4} /> {getSt(j.status).label}</Chip>
              <span style={{ fontSize: 12, color: T.white, flex: 1, fontWeight: 500 }}>{j.client}</span>
              <SLABadge job={j} />
              <InvBadge status={j.invoice} />
              <span style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>{fmt(j.quoted)}</span>
            </div>
          ))}
        </div>
      )}

      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, marginBottom: 8, letterSpacing: '0.06em' }}>UPCOMING</div>
        {upcoming.map(j => (
          <div key={j.id} onClick={() => onSelect(j)} style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 7, padding: '10px 12px', marginBottom: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Chip color={getSt(j.status).color} bg={getSt(j.status).bg} small>{getSt(j.status).label}</Chip>
            <span style={{ fontSize: 12, color: T.white, flex: 1 }}>{j.client}</span>
            <span style={{ fontSize: 10, color: T.textMuted }}>{j.scheduledDate}</span>
            {j.shooter && <Av id={j.shooter} size={18} />}
            <Chip small>{getTy(j.type).label}</Chip>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>{fmt(j.quoted)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Board ────────────────────────────────────────────────────────────────────

function BoardPage({ jobs, onSelect }: { jobs: Job[]; onSelect: (j: Job) => void }) {
  return (
    <div>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: T.white, margin: '0 0 16px' }}>Job Board</h1>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16 }}>
        {STATUSES.map(st => {
          const col = jobs.filter(j => j.status === st.key);
          return (
            <div key={st.key} style={{ minWidth: 195, flex: '0 0 200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8, padding: '0 2px' }}>
                <Dot color={st.color} size={6} />
                <span style={{ fontSize: 10, fontWeight: 600, color: T.text }}>{st.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 9, color: T.textDark, background: 'rgba(255,255,255,0.03)', padding: '1px 6px', borderRadius: 6, fontWeight: 600 }}>{col.length}</span>
              </div>
              {col.map(j => (
                <div key={j.id} onClick={() => onSelect(j)} style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 7, padding: 10, marginBottom: 5, cursor: 'pointer', borderLeft: '3px solid ' + st.color }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 8, color: T.textDark, fontWeight: 600 }}>{j.id}</span>
                    <SLABadge job={j} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.white, marginBottom: 2 }}>{j.client}</div>
                  <div style={{ fontSize: 9, color: T.textDark, marginBottom: 6 }}>{getTy(j.type).label}</div>
                  <MarginBar job={j} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[j.shooter, j.editor].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).map(id => id && <Av key={id} id={id} size={16} />)}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.accent }}>{fmt(j.quoted)}</span>
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

// ─── All Jobs ─────────────────────────────────────────────────────────────────

function JobsPage({ jobs, onSelect }: { jobs: Job[]; onSelect: (j: Job) => void }) {
  const [q,  setQ]  = useState('');
  const [fs, setFs] = useState('all');
  const filtered = useMemo(() =>
    jobs.filter(j => {
      if (fs !== 'all' && j.status !== fs) return false;
      if (q && !j.client.toLowerCase().includes(q.toLowerCase()) && !j.id.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    }).sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()),
    [jobs, q, fs]
  );

  return (
    <div>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: T.white, margin: '0 0 14px' }}>All Jobs <span style={{ color: T.textDark, fontSize: 14, fontWeight: 400 }}>({filtered.length})</span></h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search client or job ID…" style={{ background: '#1a1a1a', border: '1px solid ' + T.borderLight, borderRadius: 6, padding: '7px 12px', fontSize: 12, color: T.white, width: 240, outline: 'none' }} />
        <select value={fs} onChange={e => setFs(e.target.value)} style={{ background: '#1a1a1a', border: '1px solid ' + T.borderLight, borderRadius: 6, padding: '7px 10px', fontSize: 11, color: T.text, outline: 'none' }}>
          <option value="all">All Statuses</option>
          {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>
      <div style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px 96px 1fr 85px 70px 52px', padding: '7px 16px', borderBottom: '1px solid ' + T.border, gap: 0 }}>
          {['ID','Status','Client','Invoice','Quoted','Margin'].map(h => (
            <span key={h} style={{ fontSize: 8, color: T.textDark, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
          ))}
        </div>
        {filtered.map(j => {
          const pr = jProfit(j); const st = getSt(j.status);
          return (
            <div key={j.id} onClick={() => onSelect(j)} style={{ display: 'grid', gridTemplateColumns: '60px 96px 1fr 85px 70px 52px', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid ' + T.border, cursor: 'pointer', gap: 0 }}>
              <span style={{ fontSize: 9, color: T.textDark, fontWeight: 600 }}>{j.id}</span>
              <Chip color={st.color} bg={st.bg} small><Dot color={st.color} size={4} /> {st.label}</Chip>
              <div>
                <div style={{ fontSize: 12, color: T.white, fontWeight: 500 }}>{j.client}</div>
                <div style={{ fontSize: 9, color: T.textDark }}>{j.scheduledDate} · {getTy(j.type).label}</div>
              </div>
              <InvBadge status={j.invoice} />
              <span style={{ fontSize: 12, fontWeight: 600, color: T.accent }}>{fmt(j.quoted)}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: mc(pr.margin) }}>{pr.margin.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Finance ──────────────────────────────────────────────────────────────────

function FinancePage({ jobs, onSelect }: { jobs: Job[]; onSelect: (j: Job) => void }) {
  const mo     = jobs.filter(j => j.created >= '2026-03-01');
  const rev    = mo.reduce((s, j) => s + j.quoted, 0);
  const cost   = mo.reduce((s, j) => s + jCost(j).total, 0);
  const profit = mo.reduce((s, j) => s + jProfit(j).net, 0);
  const avgM   = mo.length ? mo.reduce((s, j) => s + jProfit(j).margin, 0) / mo.length : 0;
  const outs   = jobs.filter(j => j.invoice === 'sent').reduce((s, j) => s + j.quoted, 0);

  const bt: Record<string, { cnt: number; rev: number; profit: number }> = {};
  mo.forEach(j => { if (!bt[j.type]) bt[j.type] = { cnt: 0, rev: 0, profit: 0 }; bt[j.type].cnt++; bt[j.type].rev += j.quoted; bt[j.type].profit += jProfit(j).net; });
  const mx = Math.max(...Object.values(bt).map(v => v.rev), 1);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <SrcDot src="xero" />
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: T.white, margin: 0 }}>Finance</h1>
        <span style={{ fontSize: 11, color: T.textMuted }}>March 2026</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 16 }}>
        {[{ l: 'Revenue', v: fmt(rev), c: T.white }, { l: 'Cost', v: fmt(cost), c: T.red }, { l: 'Profit', v: fmt(profit), c: T.green }, { l: 'Avg Margin', v: avgM.toFixed(1) + '%', c: mc(avgM) }, { l: 'Awaiting Payment', v: fmt(outs), c: T.amber }].map((m, i) => (
          <div key={i} style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 8, color: T.textDark, fontWeight: 600, textTransform: 'uppercase' }}>{m.l}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: m.c, marginTop: 4 }}>{m.v}</div>
          </div>
        ))}
      </div>

      <div style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 12 }}>Revenue by Service</div>
        {Object.entries(bt).sort((a, b) => b[1].rev - a[1].rev).map(([type, d]) => {
          const m = d.rev > 0 ? (d.profit / d.rev) * 100 : 0;
          return (
            <div key={type} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                <span style={{ color: T.white }}>{getTy(type).label} <span style={{ color: T.textDark }}>×{d.cnt}</span></span>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ color: T.accent, fontWeight: 600 }}>{fmt(d.rev)}</span>
                  <span style={{ color: T.green, fontWeight: 600 }}>{fmt(d.profit)}</span>
                  <span style={{ color: mc(m), fontWeight: 700, minWidth: 32 }}>{m.toFixed(0)}%</span>
                </div>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.04)' }}>
                <div style={{ width: (d.rev / mx) * 100 + '%', height: '100%', borderRadius: 2, background: 'linear-gradient(90deg,' + T.accent + ',' + T.accentLight + ')' }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.text, padding: '12px 16px', borderBottom: '1px solid ' + T.border }}>Job P&L</div>
        {jobs.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()).map(j => {
          const pr = jProfit(j);
          return (
            <div key={j.id} onClick={() => onSelect(j)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderBottom: '1px solid ' + T.border, cursor: 'pointer' }}>
              <span style={{ fontSize: 9, color: T.textDark, fontWeight: 600, minWidth: 52 }}>{j.id}</span>
              <span style={{ fontSize: 11, color: T.white, flex: 1 }}>{j.client}</span>
              <InvBadge status={j.invoice} />
              <span style={{ fontSize: 11, fontWeight: 600, color: T.accent }}>{fmt(j.quoted)}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: pr.net >= 0 ? T.green : T.red, minWidth: 52, textAlign: 'right' }}>{fmt(pr.net)}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: mc(pr.margin), minWidth: 32, textAlign: 'right' }}>{pr.margin.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── QuoteSense ───────────────────────────────────────────────────────────────

const SERVICES: ServiceCategory[] = [
  { cat: 'VIDEO', items: [
    { id: 'video',     label: 'Cinematic Property Video (60-90s)', price: 849,  stdRate: 2122, cost: 302,  team: 'Jev shoots + Wayan edits',              hours: '15.5h' },
    { id: 'video_vfx', label: 'VFX / AI Video',                   price: 940,  stdRate: 2350, cost: 314,  team: 'Jev shoots + Wayan edits + VFX',        hours: '17.5h' },
    { id: 'youtube',   label: 'YouTube Video (11 min cinematic)',  price: 2000, stdRate: 5000, cost: 419,  team: 'Jev shoots + Hanif edits',              hours: '24.5h' },
  ]},
  { cat: 'ADD-ONS', items: [
    { id: 'reel_1',       label: 'Extra Reel (1)',                   price: 70,   stdRate: 175,  cost: 6,   team: 'Wayan',       hours: '1h' },
    { id: 'reel_2',       label: 'Extra Reels ×2 (10% off)',         price: 126,  stdRate: 315,  cost: 12,  team: 'Wayan',       hours: '2h' },
    { id: 'reel_3',       label: 'Extra Reels ×3 (20% off)',         price: 168,  stdRate: 420,  cost: 18,  team: 'Wayan',       hours: '3h' },
    { id: 'drone',        label: 'Drone Aerials',                    price: 95,   stdRate: 238,  cost: 0,   team: 'Jev (site)',  hours: '0h extra' },
    { id: 'drone_bundle', label: 'Drone + Reel Bundle (15% off)',    price: 81,   stdRate: 203,  cost: 0,   team: 'Jev',         hours: '0h extra' },
    { id: 'floor_plan',   label: 'Floor Plan (1 level)',             price: 40,   stdRate: 100,  cost: 24,  team: 'Hanif 3h',   hours: '3h' },
  ]},
  { cat: 'MEDIA PACKAGES', items: [
    { id: 'photos_video', label: 'Photos + Video Package', price: 1484, stdRate: 3405, cost: 937,  team: 'Jev + Wayan + Bruno photos + drone', hours: '15.5h + Bruno' },
    { id: 'full_media',   label: 'Veblen Full Media',      price: 1650, stdRate: 4125, cost: 1011, team: 'Jev + Editor + Bruno + VFX + twilight + reel', hours: '19.5h + Bruno' },
  ]},
  { cat: 'LEAD GENERATION', items: [
    { id: 'ad_setup',   label: 'Ad Campaign Setup (Meta or Google)', price: 600,  stdRate: 1500, cost: 199, team: 'Jev 4h + Zac 1h', hours: '5h' },
    { id: 'ad_weekly',  label: 'Ad Management (per week)',           price: 300,  stdRate: 750,  cost: 68,  team: 'Jev 2h/wk',      hours: '2h/wk',  note: 'Recurring' },
    { id: 'ad_monthly', label: 'Ad Management (per month)',          price: 1300, stdRate: 3250, cost: 292, team: 'Jev 8.7h/mo',    hours: '8.7h/mo', note: 'Recurring' },
  ]},
  { cat: 'GHL / CRM', items: [
    { id: 'ghl_build',    label: 'GHL Full CRM Build (48h quoted)',    price: 650,   stdRate: 1200, cost: 186,  team: 'Gab 24h actual', hours: '24h (quoted 48h @ $9.90/hr)', note: 'Display $9.90/hr' },
    { id: 'ghl_monthly',  label: 'GHL Monthly Management',            price: 230,   stdRate: 2300, cost: 67,   team: 'Gab 2h/wk',     hours: '8.66h/mo', note: '$200 mgmt + $30 Zapier' },
    { id: 'ghl_extra_hr', label: 'GHL Extra Hour (beyond 2h/wk)',     price: 19.80, stdRate: 100,  cost: 7.75, team: 'Gab',            hours: '1h (quoted 2h @ $9.90)', note: 'Double hours' },
  ]},
  { cat: 'WEBSITE', items: [
    { id: 'website', label: 'Professional Website (5-day build)', price: 2000, stdRate: 5000, cost: 689, team: 'Risna 40h + Hanif 16h + Gen 12h', hours: '68h' },
  ]},
  { cat: 'SOCIAL MEDIA', items: [
    { id: 'social', label: 'Monthly Social Media Management', price: 99, stdRate: 250, cost: 14, team: 'Mimi 3h/mo', hours: '3h/mo', note: 'Recurring' },
  ]},
  { cat: 'CONSULTING', items: [
    { id: 'consult_1h',   label: 'Consulting — 1 Hour',       price: 250,  stdRate: 625,  cost: 0, team: 'Zac', hours: '1h',  note: 'Pure margin' },
    { id: 'consult_half', label: 'Consulting — Half Day (4h)', price: 750,  stdRate: 1875, cost: 0, team: 'Zac', hours: '4h',  note: 'Pure margin' },
    { id: 'consult_full', label: 'Consulting — Full Day (8h)', price: 1500, stdRate: 3750, cost: 0, team: 'Zac', hours: '8h',  note: 'Pure margin' },
  ]},
  { cat: 'RETAINER PACKAGES', items: [
    { id: 'ret_starter', label: 'Starter Retainer (Ads + GHL + Social)',             price: 1600, stdRate: 4000,  cost: 507,  team: 'Jev ads + Gab GHL + Mimi + Zac', hours: '22.3h/mo', note: 'Monthly' },
    { id: 'ret_growth',  label: 'Growth Retainer (2 shoots + Ads + GHL)',            price: 3800, stdRate: 9500,  cost: 1139, team: 'Jev + Gab + Mimi + Zac',          hours: '55.3h/mo', note: 'Monthly' },
    { id: 'ret_full',    label: 'Full Service Retainer (4 shoots + everything)',     price: 5497, stdRate: 13743, cost: 1957, team: 'Full team',                        hours: '98.3h/mo', note: 'Monthly' },
  ]},
];

function QuoteSensePage() {
  const [clientName,  setClientName]  = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [items,       setItems]       = useState<QuoteItem[]>([]);
  const [discount,    setDiscount]    = useState(0);
  const [showStd,     setShowStd]     = useState(true);
  const [openCat,     setOpenCat]     = useState('VIDEO');

  const addItem  = (s: ServiceItem) => { const ex = items.find(i => i.id === s.id); ex ? setItems(items.map(i => i.id === s.id ? { ...i, qty: i.qty + 1 } : i)) : setItems([...items, { ...s, qty: 1 }]); };
  const removeIt = (id: string)     => setItems(items.filter(i => i.id !== id));
  const updateQ  = (id: string, q: number) => { if (q <= 0) return removeIt(id); setItems(items.map(i => i.id === id ? { ...i, qty: q } : i)); };

  const subtotal      = items.reduce((s, i) => s + i.price * i.qty, 0);
  const discountAmt   = subtotal * (discount / 100);
  const total         = subtotal - discountAmt;
  const totalStd      = items.reduce((s, i) => s + i.stdRate * i.qty, 0);
  const totalCost     = items.reduce((s, i) => s + i.cost * i.qty, 0);
  const preTaxProfit  = total - totalCost;
  const afterTaxProfit = preTaxProfit > 0 ? preTaxProfit * 0.75 : preTaxProfit;
  const margin        = total > 0 ? (afterTaxProfit / total) * 100 : 0;

  const inp: React.CSSProperties = { background: '#1a1a1a', border: '1px solid ' + T.borderLight, borderRadius: 5, padding: '6px 10px', fontSize: 11, color: T.white, outline: 'none', width: '100%', boxSizing: 'border-box' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: T.white, margin: 0 }}>QuoteSense</h1>
          <p style={{ color: T.textMuted, fontSize: 11, margin: '2px 0 0' }}>Build quotes with live margin tracking</p>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.textMuted, cursor: 'pointer' }}>
          <input type="checkbox" checked={showStd} onChange={e => setShowStd(e.target.checked)} />
          Show standard rates
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* LEFT */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 9, color: T.textDark, fontWeight: 600, textTransform: 'uppercase' as const, display: 'block', marginBottom: 4 }}>Client</label>
              <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client name" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 9, color: T.textDark, fontWeight: 600, textTransform: 'uppercase' as const, display: 'block', marginBottom: 4 }}>Email</label>
              <input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="Email" style={inp} />
            </div>
          </div>

          {SERVICES.map(cat => (
            <div key={cat.cat} style={{ marginBottom: 6 }}>
              <div onClick={() => setOpenCat(openCat === cat.cat ? '' : cat.cat)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: T.card, border: '1px solid ' + T.border, borderRadius: openCat === cat.cat ? '6px 6px 0 0' : 6, cursor: 'pointer' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.accent, letterSpacing: '0.06em' }}>{cat.cat}</span>
                <span style={{ fontSize: 10, color: T.textDark }}>{openCat === cat.cat ? '▾' : '▸'} {cat.items.length}</span>
              </div>
              {openCat === cat.cat && (
                <div style={{ border: '1px solid ' + T.border, borderTop: 'none', borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>
                  {cat.items.map(svc => {
                    const inQ = items.some(i => i.id === svc.id);
                    const sm  = svc.price > 0 ? (((svc.price - svc.cost) * 0.75) / svc.price) * 100 : 100;
                    return (
                      <div key={svc.id} onClick={() => !inQ && addItem(svc)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderBottom: '1px solid ' + T.border, cursor: inQ ? 'default' : 'pointer', background: inQ ? 'rgba(212,132,90,0.07)' : 'transparent' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, color: T.white, fontWeight: 500 }}>{svc.label}</div>
                          <div style={{ fontSize: 9, color: T.textDark, marginTop: 1 }}>{svc.team} · {svc.hours}</div>
                          {svc.note && <div style={{ fontSize: 8, color: T.amber, marginTop: 1 }}>{svc.note}</div>}
                        </div>
                        <div style={{ textAlign: 'right', minWidth: 65 }}>
                          {showStd && <div style={{ fontSize: 9, color: T.textDark, textDecoration: 'line-through' }}>{fmt(svc.stdRate)}</div>}
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.accent }}>{fmt(svc.price)}</div>
                          <div style={{ fontSize: 8, color: mc(sm), fontWeight: 600 }}>{sm.toFixed(0)}%</div>
                        </div>
                        <div style={{ width: 24, height: 24, borderRadius: 5, background: inQ ? T.green : T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: inQ ? 11 : 16, fontWeight: 700, flexShrink: 0 }}>
                          {inQ ? '✓' : '+'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* RIGHT */}
        <div>
          <div style={{ background: T.card, border: '1px solid ' + T.border, borderRadius: 8, padding: 18, position: 'sticky', top: 80 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 2 }}>{clientName || 'New Quote'}</div>
            {clientEmail && <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 14 }}>{clientEmail}</div>}

            {items.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: T.textDark, fontSize: 12 }}>
                Click services on the left to add them to this quote
              </div>
            ) : (
              <div>
                {items.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid ' + T.border }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: T.white }}>{item.label}</div>
                      {showStd && <div style={{ fontSize: 9, color: T.textDark, textDecoration: 'line-through' }}>{fmt(item.stdRate * item.qty)}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button onClick={() => updateQ(item.id, item.qty - 1)} style={{ width: 22, height: 22, borderRadius: 4, background: '#252525', border: 'none', color: T.text, cursor: 'pointer' }}>-</button>
                      <span style={{ fontSize: 12, color: T.white, minWidth: 18, textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => updateQ(item.id, item.qty + 1)} style={{ width: 22, height: 22, borderRadius: 4, background: '#252525', border: 'none', color: T.text, cursor: 'pointer' }}>+</button>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.accent, minWidth: 54, textAlign: 'right' }}>{fmt(item.price * item.qty)}</span>
                    <button onClick={() => removeIt(item.id)} style={{ background: 'none', border: 'none', color: T.red, fontSize: 16, cursor: 'pointer', padding: 0 }}>×</button>
                  </div>
                ))}

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', borderBottom: '1px solid ' + T.border }}>
                  <span style={{ fontSize: 11, color: T.textMuted, flex: 1 }}>Discount %</span>
                  <input type="number" value={discount} onChange={e => setDiscount(Math.max(0, Math.min(100, Number(e.target.value))))} style={{ ...inp, width: 56, textAlign: 'right' }} />
                  {discount > 0 && <span style={{ fontSize: 11, color: T.red, minWidth: 50 }}>-{fmt(discountAmt)}</span>}
                </div>

                <div style={{ paddingTop: 14 }}>
                  {showStd && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontSize: 11, color: T.textDark }}>Standard Rate</span><span style={{ fontSize: 12, color: T.textDark, textDecoration: 'line-through' }}>{fmt(totalStd)}</span></div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.white }}>TOTAL (ex GST)</span>
                    <span style={{ fontSize: 22, fontWeight: 700, color: T.accent }}>{fmt(total)}</span>
                  </div>
                  {showStd && total < totalStd && <div style={{ background: T.greenDim, borderRadius: 5, padding: '6px 10px', textAlign: 'center', marginBottom: 12 }}><span style={{ fontSize: 11, fontWeight: 600, color: T.green }}>Client saves {fmt(totalStd - total)}</span></div>}
                </div>

                {/* Internal P&L */}
                <div style={{ background: T.bg, borderRadius: 6, padding: 12, marginBottom: 14 }}>
                  <div style={{ fontSize: 8, color: T.textDark, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>INTERNAL — not shown to client</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4, marginBottom: 8 }}>
                    {[{ l: 'Revenue', v: fmt(total), c: T.white }, { l: 'Cost', v: fmt(totalCost), c: T.text }, { l: 'Profit', v: (afterTaxProfit < 0 ? '-' : '') + fmt(afterTaxProfit), c: afterTaxProfit >= 0 ? T.green : T.red }, { l: 'Margin', v: margin.toFixed(1) + '%', c: mc(margin) }].map((m, i) => (
                      <div key={i}>
                        <div style={{ fontSize: 7, color: T.textDark, fontWeight: 600, textTransform: 'uppercase' }}>{m.l}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: m.c }}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.04)' }}>
                    <div style={{ width: Math.min(Math.max(margin, 0), 100) + '%', height: '100%', borderRadius: 2, background: mc(margin) }} />
                  </div>
                  {margin > 0 && margin < 50 && <div style={{ fontSize: 9, color: T.amber, marginTop: 5 }}>Below 50% target. Increase total to hit margin goal.</div>}
                  {margin < 0 && <div style={{ fontSize: 9, color: T.red, marginTop: 5 }}>This quote loses money.</div>}
                </div>

                {/* Team */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 9, color: T.textDark, fontWeight: 600, textTransform: 'uppercase', marginBottom: 5 }}>Team required</div>
                  {items.map(item => <div key={item.id} style={{ fontSize: 10, color: T.textMuted, padding: '2px 0' }}>{item.team} · {item.hours}</div>)}
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={{ flex: 1, background: T.accent, color: '#fff', border: 'none', borderRadius: 6, padding: '11px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Create Job from Quote</button>
                  <button style={{ background: '#252525', color: T.text, border: 'none', borderRadius: 6, padding: '11px 14px', fontSize: 11, cursor: 'pointer' }}>PDF</button>
                  <button onClick={() => { setItems([]); setDiscount(0); setClientName(''); setClientEmail(''); }} style={{ background: 'transparent', color: T.textDark, border: '1px solid ' + T.borderLight, borderRadius: 6, padding: '11px 14px', fontSize: 11, cursor: 'pointer' }}>Clear</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'today',   label: 'Today'     },
  { id: 'board',   label: 'Job Board' },
  { id: 'jobs',    label: 'All Jobs'  },
  { id: 'quotes',  label: 'QuoteSense'},
  { id: 'finance', label: 'Finance'   },
];

export default function JobSenseApp() {
  const [page,       setPage]       = useState('today');
  const [jobs,       setJobs]       = useState<Job[]>(INIT);
  const [sel,        setSel]        = useState<Job | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const move = useCallback((id: string, ns: string) => {
    const entry: ActivityItem = { date: '2026-03-27', src: 'jobsense', text: 'Moved to ' + getSt(ns).label };
    setJobs(prev => prev.map(j => j.id !== id ? j : { ...j, status: ns, activity: [...j.activity, entry] }));
    setSel(prev  => prev?.id === id ? { ...prev, status: ns, activity: [...prev.activity, entry] } : prev);
  }, []);

  const create = useCallback((job: Job) => setJobs(prev => [...prev, job]), []);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: T.text }}>

      {/* ── Topbar ── */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: T.card, borderBottom: '1px solid ' + T.border, display: 'flex', alignItems: 'center', padding: '0 24px', height: 52 }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 24 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,' + T.accent + ',' + T.accentLight + ')', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 14 }}>J</div>
          <div>
            <div style={{ fontWeight: 700, color: T.white, fontSize: 14, fontFamily: 'Georgia, serif', lineHeight: 1.1 }}>JobSense</div>
            <div style={{ fontSize: 8, color: T.textDark, letterSpacing: '0.06em' }}>VEBLEN GROUP</div>
          </div>
        </div>

        {/* Nav tabs */}
        {TABS.map(t => (
          <button key={t.id} onClick={() => setPage(t.id)} style={{ padding: '0 14px', height: '100%', background: 'none', border: 'none', borderBottom: page === t.id ? '2px solid ' + T.accent : '2px solid transparent', color: page === t.id ? T.white : T.textMuted, fontSize: 12, fontWeight: page === t.id ? 600 : 400, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        {/* System dots */}
        <div style={{ display: 'flex', gap: 10, marginRight: 20 }}>
          {[['H', SRC_COLOR.hubspot], ['X', SRC_COLOR.xero], ['F', SRC_COLOR.fireflies], ['E', SRC_COLOR.eversense]].map(([l, c]) => (
            <div key={l} title={l === 'H' ? 'HubSpot' : l === 'X' ? 'Xero' : l === 'F' ? 'Fireflies' : 'EverSense'} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Dot color={T.green} size={5} />
              <span style={{ fontSize: 9, color: T.textDark }}>{l === 'H' ? 'HubSpot' : l === 'X' ? 'Xero' : l === 'F' ? 'Fireflies' : 'EverSense'}</span>
            </div>
          ))}
        </div>

        {/* New Job */}
        <button onClick={() => setShowCreate(true)} style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: 7, padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          + New Job
        </button>
      </div>

      {/* ── Page Content ── */}
      <div style={{ paddingTop: 52 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 24px' }}>
          {page === 'today'   && <TodayPage    jobs={jobs} onSelect={setSel} />}
          {page === 'board'   && <BoardPage    jobs={jobs} onSelect={setSel} />}
          {page === 'jobs'    && <JobsPage     jobs={jobs} onSelect={setSel} />}
          {page === 'quotes'  && <QuoteSensePage />}
          {page === 'finance' && <FinancePage  jobs={jobs} onSelect={setSel} />}
        </div>
      </div>

      {/* ── Job Panel + backdrop ── */}
      {sel && <div onClick={() => setSel(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 250 }} />}
      {sel && <JobPanel job={sel} onClose={() => setSel(null)} onMove={move} />}

      {/* ── Create Modal ── */}
      {showCreate && <CreateJobModal onClose={() => setShowCreate(false)} onCreate={create} />}
    </div>
  );
}
