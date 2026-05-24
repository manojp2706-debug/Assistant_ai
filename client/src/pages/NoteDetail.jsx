import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Send, RefreshCw, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const TABS = ['Chat', 'Summary', 'Flashcards', 'Quiz'];

export default function NoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [tab, setTab] = useState('Chat');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/notes/${id}`)
      .then((res) => setNote(res.data))
      .catch(() => { toast.error('Note not found'); navigate('/dashboard'); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center text-gray-400 py-20">Loading...</div>;
  if (!note) return null;

  return (
    <div>
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={18} /> Back
      </button>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{note.title}</h1>
        <span className="text-xs text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-full mt-1 inline-block">{note.subject}</span>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Chat' && <ChatTab noteId={id} />}
      {tab === 'Summary' && <SummaryTab noteId={id} />}
      {tab === 'Flashcards' && <FlashcardsTab noteId={id} />}
      {tab === 'Quiz' && <QuizTab noteId={id} />}
    </div>
  );
}

// ── Chat ──────────────────────────────────────────────────────────────────────
function ChatTab({ noteId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get(`/ai/chat/${noteId}`).then((res) => setMessages(res.data));
  }, [noteId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setSending(true);
    try {
      const res = await api.post(`/ai/chat/${noteId}`, { message: userMsg.content });
      setMessages((m) => [...m, { role: 'assistant', content: res.data.reply }]);
    } catch {
      toast.error('Failed to get response');
    } finally {
      setSending(false);
    }
  };

  const clearChat = async () => {
    await api.delete(`/ai/chat/${noteId}`);
    setMessages([]);
    toast.success('Chat cleared');
  };

  return (
    <div className="flex flex-col h-[60vh] bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <span className="text-sm text-gray-400">Chat with your notes</span>
        {messages.length > 0 && (
          <button onClick={clearChat} className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1 transition-colors">
            <RefreshCw size={12} /> Clear
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            <p>Ask anything about your notes.</p>
            <p className="text-sm mt-1">e.g. "Summarize the key points" or "Explain this concept"</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-100'}`}>
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl px-4 py-3">
              <Loader2 size={16} className="animate-spin text-indigo-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="border-t border-gray-800 p-4 flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-colors"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

// ── Summary ───────────────────────────────────────────────────────────────────
function SummaryTab({ noteId }) {
  const [summary, setSummary] = useState('');
  const [mode, setMode] = useState('short');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setSummary('');
    try {
      const res = await api.post(`/ai/summarize/${noteId}`, { mode });
      setSummary(res.data.summary);
    } catch {
      toast.error('Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const modes = ['short', 'detailed', 'bullets', 'exam'];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {modes.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${mode === m ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
          >
            {m}
          </button>
        ))}
        <button
          onClick={generate}
          disabled={loading}
          className="ml-auto flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Generate
        </button>
      </div>
      {summary && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
      )}
      {!summary && !loading && (
        <div className="text-center text-gray-500 py-16">Select a mode and click Generate</div>
      )}
    </div>
  );
}

// ── Flashcards ────────────────────────────────────────────────────────────────
function FlashcardsTab({ noteId }) {
  const [cards, setCards] = useState([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setCards([]);
    setCurrent(0);
    setFlipped(false);
    try {
      const res = await api.post(`/ai/flashcards/${noteId}`);
      setCards(res.data.flashcards);
    } catch {
      toast.error('Failed to generate flashcards');
    } finally {
      setLoading(false);
    }
  };

  const next = () => { setCurrent((c) => (c + 1) % cards.length); setFlipped(false); };
  const prev = () => { setCurrent((c) => (c - 1 + cards.length) % cards.length); setFlipped(false); };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-400 text-sm">{cards.length > 0 ? `${current + 1} / ${cards.length}` : 'No flashcards yet'}</p>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Generate
        </button>
      </div>

      {cards.length > 0 && (
        <div className="flex flex-col items-center gap-4">
          <div
            onClick={() => setFlipped(!flipped)}
            className="w-full max-w-lg h-52 cursor-pointer perspective-1000"
            style={{ perspective: '1000px' }}
          >
            <div
              className="relative w-full h-full transition-transform duration-500"
              style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
              <div className="absolute inset-0 bg-gray-900 border border-gray-700 rounded-2xl flex flex-col items-center justify-center p-6 text-center backface-hidden" style={{ backfaceVisibility: 'hidden' }}>
                <p className="text-xs text-indigo-400 mb-3 uppercase tracking-wider">Question</p>
                <p className="text-white text-lg font-medium">{cards[current]?.front}</p>
                <p className="text-gray-500 text-xs mt-4">Click to reveal answer</p>
              </div>
              <div className="absolute inset-0 bg-indigo-950 border border-indigo-700 rounded-2xl flex flex-col items-center justify-center p-6 text-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <p className="text-xs text-indigo-400 mb-3 uppercase tracking-wider">Answer</p>
                <p className="text-white text-lg">{cards[current]?.back}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={prev} className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button onClick={next} className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Quiz ──────────────────────────────────────────────────────────────────────
function QuizTab({ noteId }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
    try {
      const res = await api.post(`/ai/quiz/${noteId}`);
      setQuestions(res.data.questions);
    } catch {
      toast.error('Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const score = questions.filter((q, i) => answers[i] === q.answer).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-400 text-sm">{questions.length > 0 ? `${questions.length} questions` : 'No quiz yet'}</p>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Generate Quiz
        </button>
      </div>

      {questions.length > 0 && (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-white font-medium mb-3">{i + 1}. {q.question}</p>
              <div className="space-y-2">
                {q.options.map((opt) => {
                  let cls = 'bg-gray-800 border-gray-700 text-gray-300 hover:border-indigo-500';
                  if (submitted) {
                    if (opt === q.answer) cls = 'bg-green-950 border-green-600 text-green-300';
                    else if (opt === answers[i]) cls = 'bg-red-950 border-red-600 text-red-300';
                    else cls = 'bg-gray-800 border-gray-700 text-gray-500';
                  } else if (answers[i] === opt) {
                    cls = 'bg-indigo-950 border-indigo-500 text-indigo-200';
                  }
                  return (
                    <button
                      key={opt}
                      disabled={submitted}
                      onClick={() => setAnswers({ ...answers, [i]: opt })}
                      className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-colors ${cls}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <p className="text-xs text-gray-400 mt-3 bg-gray-800 rounded-lg px-3 py-2">
                  {q.explanation}
                </p>
              )}
            </div>
          ))}

          {!submitted ? (
            <button
              onClick={() => setSubmitted(true)}
              disabled={Object.keys(answers).length < questions.length}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors"
            >
              Submit Quiz
            </button>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
              <p className="text-3xl font-bold text-white">{score}/{questions.length}</p>
              <p className="text-gray-400 mt-1">
                {score === questions.length ? '🎉 Perfect score!' : score >= questions.length / 2 ? '👍 Good job!' : '📚 Keep studying!'}
              </p>
              <button onClick={generate} className="mt-4 text-indigo-400 hover:underline text-sm">
                Try again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
