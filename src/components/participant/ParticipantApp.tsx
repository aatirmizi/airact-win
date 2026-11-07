import React, { useState, useEffect, useRef } from 'react';
import { ParticipantView } from '../../types/activity.js';
import {
  Smartphone,
  CheckCircle2,
  Clock,
  Send,
  Heart,
  Cloud,
  HelpCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  Sparkles,
  KeyRound,
  Users,
  Pause,
} from 'lucide-react';

interface ParticipantAppProps {
  initialCode?: string;
}

export const ParticipantApp: React.FC<ParticipantAppProps> = ({ initialCode = '' }) => {
  const [token, setToken] = useState<string>(
    () => localStorage.getItem('airact_p_token') || ''
  );
  const [joinCode, setJoinCode] = useState<string>(initialCode);
  const [displayName, setDisplayName] = useState<string>(
    () => localStorage.getItem('airact_display_name') || ''
  );
  // Roster login fields
  const [useRosterLogin, setUseRosterLogin] = useState<boolean>(false);
  const [rosterId, setRosterId] = useState<string>('');
  const [rosterPin, setRosterPin] = useState<string>('');
  const [joined, setJoined] = useState<boolean>(false);
  const [joinError, setJoinError] = useState<string>('');
  const [isJoining, setIsJoining] = useState<boolean>(false);

  // Live participant view from server
  const [view, setView] = useState<ParticipantView | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<string>('');

  // Local inputs
  const [openText, setOpenText] = useState<string>('');
  const [wordInput, setWordInput] = useState<string>('');
  const [qaInput, setQaInput] = useState<string>('');

  const wsRef = useRef<WebSocket | null>(null);

  // If initialCode changes from URL
  useEffect(() => {
    if (initialCode) {
      setJoinCode(initialCode.toUpperCase());
    }
  }, [initialCode]);

  // Attempt auto-reconnect if token exists
  useEffect(() => {
    if (token) {
      fetch(`/api/p/view?token=${token}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.me && data.me.id) {
            setView(data);
            setJoined(true);
          }
        })
        .catch(() => {});
    }
  }, [token]);

  // WebSocket connection when joined
  useEffect(() => {
    if (!joined || !token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/p?token=${token}`;
    let ws: WebSocket;

    const connect = () => {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        ws.send(JSON.stringify({ type: 'hello', proto: 1, token }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'view') {
            setView(data);
          } else if (data.type === 'bye') {
            setIsConnected(false);
          }
        } catch {}
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Reconnect with jitter
        const delay = 1000 + Math.random() * 2000;
        setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
    };
  }, [joined, token]);

  // Handle Join Submit
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setJoinError('Please enter the 4-character join code');
      return;
    }

    if (useRosterLogin) {
      if (!rosterId.trim()) {
        setJoinError('Please enter your Participant ID');
        return;
      }
      const cleanPin = rosterPin.trim().toUpperCase();
      if (!/^[A-Z]{4}[0-9]{4}$/.test(cleanPin)) {
        setJoinError('PIN must be exactly 8 characters: 4 letters and 4 numbers (e.g. ALEX4821)');
        return;
      }
    }

    setIsJoining(true);
    setJoinError('');

    try {
      const payload: any = {
        code: joinCode.trim().toUpperCase(),
      };

      if (useRosterLogin) {
        payload.user_id = rosterId.trim().toUpperCase();
        payload.pin = rosterPin.trim().toUpperCase();
      } else if (displayName.trim()) {
        payload.display_name = displayName.trim();
      }

      const res = await fetch('/api/p/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setIsJoining(false);

      if (data.status === 'accepted') {
        setToken(data.token);
        localStorage.setItem('airact_p_token', data.token);
        if (data.participant?.display_name) {
          localStorage.setItem('airact_display_name', data.participant.display_name);
          setDisplayName(data.participant.display_name);
        }
        setJoined(true);
      } else if (data.status === 'refused') {
        if (data.code === 'roster_auth_required') {
          setUseRosterLogin(true);
          setJoinError('This presentation requires Roster login. Please enter your Participant ID and 8-character PIN.');
        } else if (data.code === 'roster_auth_failed') {
          setJoinError(data.message_key || 'Invalid Participant ID or PIN. Please check your credentials.');
        } else if (data.code === 'invalid_pin_format') {
          setJoinError(data.message_key || 'PIN must be exactly 4 letters followed by 4 digits (e.g. ALEX4821)');
        } else if (data.code === 'join_code_invalid') {
          setJoinError("That code isn't right or has expired.");
        } else if (data.code === 'not_live') {
          setJoinError('This presentation is not live right now.');
        } else if (data.code === 'activity_full') {
          setJoinError('This activity is full. Ask the facilitator.');
        } else {
          setJoinError('Could not join: ' + (data.message_key || data.code));
        }
      } else {
        setJoinError('Something went wrong. Please try again.');
      }
    } catch {
      setIsJoining(false);
      setJoinError('Network error. Check connection.');
    }
  };

  // Submit Answer (Poll / Quiz / Word Cloud / Open Question / Q&A)
  const submitAnswer = async (payload: any) => {
    if (!view?.slide || isSubmitting) return;

    setIsSubmitting(true);
    setSubmissionFeedback('Sending…');

    const submissionId = 'sub_' + Math.random().toString(36).substring(2, 12);

    try {
      const res = await fetch('/api/p/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-participant-token': token,
        },
        body: JSON.stringify({
          proto: 1,
          submission_id: submissionId,
          slide_id: view.slide.id,
          step: view.slide.step,
          payload,
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (data.status === 'accepted' || data.status === 'duplicate') {
        setSubmissionFeedback('✓ Answer received');
        setTimeout(() => setSubmissionFeedback(''), 4000);
      } else if (data.status === 'refused') {
        if (data.code === 'already_answered') {
          setSubmissionFeedback('You have already answered this');
        } else if (data.code === 'closed') {
          setSubmissionFeedback('Responses are closed');
        } else {
          setSubmissionFeedback(data.code || 'Refused');
        }
      }
    } catch {
      setIsSubmitting(false);
      setSubmissionFeedback('Network error. Retrying…');
    }
  };

  // Upvote Q&A
  const handleUpvote = async (questionId: string) => {
    try {
      await fetch('/api/p/qa/upvote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-participant-token': token,
        },
        body: JSON.stringify({ question_id: questionId }),
      });
    } catch {}
  };

  // 1. Landing Screen (PP-01)
  if (!joined) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-6 select-none font-sans">
        <div className="max-w-md w-full mx-auto my-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center">
              <img
                src="/assets/aistudio/AirAct_Community_Learning_Logo_44a129c1.png"
                alt="AirAct"
                className="h-16 w-auto object-contain"
              />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Join AirAct</h1>
            <p className="text-xs font-semibold text-emerald-400">
              by Skillupgrade Network
            </p>
            <p className="text-sm text-slate-400">
              {useRosterLogin
                ? 'Enter your assigned Participant ID and 8-character PIN'
                : 'Enter the 4-character code on the screen'}
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4 bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 shadow-xl">
            {/* Mode Switcher Tabs */}
            <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-700/80 mb-2">
              <button
                type="button"
                onClick={() => {
                  setUseRosterLogin(false);
                  setJoinError('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  !useRosterLogin
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Guest Join</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUseRosterLogin(true);
                  setJoinError('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  useRosterLogin
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Roster Login</span>
              </button>
            </div>

            {/* Join Code */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Session Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. K7M2"
                autoFocus={!initialCode}
                className="w-full text-center text-3xl font-mono font-extrabold tracking-widest py-3 px-4 rounded-xl bg-slate-900 border border-slate-600 text-white focus:outline-none focus:border-indigo-500 uppercase placeholder:text-slate-600"
              />
            </div>

            {useRosterLogin ? (
              <>
                {/* Participant ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Participant ID
                  </label>
                  <input
                    type="text"
                    maxLength={32}
                    value={rosterId}
                    onChange={(e) => setRosterId(e.target.value.toUpperCase())}
                    placeholder="e.g. STU101 or EMP-04"
                    autoFocus={Boolean(initialCode)}
                    className="w-full text-center text-base font-mono font-bold py-3 px-4 rounded-xl bg-slate-900 border border-slate-600 text-white focus:outline-none focus:border-indigo-500 uppercase placeholder:text-slate-600"
                  />
                </div>

                {/* 8-Character PIN: 4 letters + 4 digits */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      8-Character PIN
                    </label>
                    <span className="text-[11px] font-mono text-indigo-400 font-semibold">
                      4 letters + 4 digits
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={8}
                    value={rosterPin}
                    onChange={(e) => setRosterPin(e.target.value.toUpperCase())}
                    placeholder="e.g. ALEX4821"
                    className="w-full text-center text-2xl font-mono font-extrabold tracking-widest py-3 px-4 rounded-xl bg-slate-900 border border-slate-600 text-white focus:outline-none focus:border-indigo-500 uppercase placeholder:text-slate-600"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full text-center text-base font-semibold py-3 px-4 rounded-xl bg-slate-900 border border-slate-600 text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
                />
              </div>
            )}

            {joinError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{joinError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={
                isJoining ||
                !joinCode.trim() ||
                (useRosterLogin && (!rosterId.trim() || rosterPin.trim().length !== 8))
              }
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 min-h-[44px]"
            >
              {isJoining ? 'Verifying & Joining...' : useRosterLogin ? 'Sign In & Join' : 'Join Presentation'}
            </button>
          </form>

          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            {useRosterLogin
              ? 'Roster Mode: Verified attendee records with unique 8-character PINs.'
              : 'Privacy: Responses are anonymous or tied to your display name depending on slide settings.'}
          </p>
        </div>

        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <div>AirAct by Skillupgrade Network · Audience Polling</div>
          <div>
            <a href="/host" className="text-slate-400 hover:text-indigo-400 transition-colors underline">
              Presenter Studio Login (/host)
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 2. Joined View
  const slide = view?.slide;
  const content = slide?.content;
  const screen = slide?.screen || 'wait';
  const remainingSecs = slide?.remaining_ms !== null && slide?.remaining_ms !== undefined ? Math.ceil(slide.remaining_ms / 1000) : null;
  const hasAnswered = Boolean(view?.me.answered);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between select-none font-sans">
      {/* Top Header: Connection & Participant Identity (Sketch 04 marker 1) */}
      <header className="h-14 px-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-amber-500 animate-ping'
            }`}
          />
          <span className="text-xs font-semibold text-slate-300">
            {isConnected ? 'Connected' : 'Reconnecting...'}
          </span>
        </div>

        <div className="text-right">
          <div className="text-xs font-bold text-white truncate max-w-[140px]">
            {view?.me.name || `Participant ${view?.me.number || ''}`}
          </div>
          <div className="text-[10px] text-indigo-400 font-mono">
            {view?.presentation.title || 'Live Activity'}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-5 flex flex-col justify-center max-w-md w-full mx-auto">
        {/* State A: Presentation Ended */}
        {view?.presentation.state === 'ended' ? (
          <div className="text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-indigo-400">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold">This activity has ended</h2>
            <p className="text-xs text-slate-400">Thank you for participating!</p>
          </div>
        ) : !slide || screen === 'wait' ? (
          /* State B: Waiting for the next step / slide (PP-03) */
          <div className="text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto animate-pulse">
              <Clock className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-200">Waiting for the presenter…</h2>
            <p className="text-xs text-slate-500">The next question will appear here automatically.</p>
          </div>
        ) : screen === 'main_screen' ? (
          /* State C: Hidden on phones (PP-03) */
          <div className="text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-slate-800 text-indigo-400 flex items-center justify-center mx-auto">
              <Eye className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">Look at the main screen</h2>
            <p className="text-xs text-slate-400">Content slide shown on projector.</p>
          </div>
        ) : screen === 'closed' ? (
          /* State D: Closed responses */
          <div className="text-center space-y-3 my-auto">
            <h2 className="text-lg font-bold text-slate-300">Responses are closed</h2>
            <p className="text-xs text-slate-500">Look at the main screen for results.</p>
          </div>
        ) : (
          /* State E: Interactive Question (Poll, Quiz, Word Cloud, Open, QA) */
          <div className="space-y-6">
            {/* Question prompt & timer */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-indigo-400">
                <span className="uppercase tracking-wider">{slide.type_id}</span>
                {remainingSecs !== null && (
                  <span
                    className={`flex items-center space-x-1 font-mono font-bold px-2.5 py-0.5 rounded-full ${
                      slide.timer_paused
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : remainingSecs <= 5
                        ? 'text-red-400 animate-pulse bg-red-500/10'
                        : 'text-slate-300 bg-slate-800'
                    }`}
                  >
                    {slide.timer_paused ? (
                      <Pause className="w-3 h-3 fill-current text-amber-400" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    <span>{remainingSecs}s</span>
                    {slide.timer_paused && (
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-400 ml-0.5">
                        PAUSED
                      </span>
                    )}
                  </span>
                )}
              </div>

              <h2 className="text-xl font-extrabold text-white leading-snug">
                {content.question || content.title}
              </h2>

              {slide.closing && (
                <div className="text-xs font-bold text-amber-400 animate-pulse">
                  Closing soon…
                </div>
              )}
            </div>

            {/* Poll / Quiz answer buttons (>= 44px tap targets as per SR-12) */}
            {(slide.type_id === 'poll' || slide.type_id === 'quiz') && content.options && (
              <div className="space-y-3">
                {content.options.map((opt: any, idx: number) => {
                  const isSelected = view.me.answer?.payload?.option_id === opt.id;
                  const isCorrect = content.correct_option_id === opt.id;
                  const isRevealed = content.correct_option_id !== undefined;

                  let btnStyle = 'bg-slate-800/90 text-white hover:bg-slate-700/90 border border-slate-700';

                  if (isSelected) {
                    btnStyle = 'bg-indigo-600 text-white border border-indigo-400 shadow-lg shadow-indigo-600/30';
                  }

                  if (isRevealed) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-600 text-white border-emerald-400';
                    } else if (isSelected && !isCorrect) {
                      btnStyle = 'bg-red-600 text-white border-red-400';
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => submitAnswer({ option_id: opt.id })}
                      disabled={isSubmitting || (hasAnswered && slide.type_id === 'quiz')}
                      className={`w-full min-h-[52px] px-4 py-3 rounded-xl font-bold text-left flex items-center justify-between text-base transition-all active:scale-[0.98] disabled:cursor-not-allowed ${btnStyle}`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-7 h-7 rounded-lg bg-black/20 flex items-center justify-center text-xs font-extrabold shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt.text}</span>
                      </div>

                      {isSelected && <CheckCircle2 className="w-5 h-5 shrink-0" />}
                    </button>
                  );
                })}

                {/* Explanation reveal if quiz */}
                {slide.type_id === 'quiz' && content.explanation && (
                  <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    <span className="font-bold text-indigo-400 block mb-1">Explanation:</span>
                    {content.explanation}
                  </div>
                )}
              </div>
            )}

            {/* Word Cloud Input */}
            {slide.type_id === 'wordcloud' && (
              <div className="space-y-3">
                <input
                  type="text"
                  maxLength={40}
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  placeholder="Type a word..."
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-base focus:outline-none focus:border-indigo-500 min-h-[48px]"
                />
                <button
                  onClick={() => {
                    if (wordInput.trim()) {
                      submitAnswer({ text: wordInput.trim() });
                      setWordInput('');
                    }
                  }}
                  disabled={!wordInput.trim() || isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-md disabled:opacity-50 min-h-[48px]"
                >
                  Submit Word
                </button>
              </div>
            )}

            {/* Open Question Input */}
            {slide.type_id === 'open' && (
              <div className="space-y-3">
                <textarea
                  rows={4}
                  maxLength={content.max_chars || 280}
                  value={openText}
                  onChange={(e) => setOpenText(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>{openText.length} / {content.max_chars || 280}</span>
                </div>
                <button
                  onClick={() => {
                    if (openText.trim()) {
                      submitAnswer({ text: openText.trim() });
                      setOpenText('');
                    }
                  }}
                  disabled={!openText.trim() || isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-md disabled:opacity-50 min-h-[48px]"
                >
                  Submit Response
                </button>
              </div>
            )}

            {/* Audience Q&A Input & Question List */}
            {slide.type_id === 'qa' && (
              <div className="space-y-5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={300}
                    value={qaInput}
                    onChange={(e) => setQaInput(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-1 py-3 px-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 min-h-[44px]"
                  />
                  <button
                    onClick={() => {
                      if (qaInput.trim()) {
                        submitAnswer({ question: qaInput.trim() });
                        setQaInput('');
                      }
                    }}
                    disabled={!qaInput.trim() || isSubmitting}
                    className="px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shrink-0 min-h-[44px]"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                {/* Question Feed */}
                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {content.questions && content.questions.length > 0 ? (
                    content.questions.map((q: any) => (
                      <div
                        key={q.id}
                        className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex-1 mr-3">
                          <p className="font-semibold text-slate-200">{q.question}</p>
                          <span className="text-[10px] text-slate-500">by {q.author_name}</span>
                        </div>
                        <button
                          onClick={() => handleUpvote(q.id)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-bold active:scale-95 min-h-[36px]"
                        >
                          <Heart className="w-3.5 h-3.5 fill-current" />
                          <span>{q.upvotes}</span>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-xs text-slate-500">
                      No questions yet. Be the first to ask!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submission Feedback Toast */}
            {submissionFeedback && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-center text-xs font-bold animate-in fade-in">
                {submissionFeedback}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Status Bar */}
      <footer className="h-10 px-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-500">
        <span>AirAct</span>
        <span>Keep your screen on</span>
      </footer>
    </div>
  );
};
