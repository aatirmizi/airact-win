import React, { useState, useEffect, useMemo } from 'react';
import { usePresenter } from '../../context/PresenterContext.js';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  X,
  Smartphone,
  Tv,
  ChevronLeft,
  ChevronRight,
  FastForward,
  Eye,
  EyeOff,
  RotateCcw,
  CheckCircle2,
  Clock,
  Plus,
  Radio,
  Trophy,
  Users,
  MessageSquare,
  Pause,
  Play,
  Send,
  Cloud,
  HelpCircle,
  ThumbsUp,
  QrCode,
} from 'lucide-react';
import QRCode from 'qrcode';
import { D3WordCloud } from '../common/D3WordCloud.js';
import { getThemeTextureStyle, isThemeLight, getFieldTextStyle } from '../../utils/themes.js';

interface PreviewPaneProps {
  onClose: () => void;
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({ onClose }) => {
  const { activity, selectedSlideIndex, setSelectedSlideIndex } = usePresenter();
  const isLight = isThemeLight(activity?.theme);

  const slides = activity?.slides || [];
  const currentSlide = slides[selectedSlideIndex] || null;

  // Step state for preview:
  // poll: 'question' | 'results'
  // quiz: 'question' | 'reveal' | 'stats'
  // wordcloud / open / qa: 'collect' | 'display'
  // content / leaderboard: 'display'
  const [step, setStep] = useState<string>('question');
  const [acceptingResponses, setAcceptingResponses] = useState<boolean>(true);
  const [resultsVisible, setResultsVisible] = useState<boolean>(true);
  const [isBlanked, setIsBlanked] = useState<boolean>(false);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);

  // Per-slide simulated response stores
  const [votesBySlide, setVotesBySlide] = useState<{ [slideId: string]: { [optId: string]: number } }>({});
  const [wordsBySlide, setWordsBySlide] = useState<{ [slideId: string]: { text: string; count: number }[] }>({});
  const [openBySlide, setOpenBySlide] = useState<{ [slideId: string]: { id: string; text: string; author: string }[] }>({});
  const [qaBySlide, setQaBySlide] = useState<{ [slideId: string]: { id: string; question: string; author: string; upvotes: number }[] }>({});

  // Phone simulator state
  const [phoneChosenOption, setPhoneChosenOption] = useState<string | null>(null);
  const [phoneAnswerSubmitted, setPhoneAnswerSubmitted] = useState<boolean>(false);
  const [phoneOpenText, setPhoneOpenText] = useState<string>('');
  const [phoneWordText, setPhoneWordText] = useState<string>('');
  const [phoneQaText, setPhoneQaText] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    QRCode.toDataURL(`${origin}/j/PREVIEW`, {
      margin: 1,
      width: 320,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then(setQrCodeUrl)
      .catch(() => {});
  }, []);

  // Initial step setup when switching slides
  useEffect(() => {
    if (!currentSlide) return;
    const type = currentSlide.type_id;
    if (type === 'poll' || type === 'quiz') {
      setStep('question');
    } else if (type === 'wordcloud' || type === 'open' || type === 'qa') {
      setStep('collect');
    } else {
      setStep('display');
    }
    setAcceptingResponses(true);
    setPhoneChosenOption(null);
    setPhoneAnswerSubmitted(false);
    setPhoneOpenText('');
    setPhoneWordText('');
    setPhoneQaText('');
  }, [selectedSlideIndex, currentSlide?.id]);

  // Handle Confetti on Quiz Reveal or Leaderboard
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}
  };

  // Step transitions
  const handleNextStep = () => {
    if (!currentSlide) return;
    const type = currentSlide.type_id;

    if (type === 'poll') {
      if (step === 'question') {
        setStep('results');
        setAcceptingResponses(false);
      } else {
        // Next slide if already on results
        handleNextSlide();
      }
    } else if (type === 'quiz') {
      if (step === 'question') {
        setStep('reveal');
        setAcceptingResponses(false);
        triggerConfetti();
      } else if (step === 'reveal') {
        setStep('stats');
      } else {
        handleNextSlide();
      }
    } else if (type === 'wordcloud' || type === 'open' || type === 'qa') {
      if (step === 'collect') {
        setStep('display');
      } else {
        handleNextSlide();
      }
    } else {
      handleNextSlide();
    }
  };

  const handlePrevStep = () => {
    if (!currentSlide) return;
    const type = currentSlide.type_id;

    if (type === 'poll') {
      if (step === 'results') {
        setStep('question');
        setAcceptingResponses(true);
      } else {
        handlePrevSlide();
      }
    } else if (type === 'quiz') {
      if (step === 'stats') {
        setStep('reveal');
      } else if (step === 'reveal') {
        setStep('question');
        setAcceptingResponses(true);
      } else {
        handlePrevSlide();
      }
    } else if (type === 'wordcloud' || type === 'open' || type === 'qa') {
      if (step === 'display') {
        setStep('collect');
      } else {
        handlePrevSlide();
      }
    } else {
      handlePrevSlide();
    }
  };

  const handlePrevSlide = () => {
    if (selectedSlideIndex > 0) {
      setSelectedSlideIndex(selectedSlideIndex - 1);
    }
  };

  const handleNextSlide = () => {
    if (selectedSlideIndex < slides.length - 1) {
      setSelectedSlideIndex(selectedSlideIndex + 1);
    }
  };

  // Reset slide simulation
  const handleResetSlideData = () => {
    if (!currentSlide) return;
    const sId = currentSlide.id;
    setVotesBySlide((prev) => ({ ...prev, [sId]: {} }));
    setWordsBySlide((prev) => ({ ...prev, [sId]: [] }));
    setOpenBySlide((prev) => ({ ...prev, [sId]: [] }));
    setQaBySlide((prev) => ({ ...prev, [sId]: [] }));
    setPhoneChosenOption(null);
    setPhoneAnswerSubmitted(false);
    setPhoneOpenText('');
    setPhoneWordText('');
    setPhoneQaText('');
    setStep(currentSlide.type_id === 'poll' || currentSlide.type_id === 'quiz' ? 'question' : 'collect');
    setAcceptingResponses(true);
  };

  // Simulate audience responses
  const handleSimulateResponses = (count = 1) => {
    if (!currentSlide) return;
    const sId = currentSlide.id;
    const type = currentSlide.type_id;
    const content = currentSlide.content as any;

    if (type === 'poll' || type === 'quiz') {
      const options = content.options || [];
      if (options.length === 0) return;

      setVotesBySlide((prev) => {
        const current = { ...(prev[sId] || {}) };
        for (let i = 0; i < count; i++) {
          const randomOpt = options[Math.floor(Math.random() * options.length)];
          current[randomOpt.id] = (current[randomOpt.id] || 0) + 1;
        }
        return { ...prev, [sId]: current };
      });
    } else if (type === 'wordcloud') {
      const sampleWords = [
        'Interactive', 'Engagement', 'Speed', 'Realtime', 'Intuitive',
        'Clean', 'Collaboration', 'Fun', 'Learning', 'Audience', 'Sync', 'Modern'
      ];
      setWordsBySlide((prev) => {
        const current = [...(prev[sId] || [])];
        for (let i = 0; i < count; i++) {
          const w = sampleWords[Math.floor(Math.random() * sampleWords.length)];
          const existing = current.find((item) => item.text.toLowerCase() === w.toLowerCase());
          if (existing) {
            existing.count += 1;
          } else {
            current.push({ text: w, count: 1 });
          }
        }
        return { ...prev, [sId]: current };
      });
    } else if (type === 'open') {
      const sampleThoughts = [
        'Loving the live audience feedback feature!',
        'Super smooth transitions and real-time responsiveness.',
        'Extremely intuitive projector display and phone layout.',
        'Great way to keep attendees engaged during presentations.',
        'Seamless roster authentication and PIN verification!'
      ];
      setOpenBySlide((prev) => {
        const current = [...(prev[sId] || [])];
        for (let i = 0; i < count; i++) {
          const text = sampleThoughts[Math.floor(Math.random() * sampleThoughts.length)];
          current.push({
            id: `open_${Date.now()}_${Math.random()}`,
            text,
            author: `Participant ${Math.floor(Math.random() * 80) + 1}`,
          });
        }
        return { ...prev, [sId]: current };
      });
    } else if (type === 'qa') {
      const sampleQuestions = [
        'Can participants join without downloading any app?',
        'How does local intranet offline mode work?',
        'Can we export responses to CSV after the presentation?',
        'Does the quiz calculate speed bonuses automatically?'
      ];
      setQaBySlide((prev) => {
        const current = [...(prev[sId] || [])];
        for (let i = 0; i < count; i++) {
          const question = sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)];
          current.push({
            id: `qa_${Date.now()}_${Math.random()}`,
            question,
            author: `Attendee ${Math.floor(Math.random() * 50) + 1}`,
            upvotes: Math.floor(Math.random() * 5) + 1,
          });
        }
        return { ...prev, [sId]: current };
      });
    }
  };

  // Phone interactions
  const handlePhoneOptionClick = (optId: string) => {
    if (!acceptingResponses || phoneAnswerSubmitted) return;
    setPhoneChosenOption(optId);
    setPhoneAnswerSubmitted(true);

    // Register phone vote into simulated votes
    if (currentSlide) {
      const sId = currentSlide.id;
      setVotesBySlide((prev) => {
        const current = { ...(prev[sId] || {}) };
        current[optId] = (current[optId] || 0) + 1;
        return { ...prev, [sId]: current };
      });
    }
  };

  const handlePhoneSubmitWord = () => {
    if (!phoneWordText.trim() || !acceptingResponses || !currentSlide) return;
    const sId = currentSlide.id;
    const word = phoneWordText.trim();
    setWordsBySlide((prev) => {
      const current = [...(prev[sId] || [])];
      const existing = current.find((item) => item.text.toLowerCase() === word.toLowerCase());
      if (existing) {
        existing.count += 1;
      } else {
        current.push({ text: word, count: 1 });
      }
      return { ...prev, [sId]: current };
    });
    setPhoneWordText('');
    setPhoneAnswerSubmitted(true);
  };

  const handlePhoneSubmitOpen = () => {
    if (!phoneOpenText.trim() || !acceptingResponses || !currentSlide) return;
    const sId = currentSlide.id;
    setOpenBySlide((prev) => {
      const current = [...(prev[sId] || [])];
      current.push({
        id: `open_${Date.now()}`,
        text: phoneOpenText.trim(),
        author: 'You (Phone)',
      });
      return { ...prev, [sId]: current };
    });
    setPhoneOpenText('');
    setPhoneAnswerSubmitted(true);
  };

  const handlePhoneSubmitQa = () => {
    if (!phoneQaText.trim() || !currentSlide) return;
    const sId = currentSlide.id;
    setQaBySlide((prev) => {
      const current = [...(prev[sId] || [])];
      current.unshift({
        id: `qa_${Date.now()}`,
        question: phoneQaText.trim(),
        author: 'You (Phone)',
        upvotes: 1,
      });
      return { ...prev, [sId]: current };
    });
    setPhoneQaText('');
  };

  const handleUpvoteQA = (id: string) => {
    if (!currentSlide) return;
    const sId = currentSlide.id;
    setQaBySlide((prev) => {
      const current = [...(prev[sId] || [])];
      const item = current.find((q) => q.id === id);
      if (item) item.upvotes += 1;
      return { ...prev, [sId]: current };
    });
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in text inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevStep();
      } else if (e.key === 'PageDown' || e.key === ']') {
        e.preventDefault();
        handleNextSlide();
      } else if (e.key === 'PageUp' || e.key === '[') {
        e.preventDefault();
        handlePrevSlide();
      } else if (e.key.toLowerCase() === 'b') {
        setIsBlanked((prev) => !prev);
      } else if (e.key.toLowerCase() === 'f') {
        setIsFrozen((prev) => !prev);
      } else if (e.key.toLowerCase() === 's') {
        handleSimulateResponses(1);
      } else if (e.key.toLowerCase() === 'r') {
        handleResetSlideData();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSlideIndex, step, currentSlide, slides.length, onClose]);

  if (!currentSlide) return null;

  const content = currentSlide.content as any;
  const isPoll = currentSlide.type_id === 'poll';
  const isQuiz = currentSlide.type_id === 'quiz';
  const isPollOrQuiz = isPoll || isQuiz;

  // Compute live aggregates for current slide
  const slideVotes = votesBySlide[currentSlide.id] || {};
  const totalVotes = Object.values(slideVotes).reduce((a, b) => a + b, 0);

  // Determine current Next Step button label
  const getNextStepLabel = () => {
    if (isQuiz) {
      if (step === 'question') return 'Reveal Correct Answer';
      if (step === 'reveal') return 'Show Stats & Leaderboard';
      return 'Next Slide';
    }
    if (isPoll) {
      if (step === 'question') return 'Reveal Results';
      return 'Next Slide';
    }
    if (currentSlide.type_id === 'wordcloud' || currentSlide.type_id === 'open' || currentSlide.type_id === 'qa') {
      if (step === 'collect') return 'Display Wall';
      return 'Next Slide';
    }
    return 'Next Slide';
  };

  const getStepBadgeText = () => {
    if (isQuiz) {
      if (step === 'question') return 'Step 1: Voting (Question)';
      if (step === 'reveal') return 'Step 2: Correct Answer Revealed';
      return 'Step 3: Score Stats & Results';
    }
    if (isPoll) {
      if (step === 'question') return 'Step 1: Voting (Question)';
      return 'Step 2: Results Displayed';
    }
    if (currentSlide.type_id === 'wordcloud' || currentSlide.type_id === 'open' || currentSlide.type_id === 'qa') {
      if (step === 'collect') return 'Step 1: Collecting Responses';
      return 'Step 2: Wall Display';
    }
    return `Slide: ${currentSlide.type_id}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col select-none text-white animate-in fade-in duration-150 overflow-hidden font-sans">
      {/* 1. Top Bar: Presenter Controls on Preview Screen */}
      <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 backdrop-blur-md shrink-0 shadow-lg z-20">
        {/* Left: Slide Navigation & Step Status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 border border-slate-700 rounded-lg p-0.5 bg-slate-800">
            <button
              onClick={handlePrevSlide}
              disabled={selectedSlideIndex === 0}
              className="p-1.5 rounded hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors text-slate-200"
              title="Previous Slide (PageUp or [)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-2.5 py-0.5 flex items-center space-x-2 text-xs font-semibold">
              <span className="text-indigo-400">
                Slide {selectedSlideIndex + 1}/{slides.length}
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300 capitalize">{currentSlide.type_id}</span>
            </div>

            <button
              onClick={handleNextSlide}
              disabled={selectedSlideIndex === slides.length - 1}
              className="p-1.5 rounded hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors text-slate-200"
              title="Next Slide (PageDown or ])"
            >
              <FastForward className="w-4 h-4" />
            </button>
          </div>

          {/* Current Step indicator badge */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>{getStepBadgeText()}</span>
          </div>
        </div>

        {/* Center: Primary Presenter Stepping & Reveal Controls */}
        <div className="flex items-center space-x-2">
          {/* Previous Step button */}
          <button
            onClick={handlePrevStep}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            title="Step back (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Prev Step</span>
          </button>

          {/* Primary Next Step / Reveal Button vs Next Slide */}
          {(() => {
            const hasNextStep = (
              (isQuiz && (step === 'question' || step === 'reveal')) ||
              (isPoll && step === 'question') ||
              ((currentSlide.type_id === 'wordcloud' || currentSlide.type_id === 'open' || currentSlide.type_id === 'qa') && step === 'collect')
            );

            if (hasNextStep) {
              return (
                <button
                  onClick={handleNextStep}
                  className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold shadow-md transition-all ${
                    step === 'question' && (isQuiz || isPoll)
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                  title="Advance step or reveal (Space / Right Arrow)"
                >
                  {step === 'question' && isQuiz ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <span>{getNextStepLabel()}</span>
                </button>
              );
            }

            return (
              <button
                disabled={true}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-500 text-xs font-medium opacity-40 cursor-not-allowed"
                title="No additional steps on this slide"
              >
                <span>No Next Step</span>
              </button>
            );
          })()}

          {/* Reveal results toggle */}
          {isPollOrQuiz && (
            <button
              onClick={() => setResultsVisible(!resultsVisible)}
              className={`p-1.5 rounded-lg border text-xs font-medium transition-colors ${
                resultsVisible
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title={resultsVisible ? 'Hide results on projector' : 'Show results on projector'}
            >
              {resultsVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          )}

          {/* Accepting responses switch: ON - Close now and OFF - Open again */}
          {isPollOrQuiz && (
            <button
              onClick={() => setAcceptingResponses(!acceptingResponses)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center space-x-1.5 ${
                acceptingResponses
                  ? 'bg-amber-600/30 border-amber-500/60 text-amber-300 hover:bg-amber-600/40'
                  : 'bg-emerald-600/30 border-emerald-500/60 text-emerald-300 hover:bg-emerald-600/40'
              }`}
              title="Toggle voting acceptance for mobile participants"
            >
              <span>{acceptingResponses ? 'ON - Close now' : 'OFF - Open again'}</span>
            </button>
          )}
        </div>

        {/* Right: Simulation, Blank/Freeze & Close */}
        <div className="flex items-center space-x-2">
          {/* Simulate Audience Votes (+1, +5) */}
          <div className="flex items-center space-x-1 border border-slate-700 rounded-lg p-0.5 bg-slate-800">
            <button
              onClick={() => handleSimulateResponses(1)}
              className="px-2 py-1 rounded hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center space-x-1"
              title="Simulate +1 audience response (S key)"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>+1</span>
            </button>
            <button
              onClick={() => handleSimulateResponses(5)}
              className="px-2 py-1 rounded hover:bg-slate-700 text-xs font-semibold text-slate-200"
              title="Simulate +5 audience responses"
            >
              +5
            </button>
            <button
              onClick={handleResetSlideData}
              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200"
              title="Reset slide test data (R key)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Blank Screen Toggle */}
          <button
            onClick={() => setIsBlanked(!isBlanked)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              isBlanked
                ? 'bg-red-600 text-white border-red-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Blank projector screen (B key)"
          >
            Blank
          </button>

          {/* Freeze Screen Toggle */}
          <button
            onClick={() => setIsFrozen(!isFrozen)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              isFrozen
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Freeze projector screen (F key)"
          >
            Freeze
          </button>

          {/* Close Preview */}
          <button
            onClick={onClose}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700 ml-1"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Close (Esc)</span>
          </button>
        </div>
      </div>

      {/* 2. Main Body: Split Projector Display View & Interactive Phone Preview */}
      <div className="flex-1 flex flex-col lg:flex-row p-6 gap-6 overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950">
        {/* Left: Projector Big-Screen View with Dynamic Aspect Ratio & Theme & Texture */}
        <div
          style={{
            ...getThemeTextureStyle(activity?.theme),
            aspectRatio: (activity?.settings?.aspect_ratio || '16:9') === '4:3' ? '4/3' : (activity?.settings?.aspect_ratio || '16:9') === '16:10' ? '16/10' : '16/9',
          }}
          className="flex-1 flex flex-col border border-slate-700/60 rounded-2xl p-8 shadow-2xl overflow-y-auto justify-between relative transition-all"
        >
          {/* Blank Screen Overlay */}
          {isBlanked && (
            <div className="absolute inset-0 bg-black z-30 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
              <span className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-2">
                Projector Blanked
              </span>
              <p className="text-xs text-slate-600">Press 'B' or click Blank in the toolbar to resume</p>
            </div>
          )}

          {/* Freeze Banner */}
          {isFrozen && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-bold flex items-center space-x-1.5 shadow-lg">
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>PROJECTOR FROZEN</span>
            </div>
          )}

          <div>
            {/* Projector Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 uppercase tracking-widest">
                <Tv className="w-4 h-4" />
                <span>
                  Projector Display · {currentSlide.type_id}
                  {isQuiz && step !== 'question' && ' · Correct Answer Revealed'}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs font-mono text-slate-400">
                <span className="flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{totalVotes + (currentSlide.type_id === 'open' ? (openBySlide[currentSlide.id] || []).length : 0)} Responses</span>
                </span>
                <span>|</span>
                <span>{typeof window !== 'undefined' ? `${window.location.host}/j/PREVIEW` : 'airact/j/PREVIEW'}</span>
              </div>
            </div>

            {/* Slide Title / Question Prompt */}
            <div className="mt-6">
              <h2
                className={`text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight ${isLight ? 'text-slate-950 font-black' : 'text-white'}`}
                style={getFieldTextStyle(content.styles, content.question !== undefined ? 'question' : 'title')}
              >
                {content.question || content.title || 'Slide Title'}
              </h2>

              {/* Poll & Quiz Options Display */}
              {isPollOrQuiz && content.options && (
                <div className="space-y-3.5 mt-8 max-w-3xl">
                  {content.options.map((opt: any, idx: number) => {
                    const count = slideVotes[opt.id] || 0;
                    const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                    const isCorrect = isQuiz && step !== 'question' && content.correct_option_id === opt.id;
                    const showBars = resultsVisible || step === 'results' || step === 'stats';

                    return (
                      <div key={opt.id} className="space-y-1.5">
                        <div
                          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                            isCorrect
                              ? isLight
                                ? 'bg-emerald-100 border-emerald-400 text-slate-950 shadow-sm ring-2 ring-emerald-500/40'
                                : 'bg-emerald-950/60 border-emerald-500 text-emerald-100 shadow-lg shadow-emerald-950/30 ring-2 ring-emerald-500/40'
                              : isLight
                              ? 'bg-white/95 border-slate-200/90 text-slate-950 shadow-xs'
                              : 'bg-slate-800/80 border-slate-700/80 text-white'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
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
                              className="text-lg font-semibold"
                              style={getFieldTextStyle(content.styles, 'options')}
                            >
                              {opt.text}
                            </span>
                            {isCorrect && (
                              <span className={`flex items-center space-x-1 text-xs font-bold px-2.5 py-0.5 rounded-full ml-2 ${isLight ? 'text-emerald-800 bg-emerald-100 border border-emerald-300' : 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/40'}`}>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>CORRECT ANSWER</span>
                              </span>
                            )}
                          </div>

                          {showBars && (
                            <span className={`text-sm font-mono font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                              {count} votes ({percentage}%)
                            </span>
                          )}
                        </div>

                        {/* Animated Percentage Bar */}
                        {showBars && (
                          <div className={`h-4 w-full rounded-lg overflow-hidden p-0.5 ${isLight ? 'bg-slate-200/80 border border-slate-300' : 'bg-slate-900 border border-slate-800'}`}>
                            <div
                              className={`h-full rounded-md transition-all duration-500 ease-out ${
                                isCorrect
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                  : 'bg-gradient-to-r from-indigo-600 to-violet-500'
                              }`}
                              style={{ width: `${Math.max(percentage, totalVotes > 0 ? 3 : 0)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Quiz Explanation Reveal Box */}
                  {isQuiz && step !== 'question' && content.explanation && (
                    <div className={`mt-6 p-4 rounded-xl border text-sm leading-relaxed animate-in fade-in ${isLight ? 'bg-white/95 border-emerald-300 text-slate-800 shadow-sm' : 'bg-slate-800/90 border-emerald-500/30 text-slate-200'}`}>
                      <div className={`font-bold flex items-center space-x-1 mb-1 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Explanation & Key Takeaway</span>
                      </div>
                      <p style={getFieldTextStyle(content.styles, 'explanation')}>{content.explanation}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Word Cloud Display */}
              {currentSlide.type_id === 'wordcloud' && (
                <div className={`mt-8 p-4 rounded-2xl border h-[340px] flex items-center justify-center overflow-hidden ${isLight ? 'bg-white/90 border-slate-200 shadow-sm' : 'bg-slate-950/60 border-slate-800'}`}>
                  <D3WordCloud words={wordsBySlide[currentSlide.id] || []} className="w-full h-full" />
                </div>
              )}

              {/* Open-Ended Wall Display */}
              {currentSlide.type_id === 'open' && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto">
                  {(openBySlide[currentSlide.id] || []).length === 0 ? (
                    <div className="col-span-2 text-center text-slate-500 py-12">
                      Waiting for audience thoughts. Try submitting a thought from the phone simulator!
                    </div>
                  ) : (
                    (openBySlide[currentSlide.id] || []).map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border space-y-2 ${isLight ? 'bg-white/95 border-slate-200/90 text-slate-900 shadow-xs' : 'bg-slate-800/80 border-slate-700/80 text-slate-100'}`}
                      >
                        <p className={`text-base font-medium leading-relaxed ${isLight ? 'text-slate-950' : 'text-slate-100'}`}>
                          "{item.text}"
                        </p>
                        <div className={`text-xs font-semibold ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>{item.author}</div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Q&A Display */}
              {currentSlide.type_id === 'qa' && (
                <div className="mt-8 space-y-3 max-h-[380px] overflow-y-auto">
                  {(qaBySlide[currentSlide.id] || []).length === 0 ? (
                    <div className="text-center text-slate-500 py-12">
                      No questions asked yet. Ask a question via the phone simulator!
                    </div>
                  ) : (
                    (qaBySlide[currentSlide.id] || []).map((q) => (
                      <div
                        key={q.id}
                        className={`p-4 rounded-xl border flex items-center justify-between ${isLight ? 'bg-white/95 border-slate-200 text-slate-950 shadow-xs' : 'bg-slate-800/80 border-slate-700 text-white'}`}
                      >
                        <div>
                          <p className={`text-base font-semibold ${isLight ? 'text-slate-950' : 'text-white'}`}>{q.question}</p>
                          <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{q.author}</span>
                        </div>
                        <button
                          onClick={() => handleUpvoteQA(q.id)}
                          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                            isLight
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                              : 'bg-indigo-600/30 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600 hover:text-white'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{q.upvotes}</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Leaderboard Podium Display */}
              {currentSlide.type_id === 'leaderboard' && (
                <div className="mt-8 max-w-xl mx-auto space-y-3">
                  {[
                    { rank: 1, name: 'Alex Rivera', score: 380, correct: '4/4' },
                    { rank: 2, name: 'Taylor Chen', score: 340, correct: '4/4' },
                    { rank: 3, name: 'Jordan Patel', score: 290, correct: '3/4' },
                    { rank: 4, name: 'Morgan Casey', score: 260, correct: '3/4' },
                    { rank: 5, name: 'Samira Khan', score: 220, correct: '2/4' },
                  ].map((lead) => (
                    <div
                      key={lead.rank}
                      className={`p-3.5 rounded-xl border flex items-center justify-between ${
                        lead.rank === 1
                          ? isLight
                            ? 'bg-amber-100/90 border-amber-300 text-slate-950 shadow-sm'
                            : 'bg-amber-500/20 border-amber-500/50 text-amber-200 shadow-md'
                          : isLight
                          ? 'bg-white/95 border-slate-200 text-slate-900 shadow-2xs'
                          : lead.rank === 2
                          ? 'bg-slate-300/10 border-slate-400/40 text-slate-200'
                          : lead.rank === 3
                          ? 'bg-amber-700/10 border-amber-700/40 text-amber-300'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            lead.rank === 1
                              ? 'bg-amber-400 text-slate-950'
                              : lead.rank === 2
                              ? 'bg-slate-300 text-slate-950'
                              : lead.rank === 3
                              ? 'bg-amber-700 text-white'
                              : isLight
                              ? 'bg-slate-100 text-slate-800 border border-slate-200'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {lead.rank}
                        </span>
                        <span className={`font-bold text-base ${isLight ? 'text-slate-950' : 'text-white'}`}>{lead.name}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`text-xs ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>{lead.correct}</span>
                        <span className={`font-mono font-bold text-lg ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                          {lead.score} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Welcome Slide Display (Exact Mirror of ProjectorView) */}
              {currentSlide.type_id === 'welcome' && (
                <div className="flex flex-col lg:flex-row items-start justify-between gap-8 my-auto">
                  {/* Left Column: Workshop Info */}
                  <div className="flex-1 space-y-5 max-w-2xl">
                    <div
                      className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold border ${
                        isLight
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Interactive Workshop Session</span>
                    </div>

                    <h1
                      className={`text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight ${
                        isLight ? 'text-slate-950 font-black' : 'text-white'
                      }`}
                      style={getFieldTextStyle(content.styles, 'title')}
                    >
                      {content.title || 'Interactive Workshop'}
                    </h1>

                    {/* Presenter Box */}
                    {(content.presenter_name || content.presenter_info) && (
                      <div
                        className={`p-4 rounded-2xl max-w-lg space-y-1.5 border ${
                          isLight
                            ? 'bg-white/95 border-slate-200/90 shadow-md text-slate-900'
                            : 'bg-slate-900/80 border-slate-800 text-white'
                        }`}
                      >
                        {content.presenter_name && (
                          <div className={`text-lg font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            <span className={isLight ? 'text-slate-500 font-medium text-sm' : 'text-slate-400 font-medium text-sm'}>
                              Presented by
                            </span>
                            <span
                              className={isLight ? 'text-indigo-600 font-extrabold' : 'text-indigo-400'}
                              style={getFieldTextStyle(content.styles, 'presenter_name')}
                            >
                              {content.presenter_name}
                            </span>
                          </div>
                        )}
                        {content.presenter_info && (
                          <div
                            className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}
                            style={getFieldTextStyle(content.styles, 'presenter_info')}
                          >
                            {content.presenter_info}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Join Message & URL Box */}
                    <div className="space-y-3 pt-1">
                      <p
                        className={`text-base font-medium leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}
                        style={getFieldTextStyle(content.styles, 'join_message')}
                      >
                        {content.join_message ||
                          'Join the live interactive presentation on your phone or laptop to vote and participate:'}
                      </p>

                      <div
                        className={`flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl max-w-lg border select-none ${
                          isLight
                            ? 'bg-white/95 border-slate-200/90 shadow-md text-slate-900'
                            : 'bg-slate-900/90 border-slate-800 shadow-md text-white'
                        }`}
                      >
                        <div>
                          <div className={`text-[10px] uppercase tracking-wider font-semibold mb-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            Web Link
                          </div>
                          <div className={`text-base font-mono font-bold underline underline-offset-4 ${isLight ? 'text-slate-950' : 'text-white'}`}>
                            {typeof window !== 'undefined' ? `${window.location.host}/j/PREVIEW` : 'airact/j/PREVIEW'}
                          </div>
                        </div>
                        <div className={`sm:border-l sm:pl-5 ${isLight ? 'sm:border-slate-200' : 'sm:border-slate-800'}`}>
                          <div className={`text-[10px] uppercase tracking-wider font-semibold mb-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            Session Code
                          </div>
                          <div className={`text-2xl font-mono font-extrabold tracking-wider ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
                            PREVIEW
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: QR Code */}
                  <div className="flex flex-col items-center justify-center shrink-0">
                    <div className={`p-5 bg-white rounded-3xl ${isLight ? 'shadow-xl border-4 border-slate-200/90' : 'shadow-2xl border-4 border-indigo-500/30'}`}>
                      {qrCodeUrl ? (
                        <img
                          src={qrCodeUrl}
                          alt="Join QR Code"
                          className="w-56 h-56 lg:w-64 lg:h-64 rounded-xl object-contain"
                        />
                      ) : (
                        <div className="w-56 h-56 flex items-center justify-center bg-slate-100 rounded-xl">
                          <QrCode className="w-28 h-28 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        Scan with phone camera to participate
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Content Slide Display */}
              {currentSlide.type_id === 'content' && content.body && (
                <div
                  className={`mt-8 text-xl leading-relaxed whitespace-pre-wrap max-w-3xl ${isLight ? 'text-slate-900 font-medium' : 'text-slate-300 font-normal'}`}
                  style={getFieldTextStyle(content.styles, 'body')}
                >
                  {content.body}
                </div>
              )}
            </div>
          </div>

          {/* Projector persistent corner info */}
          <div className={`pt-6 border-t flex items-center justify-between text-xs ${isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'}`}>
            <div className="flex items-center space-x-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className={isLight ? 'text-slate-800 font-semibold' : 'text-slate-300'}>{typeof window !== 'undefined' ? `${window.location.host}/j/PREVIEW` : 'airact/j/PREVIEW'}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Shortcuts: Space/Right (Next/Reveal) · Left (Back) · B (Blank) · F (Freeze)</span>
            </div>
          </div>
        </div>

        {/* Right: Interactive Participant Phone Simulator */}
        <div className="w-full lg:w-96 flex flex-col items-center justify-center shrink-0">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 mb-3">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Interactive Participant Phone Preview</span>
          </div>

          <div className="w-80 h-[580px] bg-slate-900 border-4 border-slate-700 rounded-[36px] p-4 flex flex-col justify-between shadow-2xl overflow-hidden relative">
            {/* Top speaker notch */}
            <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-2" />

            <div className="flex-1 overflow-y-auto space-y-3.5 px-1">
              <div className="text-center">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                  Audience Phone
                </span>
                <h4 className="text-sm font-bold text-white mt-1 leading-snug">
                  {content.question || content.title}
                </h4>
              </div>

              {/* If responses are closed */}
              {!acceptingResponses && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-center text-xs font-semibold animate-in fade-in">
                  Responses are currently closed by presenter.
                </div>
              )}

              {/* Poll & Quiz on Phone */}
              {isPollOrQuiz && content.options && (
                <div className="space-y-2 mt-2">
                  {content.options.map((opt: any, idx: number) => {
                    const isChosen = phoneChosenOption === opt.id;
                    const isCorrect = isQuiz && step !== 'question' && content.correct_option_id === opt.id;
                    const isWrong = isQuiz && step !== 'question' && isChosen && !isCorrect;

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handlePhoneOptionClick(opt.id)}
                        disabled={!acceptingResponses || phoneAnswerSubmitted}
                        className={`w-full min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-semibold text-left transition-all flex items-center justify-between ${
                          isCorrect
                            ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400'
                            : isWrong
                            ? 'bg-red-600/80 text-white'
                            : isChosen
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-60'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded bg-black/20 flex items-center justify-center font-bold text-[10px]">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                        {isChosen && <span>✓</span>}
                      </button>
                    );
                  })}

                  {phoneAnswerSubmitted && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-center text-xs font-bold animate-in fade-in">
                      {isQuiz && step !== 'question' ? (
                        phoneChosenOption === content.correct_option_id ? (
                          <span>🎉 Correct! +100 Points</span>
                        ) : (
                          <span>❌ Incorrect answer</span>
                        )
                      ) : (
                        <span>✓ Response submitted</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Word Cloud on Phone */}
              {currentSlide.type_id === 'wordcloud' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={phoneWordText}
                    onChange={(e) => setPhoneWordText(e.target.value)}
                    placeholder="Enter a word (e.g. Fast)..."
                    disabled={!acceptingResponses}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-800 text-white border border-slate-700 focus:outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={handlePhoneSubmitWord}
                    disabled={!acceptingResponses || !phoneWordText.trim()}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-40"
                  >
                    Send Word
                  </button>
                </div>
              )}

              {/* Open Ended on Phone */}
              {currentSlide.type_id === 'open' && (
                <div className="space-y-2">
                  <textarea
                    value={phoneOpenText}
                    onChange={(e) => setPhoneOpenText(e.target.value)}
                    placeholder="Type your answer here..."
                    rows={3}
                    disabled={!acceptingResponses}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-800 text-white border border-slate-700 focus:outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={handlePhoneSubmitOpen}
                    disabled={!acceptingResponses || !phoneOpenText.trim()}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-40"
                  >
                    Submit Response
                  </button>
                </div>
              )}

              {/* Q&A on Phone */}
              {currentSlide.type_id === 'qa' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={phoneQaText}
                    onChange={(e) => setPhoneQaText(e.target.value)}
                    placeholder="Ask a question..."
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-800 text-white border border-slate-700 focus:outline-none"
                  />
                  <button
                    onClick={handlePhoneSubmitQa}
                    disabled={!phoneQaText.trim()}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-40 flex items-center justify-center space-x-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ask Question</span>
                  </button>
                </div>
              )}

              {/* Content Slide Info on Phone */}
              {currentSlide.type_id === 'content' && (
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-center text-xs text-slate-300">
                  <p>Follow along with the presenter on the main display.</p>
                </div>
              )}
            </div>

            {/* Bottom home bar */}
            <div className="w-24 h-1 bg-slate-600 rounded-full mx-auto mt-2" />
          </div>
        </div>
      </div>
    </div>
  );
};
