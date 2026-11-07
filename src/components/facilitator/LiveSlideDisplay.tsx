import React from 'react';
import { Slide, Theme } from '../../types/activity.js';
import {
  Sparkles,
  QrCode,
  CheckCircle2,
  Users,
  Trophy,
  Pause,
  Tv,
} from 'lucide-react';
import { D3WordCloud } from '../common/D3WordCloud.js';
import { getThemeTextureStyle, isThemeLight, getFieldTextStyle } from '../../utils/themes.js';

interface LiveSlideDisplayProps {
  slide: Slide;
  theme?: Theme;
  aggregates?: any;
  step?: string;
  isResultsVisible?: boolean;
  aspectRatio?: '16:9' | '16:10' | '4:3';
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

  const aspectStyle =
    aspectRatio === '4:3' ? '4/3' : aspectRatio === '16:10' ? '16/10' : '16/9';

  return (
    <div className="w-full h-full flex items-center justify-center p-1 overflow-hidden select-none">
      <div
        style={{
          ...getThemeTextureStyle(theme),
          aspectRatio: aspectStyle,
        }}
        className={`w-full max-h-full rounded-xl border border-slate-700/80 shadow-2xl relative overflow-y-auto flex flex-col justify-between transition-all ${
          isNextPreview ? 'p-3 sm:p-4 text-xs' : 'p-4 sm:p-6'
        }`}
      >
        {/* Blank Screen Overlay */}
        {isBlanked && !isNextPreview && (
          <div className="absolute inset-0 bg-black z-40 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">
              Projector Blanked
            </span>
            <p className="text-[11px] text-slate-600">Screen is currently dark on projector</p>
          </div>
        )}

        {/* Frozen Indicator */}
        {isFrozen && !isNextPreview && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center space-x-1 shadow-md">
            <Pause className="w-3 h-3 fill-current" />
            <span>PROJECTOR FROZEN</span>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════
            1. WELCOME SLIDE
            ═════════════════════════════════════════════════════════════ */}
        {typeId === 'welcome' && (
          <div className="flex-1 flex flex-col justify-between my-auto">
            <div className="flex flex-row items-center justify-between gap-4">
              {/* Left Column: Workshop Info */}
              <div className="flex-1 space-y-2.5 max-w-xl text-left">
                <div
                  className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    isLight
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Interactive Workshop Session</span>
                </div>

                <h1
                  style={getFieldTextStyle(content.styles, 'title')}
                  className={`font-extrabold tracking-tight leading-tight ${
                    isNextPreview ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl lg:text-3xl'
                  } ${!content.styles?.title?.color ? (isLight ? 'text-slate-950 font-black' : 'text-white') : ''}`}
                >
                  {content.title || 'Interactive Workshop'}
                </h1>

                {/* Presenter Box */}
                {(content.presenter_name || content.presenter_info) && (
                  <div
                    className={`p-2.5 rounded-xl border max-w-sm space-y-0.5 ${
                      isLight
                        ? 'bg-white/95 border-slate-200/90 text-slate-900 shadow-xs'
                        : 'bg-slate-900/80 border-slate-800 text-white'
                    }`}
                  >
                    {content.presenter_name && (
                      <div className="text-xs font-bold flex items-center space-x-1">
                        <span className={isLight ? 'text-slate-500 font-normal text-[10px]' : 'text-slate-400 font-normal text-[10px]'}>
                          Presented by
                        </span>
                        <span
                          style={getFieldTextStyle(content.styles, 'presenter_name')}
                          className={isLight ? 'text-indigo-600 font-extrabold' : 'text-indigo-400'}
                        >
                          {content.presenter_name}
                        </span>
                      </div>
                    )}
                    {content.presenter_info && (
                      <div
                        style={getFieldTextStyle(content.styles, 'presenter_info')}
                        className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}
                      >
                        {content.presenter_info}
                      </div>
                    )}
                  </div>
                )}

                {/* Join Message & Code */}
                <div className="space-y-1.5 pt-0.5">
                  <p
                    style={getFieldTextStyle(content.styles, 'join_message')}
                    className={`text-xs font-medium leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}
                  >
                    {content.join_message || 'Join on your phone or laptop:'}
                  </p>

                  <div
                    className={`flex items-center gap-3 p-2 rounded-xl border max-w-sm ${
                      isLight
                        ? 'bg-white/95 border-slate-200/90 text-slate-900 shadow-xs'
                        : 'bg-slate-900/90 border-slate-800 text-white'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[8px] uppercase tracking-wider font-semibold text-slate-400">Web Link</div>
                      <div className={`text-xs font-mono font-bold truncate ${isLight ? 'text-slate-950' : 'text-white'}`}>
                        {joinUrl || `${window.location.host}/j/${joinCode}`}
                      </div>
                    </div>
                    <div className={`border-l pl-3 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                      <div className="text-[8px] uppercase tracking-wider font-semibold text-slate-400">Code</div>
                      <div className={`text-sm font-mono font-extrabold tracking-wider ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                        {joinCode}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: QR Code Thumbnail */}
              <div className="flex flex-col items-center justify-center shrink-0">
                <div className={`p-2 bg-white rounded-2xl ${isLight ? 'shadow-md border-2 border-slate-200/90' : 'shadow-xl border-2 border-indigo-500/30'}`}>
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="Join QR"
                      className={`${isNextPreview ? 'w-20 h-20' : 'w-28 h-28 sm:w-32 sm:h-32'} rounded-lg object-contain`}
                    />
                  ) : (
                    <div className={`${isNextPreview ? 'w-20 h-20' : 'w-28 h-28 sm:w-32 sm:h-32'} flex items-center justify-center bg-slate-100 rounded-lg`}>
                      <QrCode className="w-12 h-12 text-slate-400" />
                    </div>
                  )}
                </div>
                <span className={`text-[9px] font-semibold mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Scan to join
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════
            2. NORMAL SLIDES (Poll, Quiz, Word Cloud, Open, QA, Leaderboard, Content)
            ═════════════════════════════════════════════════════════════ */}
        {typeId !== 'welcome' && (
          <div className="flex-1 flex flex-col justify-between my-auto">
            {/* Top Header: Question Prompt */}
            <div className="mb-2">
              <span className={`text-[9px] font-bold uppercase tracking-wider block mb-0.5 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                {typeId}
              </span>
              <h2
                style={getFieldTextStyle(content.styles, content.question !== undefined ? 'question' : 'title')}
                className={`font-extrabold tracking-tight leading-tight ${
                  isNextPreview ? 'text-sm sm:text-base' : 'text-base sm:text-lg lg:text-xl'
                } ${!content.styles?.[content.question !== undefined ? 'question' : 'title']?.color ? (isLight ? 'text-slate-950 font-black' : 'text-white') : ''}`}
              >
                {content.question || content.title || 'Slide Title'}
              </h2>
            </div>

            {/* A. Poll / Quiz Options Display */}
            {(typeId === 'poll' || typeId === 'quiz') && content.options && (
              <div className="space-y-1.5 my-auto max-w-3xl w-full">
                {content.options.map((opt: any, idx: number) => {
                  const aggOpt = aggregates?.options?.find((o: any) => o.option_id === opt.id);
                  const percentage = aggOpt?.percentage || 0;
                  const count = aggOpt?.count || 0;
                  const isCorrect = typeId === 'quiz' && step !== 'question' && content.correct_option_id === opt.id;
                  const showBars = isResultsVisible || step === 'results' || step === 'stats' || isCorrect;

                  return (
                    <div key={opt.id} className="space-y-0.5">
                      <div
                        className={`p-2 rounded-lg border flex items-center justify-between text-xs transition-all ${
                          isCorrect
                            ? isLight
                              ? 'bg-emerald-100 border-emerald-400 text-slate-950 shadow-xs ring-1 ring-emerald-500/40'
                              : 'bg-emerald-950/60 border-emerald-500 text-emerald-100 shadow-sm ring-1 ring-emerald-500/40'
                            : isLight
                            ? 'bg-white/95 border-slate-200/90 text-slate-950 shadow-2xs'
                            : 'bg-slate-800/80 border-slate-700/80 text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate pr-2">
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] shrink-0 ${
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
                            className="font-semibold truncate text-[11px] sm:text-xs"
                          >
                            {opt.text}
                          </span>
                          {isCorrect && (
                            <span className="flex items-center space-x-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950 shrink-0">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>CORRECT</span>
                            </span>
                          )}
                        </div>

                        {showBars && (
                          <span className={`text-[10px] font-mono font-bold shrink-0 ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                            {count} ({percentage}%)
                          </span>
                        )}
                      </div>

                      {showBars && (
                        <div className={`h-1.5 w-full rounded-full overflow-hidden ${isLight ? 'bg-slate-200/80' : 'bg-slate-900'}`}>
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
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
                  <div className={`mt-2 p-2 rounded-lg border text-[10px] leading-relaxed animate-in fade-in ${isLight ? 'bg-white/95 border-emerald-300 text-slate-800' : 'bg-slate-800/90 border-emerald-500/30 text-slate-200'}`}>
                    <span className="font-bold text-emerald-600 block">Explanation:</span>
                    <p style={getFieldTextStyle(content.styles, 'explanation')}>{content.explanation}</p>
                  </div>
                )}
              </div>
            )}

            {/* B. Word Cloud Display */}
            {typeId === 'wordcloud' && (
              <div className={`my-auto p-2 rounded-xl border flex items-center justify-center overflow-hidden ${isNextPreview ? 'h-28' : 'h-36 sm:h-44'} ${isLight ? 'bg-white/90 border-slate-200 shadow-2xs' : 'bg-slate-950/60 border-slate-800'}`}>
                {aggregates?.words && aggregates.words.length > 0 ? (
                  <D3WordCloud words={aggregates.words} className="w-full h-full" />
                ) : (
                  <div className="text-center text-[11px] text-slate-400">
                    Waiting for audience words...
                  </div>
                )}
              </div>
            )}

            {/* C. Open-Ended Thoughts */}
            {typeId === 'open' && (
              <div className={`my-auto grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto ${isNextPreview ? 'max-h-28' : 'max-h-40'}`}>
                {aggregates?.items && aggregates.items.length > 0 ? (
                  aggregates.items.slice(0, 4).map((item: any, i: number) => (
                    <div
                      key={item.id || i}
                      className={`p-2 rounded-lg border text-xs space-y-1 ${isLight ? 'bg-white/95 border-slate-200 text-slate-900' : 'bg-slate-800/80 border-slate-700 text-white'}`}
                    >
                      <p className="font-medium truncate leading-snug">"{item.text}"</p>
                      <span className={`text-[9px] ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>{item.author || 'Participant'}</span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center text-[11px] text-slate-400 py-4">
                    Waiting for audience responses...
                  </div>
                )}
              </div>
            )}

            {/* D. Q&A Display */}
            {typeId === 'qa' && (
              <div className={`my-auto space-y-1.5 overflow-y-auto ${isNextPreview ? 'max-h-28' : 'max-h-40'}`}>
                {aggregates?.questions && aggregates.questions.length > 0 ? (
                  aggregates.questions.slice(0, 3).map((q: any) => (
                    <div
                      key={q.id}
                      className={`p-2 rounded-lg border flex items-center justify-between text-xs ${isLight ? 'bg-white/95 border-slate-200 text-slate-950' : 'bg-slate-800/80 border-slate-700 text-white'}`}
                    >
                      <div className="truncate pr-2">
                        <p className="font-semibold truncate">{q.question}</p>
                        <span className="text-[9px] text-slate-400">by {q.author_name}</span>
                      </div>
                      <span className="text-xs font-bold text-indigo-500 shrink-0">▲ {q.upvotes}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-[11px] text-slate-400 py-4">
                    No questions received yet.
                  </div>
                )}
              </div>
            )}

            {/* E. Leaderboard Podium */}
            {typeId === 'leaderboard' && (
              <div className="my-auto max-w-sm mx-auto space-y-1 w-full">
                {(aggregates?.leaderboard || [
                  { rank: 1, name: 'Top Leader', score: 400 },
                  { rank: 2, name: 'Runner Up', score: 320 },
                  { rank: 3, name: 'Third Place', score: 280 },
                ]).slice(0, 3).map((lead: any, idx: number) => (
                  <div
                    key={lead.rank || idx}
                    className={`p-1.5 rounded-lg border flex items-center justify-between text-xs ${
                      idx === 0
                        ? isLight
                          ? 'bg-amber-100 border-amber-300 text-slate-950'
                          : 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                        : isLight
                        ? 'bg-white/95 border-slate-200 text-slate-900'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] ${idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : 'bg-amber-700 text-white'}`}>
                        {lead.rank || idx + 1}
                      </span>
                      <span className="font-bold truncate">{lead.name}</span>
                    </div>
                    <span className="font-mono font-bold text-indigo-500 text-xs">{lead.score} pts</span>
                  </div>
                ))}
              </div>
            )}

            {/* F. Content Slide */}
            {typeId === 'content' && (
              <div className="my-auto text-center space-y-2 max-w-lg mx-auto">
                {content.body && (
                  <p
                    style={getFieldTextStyle(content.styles, 'body')}
                    className={`text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${isLight ? 'text-slate-800' : 'text-slate-300'}`}
                  >
                    {content.body}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bottom Minimal Strip */}
        <div className={`pt-2 border-t flex items-center justify-between text-[10px] ${isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'}`}>
          <div className="flex items-center space-x-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="truncate max-w-[140px]">{joinUrl || `${window.location.host}/j/${joinCode}`}</span>
          </div>

          <div className="flex items-center space-x-2 font-mono">
            {activeParticipants > 0 && <span>{activeParticipants} online</span>}
            <span className="capitalize">{aspectRatio}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
