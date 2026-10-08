import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AiCampaignWizard from './AiCampaignWizard';
import GoogleSearchWizard from './GoogleSearchWizard';
import ErrorState, { errorMessage } from '../components/ui/ErrorState';
import { adsAPI } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { FB_LOGIN_CONFIG_ID, loadFbSdk } from '../utils/facebookSdk';
import { formatDateTime } from '../utils/dateTime.js';
import { formatMoney, formatNumber, currencySymbol, workspaceCurrency } from '../utils/locale';
import { AlertCircle, ChevronRight, RefreshCw, TrendingUp, LogIn, ImageOff, Pause, Play, Banknote, History, Sparkles } from 'lucide-react';

const RANGES = [['7', 'Last 7 days'], ['30', 'Last 30 days'], ['90', 'Last 90 days']];
// Meta amounts are in the ad account's currency (never the workspace's, never converted).
const inr = (n, currency) => formatMoney(n, currency);
const int = (n) => formatNumber(n);
const pct = (n) => (n === null || n === undefined ? '—' : `${Number(n).toFixed(2)}%`);
// Meta budgets come in the currency's minor unit (paise, cents, fils).
const paise = (p, currency) => (p ? inr(Number(p) / 100, currency) : '—');
const isoDaysAgo = (d) => new Date(Date.now() - d * 864e5).toISOString().slice(0, 10);

const statusClass = (s = '') =>
  s === 'ACTIVE' ? 'bg-green-100 text-green-700' : /PAUSED/.test(s) ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600';

const Stat = ({ label, value, sub }) => (
  <div className="bg-white border rounded-xl p-4">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-xl font-bold mt-1">{value}</p>
    {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

// Shared table for campaigns / ad sets / ads — same metric columns at every level.
const MetricsTable = ({ rows, onOpen, nameCell, budget, actions, currency, leadsLabel = 'Leads' }) => (
  <div className="bg-white border rounded-xl overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-xs text-gray-500">
        <tr>
          <th className="text-left px-3 py-2 font-medium">Name</th>
          <th className="text-left px-3 py-2 font-medium">Status</th>
          {budget && <th className="text-right px-3 py-2 font-medium">Daily budget</th>}
          <th className="text-right px-3 py-2 font-medium">Spend</th>
          <th className="text-right px-3 py-2 font-medium">Impr.</th>
          <th className="text-right px-3 py-2 font-medium">CTR</th>
          <th className="text-right px-3 py-2 font-medium">CPC</th>
          <th className="text-right px-3 py-2 font-medium">{leadsLabel}</th>
          <th className="text-right px-3 py-2 font-medium">{leadsLabel === 'Leads' ? 'CPL' : 'Cost / conv.'}</th>
          {actions && <th className="px-3 py-2" />}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && <tr><td colSpan={(budget ? 9 : 8) + (actions ? 1 : 0)} className="px-3 py-6 text-center text-gray-400">Nothing in this period.</td></tr>}
        {rows.map((r) => (
          <tr key={r.id} onClick={onOpen ? () => onOpen(r) : undefined} className={`border-t ${onOpen ? 'cursor-pointer hover:bg-gray-50' : ''}`}>
            <td className="px-3 py-2 min-w-[200px]">{nameCell ? nameCell(r) : <span className="font-medium">{r.name}</span>}</td>
            <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusClass(r.effective_status)}`}>{(r.effective_status || '—').replace(/_/g, ' ').toLowerCase()}</span></td>
            {budget && <td className="px-3 py-2 text-right">{paise(r.daily_budget_paise, currency)}</td>}
            <td className="px-3 py-2 text-right">{inr(r.spend, currency)}</td>
            <td className="px-3 py-2 text-right">{int(r.impressions)}</td>
            <td className="px-3 py-2 text-right">{pct(r.ctr)}</td>
            <td className="px-3 py-2 text-right">{inr(r.cpc, currency)}</td>
            <td className="px-3 py-2 text-right">{int(r.leads)}</td>
            <td className="px-3 py-2 text-right font-medium">{inr(r.cpl, currency)}</td>
            {actions && <td className="px-3 py-2 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>{actions(r)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Pause/resume + budget buttons for a campaign or ad set / ad group row (Phase 3, Google 7b).
// A Google budget shared by several campaigns is changed in Google Ads, not here.
const RowActions = ({ row, busy, onStatus, onBudget, platform }) => {
  const active = row.status === 'ACTIVE' || row.status === 'ENABLED';
  const canEditBudget = row.daily_budget_paise != null && !row.lifetime_budget_paise && !row.budget_shared;
  return (
    <div className="inline-flex gap-1">
      <button onClick={() => onStatus(row, active ? 'pause' : 'resume')} disabled={busy}
        title={active ? `Pause on ${platform}` : `Resume on ${platform}`}
        className={`p-1.5 rounded-lg border text-xs disabled:opacity-40 ${active ? 'hover:bg-amber-50 text-amber-700' : 'hover:bg-green-50 text-green-700'}`}>
        {active ? <Pause size={13} /> : <Play size={13} />}
      </button>
      {canEditBudget && (
        <button onClick={() => onBudget(row)} disabled={busy} title="Change daily budget"
          className="p-1.5 rounded-lg border text-xs hover:bg-gray-50 text-gray-600 disabled:opacity-40"><Banknote size={13} /></button>
      )}
    </div>
  );
};

const ACTION_LABEL = { pause: 'Paused', resume: 'Resumed', update_budget: 'Budget changed', create: 'Created', activate: 'Activated' };
const describeChange = (e) => e.action === 'update_budget'
  ? `${paise(e.old_value?.daily_budget_paise)} → ${paise(e.new_value?.daily_budget_paise)} per day`
  : `${(e.old_value?.status || '—').toLowerCase()} → ${(e.new_value?.status || (e.action === 'pause' ? 'PAUSED' : 'ACTIVE')).toLowerCase()}`;

const ChangeHistory = ({ entries }) => (
  <details className="bg-white border rounded-xl">
    <summary className="px-3 py-2.5 text-sm font-semibold cursor-pointer select-none flex items-center gap-2"><History size={14} /> Change history <span className="text-xs font-normal text-gray-400">({entries.length})</span></summary>
    {entries.length === 0 ? <p className="px-3 pb-3 text-sm text-gray-400">No changes made from CurveLead yet.</p> : (
      <ul className="divide-y text-sm">
        {entries.map((e) => (
          <li key={e.id} className="px-3 py-2 flex flex-wrap items-baseline gap-x-2">
            <span className={`text-[11px] font-semibold ${e.success ? 'text-gray-700' : 'text-red-600'}`}>{e.success ? ACTION_LABEL[e.action] || e.action : 'Failed'}</span>
            <span className="font-medium">{e.entity_name || e.entity_id}</span>
            <span className="text-xs text-gray-500">{e.success ? describeChange(e) : e.error}</span>
            <span className="ml-auto text-[11px] text-gray-400">{e.user_name || 'System'} · {formatDateTime(e.created_at)}</span>
          </li>
        ))}
      </ul>
    )}
  </details>
);

// Facebook permissions for Ads Manager, from the connect response or the saved login.
const AD_PERMISSIONS = [
  ['ads_read', 'Read ad performance'], ['ads_management', 'Manage ads (pause, budgets)'],
  ['business_management', 'Business Manager ad accounts'], ['leads_retrieval', 'Lead-ad leads'],
];
const permissionsFromAccount = (a) => a && Object.fromEntries(AD_PERMISSIONS.map(([p]) => [p,
  (a.token_scopes || []).includes(p) ? 'granted' : (a.token_declined_scopes || []).includes(p) ? 'declined' : 'missing']));
const PERMISSION_STYLE = { granted: 'bg-green-50 text-green-700 border-green-200', declined: 'bg-amber-50 text-amber-800 border-amber-200', missing: 'bg-gray-50 text-gray-500 border-gray-200' };
const PERMISSION_TEXT = { granted: '✓ granted', declined: 'turned off', missing: 'not granted' };
const PermissionList = ({ permissions }) => (
  <div className="flex flex-wrap gap-1.5">
    {AD_PERMISSIONS.map(([p, label]) => (
      <span key={p} title={p} className={`px-2 py-0.5 rounded-full border text-[11px] ${PERMISSION_STYLE[permissions[p]] || PERMISSION_STYLE.missing}`}>
        {label}: <strong className="font-semibold">{PERMISSION_TEXT[permissions[p]] || PERMISSION_TEXT.missing}</strong>
      </span>
    ))}
  </div>
);

// Why connecting didn't work: ADS_READ_DECLINED (the person turned ad access off — Reconnect
// asks Facebook again) or ADS_READ_NOT_APPROVED (Facebook never offered it).
const ConnectProblem = ({ problem, onReconnect, connecting }) => (
  <div className="text-left bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
    <p className="text-sm text-amber-900 flex items-start gap-2"><AlertCircle size={16} className="mt-0.5 shrink-0" />{problem.message}</p>
    {problem.permissions && <PermissionList permissions={problem.permissions} />}
    <button onClick={onReconnect} disabled={connecting} className="px-3 py-1.5 bg-[#1877F2] text-white rounded-lg text-xs font-semibold disabled:opacity-50">
      {connecting ? 'Opening Facebook…' : problem.code === 'ADS_READ_DECLINED' ? 'Reconnect and allow ad access' : 'Connect again'}
    </button>
  </div>
);

// Per-provider wording. Both platforms have pause/resume, budgets, the shared daily budget
// cap, change history and an AI wizard (Meta: lead ads; Google: search ads).
const PROVIDER = {
  meta: { name: 'Meta', leads: 'leads', leadsLabel: 'Leads', reconnectHint: 'Facebook access expired — click Reconnect.', groupLevel: 'ad set' },
  google: { name: 'Google', leads: 'conversions', leadsLabel: 'Conversions', reconnectHint: 'Google Ads access expired — click Reconnect.', groupLevel: 'ad group' },
};

const AdsPage = ({ provider = 'meta' }) => {
  const toast = useToast();
  const P = PROVIDER[provider];
  const isMeta = provider === 'meta';
  const [googleStatus, setGoogleStatus] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [accountId, setAccountId] = useState('');
  const [days, setDays] = useState('30');
  const [dash, setDash] = useState(null);
  const [level, setLevel] = useState({ type: 'campaigns' }); // { type, campaign?, adset? }
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [budgetEdit, setBudgetEdit] = useState(null); // { row, value }
  const [settings, setSettings] = useState(null);     // { daily_budget_cap_paise, active_daily_budget_paise }
  const [capEdit, setCapEdit] = useState(null);       // string while editing
  const [history, setHistory] = useState([]);
  const [reload, setReload] = useState(0);
  const [wizard, setWizard] = useState(false);
  const [accountsError, setAccountsError] = useState('');
  const [connectProblem, setConnectProblem] = useState(null); // { code, message, permissions }
  const [granted, setGranted] = useState(null);               // permissions from the last successful connect
  const [dataError, setDataError] = useState('');

  const params = { provider, account_id: accountId || undefined, from: isoDaysAgo(Number(days) - 1), to: isoDaysAgo(0) };
  const account = accounts?.find((a) => a.id === accountId);
  const cur = account?.currency || undefined;

  const loadAccounts = useCallback(async () => {
    setAccountsError('');
    try {
      const { data } = await adsAPI.getAccounts({ provider });
      setAccounts(data.accounts);
      setAccountId((cur) => cur || data.accounts.find((a) => a.is_primary)?.id || data.accounts[0]?.id || '');
    } catch (e) { setAccountsError(errorMessage(e, 'Could not load your ad accounts.')); setAccounts([]); }
  }, [provider]);

  useEffect(() => {
    loadAccounts();
    if (isMeta) loadFbSdk().catch(() => {});
    else adsAPI.googleStatus().then(({ data }) => setGoogleStatus(data)).catch(() => setGoogleStatus({ configured: false }));
  }, [loadAccounts, isMeta]);

  // Back from Google's consent screen: /ads?tab=google&google_connect=success|denied|error&reason=…
  useEffect(() => {
    if (isMeta) return;
    const q = new URLSearchParams(window.location.search);
    const result = q.get('google_connect');
    if (!result) return;
    if (result === 'success') toast.success(`Connected ${q.get('accounts') || 0} Google Ads account${q.get('accounts') === '1' ? '' : 's'}. First sync is running.`);
    else if (result === 'denied') toast.error('Google Ads wasn\'t connected — permission was not given.');
    else toast.error(q.get('reason') || 'Could not connect Google Ads.');
    ['google_connect', 'accounts', 'skipped', 'reason'].forEach(k => q.delete(k));
    window.history.replaceState(null, '', `${window.location.pathname}?${q}`);
  }, [isMeta]);

  useEffect(() => {
    if (!accountId) return;
    setLoading(true);
    const req = level.type === 'campaigns' ? adsAPI.getCampaigns(params)
      : level.type === 'adsets' ? adsAPI.getAdsets(level.campaign.id, params)
      : adsAPI.getAds(level.adset.id, params);
    Promise.all([req, level.type === 'campaigns' ? adsAPI.getDashboard(params) : Promise.resolve(null)])
      .then(([{ data }, d]) => {
        setRows(data.campaigns || data.adsets || data.ads || []);
        if (d) setDash(d.data);
      })
      .then(() => setDataError(''))
      .catch((e) => setDataError(errorMessage(e, 'Could not load ad data.')))
      .finally(() => setLoading(false));
  }, [accountId, days, level, reload]);

  useEffect(() => {
    if (!accountId || level.type !== 'campaigns') return;
    adsAPI.getSettings().then(({ data }) => setSettings(data)).catch(() => {});
    adsAPI.getAudit({ limit: 30, provider }).then(({ data }) => setHistory(data.entries || [])).catch(() => {});
  }, [accountId, level, reload, provider]);

  const entityLevel = level.type === 'campaigns' ? 'campaigns' : 'adsets';
  const changeStatus = async (row, action) => {
    setBusyId(row.id);
    try {
      const { data } = await adsAPI.setStatus(entityLevel, row.id, action);
      toast.success(data.unchanged ? 'Already in that state.' : `${row.name} ${action === 'pause' ? 'paused' : 'resumed'} on ${P.name}.`);
      setReload((n) => n + 1);
    } catch (e) { toast.error(e.response?.data?.error || `Could not change it on ${P.name}.`); }
    finally { setBusyId(null); }
  };
  const saveBudget = async () => {
    const rupees = Number(budgetEdit.value);
    if (!(rupees >= 1)) return toast.error(`Enter a daily budget in ${cur || 'the ad account currency'}.`);
    setBusyId(budgetEdit.row.id);
    try {
      await adsAPI.setBudget(entityLevel, budgetEdit.row.id, Math.round(rupees * 100));
      toast.success(`Daily budget for ${budgetEdit.row.name} set to ${inr(rupees, cur)}.`);
      setBudgetEdit(null);
      setReload((n) => n + 1);
    } catch (e) { toast.error(e.response?.data?.error || `Could not change the budget on ${P.name}.`); }
    finally { setBusyId(null); }
  };
  const saveCap = async () => {
    const value = capEdit.trim() === '' ? null : Math.round(Number(capEdit) * 100);
    if (value !== null && !(value >= 100)) return toast.error('Enter a cap in rupees, or leave it empty for no cap.');
    try {
      await adsAPI.updateSettings({ daily_budget_cap_paise: value });
      setSettings((s) => ({ ...s, daily_budget_cap_paise: value }));
      setCapEdit(null);
      toast.success(value ? `Daily budget cap set to ${paise(value, cur)}.` : 'Daily budget cap removed.');
    } catch (e) { toast.error(e.response?.data?.error || 'Could not save the cap.'); }
  };
  const rowActions = (r) => <RowActions row={r} platform={P.name} busy={busyId === r.id} onStatus={changeStatus} onBudget={(row) => setBudgetEdit({ row, value: String(Number(row.daily_budget_paise) / 100) })} />;

  // rerequest: Facebook shows the permissions the person turned off again (auth_type 'rerequest').
  const connect = ({ rerequest = false } = {}) => {
    if (!isMeta) {
      setConnecting(true);
      adsAPI.googleConnectUrl().then(({ data }) => { window.location.href = data.url; })
        .catch((e) => { toast.error(e.response?.data?.error || 'Could not start the Google connection.'); setConnecting(false); });
      return;
    }
    if (!window.FB) return toast.error('Facebook is still loading. Please try again in a moment.');
    setConnecting(true);
    window.FB.login((resp) => {
      const token = resp?.authResponse?.accessToken;
      if (!token) { setConnecting(false); return; }
      adsAPI.connect(token)
        .then(({ data }) => {
          setConnectProblem(null);
          setGranted(data.permissions || null);
          toast.success(`Connected ${data.connected} ad account${data.connected === 1 ? '' : 's'}. First sync is running.`);
          return loadAccounts();
        })
        .catch((e) => {
          const d = e.response?.data || {};
          if (d.code === 'ADS_READ_DECLINED' || d.code === 'ADS_READ_NOT_APPROVED') setConnectProblem({ code: d.code, message: d.error, permissions: d.permissions });
          else toast.error(d.error || 'Could not connect ad accounts.');
        })
        .finally(() => setConnecting(false));
    }, { config_id: FB_LOGIN_CONFIG_ID, ...(rerequest ? { auth_type: 'rerequest' } : {}) });
  };
  const reconnect = () => connect({ rerequest: connectProblem?.code === 'ADS_READ_DECLINED' || account?.token_status === 'expired' });

  const syncNow = async () => {
    try { await adsAPI.sync(accountId); toast.success('Sync started — new numbers appear in a few minutes.'); }
    catch (e) { toast.error(e.response?.data?.error || 'Could not start sync.'); }
  };

  if (accounts === null) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;

  if (accountsError) return <ErrorState message={accountsError} onRetry={() => { setAccounts(null); loadAccounts(); }} />;

  if (!accounts.length && !isMeta) {
    return (
      <div className="max-w-lg mx-auto mt-10 bg-white border rounded-2xl p-6 text-center space-y-3">
        <TrendingUp className="mx-auto text-brand-600" size={28} />
        <h2 className="text-lg font-bold">Connect Google Ads</h2>
        <p className="text-sm text-gray-500">See cost, clicks and conversions for every Google Ads campaign, ad group and ad — next to how many of those leads qualified and converted in CurveLead.</p>
        {googleStatus && !googleStatus.configured ? (
          <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2"><span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 mr-1.5">Coming soon</span>Google Ads reporting isn't available yet. Leads from Google Ads lead forms already arrive through Integrations → Google Ads Lead Forms.</p>
        ) : (
          <button onClick={() => connect()} disabled={connecting} className="px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-semibold disabled:opacity-50 inline-flex items-center gap-2 hover:bg-gray-50">
            <LogIn size={16} /> {connecting ? 'Opening Google…' : 'Connect with Google'}
          </button>
        )}
        {googleStatus?.token_error && <p className="text-xs text-red-600">{googleStatus.token_error}</p>}
      </div>
    );
  }

  if (!accounts.length) {
    return (
      <div className="max-w-lg mx-auto mt-10 bg-white border rounded-2xl p-6 text-center space-y-3">
        <TrendingUp className="mx-auto text-brand-600" size={28} />
        <h2 className="text-lg font-bold">Connect your Meta ad accounts</h2>
        <p className="text-sm text-gray-500">See spend, leads and CPL for every campaign, ad set and ad — next to how many of those leads actually qualified and converted in CurveLead.</p>
        {connectProblem
          ? <ConnectProblem problem={connectProblem} onReconnect={reconnect} connecting={connecting} />
          : <button onClick={() => connect()} disabled={connecting} className="px-4 py-2.5 bg-[#1877F2] text-white rounded-xl text-sm font-semibold disabled:opacity-50 inline-flex items-center gap-2">
              <LogIn size={16} /> {connecting ? 'Connecting…' : 'Connect with Facebook'}
            </button>}
      </div>
    );
  }

  const t = dash?.totals;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2">{P.name} Ads
            {account?.token_status === 'expired' && (
              <button onClick={reconnect} title={account.token_expired_at ? `Facebook ended this login on ${formatDateTime(account.token_expired_at)}` : undefined}
                className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 hover:bg-red-200">Expired – Reconnect</button>
            )}
          </h2>
          <p className="text-xs text-gray-500">
            {account?.last_synced_at ? `Last synced ${formatDateTime(account.last_synced_at)}` : 'First sync in progress…'}
          </p>
          {(account?.currency || account?.timezone_name) && (
            <p className="text-[11px] text-gray-400" title={`${P.name} reports this account's spend in its own currency, and its days in its own timezone.`}>
              Ad account: {[account.currency, account.timezone_name].filter(Boolean).join(' · ')}
              {account.currency && account.currency !== workspaceCurrency() ? ` — amounts in ${account.currency}, not converted` : ''}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {accounts.length > 1 && (
            <select value={accountId} onChange={(e) => { setAccountId(e.target.value); setLevel({ type: 'campaigns' }); }} className="px-3 py-2 border rounded-lg text-sm bg-white">
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name || a.external_id}</option>)}
            </select>
          )}
          <select value={days} onChange={(e) => setDays(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white">
            {RANGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button onClick={() => setWizard(true)} className="px-3 py-2 bg-violet-600 text-white rounded-lg text-sm font-semibold hover:bg-violet-700 inline-flex items-center gap-1.5"><Sparkles size={14} /> Create with AI</button>
          <button onClick={syncNow} className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 inline-flex items-center gap-1.5"><RefreshCw size={14} /> Sync now</button>
          {!isMeta && <button onClick={() => adsAPI.googleRefresh().then(({ data }) => { toast.success(`Found ${data.accounts} Google Ads account${data.accounts === 1 ? '' : 's'}.`); loadAccounts(); }).catch((e) => toast.error(e.response?.data?.error || 'Could not refresh accounts.'))}
            className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">Refresh accounts</button>}
          <button onClick={reconnect} disabled={connecting} className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">{connecting ? 'Connecting…' : 'Reconnect'}</button>
        </div>
      </div>

      {isMeta && connectProblem && <ConnectProblem problem={connectProblem} onReconnect={reconnect} connecting={connecting} />}
      {isMeta && (granted || account?.token_scopes) && (
        <div className="bg-white border rounded-xl px-3 py-2.5 space-y-1.5">
          <p className="text-xs text-gray-500">{granted ? 'Facebook gave CurveLead these permissions:' : 'Facebook permissions on this connection:'}</p>
          <PermissionList permissions={granted || permissionsFromAccount(account)} />
        </div>
      )}
      {(account?.sync_error || account?.token_status === 'expired') && (
        <div className="flex items-start gap-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl px-3 py-2 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{account.token_status === 'expired' ? P.reconnectHint : `Last sync failed: ${account.sync_error}`}</span>
        </div>
      )}

      {level.type === 'campaigns' && t && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Spend" value={inr(t.spend, cur)} sub={t.won_this_period ? `${int(t.won_this_period)} won this period` : 'In this period'} />
          <Stat label={`Reported by ${P.name}`} value={`${int(t.meta_leads)} ${P.leads}`} sub={`${inr(t.meta_cpl, cur)} per ${P.name} ${P.leads === 'leads' ? 'lead' : 'conversion'}`} />
          <Stat label="In CurveLead" value={`${int(t.crm_leads)} leads`} sub={`${inr(t.cost_per_lead, cur)} per lead · ${int(t.qualified_leads)} qualified`} />
          <Stat label="Cost per customer" value={inr(t.cost_per_converted, cur)} sub={`${int(t.converted_leads)} of these leads converted`} />
        </div>
      )}

      {dataError && <ErrorState message={dataError} onRetry={() => setReload((n) => n + 1)} retrying={loading} />}
      {level.type === 'campaigns' && settings && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-white border rounded-xl px-4 py-3 text-sm">
          <span className="text-gray-500">Set to spend per day: <strong className="text-gray-900">{paise(settings.active_daily_budget_paise, cur)}</strong></span>
          {capEdit === null ? (
            <span className="text-gray-500">Daily budget cap: <strong className={settings.daily_budget_cap_paise && settings.active_daily_budget_paise > settings.daily_budget_cap_paise ? 'text-red-600' : 'text-gray-900'}>{settings.daily_budget_cap_paise ? paise(settings.daily_budget_cap_paise, cur) : 'none'}</strong>
              <button onClick={() => setCapEdit(settings.daily_budget_cap_paise ? String(settings.daily_budget_cap_paise / 100) : '')} className="ml-2 text-xs text-brand-600 font-semibold hover:underline">Edit</button>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="text-gray-500">Cap ({currencySymbol(cur)})</span>
              <input autoFocus type="number" min="1" value={capEdit} onChange={(e) => setCapEdit(e.target.value)} placeholder="no cap" className="w-28 px-2 py-1 border rounded-lg text-sm" />
              <button onClick={saveCap} className="px-2.5 py-1 bg-brand-600 text-white rounded-lg text-xs font-semibold">Save</button>
              <button onClick={() => setCapEdit(null)} className="text-xs text-gray-500">Cancel</button>
            </span>
          )}
          <span className="text-[11px] text-gray-400">One cap for Meta and Google together. Budget increases and resumes from CurveLead that would go over it are blocked.</span>
        </div>
      )}
      <div className="flex items-center gap-1 text-sm text-gray-500">
        <button onClick={() => setLevel({ type: 'campaigns' })} className={level.type === 'campaigns' ? 'font-semibold text-gray-900' : 'hover:underline'}>Campaigns</button>
        {level.campaign && <><ChevronRight size={14} /><button onClick={() => setLevel({ type: 'adsets', campaign: level.campaign })} className={level.type === 'adsets' ? 'font-semibold text-gray-900' : 'hover:underline'}>{level.campaign.name}</button></>}
        {level.adset && <><ChevronRight size={14} /><span className="font-semibold text-gray-900">{level.adset.name}</span></>}
        {loading && <span className="ml-2 text-xs text-gray-400">Loading…</span>}
      </div>

      {level.type === 'campaigns' && (
        <MetricsTable currency={cur} leadsLabel={P.leadsLabel} rows={rows} budget actions={rowActions} onOpen={(c) => setLevel({ type: 'adsets', campaign: c })} />
      )}
      {level.type === 'adsets' && (
        <MetricsTable currency={cur} leadsLabel={P.leadsLabel} rows={rows} budget={isMeta} actions={rowActions} onOpen={(s) => setLevel({ type: 'ads', campaign: level.campaign, adset: s })} />
      )}
      {level.type === 'ads' && (
        <MetricsTable currency={cur} leadsLabel={P.leadsLabel} rows={rows} nameCell={(a) => (
          <div className="flex items-start gap-2">
            {a.creative?.thumbnail_url
              ? <img src={a.creative.thumbnail_url} alt="" className="w-12 h-12 rounded object-cover shrink-0" />
              : <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center shrink-0"><ImageOff size={16} className="text-gray-400" /></div>}
            <div className="min-w-0">
              <p className="font-medium">{a.name}</p>
              {a.creative?.title && <p className="text-xs text-gray-600 truncate max-w-xs">{a.creative.title}</p>}
              {a.creative?.body && <p className="text-[11px] text-gray-400 line-clamp-2 max-w-xs">{a.creative.body}</p>}
            </div>
          </div>
        )} />
      )}

      {level.type === 'campaigns' && dash?.campaigns?.length > 0 && (
        <div className="bg-white border rounded-xl overflow-x-auto">
          <p className="px-3 pt-3 text-sm font-semibold">Lead quality by campaign</p>
          <table className="w-full text-sm mt-2">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Campaign</th>
                <th className="text-right px-3 py-2 font-medium">Spend</th>
                <th className="text-right px-3 py-2 font-medium" title={`Spend ÷ ${P.leads} ${P.name} reports`}>{isMeta ? 'Meta CPL' : 'Google cost / conv.'}</th>
                <th className="text-right px-3 py-2 font-medium" title="Leads in CurveLead created in this period">Leads in CurveLead</th>
                <th className="text-right px-3 py-2 font-medium">Cost / qualified</th>
                <th className="text-right px-3 py-2 font-medium">Cost / customer</th>
              </tr>
            </thead>
            <tbody>
              {dash.campaigns.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-3 py-2">
                    {c.crm_campaign_id
                      ? <Link to={`/campaigns/${c.crm_campaign_id}?period=custom&date_from=${params.from}&date_to=${params.to}`} className="text-brand-700 hover:underline" title="Leads and outcomes in CurveLead">{c.name}</Link>
                      : c.name}
                  </td>
                  <td className="px-3 py-2 text-right">{inr(c.spend, cur)}</td>
                  <td className="px-3 py-2 text-right">{inr(c.meta_cpl, cur)}</td>
                  <td className="px-3 py-2 text-right">{int(c.crm_leads)}</td>
                  <td className="px-3 py-2 text-right">{inr(c.cost_per_qualified, cur)} <span className="text-[11px] text-gray-400">({int(c.qualified_leads)})</span></td>
                  <td className="px-3 py-2 text-right">{inr(c.cost_per_converted, cur)} <span className="text-[11px] text-gray-400">({int(c.converted_leads)})</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-3 py-2 text-[11px] text-gray-400">“Reported by {P.name}” is {P.name}'s own count{isMeta ? '' : ' of conversions (whatever the account counts as one)'}. “In CurveLead” = leads attributed to the campaign and created in this period; qualified / customers = of those leads, the ones that reached a qualified or won stage. Same definitions as the Campaigns tab and Reports.</p>
        </div>
      )}
      {level.type === 'campaigns' && <ChangeHistory entries={history} />}
      {wizard && (isMeta
        ? <AiCampaignWizard currency={cur} onClose={() => { setWizard(false); setReload((n) => n + 1); }} onChanged={() => setReload((n) => n + 1)} />
        : <GoogleSearchWizard currency={cur} onClose={() => { setWizard(false); setReload((n) => n + 1); }} onChanged={() => setReload((n) => n + 1)} />)}
      {budgetEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setBudgetEdit(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-3">
            <h2 className="font-bold">Daily budget</h2>
            <p className="text-xs text-gray-500">{budgetEdit.row.name} · now {paise(budgetEdit.row.daily_budget_paise, cur)} per day. The change goes live on {P.name} immediately.</p>
            <label className="flex items-center gap-2">
              <span className="text-gray-500">{currencySymbol(cur)}</span>
              <input autoFocus type="number" min="1" step="1" value={budgetEdit.value} onChange={(e) => setBudgetEdit((b) => ({ ...b, value: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && saveBudget()} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
              <span className="text-xs text-gray-400">per day</span>
            </label>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setBudgetEdit(null)} className="flex-1 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={saveBudget} disabled={busyId === budgetEdit.row.id} className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                {busyId === budgetEdit.row.id ? 'Saving…' : `Save on ${P.name}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdsPage;
