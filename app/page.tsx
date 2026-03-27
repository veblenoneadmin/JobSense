'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  LayoutDashboard, KanbanSquare, ListChecks, FileText, BarChart3,
  Bell, ChevronDown, LogOut, Menu, X, CheckCheck, AlertTriangle,
  Clock, CalendarDays, Users, Video, Info, ArrowLeft,
} from 'lucide-react';

// ── EverSense VS theme (exact match) ────────────────────────────────────────
const VS = {
  bg0:    '#1e1e1e',
  bg1:    '#252526',
  bg2:    '#2d2d2d',
  bg3:    '#333333',
  border: '#3c3c3c',
  text0:  '#f0f0f0',
  text1:  '#c0c0c0',
  text2:  '#909090',
  accent: '#007acc',
  red:    '#f44747',
  green:  '#6a9955',
  teal:   '#4ec9b0',
};

// ── JobSense copper palette (content-level only) ─────────────────────────────
const J = {
  copper:    '#D4845A',
  copperLt:  '#E8A87C',
  copperDim: 'rgba(212,132,90,0.12)',
  card:      '#1e1e1e',
  cardInner: '#252526',
  border:    '#3c3c3c',
  borderLt:  '#454545',
  white:     '#f0f0f0',
  text:      '#909090',
  textMuted: '#666666',
  textDark:  '#444444',
  green:     '#4ec9b0',
  greenDim:  'rgba(78,201,176,0.10)',
  red:       '#f44747',
  redDim:    'rgba(244,71,71,0.10)',
  amber:     '#dcdcaa',
  amberDim:  'rgba(220,220,170,0.10)',
  blue:      '#569cd6',
  blueDim:   'rgba(86,156,214,0.10)',
  mauve:     '#c586c0',
  mauveDim:  'rgba(197,134,192,0.10)',
  purple:    '#b267e6',
  purpleDim: 'rgba(178,103,230,0.10)',
};

// ── Types ────────────────────────────────────────────────────────────────────
interface TimeLog    { person: string; hours: number; task: string; }
interface Expense    { desc: string; amount: number; }
interface Activity   { date: string; src: string; text: string; }
interface Job {
  id: string; client: string; contact: string; phone: string; email: string;
  type: string; status: string; quoted: number; scheduledDate: string;
  location: string; shooter: string | null; editor: string | null;
  timeLogs: TimeLog[]; expenses: Expense[]; notes: string;
  created: string; invoice: string; callSummary: string | null;
  activity: Activity[]; recurring?: boolean;
}
interface TeamMember { id: string; name: string; role: string; rate: number; color: string; }
interface SvcItem    { id: string; label: string; price: number; stdRate: number; cost: number; team: string; hours: string; note?: string; }
interface SvcCat     { cat: string; items: SvcItem[]; }
interface QuoteItem  extends SvcItem { qty: number; }

// ── Data ─────────────────────────────────────────────────────────────────────
const STATUSES = [
  { key: 'booked',    label: 'Booked',    color: J.blue,    bg: J.blueDim },
  { key: 'scheduled', label: 'Scheduled', color: '#6DAF8D', bg: 'rgba(109,175,141,0.10)' },
  { key: 'on_site',   label: 'On Site',   color: J.amber,   bg: J.amberDim },
  { key: 'uploaded',  label: 'Uploaded',  color: J.mauve,   bg: J.mauveDim },
  { key: 'in_edit',   label: 'In Edit',   color: J.copper,  bg: J.copperDim },
  { key: 'qc_review', label: 'QC Review', color: J.copperLt,bg: 'rgba(232,168,124,0.10)' },
  { key: 'delivered', label: 'Delivered', color: J.green,   bg: J.greenDim },
  { key: 'approved',  label: 'Approved',  color: '#4CAF80', bg: 'rgba(76,175,128,0.10)' },
  { key: 'invoiced',  label: 'Invoiced',  color: J.purple,  bg: J.purpleDim },
  { key: 'paid',      label: 'Paid',      color: '#4ADE80', bg: 'rgba(74,222,128,0.12)' },
];
const getSt = (k: string) => STATUSES.find(s => s.key === k) || { label: k, color: '#555', bg: 'rgba(85,85,85,0.1)' };

const TYPES = [
  { key: 'video',         label: 'Video',        price: 849  },
  { key: 'full_media',    label: 'Full Media',   price: 1650 },
  { key: 'photos_video',  label: 'Photos+Video', price: 1484 },
  { key: 'website',       label: 'Website',      price: 2000 },
  { key: 'ghl_build',     label: 'GHL Build',    price: 650  },
  { key: 'ad_setup',      label: 'Ad Setup',     price: 600  },
  { key: 'ad_management', label: 'Ad Mgmt',      price: 1300 },
  { key: 'youtube',       label: 'YouTube',      price: 2000 },
  { key: 'social_media',  label: 'Social',       price: 99   },
  { key: 'consulting',    label: 'Consulting',   price: 250  },
];
const getTy = (k: string) => TYPES.find(t => t.key === k) || { label: k, price: 0 };

const TEAM: TeamMember[] = [
  { id: 'zac',    name: 'Zac',    role: 'Director',     rate: 64.19, color: '#D4845A' },
  { id: 'jev',    name: 'Jev',    role: 'Shooter',      rate: 34.42, color: '#569cd6' },
  { id: 'gen',    name: 'Gen',    role: 'Dev',          rate: 7.97,  color: '#4ec9b0' },
  { id: 'gab',    name: 'Gab',    role: 'GHL/CRM',      rate: 7.75,  color: '#b267e6' },
  { id: 'hanif',  name: 'Hanif',  role: 'Creative',     rate: 8.52,  color: '#E8A87C' },
  { id: 'wayan',  name: 'Wayan',  role: 'Editor',       rate: 6.37,  color: '#c586c0' },
  { id: 'pran',   name: 'Pran',   role: 'Editor',       rate: 4.20,  color: '#6a9955' },
  { id: 'ridho',  name: 'Ridho',  role: 'Editor',       rate: 4.20,  color: '#f44747' },
  { id: 'risna',  name: 'Risna',  role: 'Web Dev',      rate: 5.22,  color: '#dcdcaa' },
  { id: 'mimi',   name: 'Mimi',   role: 'Social',       rate: 4.75,  color: '#4ec9b0' },
  { id: 'julian', name: 'Julian', role: 'Ext. Shooter', rate: 85,    color: '#909090' },
];
const getP = (id: string) => TEAM.find(t => t.id === id);

const fmt  = (n: number) => '$' + Math.abs(n).toLocaleString('en-AU', { maximumFractionDigits: 0 });
const fmtD = (n: number) => '$' + Math.abs(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function jCost(j: Job) {
  const lab = (j.timeLogs||[]).reduce((s,l) => { const p=getP(l.person); return s+(p?p.rate*l.hours:0); }, 0);
  const exp = (j.expenses||[]).reduce((s,e) => s+e.amount, 0);
  return { labour: lab, expenses: exp, total: lab+exp };
}
function jProfit(j: Job) {
  const c=jCost(j).total, pre=j.quoted-c, tax=pre>0?pre*0.25:0;
  return { rev:j.quoted, cost:c, net:pre-tax, margin:j.quoted>0?((pre-tax)/j.quoted)*100:0 };
}
function mc(m: number) { return m>=50?J.green:m>=35?J.amber:J.red; }
function sla(t: string): number { return ({video:5,full_media:7,photos_video:5,website:5,ghl_build:10,ad_setup:3,youtube:10} as Record<string,number>)[t]||5; }
function dayDiff(a: string, b: string) { return Math.ceil((new Date(b).getTime()-new Date(a).getTime())/86400000); }

const SRC_COLOR: Record<string,string> = { hubspot:'#FF7A59', eversense:VS.accent, xero:'#13B5EA', fireflies:'#A855F7', jobsense:J.copper };
const SRC_ICON:  Record<string,string> = { hubspot:'H', eversense:'E', xero:'X', fireflies:'F', jobsense:'J' };
const INV: Record<string,{label:string;color:string;bg:string}> = {
  none:    { label:'No Invoice', color:J.textDark,  bg:'rgba(68,68,68,0.15)' },
  draft:   { label:'Draft',      color:J.textMuted, bg:'rgba(102,102,102,0.15)' },
  sent:    { label:'Sent',       color:J.amber,     bg:J.amberDim },
  overdue: { label:'Overdue',    color:J.red,       bg:J.redDim },
  paid:    { label:'Paid',       color:J.green,     bg:J.greenDim },
};

const INIT: Job[] = [
  { id:'JOB-0001', client:'Ray White Burleigh',   contact:'Sarah Mitchell', phone:'0412 345 678', email:'sarah@rwburleigh.com.au',  type:'video',         status:'paid',      quoted:849,  scheduledDate:'2026-03-10', location:'42 Hedges Ave, Mermaid Beach',   shooter:'jev',    editor:'wayan',  timeLogs:[{person:'jev',hours:5.5,task:'Shoot'},{person:'jev',hours:2,task:'Notes'},{person:'wayan',hours:7.5,task:'Edit'}], expenses:[], notes:'Waterfront. Client loved it.', created:'2026-03-08', invoice:'paid',  callSummary:'Agent wants cinematic style. Budget confirmed $849. Wants it for Domain listing next week.', activity:[{date:'2026-03-08',src:'hubspot',text:'Deal closed — job auto-created'},{date:'2026-03-10',src:'eversense',text:'Jev logged 5.5h shoot'},{date:'2026-03-12',src:'eversense',text:'Wayan started edit'},{date:'2026-03-15',src:'jobsense',text:'Delivered to client'},{date:'2026-03-15',src:'xero',text:'Invoice #1038 sent'},{date:'2026-03-18',src:'xero',text:'Payment received'}] },
  { id:'JOB-0002', client:'Kollosche',             contact:"James D'Arcy",  phone:'0423 456 789', email:'james@kollosche.com.au',    type:'full_media',    status:'delivered', quoted:1650, scheduledDate:'2026-03-18', location:'1 Admiralty Dr, Paradise Waters',shooter:'jev',    editor:'hanif',  timeLogs:[{person:'jev',hours:5.5,task:'Shoot'},{person:'jev',hours:2,task:'Notes'},{person:'hanif',hours:12,task:'Edit'},{person:'hanif',hours:4,task:'VFX'},{person:'pran',hours:3,task:'Floor plan'}], expenses:[{desc:'Bruno Photos',amount:330},{desc:'Bruno Drone',amount:150}], notes:'Luxury waterfront. Twilight shoot.', created:'2026-03-14', invoice:'sent',  callSummary:'Premium listing $4.2M. Wants full package including twilight. Happy with $1,650. Mentioned 3 more listings coming.', activity:[{date:'2026-03-14',src:'hubspot',text:'Deal closed'},{date:'2026-03-18',src:'eversense',text:'Shoot completed'},{date:'2026-03-20',src:'eversense',text:'Hanif started VFX edit'},{date:'2026-03-24',src:'jobsense',text:'Delivered to client'},{date:'2026-03-24',src:'xero',text:'Invoice #1041 sent'}] },
  { id:'JOB-0003', client:'LJ Hooker Broadbeach', contact:'Tim Nguyen',    phone:'0434 567 890', email:'tim@ljh.com.au',            type:'video',         status:'in_edit',   quoted:849,  scheduledDate:'2026-03-24', location:'Surfers Paradise',               shooter:'jev',    editor:'wayan',  timeLogs:[{person:'jev',hours:5.5,task:'Shoot'},{person:'jev',hours:1.5,task:'Notes'},{person:'wayan',hours:3,task:'Edit (in progress)'}], expenses:[], notes:'High-rise apartment. Good views.', created:'2026-03-20', invoice:'none',  callSummary:'First time client. Saw our Instagram. Wants to try one video, if good will do all listings.', activity:[{date:'2026-03-20',src:'hubspot',text:'Deal closed'},{date:'2026-03-20',src:'fireflies',text:'10-min qual call — qualified'},{date:'2026-03-24',src:'eversense',text:'Shoot completed'},{date:'2026-03-25',src:'eversense',text:'Wayan editing — 3h logged'}] },
  { id:'JOB-0004', client:'Master Tint',          contact:'Dave Wilson',   phone:'0445 678 901', email:'dave@mastertint.com.au',    type:'ghl_build',     status:'in_edit',   quoted:650,  scheduledDate:'2026-03-20', location:'Remote',                         shooter:null,     editor:null,     timeLogs:[{person:'gab',hours:16,task:'GHL build (67%)'}], expenses:[], notes:'Full GHL. Pipelines, automations, booking widget.', created:'2026-03-18', invoice:'none',  callSummary:'Tradie. No CRM currently. Wants booking system and follow-up automation.', activity:[{date:'2026-03-18',src:'hubspot',text:'Deal closed'},{date:'2026-03-18',src:'fireflies',text:'Qual call — needs full build'},{date:'2026-03-22',src:'eversense',text:'16h logged — 67% complete'}] },
  { id:'JOB-0005', client:'RE/MAX Gold Coast',    contact:'Lisa Chen',     phone:'0456 789 012', email:'lisa@remax.com.au',         type:'video',         status:'scheduled', quoted:849,  scheduledDate:'2026-03-28', location:'88 Surf Pde, Broadbeach',        shooter:'jev',    editor:'ridho',  timeLogs:[], expenses:[], notes:'Agent wants to appear in video.', created:'2026-03-25', invoice:'none',  callSummary:'Experienced agent. 10+ listings/month. Interested in ad management too.', activity:[{date:'2026-03-25',src:'hubspot',text:'Deal closed'},{date:'2026-03-25',src:'fireflies',text:'Qual call — high potential'},{date:'2026-03-25',src:'jobsense',text:'Scheduled for Mar 28'}] },
  { id:'JOB-0006', client:'ADV Painting',         contact:'Anthony',       phone:'0467 890 123', email:'anthony@adv.com.au',        type:'ad_management', status:'on_site',   quoted:1300, scheduledDate:'2026-03-01', location:'Remote',                         shooter:null,     editor:null,     timeLogs:[{person:'jev',hours:8,task:'March ads management'}], expenses:[], notes:'Monthly Meta ads. $300/wk.', created:'2026-03-01', invoice:'sent',  recurring:true, callSummary:null, activity:[{date:'2026-03-01',src:'jobsense',text:'Monthly retainer started'},{date:'2026-03-21',src:'eversense',text:'Week 3 optimisation done'},{date:'2026-03-01',src:'xero',text:'Invoice #1035 sent'}] },
  { id:'JOB-0007', client:'Harcourts Coastal',    contact:'Rachel Torres', phone:'0478 901 234', email:'rachel@harcourts.com.au',   type:'photos_video',  status:'booked',    quoted:1484, scheduledDate:'2026-04-02', location:'Mermaid Beach',                  shooter:'julian', editor:'wayan',  timeLogs:[], expenses:[], notes:'Julian shooting with drone.', created:'2026-03-26', invoice:'none',  callSummary:'New client from referral (Sarah at Ray White). Wants photos + video for $2.1M listing.', activity:[{date:'2026-03-26',src:'hubspot',text:'Deal from referral'},{date:'2026-03-26',src:'fireflies',text:'Qual call — referred by JOB-0001'}] },
  { id:'JOB-0008', client:'NT Trailers',          contact:'Mark',          phone:'0489 012 345', email:'mark@ntt.com.au',           type:'website',       status:'qc_review', quoted:2000, scheduledDate:'2026-03-17', location:'Remote',                         shooter:null,     editor:null,     timeLogs:[{person:'risna',hours:35,task:'Build'},{person:'hanif',hours:12,task:'Design'},{person:'gen',hours:8,task:'Dev + Xero integration'}], expenses:[], notes:'Needs Xero integration.', created:'2026-03-14', invoice:'none',  callSummary:'Existing retainer client. Website refresh needed. Must integrate with Xero.', activity:[{date:'2026-03-14',src:'hubspot',text:'Website job created'},{date:'2026-03-17',src:'eversense',text:'Risna started build'},{date:'2026-03-25',src:'eversense',text:'QC review started'}] },
  { id:'JOB-0009', client:'LCMB Group',           contact:'Luke',          phone:'0490 123 456', email:'luke@lcmb.com.au',          type:'video',         status:'uploaded',  quoted:849,  scheduledDate:'2026-03-25', location:'Nerang',                         shooter:'jev',    editor:'pran',   timeLogs:[{person:'jev',hours:5.5,task:'Shoot'},{person:'jev',hours:2,task:'Notes'}], expenses:[], notes:'Monthly retainer shoot.', created:'2026-03-22', invoice:'none',  recurring:true, callSummary:null, activity:[{date:'2026-03-22',src:'jobsense',text:'Monthly shoot created'},{date:'2026-03-25',src:'eversense',text:'Shoot done + footage uploaded'}] },
  { id:'JOB-0010', client:'Coastal RE',           contact:'Ben Taylor',    phone:'0401 234 567', email:'ben@coastal.com.au',        type:'video',         status:'booked',    quoted:849,  scheduledDate:'2026-04-04', location:'Tugun',                          shooter:'jev',    editor:'wayan',  timeLogs:[], expenses:[], notes:'', created:'2026-03-27', invoice:'none',  callSummary:'Cold lead from Meta ad. First time using video.', activity:[{date:'2026-03-27',src:'hubspot',text:'Lead from Meta ad — deal created'},{date:'2026-03-27',src:'fireflies',text:'Qual call — confirmed booking'}] },
];

// ── Shared UI atoms ───────────────────────────────────────────────────────────
function Dot({ color, size=6 }: { color:string; size?:number }) {
  return <span style={{ width:size, height:size, borderRadius:'50%', background:color, display:'inline-block', flexShrink:0 }} />;
}
function Chip({ children, color, bg, sm }: { children:React.ReactNode; color?:string; bg?:string; sm?:boolean }) {
  return <span style={{ display:'inline-flex', alignItems:'center', gap:3, background:bg||'rgba(255,255,255,0.05)', color:color||J.text, padding:sm?'1px 6px':'2px 8px', borderRadius:4, fontSize:sm?8:10, fontWeight:600, whiteSpace:'nowrap' }}>{children}</span>;
}
function Av({ id, size=24 }: { id:string; size?:number }) {
  const p=getP(id); if(!p) return null;
  return <div title={`${p.name} · ${p.role} · ${fmtD(p.rate)}/hr`} style={{ width:size, height:size, borderRadius:'50%', background:p.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.38, fontWeight:700, color:'#fff', flexShrink:0, border:'2px solid '+VS.bg0 }}>{p.name[0]}</div>;
}
function SLABadge({ job }: { job:Job }) {
  if (['paid','approved','invoiced','delivered'].includes(job.status)) return null;
  const rem=sla(job.type)-dayDiff(job.scheduledDate,'2026-03-27');
  const c=rem<0?J.red:rem<=1?J.amber:J.green, bg=rem<0?J.redDim:rem<=1?J.amberDim:J.greenDim;
  return <Chip color={c} bg={bg} sm>{rem<0?Math.abs(rem)+'d overdue':rem+'d left'}</Chip>;
}
function InvBadge({ status }: { status:string }) {
  const c=INV[status]||INV.none;
  return <Chip color={c.color} bg={c.bg} sm>{c.label}</Chip>;
}
function SrcDot({ src }: { src:string }) {
  return <span style={{ width:16, height:16, borderRadius:3, background:SRC_COLOR[src]||'#555', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:800, color:'#fff', flexShrink:0 }}>{SRC_ICON[src]||'?'}</span>;
}
function MarginBar({ job }: { job:Job }) {
  const p=jProfit(job), pct=Math.min(Math.max(p.margin,0),100);
  return <div style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ flex:1, height:3, borderRadius:2, background:'rgba(255,255,255,0.05)' }}><div style={{ width:pct+'%', height:'100%', borderRadius:2, background:mc(p.margin) }} /></div><span style={{ fontSize:9, fontWeight:700, color:mc(p.margin), minWidth:28 }}>{p.margin.toFixed(0)}%</span></div>;
}

// ── JobSense Logo (matches EverSense logo style) ──────────────────────────────
function JobSenseLogo({ height=36 }: { height?:number }) {
  const ratio = 220/80;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 80" width={height*ratio} height={height} style={{ display:'block' }}>
      <defs>
        <linearGradient id="jgrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor:'#D4845A' }} />
          <stop offset="100%" style={{ stopColor:'#E8A87C' }} />
        </linearGradient>
        <linearGradient id="jcircle" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor:'#D4845A' }} />
          <stop offset="100%" style={{ stopColor:'#b5643e' }} />
        </linearGradient>
        <filter id="jglow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {/* Icon */}
      <circle cx="38" cy="38" r="32" fill="url(#jcircle)" />
      <circle cx="38" cy="38" r="27" fill="none" stroke="white" strokeWidth="0.7" opacity="0.15" />
      {/* Briefcase icon */}
      <rect x="22" y="32" width="32" height="22" rx="3" fill="none" stroke="white" strokeWidth="3" strokeLinejoin="round"/>
      <path d="M30 32v-4a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v4" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      <line x1="22" y1="43" x2="54" y2="43" stroke="white" strokeWidth="2" opacity="0.6"/>
      {/* Wordmark */}
      <text x="82" y="38" fontFamily="'Segoe UI',sans-serif" fontSize="32" fontWeight="800" letterSpacing="-1">
        <tspan fontWeight="300" fill="#c0c0c0">Job</tspan>
        <tspan fill="url(#jgrad)" filter="url(#jglow)">Sense</tspan>
      </text>
      <line x1="84" y1="48" x2="84" y2="64" stroke="#D4845A" strokeWidth="1.2" opacity="0.6"/>
      <text x="92" y="61" fontFamily="'Segoe UI',sans-serif" fontSize="9" fontWeight="400" fill="#909090" letterSpacing="2">VEBLEN GROUP</text>
    </svg>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id:'today',   label:'Today',       icon:LayoutDashboard },
  { id:'board',   label:'Job Board',   icon:KanbanSquare    },
  { id:'jobs',    label:'All Jobs',    icon:ListChecks      },
  { id:'quotes',  label:'QuoteSense',  icon:FileText        },
  { id:'finance', label:'Finance',     icon:BarChart3       },
];

function Sidebar({ page, setPage, isOpen, onClose }: { page:string; setPage:(p:string)=>void; isOpen:boolean; onClose:()=>void }) {
  const accentBg = 'rgba(0,122,204,0.15)';
  return (
    <>
      {isOpen && <div style={{ position:'fixed', inset:0, zIndex:40, background:'rgba(0,0,0,0.5)' }} className="md-hidden" onClick={onClose} />}
      <div style={{ position:'fixed', top:0, left:0, bottom:0, width:240, zIndex:50, background:VS.bg1, borderRight:`1px solid ${VS.border}`, display:'flex', flexDirection:'column', transform: isOpen ? 'translateX(0)' : undefined }}>
        {/* Logo */}
        <div style={{ height:56, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', borderBottom:`1px solid ${VS.border}`, flexShrink:0 }}>
          <JobSenseLogo height={32} />
          <button onClick={onClose} style={{ background:'none', border:'none', color:VS.text2, display:'flex', padding:4 }}><X size={16}/></button>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflowY:'auto', padding:'12px 8px' }}>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button key={item.id} onClick={() => { setPage(item.id); onClose(); }} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:6, fontSize:13, fontWeight:active?500:400, color:active?VS.text0:VS.text2, background:active?accentBg:'transparent', borderLeft:active?`2px solid ${VS.accent}`:'2px solid transparent', border:'none', cursor:'pointer', textAlign:'left', marginBottom:2, transition:'background 0.15s, color 0.15s' }}
                onMouseEnter={e => { if(!active){ (e.currentTarget as HTMLElement).style.background=VS.bg2; (e.currentTarget as HTMLElement).style.color=VS.text1; }}}
                onMouseLeave={e => { if(!active){ (e.currentTarget as HTMLElement).style.background='transparent'; (e.currentTarget as HTMLElement).style.color=VS.text2; }}}>
                <Icon size={15}/>{item.label}
              </button>
            );
          })}
        </nav>

        {/* Connected systems */}
        <div style={{ padding:'12px 14px', borderTop:`1px solid ${VS.border}` }}>
          <div style={{ fontSize:9, color:VS.text2, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 }}>Connected</div>
          {[['HubSpot','#FF7A59'],['Xero','#13B5EA'],['Fireflies','#A855F7'],['EverSense',VS.accent]].map(([name,c]) => (
            <div key={name} style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 0' }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background:J.green, display:'inline-block' }}/>
              <span style={{ fontSize:10, color:VS.text2 }}>{name}</span>
              <span style={{ width:6, height:6, borderRadius:2, background:c as string, display:'inline-block', marginLeft:'auto', opacity:0.8 }}/>
            </div>
          ))}
        </div>

        {/* User */}
        <div style={{ padding:'10px 14px', borderTop:`1px solid ${VS.border}`, display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,hsl(252 87% 62%),hsl(260 80% 70%))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>Z</div>
          <div>
            <div style={{ fontSize:12, fontWeight:500, color:VS.text0 }}>Zac</div>
            <div style={{ fontSize:10, color:VS.text2 }}>owner</div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Topbar ────────────────────────────────────────────────────────────────────
const PAGE_TITLES: Record<string,string> = { today:'Today', board:'Job Board', jobs:'All Jobs', quotes:'QuoteSense', finance:'Finance' };

function Topbar({ page, onMenu, onNew, showDropdown, setShowDropdown, showNotifs, setShowNotifs }: {
  page:string; onMenu:()=>void; onNew:()=>void;
  showDropdown:boolean; setShowDropdown:(v:boolean)=>void;
  showNotifs:boolean;   setShowNotifs:(v:boolean)=>void;
}) {
  const notifMeta: Record<string,{icon:React.ElementType;color:string}> = {
    overdue: { icon:AlertTriangle, color:VS.red },
    task:    { icon:Info,          color:VS.accent },
    due_soon:{ icon:Clock,         color:'#dcdcaa' },
    calendar:{ icon:CalendarDays,  color:VS.teal },
    meeting: { icon:Video,         color:'#569cd6' },
    member:  { icon:Users,         color:VS.green },
    info:    { icon:Info,          color:VS.text2 },
  };
  void notifMeta;

  return (
    <header style={{ position:'fixed', top:0, left:240, right:0, zIndex:40, height:56, background:VS.bg1, borderBottom:`1px solid ${VS.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px 0 24px' }}>
      {/* Left */}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <button onClick={onMenu} style={{ background:'none', border:'none', color:VS.text2, display:'flex', padding:4 }}><Menu size={18}/></button>
        <span style={{ fontSize:13, fontWeight:600, color:VS.text2 }}>{PAGE_TITLES[page]}</span>
      </div>

      {/* Right */}
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        {/* New Job */}
        <button onClick={onNew} style={{ background:J.copper, color:'#fff', border:'none', borderRadius:7, padding:'6px 14px', fontSize:12, fontWeight:600, cursor:'pointer' }}>+ New Job</button>

        {/* Bell */}
        <div style={{ position:'relative' }}>
          <button onClick={() => { setShowNotifs(!showNotifs); setShowDropdown(false); }} style={{ width:32, height:32, borderRadius:8, background:showNotifs?VS.bg3:'transparent', border:'none', color:VS.text1, display:'flex', alignItems:'center', justifyContent:'center' }}
            onMouseEnter={e => { if(!showNotifs)(e.currentTarget as HTMLElement).style.background=VS.bg2; }}
            onMouseLeave={e => { if(!showNotifs)(e.currentTarget as HTMLElement).style.background='transparent'; }}>
            <Bell size={16}/>
          </button>
          {showNotifs && (
            <>
              <div style={{ position:'fixed', inset:0, zIndex:10 }} onClick={() => setShowNotifs(false)} />
              <div style={{ position:'absolute', right:0, top:'100%', marginTop:8, width:300, borderRadius:12, zIndex:20, background:VS.bg1, border:`1px solid ${VS.border}`, boxShadow:'0 16px 48px rgba(0,0,0,0.7)' }}>
                <div style={{ padding:'10px 16px', borderBottom:`1px solid ${VS.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:12, fontWeight:600, color:VS.text0 }}>Notifications</span>
                  <button onClick={() => setShowNotifs(false)} style={{ background:'none', border:'none', color:VS.text2, display:'flex' }}><X size={14}/></button>
                </div>
                <div style={{ padding:'32px 0', textAlign:'center', color:VS.text2 }}>
                  <Bell size={24} style={{ opacity:0.3, margin:'0 auto 8px' }}/>
                  <p style={{ fontSize:12 }}>No notifications yet</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User dropdown */}
        <div style={{ position:'relative' }}>
          <button onClick={() => { setShowDropdown(!showDropdown); setShowNotifs(false); }} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:8, background:showDropdown?VS.bg3:'transparent', border:'none', cursor:'pointer' }}
            onMouseEnter={e => { if(!showDropdown)(e.currentTarget as HTMLElement).style.background=VS.bg2; }}
            onMouseLeave={e => { if(!showDropdown)(e.currentTarget as HTMLElement).style.background='transparent'; }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,hsl(252 87% 62%),hsl(260 80% 70%))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff' }}>Z</div>
            <div style={{ textAlign:'left', lineHeight:1.3 }}>
              <div style={{ fontSize:12, fontWeight:500, color:VS.text0 }}>Zac</div>
              <div style={{ fontSize:10, color:VS.text2 }}>owner</div>
            </div>
            <ChevronDown size={14} style={{ color:VS.text2 }}/>
          </button>
          {showDropdown && (
            <>
              <div style={{ position:'fixed', inset:0, zIndex:10 }} onClick={() => setShowDropdown(false)} />
              <div style={{ position:'absolute', right:0, top:'100%', marginTop:8, width:200, borderRadius:12, zIndex:20, background:VS.bg1, border:`1px solid ${VS.border}`, boxShadow:'0 16px 48px rgba(0,0,0,0.7)', overflow:'hidden' }}>
                <div style={{ padding:'12px 16px', borderBottom:`1px solid ${VS.border}` }}>
                  <div style={{ fontSize:12, fontWeight:500, color:VS.text0 }}>Zac</div>
                  <div style={{ fontSize:11, color:VS.text2 }}>zac@veblengroup.com.au</div>
                </div>
                <button style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 16px', background:'transparent', border:'none', cursor:'pointer', fontSize:13, color:VS.text1 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background=`${VS.red}14`; (e.currentTarget as HTMLElement).style.color=VS.red; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='transparent'; (e.currentTarget as HTMLElement).style.color=VS.text1; }}>
                  <LogOut size={15}/> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// ── Create Job Modal ──────────────────────────────────────────────────────────
function CreateModal({ onClose, onCreate }: { onClose:()=>void; onCreate:(j:Job)=>void }) {
  const [client,setClient]=useState(''); const [contact,setContact]=useState(''); const [email,setEmail]=useState(''); const [phone,setPhone]=useState('');
  const [type,setType]=useState('video'); const [date,setDate]=useState('2026-04-01'); const [location,setLocation]=useState('');
  const [shooter,setShooter]=useState('jev'); const [editor,setEditor]=useState('wayan'); const [notes,setNotes]=useState('');
  const quoted=getTy(type).price;
  const inp: React.CSSProperties = { background:VS.bg2, border:`1px solid ${VS.border}`, borderRadius:6, padding:'7px 10px', fontSize:12, color:VS.text0, width:'100%', outline:'none', boxSizing:'border-box' };
  const lbl: React.CSSProperties = { fontSize:10, color:VS.text2, fontWeight:600, marginBottom:4, display:'block', textTransform:'uppercase', letterSpacing:'0.05em' };
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:VS.bg1, border:`1px solid ${VS.border}`, borderRadius:12, padding:24, width:480, maxHeight:'90vh', overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        <h2 style={{ fontFamily:'Georgia,serif', fontSize:18, fontWeight:700, color:VS.text0, margin:'0 0 16px' }}>New Job</h2>
        <label style={lbl}>Client</label>
        <input value={client} onChange={e=>setClient(e.target.value)} placeholder="Client or company name" style={{ ...inp, marginBottom:12 }}/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
          <div><label style={lbl}>Contact Name</label><input value={contact} onChange={e=>setContact(e.target.value)} style={inp}/></div>
          <div><label style={lbl}>Phone</label><input value={phone} onChange={e=>setPhone(e.target.value)} style={inp}/></div>
        </div>
        <label style={lbl}>Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} style={{ ...inp, marginBottom:12 }}/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
          <div><label style={lbl}>Job Type</label>
            <select value={type} onChange={e=>setType(e.target.value)} style={{ ...inp, appearance:'auto' }}>
              {TYPES.map(t=><option key={t.key} value={t.key}>{t.label} — {fmt(t.price)}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Scheduled Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inp}/></div>
        </div>
        <label style={lbl}>Location</label>
        <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Address or Remote" style={{ ...inp, marginBottom:12 }}/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
          <div><label style={lbl}>Shooter</label>
            <select value={shooter} onChange={e=>setShooter(e.target.value)} style={{ ...inp, appearance:'auto' }}>
              <option value="">None</option>
              {TEAM.filter(t=>['jev','julian'].includes(t.id)).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Editor</label>
            <select value={editor} onChange={e=>setEditor(e.target.value)} style={{ ...inp, appearance:'auto' }}>
              <option value="">None</option>
              {TEAM.filter(t=>['wayan','hanif','pran','ridho'].includes(t.id)).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <label style={lbl}>Notes</label>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} style={{ ...inp, marginBottom:16, resize:'vertical' }}/>
        <div style={{ background:VS.bg0, borderRadius:6, padding:12, marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:11, color:VS.text2 }}>Quoted Price</span>
          <span style={{ fontSize:20, fontWeight:700, color:J.copper }}>{fmt(quoted)}</span>
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ background:'transparent', color:VS.text1, border:`1px solid ${VS.border}`, borderRadius:7, padding:'8px 18px', fontSize:12, cursor:'pointer' }}>Cancel</button>
          <button onClick={() => { if(!client)return; onCreate({ id:'JOB-'+String(Math.floor(Math.random()*9000)+1000), client, contact, email, phone, type, status:'booked', quoted, scheduledDate:date, location, shooter:shooter||null, editor:editor||null, timeLogs:[], expenses:[], notes, created:'2026-03-27', invoice:'none', callSummary:null, activity:[{date:'2026-03-27',src:'jobsense',text:'Job created manually'}] }); onClose(); }} style={{ background:J.copper, color:'#fff', border:'none', borderRadius:7, padding:'8px 24px', fontSize:12, fontWeight:600, cursor:'pointer' }}>Create Job</button>
        </div>
      </div>
    </div>
  );
}

// ── Job Detail Panel ──────────────────────────────────────────────────────────
function JobPanel({ job, onClose, onMove }: { job:Job; onClose:()=>void; onMove:(id:string,ns:string)=>void }) {
  const [tab,setTab]=useState('overview');
  const p=jProfit(job), c=jCost(job), st=getSt(job.status), ty=getTy(job.type);
  const sIdx=STATUSES.findIndex(s=>s.key===job.status);
  const next=sIdx<STATUSES.length-1?STATUSES[sIdx+1]:null;
  const tabs=job.callSummary?['overview','call','financials','activity']:['overview','financials','activity'];

  return (
    <div style={{ position:'fixed', top:0, right:0, width:480, height:'100vh', background:VS.bg1, borderLeft:`1px solid ${VS.border}`, zIndex:300, display:'flex', flexDirection:'column', boxShadow:'-12px 0 40px rgba(0,0,0,0.6)', overflowY:'auto' }}>
      {/* Header */}
      <div style={{ padding:'14px 20px', borderBottom:`1px solid ${VS.border}`, position:'sticky', top:0, background:VS.bg1, zIndex:1 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
            <span style={{ fontSize:10, color:VS.text2, fontWeight:700 }}>{job.id}</span>
            <Chip color={st.color} bg={st.bg}><Dot color={st.color} size={5}/> {st.label}</Chip>
            <InvBadge status={job.invoice}/>
            {job.recurring&&<Chip color={J.blue} bg={J.blueDim} sm>Recurring</Chip>}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:VS.text2, fontSize:20, cursor:'pointer', lineHeight:1, padding:0 }}>×</button>
        </div>
        <h2 style={{ fontSize:17, fontWeight:700, color:VS.text0, margin:'0 0 2px', fontFamily:'Georgia,serif' }}>{job.client}</h2>
        <div style={{ fontSize:11, color:VS.text2 }}>{job.contact} · {job.phone}</div>
        {next&&<button onClick={()=>onMove(job.id,next.key)} style={{ marginTop:8, background:J.copper, color:'#fff', border:'none', borderRadius:6, padding:'6px 14px', fontSize:11, fontWeight:600, cursor:'pointer', width:'100%' }}>Move to {next.label} →</button>}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:`1px solid ${VS.border}`, padding:'0 20px' }}>
        {tabs.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ padding:'8px 12px', fontSize:11, fontWeight:tab===t?600:400, color:tab===t?J.copper:VS.text2, borderBottom:tab===t?`2px solid ${J.copper}`:'2px solid transparent', background:'none', border:'none', cursor:'pointer', textTransform:'capitalize' }}>{t}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding:'14px 20px', flex:1 }}>
        {tab==='overview'&&(
          <div>
            <div style={{ background:VS.bg0, borderRadius:7, padding:12, marginBottom:14, display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:4 }}>
              {[{l:'Quoted',v:fmt(p.rev),c:J.copper},{l:'Cost',v:fmt(p.cost),c:VS.text2},{l:'Profit',v:(p.net<0?'-':'')+fmt(p.net),c:p.net>=0?J.green:J.red},{l:'Margin',v:p.margin.toFixed(1)+'%',c:mc(p.margin)}].map((m,i)=>(
                <div key={i}><div style={{ fontSize:8, color:VS.text2, fontWeight:600, textTransform:'uppercase' }}>{m.l}</div><div style={{ fontSize:14, fontWeight:700, color:m.c }}>{m.v}</div></div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
              {[{l:'Type',v:ty.label},{l:'SLA',v:null,node:<SLABadge job={job}/>},{l:'Scheduled',v:job.scheduledDate},{l:'Location',v:job.location}].map((m,i)=>(
                <div key={i} style={{ background:VS.bg0, borderRadius:5, padding:8 }}>
                  <div style={{ fontSize:8, color:VS.text2, fontWeight:600, textTransform:'uppercase' }}>{m.l}</div>
                  {m.node?m.node:<div style={{ fontSize:12, color:VS.text0, marginTop:2 }}>{m.v}</div>}
                </div>
              ))}
            </div>
            <div style={{ fontSize:10, fontWeight:600, color:VS.text1, marginBottom:6 }}>Team</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
              {[job.shooter,job.editor,...(job.timeLogs||[]).map(l=>l.person)].filter((v,i,a):v is string=>!!v&&a.indexOf(v)===i).map(id=>{
                const pr=getP(id); if(!pr) return null;
                const hrs=(job.timeLogs||[]).filter(l=>l.person===id).reduce((s,l)=>s+l.hours,0);
                return <div key={id} style={{ display:'flex', alignItems:'center', gap:5, background:VS.bg0, borderRadius:5, padding:'4px 8px' }}><Av id={id} size={20}/><div><div style={{ fontSize:10, color:VS.text0, fontWeight:600 }}>{pr.name}</div><div style={{ fontSize:8, color:VS.text2 }}>{hrs>0?hrs.toFixed(1)+'h':'Assigned'}</div></div></div>;
              })}
            </div>
            {job.notes&&<div style={{ fontSize:11, color:VS.text2, background:VS.bg0, borderRadius:5, padding:8, lineHeight:1.5 }}>{job.notes}</div>}
          </div>
        )}
        {tab==='call'&&job.callSummary&&(
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}><SrcDot src="fireflies"/><span style={{ fontSize:11, fontWeight:600, color:VS.text0 }}>Qualification Call Summary</span></div>
            <div style={{ background:VS.bg0, borderRadius:6, padding:12, fontSize:12, color:VS.text1, lineHeight:1.6, borderLeft:`3px solid ${SRC_COLOR.fireflies}` }}>{job.callSummary}</div>
          </div>
        )}
        {tab==='financials'&&(
          <div>
            <div style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, marginBottom:3 }}><span style={{ color:VS.text2 }}>Budget consumed</span><span style={{ color:mc(p.margin), fontWeight:600 }}>{p.rev>0?((p.cost/p.rev)*100).toFixed(0):0}%</span></div>
              <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,0.05)' }}><div style={{ width:Math.min(p.rev>0?(p.cost/p.rev)*100:0,100)+'%', height:'100%', borderRadius:3, background:p.cost/p.rev>0.7?J.red:p.cost/p.rev>0.5?J.amber:J.green }}/></div>
            </div>
            {(job.timeLogs||[]).length>0&&(
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:10, fontWeight:600, color:VS.text1, marginBottom:6 }}>Time Logged (EverSense)</div>
                {job.timeLogs.map((l,i)=>{const pr=getP(l.person);return(<div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 0', borderBottom:`1px solid ${VS.border}` }}><Av id={l.person} size={16}/><span style={{ fontSize:10, color:VS.text1, flex:1 }}>{pr?.name} — {l.task}</span><span style={{ fontSize:10, color:VS.text2 }}>{l.hours}h</span><span style={{ fontSize:10, color:J.copper, fontWeight:600, minWidth:45, textAlign:'right' }}>{fmtD(l.hours*(pr?.rate||0))}</span></div>);})}
                <div style={{ display:'flex', justifyContent:'flex-end', gap:12, padding:'6px 0', fontSize:10, fontWeight:700 }}><span style={{ color:VS.text2 }}>Labour: {fmtD(c.labour)}</span>{c.expenses>0&&<span style={{ color:VS.text2 }}>Exp: {fmtD(c.expenses)}</span>}<span style={{ color:J.copper }}>Total: {fmtD(c.total)}</span></div>
              </div>
            )}
            {(job.expenses||[]).length>0&&(
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:10, fontWeight:600, color:VS.text1, marginBottom:6 }}>Expenses</div>
                {job.expenses.map((e,i)=><div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:`1px solid ${VS.border}`, fontSize:11 }}><span style={{ color:VS.text1 }}>{e.desc}</span><span style={{ color:J.red, fontWeight:600 }}>{fmt(e.amount)}</span></div>)}
              </div>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}><SrcDot src="xero"/><span style={{ fontSize:10, fontWeight:600, color:VS.text1 }}>Invoice (Xero)</span></div>
            <div style={{ background:VS.bg0, borderRadius:6, padding:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}><InvBadge status={job.invoice}/><span style={{ fontSize:12, fontWeight:700, color:J.copper }}>{fmt(job.quoted)}</span></div>
          </div>
        )}
        {tab==='activity'&&(
          <div>
            {(job.activity||[]).slice().reverse().map((a,i,arr)=>(
              <div key={i} style={{ display:'flex', gap:8 }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:16 }}>
                  <SrcDot src={a.src}/>
                  {i<arr.length-1&&<div style={{ width:1, flex:1, background:VS.border, margin:'3px 0' }}/>}
                </div>
                <div style={{ paddingBottom:12 }}><div style={{ fontSize:11, color:VS.text0 }}>{a.text}</div><div style={{ fontSize:9, color:VS.text2, marginTop:1 }}>{a.date} · {a.src}</div></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Today ─────────────────────────────────────────────────────────────────────
function TodayPage({ jobs, onSelect }: { jobs:Job[]; onSelect:(j:Job)=>void }) {
  const mo=jobs.filter(j=>j.created>='2026-03-01');
  const rev=mo.reduce((s,j)=>s+j.quoted,0), profit=mo.reduce((s,j)=>s+jProfit(j).net,0);
  const avgM=mo.length?mo.reduce((s,j)=>s+jProfit(j).margin,0)/mo.length:0;
  const outstanding=jobs.filter(j=>['delivered','approved','invoiced'].includes(j.status)).reduce((s,j)=>s+j.quoted,0);
  const overdue=jobs.filter(j=>!['paid','approved','invoiced','delivered'].includes(j.status)&&dayDiff(j.scheduledDate,'2026-03-27')>sla(j.type));
  const inProgress=jobs.filter(j=>['in_edit','on_site'].includes(j.status));
  const attn=jobs.filter(j=>['uploaded','qc_review','delivered'].includes(j.status));
  const upcoming=jobs.filter(j=>['booked','scheduled'].includes(j.status)).sort((a,b)=>new Date(a.scheduledDate).getTime()-new Date(b.scheduledDate).getTime());

  const card: React.CSSProperties = { background:VS.bg1, border:`1px solid ${VS.border}`, borderRadius:8 };

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontFamily:'Georgia,serif', fontSize:22, fontWeight:700, color:VS.text0, margin:0 }}>Today</h1>
        <p style={{ color:VS.text2, fontSize:11, margin:'3px 0 0' }}>Thursday 27 March 2026</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10, marginBottom:16 }}>
        {[
          { l:'Revenue',     v:fmt(rev),       c:VS.text0,  s:mo.length+' jobs this month' },
          { l:'Profit',      v:fmt(profit),    c:J.green,   s:avgM.toFixed(0)+'% avg margin' },
          { l:'Active Jobs', v:jobs.filter(j=>j.status!=='paid').length, c:J.copper, s:fmt(jobs.filter(j=>j.status!=='paid').reduce((s,j)=>s+j.quoted,0))+' in pipeline' },
          { l:'Outstanding', v:fmt(outstanding),c:J.amber,  s:'awaiting payment' },
        ].map((m,i)=>(
          <div key={i} style={{ ...card, padding:'14px 16px' }}>
            <div style={{ fontSize:8, color:VS.text2, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em' }}>{m.l}</div>
            <div style={{ fontSize:22, fontWeight:700, color:m.c, margin:'4px 0 2px' }}>{m.v}</div>
            <div style={{ fontSize:9, color:VS.text2 }}>{m.s}</div>
          </div>
        ))}
      </div>

      {overdue.length>0&&(
        <div style={{ background:J.redDim, border:`1px solid rgba(244,71,71,0.25)`, borderRadius:8, padding:'10px 16px', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ color:J.red, fontSize:12, fontWeight:700 }}>⚠ {overdue.length} job{overdue.length>1?'s':''} overdue</span>
          <span style={{ color:VS.text2, fontSize:10 }}>— {overdue.map(j=>j.client).join(', ')}</span>
        </div>
      )}

      {inProgress.length>0&&(
        <div style={{ marginBottom:18 }}>
          <div style={{ fontSize:10, fontWeight:700, color:J.copper, marginBottom:8, display:'flex', alignItems:'center', gap:5, letterSpacing:'0.06em' }}><Dot color={J.copper} size={6}/> ACTIVE RIGHT NOW</div>
          {inProgress.map(j=>(
            <div key={j.id} onClick={()=>onSelect(j)} style={{ ...card, padding:12, marginBottom:6, cursor:'pointer', borderLeft:`3px solid ${getSt(j.status).color}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                <span style={{ fontSize:9, color:VS.text2, fontWeight:600 }}>{j.id}</span>
                <Chip color={getSt(j.status).color} bg={getSt(j.status).bg} sm><Dot color={getSt(j.status).color} size={4}/> {getSt(j.status).label}</Chip>
                <Chip sm>{getTy(j.type).label}</Chip>
                <SLABadge job={j}/><InvBadge status={j.invoice}/>
                <span style={{ marginLeft:'auto', fontSize:13, fontWeight:700, color:J.copper }}>{fmt(j.quoted)}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div><div style={{ fontSize:14, fontWeight:600, color:VS.text0 }}>{j.client}</div><div style={{ fontSize:10, color:VS.text2 }}>{j.location}</div></div>
                <div style={{ display:'flex', gap:3 }}>{[j.shooter,j.editor,...(j.timeLogs||[]).map(l=>l.person)].filter((v,i,a):v is string=>!!v&&a.indexOf(v)===i).map(id=><Av key={id} id={id} size={22}/>)}</div>
              </div>
              <div style={{ marginTop:8 }}><MarginBar job={j}/></div>
            </div>
          ))}
        </div>
      )}

      {attn.length>0&&(
        <div style={{ marginBottom:18 }}>
          <div style={{ fontSize:10, fontWeight:700, color:J.amber, marginBottom:8, display:'flex', alignItems:'center', gap:5, letterSpacing:'0.06em' }}><Dot color={J.amber} size={6}/> NEEDS ATTENTION</div>
          {attn.map(j=>(
            <div key={j.id} onClick={()=>onSelect(j)} style={{ ...card, padding:'10px 12px', marginBottom:4, cursor:'pointer', display:'flex', alignItems:'center', gap:10 }}>
              <Chip color={getSt(j.status).color} bg={getSt(j.status).bg} sm><Dot color={getSt(j.status).color} size={4}/> {getSt(j.status).label}</Chip>
              <span style={{ fontSize:12, color:VS.text0, flex:1, fontWeight:500 }}>{j.client}</span>
              <SLABadge job={j}/><InvBadge status={j.invoice}/>
              <span style={{ fontSize:12, fontWeight:700, color:J.copper }}>{fmt(j.quoted)}</span>
            </div>
          ))}
        </div>
      )}

      <div>
        <div style={{ fontSize:10, fontWeight:700, color:VS.text2, marginBottom:8, letterSpacing:'0.06em' }}>UPCOMING</div>
        {upcoming.map(j=>(
          <div key={j.id} onClick={()=>onSelect(j)} style={{ ...card, padding:'10px 12px', marginBottom:4, cursor:'pointer', display:'flex', alignItems:'center', gap:10 }}>
            <Chip color={getSt(j.status).color} bg={getSt(j.status).bg} sm>{getSt(j.status).label}</Chip>
            <span style={{ fontSize:12, color:VS.text0, flex:1 }}>{j.client}</span>
            <span style={{ fontSize:10, color:VS.text2 }}>{j.scheduledDate}</span>
            {j.shooter&&<Av id={j.shooter} size={18}/>}
            <Chip sm>{getTy(j.type).label}</Chip>
            <span style={{ fontSize:12, fontWeight:700, color:J.copper }}>{fmt(j.quoted)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Board ─────────────────────────────────────────────────────────────────────
function BoardPage({ jobs, onSelect }: { jobs:Job[]; onSelect:(j:Job)=>void }) {
  return (
    <div>
      <h1 style={{ fontFamily:'Georgia,serif', fontSize:20, fontWeight:700, color:VS.text0, margin:'0 0 16px' }}>Job Board</h1>
      <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:16 }}>
        {STATUSES.map(st=>{
          const col=jobs.filter(j=>j.status===st.key);
          return (
            <div key={st.key} style={{ minWidth:195, flex:'0 0 200px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:8, padding:'0 2px' }}>
                <Dot color={st.color} size={6}/>
                <span style={{ fontSize:10, fontWeight:600, color:VS.text1 }}>{st.label}</span>
                <span style={{ marginLeft:'auto', fontSize:9, color:VS.text2, background:'rgba(255,255,255,0.04)', padding:'1px 6px', borderRadius:6, fontWeight:600 }}>{col.length}</span>
              </div>
              {col.map(j=>(
                <div key={j.id} onClick={()=>onSelect(j)} style={{ background:VS.bg1, border:`1px solid ${VS.border}`, borderRadius:7, padding:10, marginBottom:5, cursor:'pointer', borderLeft:`3px solid ${st.color}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}><span style={{ fontSize:8, color:VS.text2, fontWeight:600 }}>{j.id}</span><SLABadge job={j}/></div>
                  <div style={{ fontSize:11, fontWeight:600, color:VS.text0, marginBottom:2 }}>{j.client}</div>
                  <div style={{ fontSize:9, color:VS.text2, marginBottom:6 }}>{getTy(j.type).label}</div>
                  <MarginBar job={j}/>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6 }}>
                    <div style={{ display:'flex', gap:2 }}>{[j.shooter,j.editor].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).map(id=>id&&<Av key={id} id={id} size={16}/>)}</div>
                    <span style={{ fontSize:11, fontWeight:700, color:J.copper }}>{fmt(j.quoted)}</span>
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

// ── All Jobs ──────────────────────────────────────────────────────────────────
function JobsPage({ jobs, onSelect }: { jobs:Job[]; onSelect:(j:Job)=>void }) {
  const [q,setQ]=useState(''), [fs,setFs]=useState('all');
  const filtered=useMemo(()=>jobs.filter(j=>{
    if(fs!=='all'&&j.status!==fs)return false;
    if(q&&!j.client.toLowerCase().includes(q.toLowerCase())&&!j.id.toLowerCase().includes(q.toLowerCase()))return false;
    return true;
  }).sort((a,b)=>new Date(b.created).getTime()-new Date(a.created).getTime()),[jobs,q,fs]);
  const inp: React.CSSProperties = { background:VS.bg2, border:`1px solid ${VS.border}`, borderRadius:6, padding:'7px 12px', fontSize:12, color:VS.text0, outline:'none' };
  return (
    <div>
      <h1 style={{ fontFamily:'Georgia,serif', fontSize:20, fontWeight:700, color:VS.text0, margin:'0 0 14px' }}>All Jobs <span style={{ color:VS.text2, fontSize:14, fontWeight:400 }}>({filtered.length})</span></h1>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search client or job ID…" style={{ ...inp, width:240 }}/>
        <select value={fs} onChange={e=>setFs(e.target.value)} style={{ ...inp }}>
          <option value="all">All Statuses</option>
          {STATUSES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>
      <div style={{ background:VS.bg1, border:`1px solid ${VS.border}`, borderRadius:8, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'60px 96px 1fr 85px 70px 52px', padding:'7px 16px', borderBottom:`1px solid ${VS.border}` }}>
          {['ID','Status','Client','Invoice','Quoted','Margin'].map(h=><span key={h} style={{ fontSize:8, color:VS.text2, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em' }}>{h}</span>)}
        </div>
        {filtered.map(j=>{
          const pr=jProfit(j), st=getSt(j.status);
          return (
            <div key={j.id} onClick={()=>onSelect(j)} style={{ display:'grid', gridTemplateColumns:'60px 96px 1fr 85px 70px 52px', alignItems:'center', padding:'10px 16px', borderBottom:`1px solid ${VS.border}`, cursor:'pointer' }}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=VS.bg2}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
              <span style={{ fontSize:9, color:VS.text2, fontWeight:600 }}>{j.id}</span>
              <Chip color={st.color} bg={st.bg} sm><Dot color={st.color} size={4}/> {st.label}</Chip>
              <div><div style={{ fontSize:12, color:VS.text0, fontWeight:500 }}>{j.client}</div><div style={{ fontSize:9, color:VS.text2 }}>{j.scheduledDate} · {getTy(j.type).label}</div></div>
              <InvBadge status={j.invoice}/>
              <span style={{ fontSize:12, fontWeight:600, color:J.copper }}>{fmt(j.quoted)}</span>
              <span style={{ fontSize:11, fontWeight:700, color:mc(pr.margin) }}>{pr.margin.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Finance ───────────────────────────────────────────────────────────────────
function FinancePage({ jobs, onSelect }: { jobs:Job[]; onSelect:(j:Job)=>void }) {
  const mo=jobs.filter(j=>j.created>='2026-03-01');
  const rev=mo.reduce((s,j)=>s+j.quoted,0), cost=mo.reduce((s,j)=>s+jCost(j).total,0);
  const profit=mo.reduce((s,j)=>s+jProfit(j).net,0), avgM=mo.length?mo.reduce((s,j)=>s+jProfit(j).margin,0)/mo.length:0;
  const outs=jobs.filter(j=>j.invoice==='sent').reduce((s,j)=>s+j.quoted,0);
  const bt: Record<string,{cnt:number;rev:number;profit:number}>={};
  mo.forEach(j=>{if(!bt[j.type])bt[j.type]={cnt:0,rev:0,profit:0};bt[j.type].cnt++;bt[j.type].rev+=j.quoted;bt[j.type].profit+=jProfit(j).net;});
  const mx=Math.max(...Object.values(bt).map(v=>v.rev),1);
  const card: React.CSSProperties = { background:VS.bg1, border:`1px solid ${VS.border}`, borderRadius:8 };
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}><SrcDot src="xero"/><h1 style={{ fontFamily:'Georgia,serif', fontSize:20, fontWeight:700, color:VS.text0, margin:0 }}>Finance</h1><span style={{ fontSize:11, color:VS.text2 }}>March 2026</span></div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:16 }}>
        {[{l:'Revenue',v:fmt(rev),c:VS.text0},{l:'Cost',v:fmt(cost),c:J.red},{l:'Profit',v:fmt(profit),c:J.green},{l:'Avg Margin',v:avgM.toFixed(1)+'%',c:mc(avgM)},{l:'Awaiting Payment',v:fmt(outs),c:J.amber}].map((m,i)=>(
          <div key={i} style={{ ...card, padding:'12px 14px' }}><div style={{ fontSize:8, color:VS.text2, fontWeight:600, textTransform:'uppercase' }}>{m.l}</div><div style={{ fontSize:20, fontWeight:700, color:m.c, marginTop:4 }}>{m.v}</div></div>
        ))}
      </div>
      <div style={{ ...card, padding:16, marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:600, color:VS.text1, marginBottom:12 }}>Revenue by Service</div>
        {Object.entries(bt).sort((a,b)=>b[1].rev-a[1].rev).map(([type,d])=>{
          const m=d.rev>0?(d.profit/d.rev)*100:0;
          return (
            <div key={type} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:3 }}>
                <span style={{ color:VS.text0 }}>{getTy(type).label} <span style={{ color:VS.text2 }}>×{d.cnt}</span></span>
                <div style={{ display:'flex', gap:12 }}><span style={{ color:J.copper, fontWeight:600 }}>{fmt(d.rev)}</span><span style={{ color:J.green, fontWeight:600 }}>{fmt(d.profit)}</span><span style={{ color:mc(m), fontWeight:700, minWidth:32 }}>{m.toFixed(0)}%</span></div>
              </div>
              <div style={{ height:4, borderRadius:2, background:'rgba(255,255,255,0.04)' }}><div style={{ width:(d.rev/mx)*100+'%', height:'100%', borderRadius:2, background:`linear-gradient(90deg,${J.copper},${J.copperLt})` }}/></div>
            </div>
          );
        })}
      </div>
      <div style={{ ...card, overflow:'hidden' }}>
        <div style={{ fontSize:11, fontWeight:600, color:VS.text1, padding:'12px 16px', borderBottom:`1px solid ${VS.border}` }}>Job P&L</div>
        {jobs.sort((a,b)=>new Date(b.created).getTime()-new Date(a.created).getTime()).map(j=>{
          const pr=jProfit(j);
          return <div key={j.id} onClick={()=>onSelect(j)} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 16px', borderBottom:`1px solid ${VS.border}`, cursor:'pointer' }} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=VS.bg2} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
            <span style={{ fontSize:9, color:VS.text2, fontWeight:600, minWidth:52 }}>{j.id}</span>
            <span style={{ fontSize:11, color:VS.text0, flex:1 }}>{j.client}</span>
            <InvBadge status={j.invoice}/>
            <span style={{ fontSize:11, fontWeight:600, color:J.copper }}>{fmt(j.quoted)}</span>
            <span style={{ fontSize:11, fontWeight:600, color:pr.net>=0?J.green:J.red, minWidth:52, textAlign:'right' }}>{fmt(pr.net)}</span>
            <span style={{ fontSize:11, fontWeight:700, color:mc(pr.margin), minWidth:32, textAlign:'right' }}>{pr.margin.toFixed(0)}%</span>
          </div>;
        })}
      </div>
    </div>
  );
}

// ── QuoteSense ────────────────────────────────────────────────────────────────
const SERVICES: SvcCat[] = [
  { cat:'VIDEO', items:[
    { id:'video',     label:'Cinematic Property Video (60-90s)', price:849,  stdRate:2122, cost:302,  team:'Jev shoots + Wayan edits',   hours:'15.5h' },
    { id:'video_vfx', label:'VFX / AI Video',                   price:940,  stdRate:2350, cost:314,  team:'Jev + Wayan + VFX',          hours:'17.5h' },
    { id:'youtube',   label:'YouTube Video (11 min cinematic)',  price:2000, stdRate:5000, cost:419,  team:'Jev shoots + Hanif edits',   hours:'24.5h' },
  ]},
  { cat:'ADD-ONS', items:[
    { id:'reel_1',       label:'Extra Reel (1)',                 price:70,   stdRate:175,  cost:6,    team:'Wayan',      hours:'1h' },
    { id:'reel_2',       label:'Extra Reels ×2 (10% off)',       price:126,  stdRate:315,  cost:12,   team:'Wayan',      hours:'2h' },
    { id:'reel_3',       label:'Extra Reels ×3 (20% off)',       price:168,  stdRate:420,  cost:18,   team:'Wayan',      hours:'3h' },
    { id:'drone',        label:'Drone Aerials',                  price:95,   stdRate:238,  cost:0,    team:'Jev (site)', hours:'0h extra' },
    { id:'drone_bundle', label:'Drone + Reel Bundle (15% off)',  price:81,   stdRate:203,  cost:0,    team:'Jev',        hours:'0h extra' },
    { id:'floor_plan',   label:'Floor Plan (1 level)',           price:40,   stdRate:100,  cost:24,   team:'Hanif 3h',   hours:'3h' },
  ]},
  { cat:'MEDIA PACKAGES', items:[
    { id:'photos_video', label:'Photos + Video Package', price:1484, stdRate:3405, cost:937,  team:'Jev + Wayan + Bruno photos + drone', hours:'15.5h + Bruno' },
    { id:'full_media',   label:'Veblen Full Media',      price:1650, stdRate:4125, cost:1011, team:'Jev + Editor + Bruno + VFX + twilight + reel', hours:'19.5h + Bruno' },
  ]},
  { cat:'LEAD GENERATION', items:[
    { id:'ad_setup',   label:'Ad Campaign Setup (Meta or Google)', price:600,  stdRate:1500, cost:199, team:'Jev 4h + Zac 1h', hours:'5h' },
    { id:'ad_weekly',  label:'Ad Management (per week)',           price:300,  stdRate:750,  cost:68,  team:'Jev 2h/wk',       hours:'2h/wk',   note:'Recurring' },
    { id:'ad_monthly', label:'Ad Management (per month)',          price:1300, stdRate:3250, cost:292, team:'Jev 8.7h/mo',     hours:'8.7h/mo', note:'Recurring' },
  ]},
  { cat:'GHL / CRM', items:[
    { id:'ghl_build',    label:'GHL Full CRM Build (48h quoted)',   price:650,   stdRate:1200, cost:186,  team:'Gab 24h actual', hours:'24h @ $9.90/hr', note:'Display $9.90/hr' },
    { id:'ghl_monthly',  label:'GHL Monthly Management',           price:230,   stdRate:2300, cost:67,   team:'Gab 2h/wk',     hours:'8.66h/mo',       note:'$200 mgmt + $30 Zapier' },
    { id:'ghl_extra_hr', label:'GHL Extra Hour (beyond 2h/wk)',    price:19.80, stdRate:100,  cost:7.75, team:'Gab',           hours:'1h (quoted 2h)',  note:'Double hours' },
  ]},
  { cat:'WEBSITE', items:[
    { id:'website', label:'Professional Website (5-day build)', price:2000, stdRate:5000, cost:689, team:'Risna 40h + Hanif 16h + Gen 12h', hours:'68h' },
  ]},
  { cat:'SOCIAL MEDIA', items:[
    { id:'social', label:'Monthly Social Media Management', price:99, stdRate:250, cost:14, team:'Mimi 3h/mo', hours:'3h/mo', note:'Recurring' },
  ]},
  { cat:'CONSULTING', items:[
    { id:'consult_1h',   label:'Consulting — 1 Hour',        price:250,  stdRate:625,  cost:0, team:'Zac', hours:'1h',  note:'Pure margin' },
    { id:'consult_half', label:'Consulting — Half Day (4h)', price:750,  stdRate:1875, cost:0, team:'Zac', hours:'4h',  note:'Pure margin' },
    { id:'consult_full', label:'Consulting — Full Day (8h)', price:1500, stdRate:3750, cost:0, team:'Zac', hours:'8h',  note:'Pure margin' },
  ]},
  { cat:'RETAINER PACKAGES', items:[
    { id:'ret_starter', label:'Starter Retainer (Ads + GHL + Social)',        price:1600, stdRate:4000,  cost:507,  team:'Jev ads + Gab GHL + Mimi + Zac', hours:'22.3h/mo', note:'Monthly' },
    { id:'ret_growth',  label:'Growth Retainer (2 shoots + Ads + GHL)',       price:3800, stdRate:9500,  cost:1139, team:'Jev + Gab + Mimi + Zac',          hours:'55.3h/mo', note:'Monthly' },
    { id:'ret_full',    label:'Full Service Retainer (4 shoots + everything)',price:5497, stdRate:13743, cost:1957, team:'Full team',                        hours:'98.3h/mo', note:'Monthly' },
  ]},
];

function QuoteSensePage() {
  const [clientName,setClientName]=useState(''), [clientEmail,setClientEmail]=useState('');
  const [items,setItems]=useState<QuoteItem[]>([]), [discount,setDiscount]=useState(0);
  const [showStd,setShowStd]=useState(true), [openCat,setOpenCat]=useState('VIDEO');
  const addItem=(s:SvcItem)=>{const ex=items.find(i=>i.id===s.id);ex?setItems(items.map(i=>i.id===s.id?{...i,qty:i.qty+1}:i)):setItems([...items,{...s,qty:1}]);};
  const removeIt=(id:string)=>setItems(items.filter(i=>i.id!==id));
  const updateQ=(id:string,q:number)=>{if(q<=0)return removeIt(id);setItems(items.map(i=>i.id===id?{...i,qty:q}:i));};
  const subtotal=items.reduce((s,i)=>s+i.price*i.qty,0), discAmt=subtotal*(discount/100), total=subtotal-discAmt;
  const totalStd=items.reduce((s,i)=>s+i.stdRate*i.qty,0), totalCost=items.reduce((s,i)=>s+i.cost*i.qty,0);
  const preTax=total-totalCost, afterTax=preTax>0?preTax*0.75:preTax, margin=total>0?(afterTax/total)*100:0;
  const inp: React.CSSProperties = { background:VS.bg2, border:`1px solid ${VS.border}`, borderRadius:5, padding:'6px 10px', fontSize:11, color:VS.text0, outline:'none', width:'100%', boxSizing:'border-box' };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:16 }}>
        <div><h1 style={{ fontFamily:'Georgia,serif', fontSize:20, fontWeight:700, color:VS.text0, margin:0 }}>QuoteSense</h1><p style={{ color:VS.text2, fontSize:11, margin:'2px 0 0' }}>Build quotes with live margin tracking</p></div>
        <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:VS.text2, cursor:'pointer' }}><input type="checkbox" checked={showStd} onChange={e=>setShowStd(e.target.checked)}/> Show standard rates</label>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* LEFT */}
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
            <div><label style={{ fontSize:9, color:VS.text2, fontWeight:600, textTransform:'uppercase' as const, display:'block', marginBottom:4 }}>Client</label><input value={clientName} onChange={e=>setClientName(e.target.value)} placeholder="Client name" style={inp}/></div>
            <div><label style={{ fontSize:9, color:VS.text2, fontWeight:600, textTransform:'uppercase' as const, display:'block', marginBottom:4 }}>Email</label><input value={clientEmail} onChange={e=>setClientEmail(e.target.value)} placeholder="Email" style={inp}/></div>
          </div>
          {SERVICES.map(cat=>(
            <div key={cat.cat} style={{ marginBottom:6 }}>
              <div onClick={()=>setOpenCat(openCat===cat.cat?'':cat.cat)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', background:VS.bg1, border:`1px solid ${VS.border}`, borderRadius:openCat===cat.cat?'6px 6px 0 0':6, cursor:'pointer' }}>
                <span style={{ fontSize:10, fontWeight:700, color:J.copper, letterSpacing:'0.06em' }}>{cat.cat}</span>
                <span style={{ fontSize:10, color:VS.text2 }}>{openCat===cat.cat?'▾':'▸'} {cat.items.length}</span>
              </div>
              {openCat===cat.cat&&(
                <div style={{ border:`1px solid ${VS.border}`, borderTop:'none', borderRadius:'0 0 6px 6px', overflow:'hidden' }}>
                  {cat.items.map(svc=>{
                    const inQ=items.some(i=>i.id===svc.id), sm=svc.price>0?(((svc.price-svc.cost)*0.75)/svc.price)*100:100;
                    return (
                      <div key={svc.id} onClick={()=>!inQ&&addItem(svc)} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', borderBottom:`1px solid ${VS.border}`, cursor:inQ?'default':'pointer', background:inQ?J.copperDim:'transparent' }}
                        onMouseEnter={e=>{ if(!inQ)(e.currentTarget as HTMLElement).style.background=VS.bg2; }}
                        onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background=inQ?J.copperDim:'transparent'; }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:11, color:VS.text0, fontWeight:500 }}>{svc.label}</div>
                          <div style={{ fontSize:9, color:VS.text2, marginTop:1 }}>{svc.team} · {svc.hours}</div>
                          {svc.note&&<div style={{ fontSize:8, color:J.amber, marginTop:1 }}>{svc.note}</div>}
                        </div>
                        <div style={{ textAlign:'right', minWidth:65 }}>
                          {showStd&&<div style={{ fontSize:9, color:VS.text2, textDecoration:'line-through' }}>{fmt(svc.stdRate)}</div>}
                          <div style={{ fontSize:13, fontWeight:700, color:J.copper }}>{fmt(svc.price)}</div>
                          <div style={{ fontSize:8, color:mc(sm), fontWeight:600 }}>{sm.toFixed(0)}%</div>
                        </div>
                        <div style={{ width:24, height:24, borderRadius:5, background:inQ?J.green:J.copper, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:inQ?11:16, fontWeight:700, flexShrink:0 }}>{inQ?'✓':'+'}</div>
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
          <div style={{ background:VS.bg1, border:`1px solid ${VS.border}`, borderRadius:8, padding:18, position:'sticky', top:76 }}>
            <div style={{ fontSize:14, fontWeight:700, color:VS.text0, marginBottom:2 }}>{clientName||'New Quote'}</div>
            {clientEmail&&<div style={{ fontSize:10, color:VS.text2, marginBottom:14 }}>{clientEmail}</div>}
            {items.length===0?(
              <div style={{ padding:'40px 0', textAlign:'center', color:VS.text2, fontSize:12 }}>Click services on the left to add them</div>
            ):(
              <div>
                {items.map(item=>(
                  <div key={item.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:`1px solid ${VS.border}` }}>
                    <div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:11, color:VS.text0 }}>{item.label}</div>{showStd&&<div style={{ fontSize:9, color:VS.text2, textDecoration:'line-through' }}>{fmt(item.stdRate*item.qty)}</div>}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <button onClick={()=>updateQ(item.id,item.qty-1)} style={{ width:22, height:22, borderRadius:4, background:VS.bg3, border:'none', color:VS.text1, cursor:'pointer' }}>-</button>
                      <span style={{ fontSize:12, color:VS.text0, minWidth:18, textAlign:'center' }}>{item.qty}</span>
                      <button onClick={()=>updateQ(item.id,item.qty+1)} style={{ width:22, height:22, borderRadius:4, background:VS.bg3, border:'none', color:VS.text1, cursor:'pointer' }}>+</button>
                    </div>
                    <span style={{ fontSize:13, fontWeight:700, color:J.copper, minWidth:54, textAlign:'right' }}>{fmt(item.price*item.qty)}</span>
                    <button onClick={()=>removeIt(item.id)} style={{ background:'none', border:'none', color:J.red, fontSize:16, cursor:'pointer', padding:0 }}>×</button>
                  </div>
                ))}
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 0', borderBottom:`1px solid ${VS.border}` }}>
                  <span style={{ fontSize:11, color:VS.text2, flex:1 }}>Discount %</span>
                  <input type="number" value={discount} onChange={e=>setDiscount(Math.max(0,Math.min(100,Number(e.target.value))))} style={{ ...inp, width:56, textAlign:'right' }}/>
                  {discount>0&&<span style={{ fontSize:11, color:J.red, minWidth:50 }}>-{fmt(discAmt)}</span>}
                </div>
                <div style={{ paddingTop:14 }}>
                  {showStd&&<div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}><span style={{ fontSize:11, color:VS.text2 }}>Standard Rate</span><span style={{ fontSize:12, color:VS.text2, textDecoration:'line-through' }}>{fmt(totalStd)}</span></div>}
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                    <span style={{ fontSize:14, fontWeight:700, color:VS.text0 }}>TOTAL (ex GST)</span>
                    <span style={{ fontSize:22, fontWeight:700, color:J.copper }}>{fmt(total)}</span>
                  </div>
                  {showStd&&total<totalStd&&<div style={{ background:J.greenDim, borderRadius:5, padding:'6px 10px', textAlign:'center', marginBottom:12 }}><span style={{ fontSize:11, fontWeight:600, color:J.green }}>Client saves {fmt(totalStd-total)}</span></div>}
                </div>
                {/* Internal P&L */}
                <div style={{ background:VS.bg0, borderRadius:6, padding:12, marginBottom:14 }}>
                  <div style={{ fontSize:8, color:VS.text2, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>INTERNAL — not shown to client</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:4, marginBottom:8 }}>
                    {[{l:'Revenue',v:fmt(total),c:VS.text0},{l:'Cost',v:fmt(totalCost),c:VS.text2},{l:'Profit',v:(afterTax<0?'-':'')+fmt(afterTax),c:afterTax>=0?J.green:J.red},{l:'Margin',v:margin.toFixed(1)+'%',c:mc(margin)}].map((m,i)=>(
                      <div key={i}><div style={{ fontSize:7, color:VS.text2, fontWeight:600, textTransform:'uppercase' }}>{m.l}</div><div style={{ fontSize:14, fontWeight:700, color:m.c }}>{m.v}</div></div>
                    ))}
                  </div>
                  <div style={{ height:4, borderRadius:2, background:'rgba(255,255,255,0.05)' }}><div style={{ width:Math.min(Math.max(margin,0),100)+'%', height:'100%', borderRadius:2, background:mc(margin) }}/></div>
                  {margin>0&&margin<50&&<div style={{ fontSize:9, color:J.amber, marginTop:5 }}>Below 50% target.</div>}
                  {margin<0&&<div style={{ fontSize:9, color:J.red, marginTop:5 }}>This quote loses money.</div>}
                </div>
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:9, color:VS.text2, fontWeight:600, textTransform:'uppercase', marginBottom:5 }}>Team required</div>
                  {items.map(item=><div key={item.id} style={{ fontSize:10, color:VS.text2, padding:'2px 0' }}>{item.team} · {item.hours}</div>)}
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button style={{ flex:1, background:J.copper, color:'#fff', border:'none', borderRadius:6, padding:'11px 0', fontSize:12, fontWeight:600, cursor:'pointer' }}>Create Job from Quote</button>
                  <button style={{ background:VS.bg3, color:VS.text1, border:'none', borderRadius:6, padding:'11px 14px', fontSize:11, cursor:'pointer' }}>PDF</button>
                  <button onClick={()=>{setItems([]);setDiscount(0);setClientName('');setClientEmail('');}} style={{ background:'transparent', color:VS.text2, border:`1px solid ${VS.border}`, borderRadius:6, padding:'11px 14px', fontSize:11, cursor:'pointer' }}>Clear</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function JobSenseApp() {
  const [page,setPage]=useState('today');
  const [jobs,setJobs]=useState<Job[]>(INIT);
  const [sel,setSel]=useState<Job|null>(null);
  const [showCreate,setShowCreate]=useState(false);
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [showDropdown,setShowDropdown]=useState(false);
  const [showNotifs,setShowNotifs]=useState(false);

  const move=useCallback((id:string,ns:string)=>{
    const entry:Activity={date:'2026-03-27',src:'jobsense',text:'Moved to '+getSt(ns).label};
    setJobs(prev=>prev.map(j=>j.id!==id?j:{...j,status:ns,activity:[...j.activity,entry]}));
    setSel(prev=>prev?.id===id?{...prev,status:ns,activity:[...prev.activity,entry]}:prev);
  },[]);
  const create=useCallback((job:Job)=>setJobs(prev=>[...prev,job]),[]);

  return (
    <div style={{ minHeight:'100vh', background:VS.bg0, fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* Sidebar */}
      <Sidebar page={page} setPage={setPage} isOpen={sidebarOpen} onClose={()=>setSidebarOpen(false)}/>

      {/* Topbar */}
      <Topbar page={page} onMenu={()=>setSidebarOpen(v=>!v)} onNew={()=>setShowCreate(true)} showDropdown={showDropdown} setShowDropdown={setShowDropdown} showNotifs={showNotifs} setShowNotifs={setShowNotifs}/>

      {/* Page content — matches EverSense: pl-60 pt-14 */}
      <main style={{ paddingLeft:240, paddingTop:56, minWidth:0 }}>
        <div style={{ padding:'28px 28px' }}>
          {page==='today'   && <TodayPage   jobs={jobs} onSelect={setSel}/>}
          {page==='board'   && <BoardPage   jobs={jobs} onSelect={setSel}/>}
          {page==='jobs'    && <JobsPage    jobs={jobs} onSelect={setSel}/>}
          {page==='quotes'  && <QuoteSensePage/>}
          {page==='finance' && <FinancePage jobs={jobs} onSelect={setSel}/>}
        </div>
      </main>

      {/* Overlays */}
      {sel&&<div onClick={()=>setSel(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:250 }}/>}
      {sel&&<JobPanel job={sel} onClose={()=>setSel(null)} onMove={move}/>}
      {showCreate&&<CreateModal onClose={()=>setShowCreate(false)} onCreate={create}/>}
    </div>
  );
}
