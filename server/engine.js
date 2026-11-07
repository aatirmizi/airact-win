import { WebSocket } from 'ws';
import QRCode from 'qrcode';
import { defaultDb } from './db.js';
import { createStarterActivity, generateId, generateJoinCode } from './fileManager.js';
export class PresentationEngine {
    db;
    activity;
    // Runtime presentation state
    isLive = false;
    presentationId = null;
    joinCode = '';
    joinMode = 'anonymous';
    participantLimit = 200;
    currentSlideIndex = 0;
    currentStep = 'question';
    acceptingResponses = true;
    isClosing = false;
    closeDeadlineMs = null;
    timerActive = false;
    timerPaused = false;
    remainingSeconds = null;
    timerInterval = null;
    stepOpenedAt = Date.now();
    resultsVisibleOnProjector = true;
    isBlanked = false;
    isFrozen = false;
    rev = 1;
    // Projector one-time tokens
    projectorTokens = new Map(); // token -> expiresAt
    // Connections
    participantClients = new Map();
    projectorClients = new Set();
    facilitatorClients = new Set();
    // App host URL (injected or detected)
    currentAppUrl = (process.env.APP_URL && process.env.APP_URL.startsWith('http'))
        ? process.env.APP_URL.replace(/\/$/, '')
        : '';
    // QR Code data URL cache
    cachedQrCode = '';
    setAppUrl(url) {
        if (url && url.startsWith('http')) {
            const clean = url.replace(/\/$/, '');
            if (!this.currentAppUrl || (this.currentAppUrl.includes('localhost') && !clean.includes('localhost'))) {
                this.currentAppUrl = clean;
            }
        }
    }
    constructor(db = defaultDb) {
        this.db = db;
        this.activity = createStarterActivity();
        if (!this.activity.slides.some((s) => s.type_id === 'welcome')) {
            const welcomeSlide = {
                id: generateId(12),
                type_id: 'welcome',
                type_version: 1,
                content: {
                    title: this.activity.manifest.meta.name || 'Interactive Workshop & Presentation',
                    presenter_name: 'Lead Facilitator',
                    presenter_info: 'Skill Upgrade Network',
                    join_message: 'Scan the QR code or use the link below to participate live from your phone or laptop',
                    logo_url: '/assets/aistudio/sunlogo-removebg-preview_80efd167.png',
                },
                settings: {
                    participant_visibility: true,
                },
                notes: 'Welcome participants! Allow everyone to scan the QR code to join before proceeding.',
            };
            this.activity.slides.unshift(welcomeSlide);
        }
        this.startHeartbeat();
    }
    // Heartbeat ping-pong
    startHeartbeat() {
        setInterval(() => {
            const now = Date.now();
            // Participant pings
            for (const [ws, client] of this.participantClients.entries()) {
                if (ws.readyState === WebSocket.OPEN) {
                    try {
                        ws.ping();
                    }
                    catch {
                        this.participantClients.delete(ws);
                    }
                }
                else {
                    this.participantClients.delete(ws);
                }
            }
            // Check active count change
            this.checkActiveParticipants();
        }, 5000);
    }
    getActiveCount() {
        const now = Date.now();
        const activeTokens = new Set();
        for (const [ws, client] of this.participantClients.entries()) {
            if (ws.readyState === WebSocket.OPEN && client.token && now - client.lastPong < 15000) {
                activeTokens.add(client.token);
            }
        }
        return activeTokens.size;
    }
    checkActiveParticipants() {
        // If active count changed, broadcast updated view
        if (this.isLive) {
            this.broadcastViews();
        }
    }
    // Current Slide Helper
    getCurrentSlide() {
        if (this.currentSlideIndex >= 0 && this.currentSlideIndex < this.activity.slides.length) {
            return this.activity.slides[this.currentSlideIndex];
        }
        return null;
    }
    // Start Presentation (Go Live)
    async startPresentation(startIndex = 0, joinMode = 'anonymous', participantLimit = 200, appUrl) {
        this.isLive = true;
        this.presentationId = generateId(16);
        this.joinCode = generateJoinCode();
        this.joinMode = joinMode;
        this.participantLimit = participantLimit;
        this.currentSlideIndex = Math.max(0, Math.min(startIndex, this.activity.slides.length - 1));
        this.currentStep = this.getDefaultStepForSlide(this.getCurrentSlide());
        this.acceptingResponses = true;
        this.isClosing = false;
        this.closeDeadlineMs = null;
        this.resultsVisibleOnProjector = true;
        this.isBlanked = false;
        this.isFrozen = false;
        this.stepOpenedAt = Date.now();
        this.bumpRev();
        // Init database presentation record
        this.db.createPresentation(this.presentationId, this.activity.manifest.meta.activity_id, this.joinCode, joinMode, participantLimit);
        // Generate QR code using currentAppUrl
        if (appUrl) {
            this.currentAppUrl = appUrl.replace(/\/$/, '');
        }
        else if (process.env.APP_URL) {
            this.currentAppUrl = process.env.APP_URL.replace(/\/$/, '');
        }
        else if (!this.currentAppUrl) {
            this.currentAppUrl = 'http://localhost:3000';
        }
        const hostUrl = this.currentAppUrl;
        const fullJoinUrl = `${hostUrl}/j/${this.joinCode}`;
        try {
            this.cachedQrCode = await QRCode.toDataURL(fullJoinUrl, {
                margin: 2,
                width: 400,
                color: { dark: '#000000', light: '#ffffff' },
            });
        }
        catch {
            this.cachedQrCode = '';
        }
        // Setup slide timer if configured
        this.initTimerForCurrentSlide();
        // Broadcast views
        this.broadcastViews();
        return this.joinCode;
    }
    // End Presentation
    endPresentation() {
        if (!this.isLive)
            return;
        this.stopTimer();
        if (this.presentationId) {
            this.db.endPresentation(this.presentationId);
        }
        this.isLive = false;
        this.isClosing = false;
        this.closeDeadlineMs = null;
        this.bumpRev();
        // Close participant sockets with code 1000 (normal presentation ended)
        for (const [ws] of this.participantClients.entries()) {
            try {
                ws.send(JSON.stringify({ type: 'bye', code: 'presentation_ended', retry: false }));
                ws.close(1000, 'The activity has ended');
            }
            catch { }
        }
        this.participantClients.clear();
        this.broadcastViews();
    }
    // Navigation
    nextStep() {
        const slide = this.getCurrentSlide();
        if (!slide)
            return;
        if (slide.type_id === 'poll') {
            if (this.currentStep === 'question') {
                this.currentStep = 'results';
                this.acceptingResponses = false;
            }
        }
        else if (slide.type_id === 'quiz') {
            if (this.currentStep === 'question') {
                this.currentStep = 'reveal';
                this.acceptingResponses = false; // Fairness rule: lock accepting once reveal shown
            }
            else if (this.currentStep === 'reveal') {
                this.currentStep = 'stats';
            }
        }
        else if (slide.type_id === 'open' || slide.type_id === 'wordcloud' || slide.type_id === 'qa') {
            if (this.currentStep === 'collect') {
                this.currentStep = 'display';
            }
        }
        this.stepOpenedAt = Date.now();
        this.bumpRev();
        this.broadcastViews();
    }
    prevStep() {
        const slide = this.getCurrentSlide();
        if (!slide)
            return;
        if (slide.type_id === 'poll' && this.currentStep === 'results') {
            this.currentStep = 'question';
            this.acceptingResponses = true;
        }
        else if (slide.type_id === 'quiz') {
            if (this.currentStep === 'stats') {
                this.currentStep = 'reveal';
            }
            // Note: Fairness rule forbids returning to 'question' if already revealed
        }
        else if ((slide.type_id === 'open' || slide.type_id === 'wordcloud' || slide.type_id === 'qa') &&
            this.currentStep === 'display') {
            this.currentStep = 'collect';
        }
        this.bumpRev();
        this.broadcastViews();
    }
    nextSlide() {
        if (this.currentSlideIndex < this.activity.slides.length - 1) {
            this.goToSlide(this.currentSlideIndex + 1);
        }
    }
    prevSlide() {
        if (this.currentSlideIndex > 0) {
            this.goToSlide(this.currentSlideIndex - 1);
        }
    }
    goToSlide(index) {
        if (index >= 0 && index < this.activity.slides.length) {
            this.stopTimer();
            this.currentSlideIndex = index;
            const slide = this.activity.slides[index];
            this.currentStep = this.getDefaultStepForSlide(slide);
            this.acceptingResponses = true;
            this.isClosing = false;
            this.closeDeadlineMs = null;
            this.stepOpenedAt = Date.now();
            this.resultsVisibleOnProjector = slide.settings.results_visibility !== 'hidden';
            this.initTimerForCurrentSlide();
            this.bumpRev();
            this.broadcastViews();
        }
    }
    getDefaultStepForSlide(slide) {
        if (!slide)
            return 'display';
        switch (slide.type_id) {
            case 'poll':
            case 'quiz':
                return 'question';
            case 'open':
            case 'wordcloud':
            case 'qa':
                return 'collect';
            case 'leaderboard':
            case 'content':
            default:
                return 'display';
        }
    }
    // Step & Applicability Helpers
    hasNextStep() {
        const slide = this.getCurrentSlide();
        if (!slide)
            return false;
        if (slide.type_id === 'poll') {
            return this.currentStep === 'question';
        }
        if (slide.type_id === 'quiz') {
            return this.currentStep === 'question' || this.currentStep === 'reveal';
        }
        if (slide.type_id === 'open' || slide.type_id === 'wordcloud' || slide.type_id === 'qa') {
            return this.currentStep === 'collect';
        }
        return false;
    }
    isTimerApplicable() {
        const slide = this.getCurrentSlide();
        if (!slide)
            return false;
        if (slide.type_id === 'content' || slide.type_id === 'leaderboard' || slide.type_id === 'welcome')
            return false;
        if (slide.type_id === 'poll')
            return this.currentStep === 'question';
        if (slide.type_id === 'quiz')
            return this.currentStep === 'question';
        if (slide.type_id === 'open' || slide.type_id === 'wordcloud' || slide.type_id === 'qa') {
            return this.currentStep === 'collect';
        }
        return false;
    }
    // Timer controls
    startTimerCountdown() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.timerInterval = setInterval(() => {
            if (!this.timerActive || this.timerPaused || this.remainingSeconds === null)
                return;
            this.remainingSeconds -= 1;
            if (this.remainingSeconds <= 0) {
                this.remainingSeconds = 0;
                this.timerActive = false;
                this.timerPaused = false;
                this.stopTimer();
                this.handleTimerExpired();
            }
            else {
                this.broadcastViews();
            }
        }, 1000);
    }
    initTimerForCurrentSlide() {
        this.stopTimer();
        this.timerPaused = false;
        const slide = this.getCurrentSlide();
        if (!slide)
            return;
        if (!this.isTimerApplicable()) {
            this.remainingSeconds = null;
            this.timerActive = false;
            this.timerPaused = false;
            return;
        }
        const timerSeconds = slide.settings.timer_seconds;
        if (timerSeconds && timerSeconds > 0) {
            this.remainingSeconds = timerSeconds;
            this.timerActive = true;
            this.timerPaused = false;
            this.startTimerCountdown();
        }
        else {
            this.remainingSeconds = null;
            this.timerActive = false;
            this.timerPaused = false;
        }
    }
    handleTimerExpired() {
        this.stopTimer();
        this.timerActive = false;
        this.timerPaused = false;
        const slide = this.getCurrentSlide();
        const closePolicy = slide?.settings.close_policy;
        if (closePolicy && closePolicy.mode === 'grace') {
            const graceSeconds = closePolicy.grace_seconds || 5;
            this.isClosing = true;
            this.closeDeadlineMs = Date.now() + graceSeconds * 1000;
            this.bumpRev();
            this.broadcastViews();
            setTimeout(() => {
                this.isClosing = false;
                this.closeDeadlineMs = null;
                this.acceptingResponses = false;
                this.bumpRev();
                this.broadcastViews();
            }, graceSeconds * 1000);
        }
        else {
            // Immediate close
            this.acceptingResponses = false;
            this.isClosing = false;
            this.bumpRev();
            this.broadcastViews();
        }
    }
    pauseTimer() {
        if (this.remainingSeconds !== null && this.remainingSeconds > 0) {
            this.timerActive = false;
            this.timerPaused = true;
            // Do NOT clear remainingSeconds; freeze it exactly where it is!
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
            this.bumpRev();
            this.broadcastViews();
        }
    }
    resumeTimer() {
        if (this.remainingSeconds !== null && this.remainingSeconds > 0) {
            this.timerActive = true;
            this.timerPaused = false;
            this.startTimerCountdown();
            this.bumpRev();
            this.broadcastViews();
        }
    }
    setTimer(seconds, autoStart = true) {
        if (!this.isTimerApplicable())
            return;
        this.stopTimer();
        const validSecs = Math.max(5, Math.min(600, Math.round(seconds)));
        this.remainingSeconds = validSecs;
        if (autoStart) {
            this.timerActive = true;
            this.timerPaused = false;
            this.acceptingResponses = true;
            this.isClosing = false;
            this.startTimerCountdown();
        }
        else {
            this.timerActive = false;
            this.timerPaused = true;
        }
        this.bumpRev();
        this.broadcastViews();
    }
    resetTimer(seconds) {
        if (!this.isTimerApplicable())
            return;
        this.stopTimer();
        const secs = seconds !== undefined ? seconds : 30;
        this.remainingSeconds = Math.max(5, Math.min(600, Math.round(secs)));
        this.timerActive = false;
        this.timerPaused = true;
        this.bumpRev();
        this.broadcastViews();
    }
    extendTimer(seconds = 30) {
        if (!this.isTimerApplicable())
            return;
        if (this.remainingSeconds === null || this.remainingSeconds <= 0) {
            this.remainingSeconds = seconds;
        }
        else {
            this.remainingSeconds += seconds;
        }
        this.timerActive = true;
        this.timerPaused = false;
        this.acceptingResponses = true;
        this.isClosing = false;
        this.startTimerCountdown();
        this.bumpRev();
        this.broadcastViews();
    }
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.timerActive = false;
    }
    clearTimer() {
        this.stopTimer();
        this.timerPaused = false;
        this.remainingSeconds = null;
        this.bumpRev();
        this.broadcastViews();
    }
    // Facilitator Switches
    toggleAcceptingResponses(accepting) {
        const slide = this.getCurrentSlide();
        // Fairness rule for quiz
        if (slide?.type_id === 'quiz' && this.currentStep !== 'question') {
            return; // Cannot re-open quiz once reveal/stats reached
        }
        if (!accepting) {
            const closePolicy = slide?.settings.close_policy;
            if (closePolicy?.mode === 'grace') {
                const graceSeconds = closePolicy.grace_seconds || 5;
                this.isClosing = true;
                this.closeDeadlineMs = Date.now() + graceSeconds * 1000;
                this.bumpRev();
                this.broadcastViews();
                setTimeout(() => {
                    this.isClosing = false;
                    this.closeDeadlineMs = null;
                    this.acceptingResponses = false;
                    this.bumpRev();
                    this.broadcastViews();
                }, graceSeconds * 1000);
                return;
            }
        }
        this.acceptingResponses = accepting;
        this.isClosing = false;
        this.closeDeadlineMs = null;
        this.bumpRev();
        this.broadcastViews();
    }
    closeNow() {
        this.stopTimer();
        this.isClosing = false;
        this.closeDeadlineMs = null;
        this.acceptingResponses = false;
        this.bumpRev();
        this.broadcastViews();
    }
    toggleResultsVisibility(visible) {
        this.resultsVisibleOnProjector = visible;
        this.bumpRev();
        this.broadcastViews();
    }
    setBlanked(blanked) {
        this.isBlanked = blanked;
        this.bumpRev();
        this.broadcastViews();
    }
    setFrozen(frozen) {
        this.isFrozen = frozen;
        this.bumpRev();
        this.broadcastViews();
    }
    bumpRev() {
        this.rev += 1;
    }
    // Projector link token generator
    generateProjectorToken() {
        const token = generateId(24);
        this.projectorTokens.set(token, Date.now() + 60000); // 60s TTL
        return token;
    }
    validateProjectorToken(token) {
        const expiresAt = this.projectorTokens.get(token);
        if (!expiresAt)
            return false;
        this.projectorTokens.delete(token); // One-time token
        return Date.now() <= expiresAt;
    }
    // Slide Aggregates calculation
    getAggregatesForSlide(slide) {
        if (!this.presentationId)
            return null;
        if (slide.type_id === 'poll' || slide.type_id === 'quiz') {
            const responses = this.db.getResponsesForSlide(this.presentationId, slide.id);
            const totalCount = responses.length;
            const counts = {};
            const options = slide.content.options || [];
            for (const opt of options) {
                counts[opt.id] = 0;
            }
            for (const resp of responses) {
                try {
                    const payload = JSON.parse(resp.payload);
                    if (payload.option_id && counts[payload.option_id] !== undefined) {
                        counts[payload.option_id] += 1;
                    }
                }
                catch { }
            }
            const results = options.map((opt) => ({
                option_id: opt.id,
                count: counts[opt.id] || 0,
                percentage: totalCount > 0 ? Math.round(((counts[opt.id] || 0) / totalCount) * 100) : 0,
            }));
            return {
                total_responses: totalCount,
                options: results,
            };
        }
        else if (slide.type_id === 'wordcloud') {
            const responses = this.db.getResponsesForSlide(this.presentationId, slide.id);
            const wordCounts = {};
            for (const resp of responses) {
                try {
                    const payload = JSON.parse(resp.payload);
                    const raw = String(payload.text || payload.word || '').trim();
                    if (raw) {
                        const normalized = raw.toLowerCase();
                        wordCounts[normalized] = (wordCounts[normalized] || 0) + 1;
                    }
                }
                catch { }
            }
            const words = Object.entries(wordCounts)
                .map(([text, count]) => ({ text, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 50);
            return { words };
        }
        else if (slide.type_id === 'open') {
            const responses = this.db.getResponsesForSlide(this.presentationId, slide.id);
            const answers = responses.map((r) => {
                let text = '';
                try {
                    text = JSON.parse(r.payload).text || '';
                }
                catch { }
                return {
                    id: r.id,
                    text,
                    author: r.is_name_hidden ? `Participant ${r.participant_number}` : (r.participant_name || `Participant ${r.participant_number}`),
                    created_at: r.created_at,
                };
            });
            return { answers };
        }
        else if (slide.type_id === 'leaderboard') {
            const leaderboard = this.db.getLeaderboard(this.presentationId);
            const displayMode = slide.content.display_mode || 'top_5';
            const items = displayMode === 'top_5' ? leaderboard.slice(0, 5) : leaderboard;
            return { leaderboard: items };
        }
        else if (slide.type_id === 'qa') {
            const questions = this.db.getQAQuestions(this.presentationId, slide.id);
            return { questions };
        }
        return null;
    }
    // Build Projector View
    buildProjectorView(appUrl) {
        const effectiveAppUrl = appUrl || this.currentAppUrl || (process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : 'http://localhost:3000');
        const slide = this.getCurrentSlide();
        const active = this.getActiveCount();
        let answered = 0;
        let stored = 0;
        if (this.presentationId && slide) {
            const responses = this.db.getResponsesForSlide(this.presentationId, slide.id);
            answered = responses.length;
            stored = this.db.getAllResponsesForSlideAllPresentations(slide.id).length;
        }
        const state = !this.isLive
            ? 'lobby'
            : this.isBlanked
                ? 'blank'
                : this.isFrozen
                    ? 'frozen'
                    : 'live';
        return {
            type: 'view',
            rev: this.rev,
            audience: 'projector',
            join: {
                code: this.joinCode,
                url: `${effectiveAppUrl}/j/${this.joinCode}`,
                qr_payload: `${effectiveAppUrl}/j/${this.joinCode}`,
            },
            presentation: {
                state,
                title: this.activity.manifest.meta.name,
            },
            counters: {
                active,
                answered,
                stored: Math.max(answered, stored),
            },
            slide: slide
                ? {
                    id: slide.id,
                    type_id: slide.type_id,
                    step: this.currentStep,
                    timer_active: this.timerActive,
                    timer_paused: this.timerPaused,
                    remaining_ms: (this.timerActive || this.timerPaused) && this.remainingSeconds !== null
                        ? this.remainingSeconds * 1000
                        : null,
                    results_visible: this.resultsVisibleOnProjector,
                    content: slide.content,
                    aggregates: this.getAggregatesForSlide(slide),
                }
                : null,
            theme: this.activity.theme,
        };
    }
    // Build Participant View for a specific participant
    buildParticipantView(participantToken) {
        const slide = this.getCurrentSlide();
        const pRecord = participantToken ? this.db.getParticipantByToken(participantToken) : null;
        let answered = false;
        let answerSummary = null;
        if (this.presentationId && slide && pRecord) {
            const resp = this.db.findParticipantResponseForSlide(this.presentationId, pRecord.id, slide.id);
            if (resp) {
                answered = true;
                try {
                    const payload = JSON.parse(resp.payload);
                    answerSummary = {
                        submission_id: resp.submission_id,
                        summary: payload.option_id || payload.text || 'Answer submitted',
                        payload,
                    };
                }
                catch {
                    answerSummary = { submission_id: resp.submission_id, summary: 'Answer submitted' };
                }
            }
        }
        // Determine participant screen state
        let screen = 'wait';
        if (!this.isLive) {
            screen = 'wait';
        }
        else if (!slide) {
            screen = 'wait';
        }
        else if (slide.settings.participant_visibility === false || slide.type_id === 'welcome') {
            screen = 'main_screen';
        }
        else if (!this.acceptingResponses && !this.isClosing) {
            if (slide.type_id === 'poll' && this.currentStep === 'results') {
                screen = 'results';
            }
            else if (slide.type_id === 'quiz' && (this.currentStep === 'reveal' || this.currentStep === 'stats')) {
                screen = 'results';
            }
            else {
                screen = 'closed';
            }
        }
        else {
            // Accepting or closing grace
            if (slide.type_id === 'poll') {
                if (this.currentStep === 'question') {
                    screen = 'interact';
                }
                else {
                    screen = 'results';
                }
            }
            else if (slide.type_id === 'quiz') {
                if (this.currentStep === 'question') {
                    screen = 'interact';
                }
                else {
                    screen = 'results';
                }
            }
            else if (slide.type_id === 'open' || slide.type_id === 'wordcloud' || slide.type_id === 'qa') {
                screen = 'interact';
            }
            else {
                screen = 'main_screen';
            }
        }
        // Sanitize slide content for participants (never leak correct answer before reveal)
        let sanitizedContent = null;
        if (slide) {
            if (slide.type_id === 'quiz') {
                const qc = slide.content;
                sanitizedContent = {
                    question: qc.question,
                    options: qc.options,
                    points: qc.points,
                    // Hide correct_option_id and explanation until reveal
                    correct_option_id: this.currentStep !== 'question' ? qc.correct_option_id : undefined,
                    explanation: this.currentStep !== 'question' ? qc.explanation : undefined,
                };
            }
            else if (slide.type_id === 'poll') {
                sanitizedContent = {
                    question: slide.content.question,
                    options: slide.content.options,
                    aggregates: screen === 'results' ? this.getAggregatesForSlide(slide) : undefined,
                };
            }
            else if (slide.type_id === 'leaderboard') {
                sanitizedContent = {
                    title: slide.content.title,
                    leaderboard: this.db.getLeaderboard(this.presentationId || ''),
                };
            }
            else if (slide.type_id === 'qa') {
                sanitizedContent = {
                    title: slide.content.title,
                    questions: this.presentationId ? this.db.getQAQuestions(this.presentationId, slide.id) : [],
                };
            }
            else {
                sanitizedContent = slide.content;
            }
        }
        return {
            type: 'view',
            rev: this.rev,
            presentation: {
                state: this.isLive ? 'live' : 'ended',
                join_code: this.joinCode,
                title: this.activity.manifest.meta.name,
            },
            me: {
                id: pRecord ? pRecord.id : '',
                number: pRecord ? pRecord.participant_number : 0,
                name: pRecord ? pRecord.display_name : null,
                answered,
                answer: answerSummary,
            },
            slide: slide
                ? {
                    id: slide.id,
                    type_id: slide.type_id,
                    step: this.currentStep,
                    screen,
                    accepting: this.acceptingResponses,
                    closing: this.isClosing,
                    timer_active: this.timerActive,
                    timer_paused: this.timerPaused,
                    remaining_ms: (this.timerActive || this.timerPaused) && this.remainingSeconds !== null
                        ? this.remainingSeconds * 1000
                        : null,
                    content: sanitizedContent,
                }
                : null,
        };
    }
    // Broadcast views to all connected audiences
    broadcastViews() {
        // 1. Projector view
        if (this.projectorClients.size > 0) {
            const projView = JSON.stringify(this.buildProjectorView(this.currentAppUrl));
            for (const ws of this.projectorClients) {
                if (ws.readyState === WebSocket.OPEN) {
                    try {
                        ws.send(projView);
                    }
                    catch { }
                }
            }
        }
        // 2. Facilitator view
        if (this.facilitatorClients.size > 0) {
            const facState = JSON.stringify({
                type: 'facilitator_update',
                rev: this.rev,
                state: this.getFacilitatorState(),
            });
            for (const ws of this.facilitatorClients) {
                if (ws.readyState === WebSocket.OPEN) {
                    try {
                        ws.send(facState);
                    }
                    catch { }
                }
            }
        }
        // 3. Participant views
        for (const [ws, client] of this.participantClients.entries()) {
            if (ws.readyState === WebSocket.OPEN) {
                try {
                    const pView = JSON.stringify(this.buildParticipantView(client.token));
                    ws.send(pView);
                }
                catch { }
            }
        }
    }
    // Facilitator full state
    getFacilitatorState() {
        const slide = this.getCurrentSlide();
        const active = this.getActiveCount();
        let answered = 0;
        let stored = 0;
        let slideResponses = [];
        let slideAggregates = null;
        if (this.presentationId && slide) {
            slideResponses = this.db.getResponsesForSlide(this.presentationId, slide.id);
            answered = slideResponses.length;
            stored = this.db.getAllResponsesForSlideAllPresentations(slide.id).length;
            slideAggregates = this.getAggregatesForSlide(slide);
        }
        // Slide overview counts
        const slidesSummary = this.activity.slides.map((s, idx) => {
            const respCount = this.presentationId
                ? this.db.getAllResponsesForSlideAllPresentations(s.id).length
                : 0;
            return {
                id: s.id,
                index: idx,
                type_id: s.type_id,
                title: s.content.title || s.content.question || `Slide ${idx + 1}`,
                stored_responses: respCount,
                is_current: idx === this.currentSlideIndex,
                settings: s.settings,
            };
        });
        return {
            is_live: this.isLive,
            presentation_id: this.presentationId,
            activity_id: this.activity.manifest.meta.activity_id,
            activity_name: this.activity.manifest.meta.name,
            join_code: this.joinCode,
            join_mode: this.joinMode,
            participant_limit: this.participantLimit,
            current_slide_index: this.currentSlideIndex,
            current_step: this.currentStep,
            has_next_step: this.hasNextStep(),
            is_timer_applicable: this.isTimerApplicable(),
            accepting_responses: this.acceptingResponses,
            is_closing: this.isClosing,
            close_deadline_ms: this.closeDeadlineMs,
            timer_active: this.timerActive,
            timer_paused: this.timerPaused,
            remaining_seconds: this.remainingSeconds,
            results_visible_on_projector: this.resultsVisibleOnProjector,
            is_blanked: this.isBlanked,
            is_frozen: this.isFrozen,
            active_participants: active,
            answered_count: answered,
            stored_count: Math.max(answered, stored),
            current_slide: slide,
            current_slide_aggregates: slideAggregates,
            current_slide_responses: slideResponses,
            slides_summary: slidesSummary,
            qr_code: this.cachedQrCode,
            rev: this.rev,
        };
    }
}
export const defaultEngine = new PresentationEngine();
