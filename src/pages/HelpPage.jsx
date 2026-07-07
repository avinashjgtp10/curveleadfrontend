import { useState } from 'react';
import {
  LayoutDashboard, Users, Gauge, Clock, FileText, BookOpen, Megaphone,
  MessageCircle, UserCog, BarChart3, Lightbulb, Globe, Plug, Settings,
  CreditCard, HelpCircle, Flame, CheckCircle, AlertTriangle,
} from 'lucide-react';

const GROUPS = [
  {
    label: 'Getting Started',
    topics: [
      { id: 'overview', label: 'Welcome to CurveLead', icon: HelpCircle },
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Leads',
    topics: [
      { id: 'leads', label: 'Managing Leads', icon: Users },
      { id: 'intent', label: 'Lead Intent Index', icon: Gauge },
      { id: 'followups', label: 'Follow-ups & Appointments', icon: Clock },
    ],
  },
  {
    label: 'Selling',
    topics: [
      { id: 'quotations', label: 'Quotations', icon: FileText },
      { id: 'brochures', label: 'Brochures', icon: BookOpen },
      { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    ],
  },
  {
    label: 'Communication',
    topics: [
      { id: 'whatsapp', label: 'WhatsApp Inbox', icon: MessageCircle },
    ],
  },
  {
    label: 'Team & Insights',
    topics: [
      { id: 'team', label: 'Team', icon: UserCog },
      { id: 'reports', label: 'Reports', icon: BarChart3 },
      { id: 'coaching', label: 'Sales Coaching', icon: Lightbulb },
      { id: 'market', label: 'Market Intelligence', icon: Globe },
    ],
  },
  {
    label: 'Setup',
    topics: [
      { id: 'integrations', label: 'Integrations', icon: Plug },
      { id: 'settings', label: 'Settings', icon: Settings },
      { id: 'billing', label: 'Billing', icon: CreditCard },
    ],
  },
];

const Tip = ({ children }) => (
  <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
    <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
    <p className="text-xs text-amber-700">{children}</p>
  </div>
);

const Section = ({ id, icon: Icon, title, children }) => (
  <section id={id} className="scroll-mt-4 bg-white rounded-2xl border p-5 mb-4">
    <h2 className="font-semibold text-base flex items-center gap-2 mb-3">
      <Icon size={18} className="text-brand-600" /> {title}
    </h2>
    <div className="space-y-2.5 text-sm text-gray-600">{children}</div>
  </section>
);

const HelpPage = () => {
  const [activeId, setActiveId] = useState('overview');

  const goTo = (id) => {
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
      {/* Topic nav */}
      <nav className="lg:sticky lg:top-0 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
        <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {GROUPS.map(group => (
            <div key={group.label} className="shrink-0 lg:shrink">
              <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wide mb-1.5 px-1">{group.label}</p>
              <div className="flex lg:flex-col gap-1">
                {group.topics.map(t => (
                  <button key={t.id} onClick={() => goTo(t.id)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap text-left transition-colors ${
                      activeId === t.id ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}>
                    <t.icon size={14} className="shrink-0" /> {t.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Content */}
      <div>
        <Section id="overview" icon={HelpCircle} title="Welcome to CurveLead">
          <p>CurveLead helps you capture leads from ads/website/WhatsApp, track them through your sales pipeline, follow up on time, send quotations, and see where your team is winning or falling behind.</p>
          <p>The sidebar covers the main areas: <strong>Leads</strong> is where you'll spend most of your day; <strong>Dashboard</strong> and <strong>Reports</strong> tell you how things are going; <strong>Settings</strong> and <strong>Integrations</strong> are one-time setup.</p>
        </Section>

        <Section id="dashboard" icon={LayoutDashboard} title="Dashboard">
          <p>Your daily starting point — what needs attention today, at a glance.</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Action strip</strong> — New Today, Follow-ups Today, Demos Today, Overdue, Hot Leads, Missed Follow-ups, and Critical Follow-ups. Click any tile to jump straight to the filtered leads list.</li>
            <li><strong>Overdue</strong> is any pending follow-up past its due time. <strong>Missed</strong> narrows that to 48 hours–5 days overdue; <strong>Critical</strong> is more than 5 days overdue.</li>
            <li>Alert banners appear only when something needs action — unassigned leads, or leads with critical missed follow-ups. No banner means nothing urgent.</li>
            <li>Pipeline funnel, recent leads, lead sources, and team performance charts below the fold give the bigger picture.</li>
          </ul>
        </Section>

        <Section id="leads" icon={Users} title="Managing Leads">
          <p>The Leads page is a filterable table of every lead, plus a Pipeline (kanban) view and a Follow-ups tab.</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Add a lead</strong> with the "+ Add Lead" button, or let leads flow in automatically via Integrations (Facebook, website form, API, WhatsApp).</li>
            <li><strong>Filters</strong> — Stage, Status, Score, Follow-up Health, Source, Assigned To, and date range. Active filters show as removable chips.</li>
            <li>Click a lead's name to open its detail panel without losing your filters/page position.</li>
            <li>Change <strong>Stage</strong> or <strong>Status</strong> directly from the table by clicking the value in that row.</li>
            <li>Switch to the <strong>Pipeline</strong> tab for a kanban board grouped by stage, or the <strong>Follow-ups</strong> tab to see only leads with a pending follow-up, colored by health.</li>
          </ul>
        </Section>

        <Section id="intent" icon={Gauge} title="Lead Intent Index">
          <p>Opening a lead shows a <strong>Lead Intent</strong> card at the top of the Overview tab — a quick read on how likely this lead is to convert and what to do next. Everything on it is calculated automatically from your team's own activity, not guessed by AI.</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              <span className="inline-flex items-center gap-1 font-semibold"><Flame size={12} className="text-red-500" /> Score & Level</span> — a 0-100 score and a Hot / Warm / Cold label. It goes up when the lead is contacted recently, responds well (status like "Interested" / "Connected" / "Proposal"), and follow-ups are on time. It drops for negative statuses ("Not Interested", "No Answer", "Busy"), follow-ups that keep getting rescheduled without a real outcome, or long gaps with no contact. A lead in a <strong>Won</strong> stage is always 100; a <strong>Lost</strong> stage is always 5.
            </li>
            <li>
              <span className="inline-flex items-center gap-1 font-semibold"><CheckCircle size={12} className="text-green-600" /> Follow-up Health</span> — Good, Delayed (overdue &lt;48h), Missed (48h–5 days), or Critical (5+ days). This is purely about timing: is someone from the team going to call this lead when they said they would.
            </li>
            <li><strong>Suggested next action</strong> — a one-line recommendation ("Follow up today", "Manager follow-up needed", "Call to confirm interest before marking Lost", etc.) picked from whichever signal is worst right now.</li>
            <li><strong>Why</strong> — a plain-language explanation listing exactly which signals contributed, so you can always see the reasoning, not just the number.</li>
            <li><strong>Score history</strong> — expand it to see every past recalculation with its score and reason, so you can see how a lead's intent has trended over time.</li>
            <li>Click <strong>"Recalculate Intent"</strong> (or the lightning icon in the leads table) any time to refresh a lead's score after a call or status change — it updates instantly since there's no AI call involved.</li>
          </ul>
        </Section>

        <Section id="followups" icon={Clock} title="Follow-ups & Appointments">
          <p>There are three places you might look for follow-ups — they show the same underlying data, filtered differently:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Leads → Follow-ups tab</strong> — every pending follow-up, color-coded by health, alongside the lead's stage.</li>
            <li><strong>Follow-ups page</strong> (sidebar) — a dedicated Pending / Overdue / Completed list across all follow-up types (call, WhatsApp, visit, demo).</li>
            <li><strong>Appointments page</strong> (sidebar) — just Demos specifically, grouped by Overdue / Today / Tomorrow / This Week / Later.</li>
          </ul>
          <p>You schedule a follow-up (or a demo) from inside a lead's detail page, not from these list pages — they're for reviewing and completing follow-ups, not creating new ones.</p>
          <Tip>Marking a follow-up "Done" without a proper outcome, or repeatedly rescheduling it, will lower that lead's Intent Score — see Lead Intent Index above.</Tip>
        </Section>

        <Section id="quotations" icon={FileText} title="Quotations">
          <p>Build itemized price quotes tied to a lead and send them straight to WhatsApp.</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>"New Quotation" → pick a lead, add line items, discount %, tax %, valid-until date, terms.</li>
            <li>"Save & Send on WhatsApp" sends it immediately; "Save Draft" lets you finish later.</li>
            <li>Every quotation gets a <strong>public shareable link</strong> — anyone with the link can view it, no login needed, so only put information you're comfortable sharing externally.</li>
            <li>When a client <strong>Accepts</strong> a sent quotation, the linked lead is automatically moved to Won. <strong>Reject</strong> prompts for an optional reason.</li>
            <li>Only draft quotations can be deleted or manually marked "Sent."</li>
          </ul>
        </Section>

        <Section id="brochures" icon={BookOpen} title="Brochures">
          <p>Upload marketing PDFs/images once, then share them to any lead over WhatsApp in one click.</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>"Upload Brochure" — name, category (Products/Services/Pricing/Company/General), and the file.</li>
            <li>Filter by category, then use "Share" on a lead's Overview tab (Share Materials) or here to send via WhatsApp.</li>
            <li>Each brochure card shows how many times it's been shared.</li>
          </ul>
        </Section>

        <Section id="campaigns" icon={Megaphone} title="Campaigns">
          <p>Track marketing campaigns and see which ones are actually producing leads.</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>"New Campaign" — name, source (Meta Ads/Google Ads/Instagram/etc.), budget, dates, status.</li>
            <li>Open a campaign to see Budget, Spent, Leads generated, and Cost Per Lead — CPL is calculated automatically from spend ÷ leads.</li>
            <li>Attribute leads to a campaign via the campaign field when a lead comes in (automatic for ad-integration leads, manual otherwise).</li>
          </ul>
        </Section>

        <Section id="whatsapp" icon={MessageCircle} title="WhatsApp Inbox">
          <p>A directory of every WhatsApp conversation you're having with leads — search by name or phone, click a conversation to jump into that lead's chat thread on their detail page. New inbound messages appear here automatically; there's nothing to set up beyond connecting WhatsApp in Integrations.</p>
        </Section>

        <Section id="team" icon={UserCog} title="Team">
          <p>Admins can add and manage staff accounts here.</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>"Add Member" — name, email, an initial password you set for them, and role (Staff or Admin).</li>
            <li>Staff only see leads assigned to them; Admins see everything.</li>
            <li>Admin accounts can't be removed from this page.</li>
          </ul>
        </Section>

        <Section id="reports" icon={BarChart3} title="Reports">
          <p>Read-only analytics: pick a period (Today/Week/Month/Last Month/Year) to see conversion rate, leads-by-source breakdown, the pipeline funnel, staff performance (leads/won/lost/conversion per rep), and campaign ROI.</p>
        </Section>

        <Section id="coaching" icon={Lightbulb} title="Sales Coaching">
          <p>An AI-generated playbook — best practices, common objections and how to handle them, phrases that work vs. don't — built from your team's won/lost calls, plus a per-rep coaching table comparing each rep's average call score to the team average.</p>
          <Tip>You need a few leads marked Won or Lost with analyzed calls attached before there's enough data to generate a playbook. Click "Regenerate Now" once you do.</Tip>
        </Section>

        <Section id="market" icon={Globe} title="Market Intelligence">
          <p>Fill in your industry, product/service, and target market to get an AI-generated market overview, ideal customer profile, competitor breakdown, opportunities/threats, and strategic recommendations.</p>
          <Tip>This is based on the AI's general training data, not live research — treat it as a starting point, not real-time competitive intelligence. Results aren't saved; "New Analysis" discards the current one.</Tip>
        </Section>

        <Section id="integrations" icon={Plug} title="Integrations">
          <p>Connect the channels that feed leads into CurveLead automatically.</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Facebook/Instagram</strong> — log in, pick a Page, sync past leads, and get a webhook for new leads in real time.</li>
            <li><strong>Google Ads</strong> — paste a webhook secret matching your Google Ads Lead Form setup.</li>
            <li><strong>REST API</strong> — generate an API key to push leads in from any external system (IndiaMART, JustDial, Zapier, your own tools). Copy the key immediately — it's only shown once.</li>
            <li><strong>Website Embed Form</strong> — needs an API key first, then generates a copy-paste snippet for your site.</li>
            <li><strong>AI Calling Agent</strong> and <strong>WhatsApp Business API</strong> — paste your provider credentials to enable AI voice calls and WhatsApp messaging (booking a demo or visit auto-sends a WhatsApp confirmation).</li>
          </ul>
          <Tip>Revoking your API key immediately breaks the website embed form and any external system pushing leads through it.</Tip>
        </Section>

        <Section id="settings" icon={Settings} title="Settings">
          <p>Business details, message templates, and pipeline configuration, organized into tabs.</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Business</strong> — company details, GST/PAN, and bank/UPI details. These appear on every quotation you send, so keep them accurate.</li>
            <li><strong>Password</strong> — change your own login password.</li>
            <li><strong>Templates</strong> (admin) — reusable WhatsApp/SMS/Email messages with variables like {'{name}'}, {'{course}'}, {'{course_fee}'}.</li>
            <li><strong>Pipeline</strong> (admin) — add/edit/reorder Stages and the Statuses inside each stage; mark a stage as "Won" or "Lost" so the rest of the app (reports, Lead Intent scoring) knows what it means.</li>
          </ul>
          <Tip>For WhatsApp Business API setup, use the main Integrations page — the WhatsApp card inside this Settings page is out of date.</Tip>
        </Section>

        <Section id="billing" icon={CreditCard} title="Billing">
          <p>Pick a plan (Free/Starter/Growth/Pro), toggle Monthly/Yearly, and pay securely via Razorpay. Pro (and any custom plan) routes to "Contact Sales" instead of checkout.</p>
          <Tip>If you've paid but your plan hasn't updated, don't pay again — contact support@curvelead.com with your payment ID. Verification happens right after payment and can occasionally lag.</Tip>
        </Section>
      </div>
    </div>
  );
};

export default HelpPage;
