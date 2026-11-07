import React from 'react';
import { Slide, Theme } from '../../types/activity.js';
import {
  Sparkles,
  QrCode,
  CheckCircle2,
  Users,
  Trophy,
  Pause,
  Clock,
  Tv,
} from 'lucide-react';
import { D3WordCloud } from '../common/D3WordCloud.js';
import { getThemeTextureStyle, isThemeLight, getFieldTextStyle } from '../../utils/themes.js';
import { AspectScaledCanvas, AspectRatioType } from '../common/AspectScaledCanvas.js';

interface LiveSlideDisplayProps {
  slide: Slide;
  theme?: Theme;
  aggregates?: any;
  step?: string;
  isResultsVisible?: boolean;
  aspectRatio?: AspectRatioType;
  joinCode?: string;
  joinUrl?: string;
  qrCodeUrl?: string;
  isBlanked?: boolean;
  isFrozen?: boolean;
  isNextPreview?: boolean;
  activeParticipants?: number;
}

export const LiveSlideDisplay: React.FC<LiveSlideDisplayProps> = ({
  slide,
  theme,
  aggregates,
  step = 'question',
  isResultsVisible = true,
  aspectRatio = '16:9',
  joinCode = 'LIVE',
  joinUrl = '',
  qrCodeUrl = '',
  isBlanked = false,
  isFrozen = false,
  isNextPreview = false,
  activeParticipants = 0,
}) => {
  const isLight = isThemeLight(theme);
  const content = (slide.content || {}) as any;
  const typeId = slide.type_id;

  return (
    <AspectScaledCanvas
      aspectRatio={aspectRatio}
      containerClassName="w-full h-full"
      wrapperClassName="rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden"
    >
      <div
        style={getThemeTextureStyle(theme)}
        className="w-full h-full relative p-12 sm:p-14 flex flex-col justify-between overflow-hidden select-none"
      >
        {/* Blank Screen Overlay */}
        {isBlanked && !isNextPreview && (
          <div className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
            <span className="text-xl font-mono text-slate-400 uppercase tracking-widest mb-2">
              Projector Blanked
            </span>
            <p className="text-sm text-slate-500">Screen output is currently dark on projector</p>
          </div>
        )}

        {/* Frozen Indicator */}
        {isFrozen && !isNextPreview && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-1.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black tracking-wider flex items-center space-x-2 shadow-xl">
            <Pause className="w-4 h-4 fill-current" />
            <span>PROJECTOR DISPLAY FROZEN</span>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════
            1. WELCOME SLIDE
            ═════════════════════════════════════════════════════════════ */}
        {typeId === 'welcome' && (
          <div className="flex-1 flex flex-col justify-between my-auto">
            {/* Top Left Logo */}
            <div className="flex items-center space-x-3 mb-6">
              <img
                src="/assets/aistudio/AirAct_Community_Learning_Logo_44a129c1.png"
                alt="AirAct"
                className="h-12 w-auto object-contain"
              />
              <span className={`text-base font-extrabold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                AirAct
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${isLight ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/60'}`}>
                Interactive Presentation
              </span>
            </div>

            <div className="flex flex-row items-center justify-between gap-12 my-auto">
              {/* Left Column: Workshop Info */}
              <div className="flex-1 space-y-6 text-left">
                <div
                  className={`inline-flex items-center space-x-2 px-3.5 py-1 rounded-full text-xs font-bold border ${
                    isLight
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Live Audience Session</span>
                </div>

                <h1
                  style={getFieldTextStyle(content.styles, 'title')}
                  className={`text-5xl lg:text-6xl font-black tracking-tight leading-tight ${
                    !content.styles?.title?.color ? (isLight ? 'text-slate-950' : 'text-white') : ''
                  }`}
                >
                  {content.title || 'Interactive Workshop & Presentation'}
                </h1>

                {/* Presenter Box */}
                {(content.presenter_name || content.presenter_info) && (
                  <div
                    className={`p-5 rounded-2xl border max-w-lg space-y-1.5 shadow-sm ${
                      isLight
                        ? 'bg-white/95 border-slate-200/90 text-slate-900'
                        : 'bg-slate-900/80 border-slate-800 text-white'
                    }`}
                  >
                    {content.presenter_name && (
                      <div className="text-xl font-bold flex items-center space-x-2">
                        <span className={isLight ? 'text-slate-500 font-medium text-base' : 'text-slate-400 font-medium text-base'}>
                          Presented by
                        </span>
                        <span
                          style={getFieldTextStyle(content.styles, 'presenter_name')}
                          className={isLight ? 'text-indigo-600 font-black' : 'text-indigo-400 font-black'}
                        >
                          {content.presenter_name}
                        </span>
                      </div>
                    )}
                    {content.presenter_info && (
                      <div
                        style={getFieldTextStyle(content.styles, 'presenter_info')}
                        className={`text-sm font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}
                      >
                        {content.presenter_info}
                      </div>
                    )}
                  </div>
                )}

                {/* Join Message & Code */}
                <div className="space-y-3 pt-2">
                  <p
                    style={getFieldTextStyle(content.styles, 'join_message')}
                    className={`text-lg font-medium leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}
                  >
                    {content.join_message || 'Scan the QR code or use the link below to participate live from your phone or laptop:'}
                  </p>

                  <div
                    className={`flex items-center gap-6 p-4 rounded-2xl border max-w-xl shadow-md ${
                      isLight
                        ? 'bg-white/95 border-slate-200/90 text-slate-900'
                        : 'bg-slate-900/90 border-slate-800 text-white'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-0.5">
                        Web Link
                      </div>
                      <div className={`text-xl font-mono font-bold truncate underline underline-offset-4 ${isLight ? 'text-slate-950' : 'text-white'}`}>
                        {joinUrl || `${window.location.host}/j/${joinCode}`}
                      </div>
                    </div>
                    <div className={`border-l pl-6 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                      <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-0.5">
                        Session Code
                      </div>
                      <div className={`text-3xl font-mono font-extrabold tracking-wider ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                        {joinCode}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: High-Res QR Code */}
              <div className="flex flex-col items-center justify-center shrink-0">
                <div className={`p-5 bg-white rounded-3xl ${isLight ? 'shadow-xl border-4 border-slate-200/90' : 'shadow-2xl border-4 border-indigo-500/30'}`}>
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="Join QR Code"
                      className="w-64 h-64 lg:w-72 lg:h-72 rounded-xl object-contain"
                    />
                  ) : (
                    <div className="w-64 h-64 lg:w-72 lg:h-72 flex items-center justify-center bg-slate-100 rounded-xl">
                      <QrCode className="w-32 h-32 text-slate-400" />
                    </div>
                  )}
                </div>
                <span className={`text-sm font-semibold mt-3 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Scan with phone camera to participate
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════
            2. NORMAL INTERACTIVE SLIDES (Poll, Quiz, Word Cloud, Open, QA, Leaderboard, Content)
            ═════════════════════════════════════════════════════════════ */}
        {typeId !== 'welcome' && (
          <div className="flex-1 flex flex-col justify-between my-auto">
            {/* Top Header: Question Prompt */}
            <div className="mb-6">
              <span className={`text-xs font-bold uppercase tracking-widest block mb-2 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                {typeId}
              </span>
              <h2
                style={getFieldTextStyle(content.styles, content.question !== undefined ? 'question' : 'title')}
                className={`text-4xl lg:text-5xl font-black tracking-tight leading-tight ${
                  !content.styles?.[content.question !== undefined ? 'question' : 'title']?.color ? (isLight ? 'text-slate-950' : 'text-white') : ''
                }`}
              >
                {content.question || content.title || 'Slide Title'}
              </h2>
            </div>

            {/* A. Poll / Quiz Options Display */}
            {(typeId === 'poll' || typeId === 'quiz') && content.options && (
              <div className="space-y-4 my-auto max-w-4xl w-full mx-auto">
                {content.options.map((opt: any, idx: number) => {
                  const aggOpt = aggregates?.options?.find((o: any) => o.option_id === opt.id);
                  const percentage = aggOpt?.percentage || 0;
                  const count = aggOpt?.count || 0;
                  const isCorrect = typeId === 'quiz' && step !== 'question' && content.correct_option_id === opt.id;
                  const showBars = isResultsVisible || step === 'results' || step === 'stats' || isCorrect;

                  return (
                    <div key={opt.id} className="space-y-2">
                      <div
                        className={`p-4 rounded-2xl border flex items-center justify-between text-lg transition-all ${
                          isCorrect
                            ? isLight
                              ? 'bg-emerald-100 border-emerald-400 text-slate-950 shadow-md ring-2 ring-emerald-500/40'
                              : 'bg-emerald-950/60 border-emerald-500 text-emerald-100 shadow-lg ring-2 ring-emerald-500/40'
                            : isLight
                            ? 'bg-white/95 border-slate-200/90 text-slate-950 shadow-sm'
                            : 'bg-slate-800/80 border-slate-700/80 text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3.5 truncate pr-4">
                          <span
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-500 text-white'
                                : isLight
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : 'bg-indigo-500/20 text-indigo-400'
                            }`}
                          >
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span
                            style={getFieldTextStyle(content.styles, 'options')}
                            className="font-bold truncate text-xl lg:text-2xl"
                          >
                            {opt.text}
                          </span>
                          {isCorrect && (
                            <span className="flex items-center space-x-1 text-xs font-bold px-3 py-1 rounded-full text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950 shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>CORRECT</span>
                            </span>
                          )}
                        </div>

                        {showBars && (
                          <span className={`text-lg font-mono font-bold shrink-0 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                            {count} votes ({percentage}%)
                          </span>
                        )}
                      </div>

                      {showBars && (
                        <div className={`h-4 w-full rounded-full overflow-hidden p-0.5 ${isLight ? 'bg-slate-200/80' : 'bg-slate-900'}`}>
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${
                              isCorrect
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                : 'bg-gradient-to-r from-indigo-600 to-violet-500'
                            }`}
                            style={{ width: `${Math.max(percentage, count > 0 ? 3 : 0)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Quiz Explanation Reveal */}
                {typeId === 'quiz' && step !== 'question' && content.explanation && (
                  <div className={`mt-4 p-4 rounded-xl border text-sm leading-relaxed animate-in fade-in shadow-sm ${isLight ? 'bg-white/95 border-emerald-300 text-slate-800' : 'bg-slate-800/90 border-emerald-500/30 text-slate-200'}`}>
                    <span className="font-bold text-emerald-600 block mb-1">Explanation:</span>
                    <p style={getFieldTextStyle(content.styles, 'explanation')}>{content.explanation}</p>
                  </div>
                )}
              </div>
            )}

            {/* B. Word Cloud Display */}
            {typeId === 'wordcloud' && (
              <div className={`my-auto p-4 rounded-3xl border flex items-center justify-center overflow-hidden h-96 w-full ${isLight ? 'bg-white/90 border-slate-200 shadow-sm' : 'bg-slate-950/60 border-slate-800'}`}>
                {aggregates?.words && aggregates.words.length > 0 ? (
                  <D3WordCloud words={aggregates.words} className="w-full h-full" />
                ) : (
                  <div className="text-center text-base text-slate-400">
                    Waiting for audience words...
                  </div>
                )}
              </div>
            )}

            {/* C. Open-Ended Thoughts Stream */}
            {typeId === 'open' && (
              <div className="my-auto grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {aggregates?.items && aggregates.items.length > 0 ? (
                  aggregates.items.slice(0, 6).map((item: any, i: number) => (
                    <div
                      key={item.id || i}
                      className={`p-4 rounded-2xl border text-sm space-y-2 shadow-sm ${isLight ? 'bg-white/95 border-slate-200 text-slate-900' : 'bg-slate-800/80 border-slate-700 text-white'}`}
                    >
                      <p className="font-medium text-base leading-snug">"{item.text}"</p>
                      <span className={`text-xs font-semibold ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                        {item.author || 'Participant'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center text-sm text-slate-400 py-10">
                    Waiting for audience responses...
                  </div>
                )}
              </div>
            )}

            {/* D. Crowdsourced Q&A */}
            {typeId === 'qa' && (
              <div className="my-auto space-y-3 max-h-96 overflow-y-auto">
                {aggregates?.questions && aggregates.questions.length > 0 ? (
                  aggregates.questions.slice(0, 5).map((q: any) => (
                    <div
                      key={q.id}
                      className={`p-4 rounded-2xl border flex items-center justify-between text-base shadow-sm ${isLight ? 'bg-white/95 border-slate-200 text-slate-950' : 'bg-slate-800/80 border-slate-700 text-white'}`}
                    >
                      <div className="truncate pr-4">
                        <p className="font-bold text-lg truncate">{q.question}</p>
                        <span className="text-xs text-slate-400">by {q.author_name}</span>
                      </div>
                      <span className="text-base font-bold text-indigo-500 shrink-0 px-3 py-1 rounded-lg bg-indigo-500/10">
                        ▲ {q.upvotes}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-sm text-slate-400 py-10">
                    No questions received yet.
                  </div>
                )}
              </div>
            )}

            {/* E. Leaderboard Podium */}
            {typeId === 'leaderboard' && (
              <div className="my-auto max-w-xl mx-auto space-y-3 w-full">
                {(aggregates?.leaderboard || [
                  { rank: 1, name: 'Top Leader', score: 400 },
                  { rank: 2, name: 'Runner Up', score: 320 },
                  { rank: 3, name: 'Third Place', score: 280 },
                ]).slice(0, 5).map((lead: any, idx: number) => (
                  <div
                    key={lead.rank || idx}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between text-base shadow-sm ${
                      idx === 0
                        ? isLight
                          ? 'bg-amber-100 border-amber-300 text-slate-950 font-bold'
                          : 'bg-amber-500/20 border-amber-500/50 text-amber-200 font-bold'
                        : isLight
                        ? 'bg-white/95 border-slate-200 text-slate-900'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : 'bg-amber-700 text-white'}`}>
                        {lead.rank || idx + 1}
                      </span>
                      <span className="font-bold text-lg truncate">{lead.name}</span>
                    </div>
                    <span className="font-mono font-extrabold text-indigo-500 text-lg">{lead.score} pts</span>
                  </div>
                ))}
              </div>
            )}

            {/* F. Content Slide */}
            {typeId === 'content' && (
              <div className="my-auto text-center space-y-4 max-w-2xl mx-auto">
                {content.body && (
                  <p
                    style={getFieldTextStyle(content.styles, 'body')}
                    className={`text-2xl leading-relaxed whitespace-pre-wrap ${isLight ? 'text-slate-800' : 'text-slate-300'}`}
                  >
                    {content.body}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bottom Minimal Strip */}
        <div className={`pt-4 border-t flex items-center justify-between text-xs font-medium ${isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'}`}>
          <div className="flex items-center space-x-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="truncate max-w-xs">{joinUrl || `${window.location.host}/j/${joinCode}`}</span>
          </div>

          <div className="flex items-center space-x-3 font-mono">
            {activeParticipants > 0 && <span>{activeParticipants} online</span>}
            <span className="capitalize px-2 py-0.5 rounded bg-slate-800/60 text-slate-300 border border-slate-700/60">{aspectRatio}</span>
          </div>
        </div>
      </div>
    </AspectScaledCanvas>
  );
};
