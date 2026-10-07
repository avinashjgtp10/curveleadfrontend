// Knowledge base for the landing page's "CurveLead AI" widget. Every visitor here is
// signed out, so every action button points at /signup (or an in-page anchor) rather
// than a real app route — there's nothing to "open" yet. answerQuestion() is the seam
// to swap in a real AI API later: same { text, steps, example, cta } shape.

const SIGNUP = { label: 'Start free', path: '/signup' };

export const FEATURES = [
  // ---- General ----
  { id: 'overview', category: 'general', label: 'What is CurveLead', keywords: ['what is curvelead', 'what can i do', 'what can you do', 'what does curvelead do', 'how does curvelead work'],
    explain: 'CurveLead is a sales workspace built around WhatsApp: it captures leads from ads and your website, scores them from real activity, keeps follow-ups on track, and shows which campaigns and salespeople are actually closing.',
    cta: SIGNUP },
  { id: 'dashboard', category: 'general', label: 'Dashboard', keywords: ['dashboard', 'home screen', 'overview screen'],
    explain: 'Think of the Dashboard as your "what needs my attention today" screen — new leads, follow-ups due, hot leads, and anything overdue, plus how your pipeline and team are trending, all without digging through separate pages.',
    cta: SIGNUP },

  // ---- Leads ----
  { id: 'leads-add', category: 'leads', label: 'Add a lead', keywords: ['add a lead', 'add lead', 'create a lead', 'new lead'],
    explain: 'Add a lead manually, or let them flow in automatically from a connected ad source.',
    steps: ['Open Leads.', 'Click "+ Add Lead".', 'Enter name, phone (required), source and notes.', 'Save — it appears in your pipeline with stage "New".'],
    example: 'Example: a walk-in enquiry you want to track alongside your ad leads.', cta: SIGNUP },
  { id: 'leads-import', category: 'leads', label: 'Import leads', keywords: ['import lead', 'import a lead', 'bulk upload', 'csv'],
    explain: 'Bulk-import leads from a spreadsheet, with column mapping and duplicate detection before anything is saved.',
    steps: ['Open Leads → More Actions → Import CSV.', 'Upload your file — CurveLead auto-detects name/phone/email columns.', 'Review the preview (valid rows vs. duplicates).', 'Confirm import.'],
    cta: SIGNUP },
  { id: 'leads-search', category: 'leads', label: 'Search & filter leads', keywords: ['search lead', 'filter lead', 'find a lead'],
    explain: 'Search by name or phone, and filter by stage, status, score, source, assigned staff, or date range — active filters show as removable chips.', cta: SIGNUP },
  { id: 'leads-pipeline', category: 'leads', label: 'Lead Pipeline', keywords: ['lead pipeline', 'pipeline', 'kanban'],
    explain: 'A kanban board of every lead grouped by stage — drag a card to move it forward, or change stage from the main table.', cta: SIGNUP },
  { id: 'leads-update', category: 'leads', label: 'Update a lead', keywords: ['update a lead', 'edit a lead', 'change lead stage'],
    explain: 'Click a lead to open its details, then edit stage, status, deal value, or any field directly from that panel — changes save instantly and are logged to its activity history.', cta: SIGNUP },
  { id: 'leads-detail', category: 'leads', label: 'Lead Details', keywords: ['lead details', 'lead detail', 'lead profile'],
    explain: 'Opening a lead shows its Intent Score, stage/status, WhatsApp chat, notes & files, automation status, and full activity timeline — everything about that lead in one panel.', cta: SIGNUP },
  { id: 'leads-assign', category: 'leads', label: 'Assign a lead', keywords: ['assign a lead', 'assign lead', 'assign to a team member'],
    explain: 'Assign a lead to a staff member manually from its detail panel, or set up Smart Lead Routing to auto-assign by source, campaign, or location — or round-robin across the team.', cta: SIGNUP },

  // ---- Campaigns ----
  { id: 'campaigns-create', category: 'campaigns', label: 'Create a campaign', keywords: ['create a campaign', 'create campaign', 'new campaign', 'start a campaign'],
    explain: 'Creating a campaign in CurveLead is simple.',
    steps: ['Open Campaigns.', 'Click "Create Campaign".', 'Select your target leads.', 'Configure your campaign.', 'Review your campaign.', 'Launch it.'],
    example: 'You can use campaigns to reach multiple leads with targeted communication.', cta: SIGNUP },
  { id: 'campaigns-manage', category: 'campaigns', label: 'Manage campaigns', keywords: ['manage campaign', 'manage campaigns', 'edit campaign'],
    explain: 'Edit a campaign\'s budget, dates, or status anytime from the Campaigns list — status changes (active/paused/ended) take effect immediately.', cta: SIGNUP },
  { id: 'campaigns-track', category: 'campaigns', label: 'Track campaign performance', keywords: ['track campaign', 'campaign performance', 'campaign roi'],
    explain: 'Open a campaign to see budget, spend, leads generated, and cost-per-lead — CPL is calculated automatically from spend ÷ leads.', cta: SIGNUP },
  { id: 'campaigns-target', category: 'campaigns', label: 'Target specific leads', keywords: ['target lead', 'target specific lead', 'target audience'],
    explain: 'Attribute leads to a campaign via the campaign field when they come in — automatic for ad-integration leads, manual otherwise — so you always know which campaign a lead belongs to.', cta: SIGNUP },

  // ---- Social ----
  { id: 'social-how', category: 'social', label: 'Social', keywords: ['social page', 'social media', 'instagram post', 'facebook post'],
    explain: 'Your connected social accounts and posts live right next to Ads Manager, so you\'re not jumping to a separate tool just to see how a post is performing.', cta: SIGNUP },

  // ---- WhatsApp ----
  { id: 'whatsapp-connect', category: 'whatsapp', label: 'Connect WhatsApp', keywords: ['connect whatsapp', 'setup whatsapp', 'whatsapp business api'],
    explain: 'Connect your WhatsApp Business API credentials once, from Settings/Integrations, and every lead conversation flows through CurveLead\'s shared inbox from then on.', cta: SIGNUP },
  { id: 'whatsapp-send', category: 'whatsapp', label: 'Send a WhatsApp message', keywords: ['send a whatsapp message', 'send whatsapp', 'whatsapp message'],
    explain: 'Open a conversation and reply directly, within the 24-hour window.',
    steps: ['Open WhatsApp.', 'Pick a conversation (or start a new chat).', 'Type your reply and send.'], cta: SIGNUP },
  { id: 'whatsapp-templates', category: 'whatsapp', label: 'WhatsApp templates', keywords: ['whatsapp template', 'template message'],
    explain: 'Outside the 24-hour reply window, only approved WhatsApp templates can be sent — pick one from the template picker, fill any variables, and send.', cta: SIGNUP },
  { id: 'whatsapp-inbox', category: 'whatsapp', label: 'WhatsApp Inbox', keywords: ['whatsapp inbox', 'shared inbox'],
    explain: 'A shared inbox across your whole team — every conversation stays tied to the right lead, with notes, files, and brochures all in the same view.', cta: SIGNUP },
  { id: 'whatsapp-track', category: 'whatsapp', label: 'Track WhatsApp messages', keywords: ['track whatsapp', 'whatsapp report', 'message report'],
    explain: 'Every message is logged to that lead\'s activity history, and the Reports section includes a dedicated Messages Report for response times and volume.', cta: SIGNUP },

  // ---- Automations ----
  { id: 'automation-how', category: 'automations', label: 'Lead Automation', keywords: ['lead automation', 'how does lead automation work'],
    explain: 'Lead Automation runs a scripted follow-up sequence the moment a lead matches your rule.',
    example: 'Example: New Lead → WhatsApp welcome message → AI intent check → scheduled follow-up → appointment booking.', cta: SIGNUP },
  { id: 'automation-create', category: 'automations', label: 'Create an automation', keywords: ['create an automation', 'build automation', 'automation sequence'],
    explain: 'Build a sequence of WhatsApp/email steps, set the trigger (e.g. "new lead from Facebook"), and every matching lead gets enrolled automatically.',
    steps: ['Open Automations.', 'Click "New Sequence".', 'Add steps (message, wait, follow-up).', 'Set the trigger rule.', 'Activate it.'], cta: SIGNUP },
  { id: 'automation-followup', category: 'automations', label: 'Automate follow-ups', keywords: ['automate follow-up', 'automate followups', 'automate my follow-up'],
    explain: 'Instead of manually remembering to message every lead, an automation sequence sends the right message at the right time automatically, and still lets a human take over anytime.', cta: SIGNUP },
  { id: 'automation-reply', category: 'automations', label: 'Auto-respond to new leads', keywords: ['automatically respond', 'auto respond', 'auto reply to leads'],
    explain: 'Yes — an AI agent can automatically reply to and qualify new WhatsApp leads for you, based on business details you provide, before handing off to your team.', cta: SIGNUP },
  { id: 'ai-agent', category: 'automations', label: 'AI Agent', keywords: ['ai agent', 'qualification bot', 'ai that replies'],
    explain: 'This is that AI auto-reply bot, set up your way — tell it about your business once (website, tone, FAQs, when to hand off to a human) and it handles the first WhatsApp reply so no new lead waits on you.', cta: SIGNUP },

  // ---- Appointments ----
  { id: 'appt-create', category: 'appointments', label: 'Create an appointment', keywords: ['create an appointment', 'book an appointment', 'book a demo', 'schedule a visit'],
    explain: 'Appointments are scheduled from inside a lead\'s detail page, so they\'re always linked to the right lead.',
    steps: ['Open a lead\'s detail page.', 'Click "Schedule Appointment".', 'Pick type (demo/visit), date and time.', 'Save — CurveLead sends an automatic WhatsApp confirmation.'], cta: SIGNUP },
  { id: 'appt-manage', category: 'appointments', label: 'Manage appointments', keywords: ['manage appointment', 'manage appointments', 'reschedule appointment'],
    explain: 'The Appointments page groups everything by Overdue / Today / Tomorrow / This Week — reschedule or mark complete right from the list.', cta: SIGNUP },
  { id: 'appt-followup', category: 'appointments', label: 'Schedule a follow-up', keywords: ['schedule a follow-up', 'schedule a followup'],
    explain: 'A follow-up is scheduled the same way as an appointment — from the lead\'s detail page — but it\'s a simple callback/reminder rather than a demo or visit.', cta: SIGNUP },
  { id: 'appt-upcoming', category: 'appointments', label: 'Track upcoming appointments', keywords: ['upcoming appointment', 'track appointment'],
    explain: 'The Appointments page is exactly this view — everything upcoming, grouped by how soon it\'s due.', cta: SIGNUP },

  // ---- Follow-ups ----
  { id: 'fu-create', category: 'followups', label: 'Create a follow-up', keywords: ['create a follow-up', 'create a followup', 'add a follow-up'],
    explain: 'Schedule a follow-up from a lead\'s detail page — pick a date, time and optional note, and it shows up on your Follow-ups list.', cta: SIGNUP },
  { id: 'fu-manage', category: 'followups', label: 'Manage follow-ups', keywords: ['manage follow-up', 'manage followups'],
    explain: 'Every pending follow-up is color-coded by health — Good, Delayed, Missed, or Critical — so you always know who to call next.', cta: SIGNUP },
  { id: 'fu-reminder', category: 'followups', label: 'Follow-up reminders', keywords: ['follow-up reminder', 'followup reminder'],
    explain: 'A scheduled follow-up surfaces on your Dashboard and Follow-ups list as it comes due, and turns "Missed" or "Critical" if it\'s overdue, so it\'s hard to lose track of.', cta: SIGNUP },
  { id: 'fu-completed', category: 'followups', label: 'Completed follow-ups', keywords: ['completed follow-up', 'track completed'],
    explain: 'Completed follow-ups stay in that lead\'s activity history with their outcome, so you can see the full contact history at a glance.', cta: SIGNUP },

  // ---- Tasks ----
  { id: 'tasks-general', category: 'tasks', label: 'Tasks', keywords: ['create a task', 'manage my tasks', 'track completed tasks', 'task'],
    explain: 'CurveLead doesn\'t have a separate generic to-do list — your actionable "tasks" are the pending Follow-ups and Appointments tied to each lead, which is what keeps them from getting lost in a side list nobody checks.', cta: SIGNUP },

  // ---- Reports ----
  { id: 'reports-available', category: 'reports', label: 'Available reports', keywords: ['what reports', 'reports available', 'reporting'],
    explain: 'Conversion rate, leads by source, the pipeline funnel, staff performance, and campaign ROI — filterable by period (Today/Week/Month/Year).', cta: SIGNUP },
  { id: 'reports-messages', category: 'reports', label: 'Messages Report', keywords: ['messages report'],
    explain: 'The Messages Report breaks down WhatsApp volume and response times, so you can see how quickly your team (or AI) is actually replying.', cta: SIGNUP },
  { id: 'reports-conversion', category: 'reports', label: 'Track lead conversion', keywords: ['track lead conversion', 'conversion rate'],
    explain: 'Conversion rate is tracked automatically from stage changes — see it overall, or broken down by source and campaign.', cta: SIGNUP },
  { id: 'reports-campaign-analysis', category: 'reports', label: 'Analyze campaign performance', keywords: ['analyze campaign', 'campaign analysis'],
    explain: 'Each campaign\'s report shows spend, leads, cost-per-lead, and revenue — so you know exactly which ones are worth scaling.', cta: SIGNUP },
  { id: 'reports-sales', category: 'reports', label: 'Sales performance', keywords: ['sales performance', 'understand my sales'],
    explain: 'The staff performance report compares leads handled, won/lost, and conversion rate per rep, so you can coach based on real numbers.', cta: SIGNUP },

  // ---- Brochures ----
  { id: 'brochures-how', category: 'brochures', label: 'How brochures work', keywords: ['how do brochures work', 'brochure'],
    explain: 'Upload product PDFs/images once, then share them to any lead over WhatsApp in a single click, right from that lead\'s chat.', cta: SIGNUP },
  { id: 'brochures-create', category: 'brochures', label: 'Create a brochure', keywords: ['create a brochure', 'upload a brochure'],
    explain: 'Go to Brochures → Upload, give it a name and category, and it\'s instantly available to share with any lead.', cta: SIGNUP },
  { id: 'brochures-share', category: 'brochures', label: 'Share a brochure', keywords: ['share a brochure', 'send a brochure'],
    explain: 'From a lead\'s WhatsApp chat, click the attachment icon and pick a brochure — it sends as a document message.', cta: SIGNUP },
  { id: 'brochures-track', category: 'brochures', label: 'Track brochure activity', keywords: ['track brochure', 'brochure activity'],
    explain: 'Each brochure card shows how many times it\'s been shared, so you know which material your team is actually using.', cta: SIGNUP },

  // ---- Sales Coaching ----
  { id: 'coaching-what', category: 'coaching', label: 'What is Sales Coaching', keywords: ['what is sales coaching', 'sales coaching'],
    explain: 'An AI-generated playbook — common objections and how to handle them, what phrases work and what doesn\'t — built from your own team\'s won and lost calls.', cta: SIGNUP },
  { id: 'coaching-improve', category: 'coaching', label: 'Improve my sales', keywords: ['improve my sales', 'improve sales'],
    explain: 'A per-rep scoring table compares each salesperson\'s average call score to the team average, so coaching focuses on the real gaps.', cta: SIGNUP },
  { id: 'coaching-analyze', category: 'coaching', label: 'Analyze sales conversations', keywords: ['analyze my sales conversation', 'analyze conversations'],
    explain: 'Calls get analyzed automatically once attached to Won or Lost leads — the playbook regenerates from that analysis whenever you ask it to.', cta: SIGNUP },

  // ---- Team ----
  { id: 'team-manage', category: 'team', label: 'Manage your team', keywords: ['manage my team', 'manage team'],
    explain: 'Admins see every staff member\'s assigned leads and activity from the Team page, in one place.', cta: SIGNUP },
  { id: 'team-add', category: 'team', label: 'Add a team member', keywords: ['add a team member', 'invite a team member', 'invite staff'],
    explain: 'Go to Team → "Add Member", enter their name, email and an initial password, and pick a role — Staff or Admin.', cta: SIGNUP },
  { id: 'team-assign', category: 'team', label: 'Assign leads to team members', keywords: ['assign leads to team', 'assign to staff'],
    explain: 'Assign manually from a lead\'s detail panel, or set up Smart Lead Routing to auto-assign new leads by source, campaign, or round-robin.', cta: SIGNUP },
  { id: 'team-permissions', category: 'team', label: 'Team permissions', keywords: ['team permission', 'role permission'],
    explain: 'Staff only see leads assigned to them; Admins see and manage everything, including team settings and billing.', cta: SIGNUP },

  // ---- Notifications ----
  { id: 'notif-how', category: 'notifications', label: 'How notifications work', keywords: ['how do notifications work', 'curvelead notifications'],
    explain: 'The bell icon in the top bar shows real-time alerts — new leads, messages, and follow-ups coming due — without needing a separate page.', cta: SIGNUP },
  { id: 'notif-manage', category: 'notifications', label: 'Manage notifications', keywords: ['manage notifications'],
    explain: 'Notification preferences are configurable per type in Settings, so you only get alerted for what actually matters to your role.', cta: SIGNUP },
  { id: 'notif-stay-updated', category: 'notifications', label: 'Stay updated on lead activity', keywords: ['stay updated', 'lead activity alert'],
    explain: 'Every lead\'s activity timeline logs changes in real time, and the notification bell surfaces the ones that need your attention.', cta: SIGNUP },

  // ---- Billing ----
  { id: 'billing-plans', category: 'billing', label: 'Available plans', keywords: ['what plans', 'curvelead plans', 'pricing plans'],
    explain: 'Free, Starter, Growth, and Pro — see exactly what each includes in the pricing section below.', cta: { label: 'View Pricing', path: '#pricing' } },
  { id: 'billing-features', category: 'billing', label: 'What\'s in my plan', keywords: ['features in my plan', 'included in my plan'],
    explain: 'Each plan page lists its lead limit, user limit, and which features (like Lead Intent Index or Campaign ROI) are included.', cta: { label: 'View Pricing', path: '#pricing' } },
  { id: 'billing-manage', category: 'billing', label: 'Manage subscription', keywords: ['manage my subscription', 'manage subscription', 'upgrade plan'],
    explain: 'Upgrade, downgrade, or change billing period anytime from the Billing page — changes apply immediately.', cta: SIGNUP },
  { id: 'billing-how', category: 'billing', label: 'How billing works', keywords: ['how does billing work', 'curvelead billing'],
    explain: 'Pick monthly or yearly (two months free), pay securely via Razorpay, and your plan updates right after payment.', cta: { label: 'View Pricing', path: '#pricing' } },

  // ---- Google Business Profile ----
  { id: 'gbp-connect', category: 'gbp', label: 'Connect Google Business Profile', keywords: ['connect google business', 'connect gbp'],
    explain: 'Connect your Google account securely from the Google Business Profile section — CurveLead only accesses the listings you manage.', cta: { label: 'Learn more', path: '#google-business-profile' } },
  { id: 'gbp-reviews', category: 'gbp', label: 'Reviews', keywords: ['how do reviews work', 'google reviews'],
    explain: 'Review requests go out over WhatsApp today; replying to reviews from inside CurveLead is rolling out as Google approves deeper access.', cta: { label: 'Learn more', path: '#google-business-profile' } },
  { id: 'gbp-posts', category: 'gbp', label: 'Posts', keywords: ['how do posts work', 'google posts'],
    explain: 'Google Business Posts let you publish updates and offers directly to your listing — available once your profile is connected.', cta: { label: 'Learn more', path: '#google-business-profile' } },
  { id: 'gbp-insights', category: 'gbp', label: 'Insights', keywords: ['what are insights', 'gbp insights'],
    explain: 'Insights cover calls, direction requests, website clicks, and search views for your listing.', cta: { label: 'Learn more', path: '#google-business-profile' } },
  { id: 'gbp-troubleshoot', category: 'gbp', label: 'Reviews not loading', keywords: ['reviews not loading', 'reviews not showing'],
    explain: 'That usually means the Google account connection needs to be refreshed — reconnect it from the Google Business Profile section, and reviews should sync again within a few minutes.', cta: { label: 'Learn more', path: '#google-business-profile' } },

  // ---- Settings ----
  { id: 'settings-configure', category: 'settings', label: 'What you can configure', keywords: ['what can i configure', 'settings options'],
    explain: 'Business details, message templates, your password, and pipeline stage/status configuration all live in Settings.', cta: SIGNUP },
  { id: 'settings-account', category: 'settings', label: 'Manage your account', keywords: ['manage my account', 'manage account'],
    explain: 'Update your business details, bank/UPI info (for quotations), and password from Settings → Business/Password.', cta: SIGNUP },
  { id: 'settings-integrations', category: 'settings', label: 'Configure integrations', keywords: ['configure integrations', 'setup integrations'],
    explain: 'Connect Facebook/Instagram lead ads, Google Ads, generate a REST API key, or grab your website embed-form snippet — all from Integrations.', cta: SIGNUP },

  // ---- Integrations ----
  { id: 'integrations-how', category: 'integrations', label: 'Integrations', keywords: ['integration', 'api key', 'webhook', 'website embed form', 'connect facebook'],
    explain: 'This is where CurveLead plugs into everything else — connect Facebook/Instagram lead ads, Google Ads, grab a REST API key to push leads from any other system, or copy a ready-made embed snippet for your website\'s contact form.', cta: SIGNUP },

  // ---- Help & Support ----
  { id: 'help-support', category: 'help', label: 'Help & Support', keywords: ['help page', 'support ticket', 'submit a ticket', 'user guide', 'contact support'],
    explain: 'If something\'s not working or you just want a walkthrough, Help & Support is a real human on the other end — submit a ticket, track replies, or browse the in-app guide while you wait.', cta: SIGNUP },
];

export const CATEGORIES = [
  { id: 'general', emoji: '🏠', label: 'Dashboard' },
  { id: 'leads', emoji: '📋', label: 'Leads' },
  { id: 'whatsapp', emoji: '💬', label: 'WhatsApp' },
  { id: 'campaigns', emoji: '📢', label: 'Ads Manager' },
  { id: 'social', emoji: '🔗', label: 'Social' },
  { id: 'automations', emoji: '⚡', label: 'Automations' },
  { id: 'appointments', emoji: '📅', label: 'Appointments' },
  { id: 'followups', emoji: '🔔', label: 'Follow-ups' },
  { id: 'tasks', emoji: '✅', label: 'Tasks' },
  { id: 'reports', emoji: '📊', label: 'Reports' },
  { id: 'brochures', emoji: '📄', label: 'Brochures' },
  { id: 'coaching', emoji: '🎯', label: 'Sales Coaching' },
  { id: 'team', emoji: '👥', label: 'Team' },
  { id: 'notifications', emoji: '🔔', label: 'Notifications' },
  { id: 'billing', emoji: '💳', label: 'Billing' },
  { id: 'gbp', emoji: '⭐', label: 'Google Business' },
  { id: 'integrations', emoji: '🔌', label: 'Integrations' },
  { id: 'settings', emoji: '⚙️', label: 'Settings' },
  { id: 'help', emoji: '🆘', label: 'Help & Support' },
];

// First-screen curated set (kept short so the welcome panel isn't overwhelming).
export const CURATED_QUESTIONS = [
  'What can I do with CurveLead?',
  'How do I add a lead?',
  'How does Lead Automation work?',
  'How do I send a WhatsApp message?',
  'How do I create a campaign?',
  'How do I schedule a follow-up?',
  'What reports are available?',
  'Give me a complete demo',
];

// Every question shown in the "Explore all features" category browser, grouped by
// category id — each maps straight to a feature id so clicking is deterministic
// (no re-parsing the question text).
export const QUESTIONS_BY_CATEGORY = CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = FEATURES.filter((f) => f.category === cat.id).map((f) => ({ text: questionTextFor(f), featureId: f.id }));
  return acc;
}, {});

function questionTextFor(f) {
  // A few features read awkwardly as their own label; override those specifically.
  const overrides = {
    overview: 'What can I do with CurveLead?',
    'automation-how': 'How does Lead Automation work?',
  };
  return overrides[f.id] || f.label + '?';
}

export const ALL_QUESTIONS = CATEGORIES.flatMap((cat) => QUESTIONS_BY_CATEGORY[cat.id].map((q) => ({ ...q, category: cat.id })));

const TOUR_IDS = ['leads-add', 'campaigns-create', 'whatsapp-inbox', 'automation-how', 'appt-create', 'fu-manage', 'reports-available', 'coaching-what'];
const TOUR_EMOJI = { 'leads-add': '📋', 'campaigns-create': '📢', 'whatsapp-inbox': '💬', 'automation-how': '⚡', 'appt-create': '📅', 'fu-manage': '🔔', 'reports-available': '📊', 'coaching-what': '🎯' };
const TOUR_SHORT = {
  'leads-add': 'Manage your leads', 'campaigns-create': 'Run targeted campaigns', 'whatsapp-inbox': 'Communicate with leads',
  'automation-how': 'Automate repetitive workflows', 'appt-create': 'Manage meetings', 'fu-manage': 'Never miss a follow-up',
  'reports-available': 'Track performance', 'coaching-what': 'Improve sales performance',
};

export const startDemo = () => ({
  text: "Let's explore CurveLead 🚀",
  cards: TOUR_IDS.map((id) => {
    const f = FEATURES.find((x) => x.id === id);
    return { id, emoji: TOUR_EMOJI[id], label: CATEGORIES.find((c) => c.id === f.category)?.label || f.label, desc: TOUR_SHORT[id], cta: SIGNUP };
  }),
  cta: SIGNUP,
});

const DEMO_KEYWORDS = ['give me a demo', 'give me a complete', 'show me curvelead', 'show me all', 'how does curvelead work', 'demo'];
const FALLBACK = "I'm not sure about that yet, but I can help you with CurveLead's Leads, WhatsApp, Campaigns, Automations, Appointments, Reports, and other features.";

// Intent order matters: GREETING is checked before everything else (including the
// keyword scorer below), since "hi"/"hey" would otherwise fall through to FALLBACK —
// no FEATURES entry's keywords match a bare greeting, so bestScore stays 0.
const GREETING_RE = /\b(hi+|hello+|hey+)\b|\bgood (morning|afternoon|evening)\b/;
const CAPABILITY_RE = /what can you do|what can curvelead do|what do you do/;

const QUICK_ACTION_CATEGORY_IDS = ['leads', 'whatsapp', 'campaigns', 'automations', 'appointments', 'reports'];

const greetingQuickActions = () => QUICK_ACTION_CATEGORY_IDS.map((id) => {
  const cat = CATEGORIES.find((c) => c.id === id);
  const firstQuestion = QUESTIONS_BY_CATEGORY[id][0];
  return { label: `Explore ${cat.label}`, featureId: firstQuestion.featureId, text: firstQuestion.text };
});

const greetingResponse = () => ({
  text: 'Hi! 👋 Welcome to CurveLead AI.\n\nI can help you understand CurveLead, guide you through features, and show you how to use the platform.\n\nWhat would you like to explore?',
  quickActions: greetingQuickActions(),
  exploreAll: true,
});

const greetingWithCapabilityResponse = () => ({
  text: "Hi! 👋 I can help you with CurveLead's Leads, Campaigns, WhatsApp, Automations, Appointments, Reports, and more.\n\nYou can ask me things like:\n• How do I add a lead?\n• How do I create a campaign?\n• How does Lead Automation work?\n• How do I send a WhatsApp message?\n• Give me a complete demo.",
  exploreAll: true,
});

export const answerQuestion = (question) => {
  const q = question.toLowerCase().trim();

  const isGreeting = GREETING_RE.test(q);
  if (isGreeting && CAPABILITY_RE.test(q)) return greetingWithCapabilityResponse();
  if (isGreeting) return greetingResponse();

  if (DEMO_KEYWORDS.some((k) => q.includes(k))) return startDemo();

  let best = null, bestScore = 0;
  for (const f of FEATURES) {
    const score = f.keywords.filter((k) => q.includes(k)).length;
    if (score > bestScore) { bestScore = score; best = f; }
  }
  if (!best) return { text: FALLBACK, cta: null, steps: null, example: null };
  return { text: best.explain, steps: best.steps || null, example: best.example || null, cta: best.cta || null };
};

export const answerFeature = (featureId) => {
  const f = FEATURES.find((x) => x.id === featureId);
  if (!f) return { text: FALLBACK, cta: null, steps: null, example: null };
  return { text: f.explain, steps: f.steps || null, example: f.example || null, cta: f.cta || null };
};
