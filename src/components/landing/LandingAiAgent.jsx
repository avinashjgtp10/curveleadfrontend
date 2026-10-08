import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, ChevronLeft, ChevronRight, Info, MessageCircle, Minus, PhoneCall, Search, Send, Sparkles, X } from 'lucide-react';
import {
  answerFeature, answerQuestion,
  CATEGORIES, CURATED_QUESTIONS, QUESTIONS_BY_CATEGORY, ALL_QUESTIONS,
} from '../../services/landingAiKnowledge';

const Message = ({ role, text, steps, example, cards, cta, quickActions, exploreAll, onQuickAction, onExploreAll }) => {
  const isUser = role === 'user';
  return (
    <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
          <Bot size={14} />
        </div>
      )}
      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${isUser ? 'rounded-br-sm bg-brand-600 text-white' : 'rounded-bl-sm bg-gray-100 text-gray-800'}`}>
        <p className="whitespace-pre-line">{text}</p>

        {quickActions && (
          <div className="mt-2.5 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
            {quickActions.map((item) => (
              <button
                key={item.featureId}
                onClick={() => onQuickAction(item)}
                className="rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {exploreAll && (
          <button onClick={onExploreAll} className="mt-2 block text-xs font-bold text-brand-600 hover:underline">
            Explore all features →
          </button>
        )}

        {steps && (
          <ol className="mt-2 space-y-1 pl-4 text-sm">
            {steps.map((s, i) => <li key={i} className="list-decimal">{s}</li>)}
          </ol>
        )}

        {example && <p className="mt-2 text-xs italic text-gray-500">{example}</p>}

        {cards && (
          <div className="mt-2.5 space-y-2">
            {cards.map((card) => (
              <div key={card.id} className="flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-2.5">
                <span className="text-base leading-none">{card.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-900">{card.label}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{card.desc}</p>
                  <a href={card.cta.path} className="mt-1.5 inline-block text-xs font-semibold text-brand-600 hover:underline">
                    {card.cta.label} →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {cta && (
          <a
            href={cta.path}
            className={`mt-2 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${isUser ? 'bg-white/20 text-white' : 'bg-white text-brand-700 border border-brand-200 hover:bg-brand-50'}`}
          >
            {cta.label} →
          </a>
        )}
      </div>
    </div>
  );
};

const TypingBubble = () => (
  <div className="flex items-end gap-2">
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
      <Bot size={14} />
    </div>
    <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-gray-100 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  </div>
);

const ContactActions = () => (
  <div className="mt-5 grid grid-cols-2 gap-2 text-left">
    <a
      href="https://wa.me/919999999999?text=Hi%20CurveLead%2C%20I%20want%20to%20learn%20more%20about%20the%20platform."
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
    >
      <MessageCircle size={15} />
      WhatsApp
    </a>
    <a
      href="tel:+919999999999"
      className="flex items-center justify-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 text-xs font-bold text-brand-700 hover:bg-brand-100"
    >
      <PhoneCall size={15} />
      Call
    </a>
  </div>
);

// Browse-all-features panel: category list → expand to its questions, or search
// across every question at once. Shown in place of the welcome screen once the
// user taps "Explore all features"; picking a question sends it like any other.
const ExploreView = ({ onBack, onPick }) => {
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return ALL_QUESTIONS.filter((item) => item.text.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 px-3 py-2.5">
        <button onClick={onBack} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><ChevronLeft size={16} /></button>
        <p className="text-sm font-bold text-gray-900">Explore all features</p>
      </div>
      <div className="shrink-0 px-3 pt-3">
        <div className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2">
          <Search size={14} className="text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setExpanded(null); }}
            placeholder="Search CurveLead help…"
            className="flex-1 bg-transparent text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {results ? (
          <div className="space-y-1.5">
            {results.length === 0 && <p className="px-1 text-xs text-gray-400">No matches — try a different word.</p>}
            {results.map((item) => (
              <button key={item.featureId} onClick={() => onPick(item)} className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs font-medium text-gray-700 hover:border-brand-200 hover:bg-brand-50">
                {item.text}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {CATEGORIES.map((cat) => {
              const open = expanded === cat.id;
              const questions = QUESTIONS_BY_CATEGORY[cat.id] || [];
              return (
                <div key={cat.id} className="overflow-hidden rounded-lg border border-gray-200">
                  <button
                    onClick={() => setExpanded(open ? null : cat.id)}
                    className="flex w-full items-center justify-between bg-white px-3 py-2.5 text-left text-xs font-semibold text-gray-800 hover:bg-gray-50"
                  >
                    <span>{cat.emoji} {cat.label}</span>
                    <ChevronRight size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`} />
                  </button>
                  {open && (
                    <div className="space-y-1 border-t border-gray-100 bg-gray-50/60 p-2">
                      {questions.map((item) => (
                        <button key={item.featureId} onClick={() => onPick({ ...item, category: cat.id })} className="block w-full rounded-lg bg-white px-3 py-2 text-left text-xs font-medium text-gray-700 hover:border hover:border-brand-200 hover:bg-brand-50">
                          {item.text}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// A self-contained landing-page chat widget modeled on Salesforce Agentforce's layout.
// Answers come from a local rule-based knowledge base (services/landingAiKnowledge.js)
// — the same { text, steps, example, cta } shape a real AI API would return, so
// swapping in a live backend later only means replacing the answer functions.
const LandingAiAgent = () => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [exploring, setExploring] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const pushExchange = (userText, resolve) => {
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setExploring(false);
    setTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'ai', ...resolve() }]);
      setTyping(false);
    }, 550);
  };

  const send = (text) => {
    const question = text.trim();
    if (!question || typing) return;
    setInput('');
    pushExchange(question, () => answerQuestion(question));
  };

  const pickQuestion = (item) => {
    if (typing) return;
    pushExchange(item.text, () => answerFeature(item.featureId));
  };

  const handleOpen = () => { setOpen(true); setMinimized(false); };

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        aria-label="Open CurveLead AI assistant"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-xl shadow-brand-200 transition-transform hover:scale-105"
      >
        <Sparkles size={22} />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all ${minimized ? 'h-16' : 'h-[34rem] max-h-[calc(100vh-3rem)]'}`}>
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white">
            <Bot size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-950">CurveLead AI</p>
            {!minimized && <p className="text-[11px] text-gray-400">Ask CurveLead</p>}
          </div>
        </div>
        <div className="flex items-center gap-1 text-gray-400">
          <button title="About CurveLead AI" className="rounded-lg p-1.5 hover:bg-gray-100 hover:text-gray-600"><Info size={15} /></button>
          <button onClick={() => setMinimized((v) => !v)} title={minimized ? 'Expand' : 'Minimize'} className="rounded-lg p-1.5 hover:bg-gray-100 hover:text-gray-600"><Minus size={15} /></button>
          <button onClick={() => setOpen(false)} title="Close" className="rounded-lg p-1.5 hover:bg-gray-100 hover:text-gray-600"><X size={16} /></button>
        </div>
      </div>

      {!minimized && (
        exploring ? (
          <ExploreView onBack={() => setExploring(false)} onPick={pickQuestion} />
        ) : (
          <>
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-gray-50/50 px-4 py-4">
              {messages.length === 0 ? (
                <div className="pt-4 text-center">
                  <h3 className="text-xl font-extrabold leading-snug text-gray-950">
                    How can <span className="text-brand-600">CurveLead</span> help?
                  </h3>
                  <p className="mx-auto mt-2 max-w-[15rem] text-xs leading-5 text-gray-500">
                    Ask me anything about CurveLead. I can explain features, guide you through workflows, and give you a product demo.
                  </p>
                  <ContactActions />
                  <div className="mt-5 flex flex-col gap-2 text-left">
                    {CURATED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => send(q)}
                        className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-left text-xs font-medium text-gray-700 hover:border-brand-200 hover:bg-brand-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setExploring(true)}
                    className="mt-3 w-full rounded-xl border border-dashed border-brand-200 bg-brand-50/50 px-3.5 py-2.5 text-xs font-bold text-brand-700 hover:bg-brand-50"
                  >
                    Explore all features →
                  </button>
                </div>
              ) : (
                <>
                  {messages.map((m, i) => (
                    <Message key={i} {...m} onQuickAction={pickQuestion} onExploreAll={() => setExploring(true)} />
                  ))}
                  {!typing && messages.length > 0 && (
                    <button onClick={() => setExploring(true)} className="w-full rounded-xl border border-dashed border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-500 hover:border-brand-200 hover:text-brand-600">
                      Explore all features →
                    </button>
                  )}
                </>
              )}
              {typing && <TypingBubble />}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex shrink-0 items-center gap-2 border-t border-gray-100 bg-white px-3 py-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask CurveLead anything…"
                className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              <button
                type="submit"
                disabled={!input.trim() || typing}
                aria-label="Send"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white disabled:opacity-40"
              >
                <Send size={15} />
              </button>
            </form>
          </>
        )
      )}
    </div>
  );
};

export default LandingAiAgent;
