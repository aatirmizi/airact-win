import express from 'express';
import { WebSocketServer } from 'ws';
import os from 'os';
import { defaultEngine } from './engine.js';
import { generateId, generate8CharPin, packageActivityToZip, unpackActivityFromZip, createSafetyBackup, } from './fileManager.js';
import { verifyHostPin, validateHostToken, updateHostPin, revokeHostToken, getSecurityStorageInfo, } from './hostSecurity.js';
import { getNetworkStatus, saveStoredSettings, recordTestPing, getTestPingStatus, generateQrDataUrl, } from './networkManager.js';
// Helper to get local private IPv4 addresses for intranet use
function getLocalIpAddresses() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] || []) {
            if (iface.family === 'IPv4' && !iface.internal) {
                addresses.push(iface.address);
            }
        }
    }
    // Sort real LAN addresses (192.168, 10., 172.) before link-local (169.254)
    addresses.sort((a, b) => {
        const aIsLan = a.startsWith('192.168.') || a.startsWith('10.') || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(a);
        const bIsLan = b.startsWith('192.168.') || b.startsWith('10.') || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(b);
        if (aIsLan && !bIsLan)
            return -1;
        if (!aIsLan && bIsLan)
            return 1;
        return 0;
    });
    return addresses;
}
// Helper to determine canonical public or LAN app URL
function getAppBaseUrl(req) {
    // If APP_URL environment variable is set (e.g. on Cloud Run / AI Studio), always use it
    if (process.env.APP_URL && process.env.APP_URL.startsWith('http')) {
        return process.env.APP_URL.replace(/\/$/, '');
    }
    const reqHost = req ? (req.get ? req.get('host') : (req.headers ? req.headers.host : undefined)) : undefined;
    const status = getNetworkStatus(reqHost);
    if (status.activeUrl && !status.activeUrl.includes('localhost')) {
        return status.activeUrl;
    }
    if (req) {
        const headers = req.headers || req.headers;
        const proto = headers['x-forwarded-proto'] || req.protocol || 'http';
        const host = req.get ? req.get('host') : headers.host;
        if (host) {
            return `${proto}://${host}`.replace(/\/$/, '');
        }
    }
    const port = process.env.PORT || 3000;
    return status.activeUrl || `http://localhost:${port}`;
}
export function createApiRouter(engine = defaultEngine) {
    const router = express.Router();
    // Helper to extract participant token
    const getParticipantToken = (req) => {
        return (req.headers['x-participant-token'] ||
            (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : null) ||
            req.query.token ||
            null);
    };
    // Middleware requiring a valid Host session token
    const requireFacilitatorAuth = (req, res, next) => {
        const token = req.headers['x-facilitator-token'] ||
            (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : null) ||
            req.query.fac_token;
        if (token && validateHostToken(String(token))) {
            return next();
        }
        return res.status(401).json({
            error: 'Access Restricted: Valid Host PIN authorization required.',
            requiresAuth: true,
        });
    };
    // -------------------------------------------------------------
    // PARTICIPANT ROUTES
    // -------------------------------------------------------------
    // Join activity
    router.post('/p/join', async (req, res) => {
        const { proto = 1, code, display_name } = req.body;
        if (!engine.isLive) {
            return res.status(200).json({
                status: 'refused',
                code: 'not_live',
                message_key: 'presentation_not_live',
                rev: engine.rev,
            });
        }
        if (!code || String(code).trim().toUpperCase() !== engine.joinCode.toUpperCase()) {
            return res.status(200).json({
                status: 'refused',
                code: 'join_code_invalid',
                message_key: 'invalid_join_code',
                rev: engine.rev,
            });
        }
        let finalDisplayName = display_name || null;
        // Roster Join Mode Authentication
        if (engine.joinMode === 'roster') {
            const { user_id, pin } = req.body;
            if (!user_id || !pin) {
                return res.status(200).json({
                    status: 'refused',
                    code: 'roster_auth_required',
                    message_key: 'Please enter both Participant ID and PIN',
                    rev: engine.rev,
                });
            }
            const cleanPin = String(pin).trim().toUpperCase();
            // Enforce 8 characters: 4 letters + 4 numbers (e.g. ALEX4821)
            const pinPattern = /^[A-Z]{4}[0-9]{4}$/;
            if (!pinPattern.test(cleanPin)) {
                return res.status(200).json({
                    status: 'refused',
                    code: 'invalid_pin_format',
                    message_key: 'PIN must be exactly 8 characters: 4 letters followed by 4 digits (e.g. ALEX4821)',
                    rev: engine.rev,
                });
            }
            const roster = engine.activity.roster || [];
            const member = roster.find((r) => r.id.trim().toUpperCase() === String(user_id).trim().toUpperCase() &&
                r.pin.trim().toUpperCase() === cleanPin);
            if (!member) {
                return res.status(200).json({
                    status: 'refused',
                    code: 'roster_auth_failed',
                    message_key: 'Invalid Participant ID or PIN. Please check your credentials.',
                    rev: engine.rev,
                });
            }
            finalDisplayName = member.name;
        }
        // Check existing token or generate new one
        let token = getParticipantToken(req);
        let existingParticipant = token ? engine.db.getParticipantByToken(token) : null;
        if (!existingParticipant) {
            const activeCount = engine.getActiveCount();
            if (activeCount >= engine.participantLimit) {
                return res.status(200).json({
                    status: 'refused',
                    code: 'activity_full',
                    message_key: 'activity_full',
                    rev: engine.rev,
                });
            }
            // Mint new participant
            token = generateId(32);
            const allParticipants = engine.db.getParticipants(engine.presentationId);
            const nextNumber = allParticipants.length + 1;
            const participantId = generateId(16);
            engine.db.upsertParticipant(participantId, engine.presentationId, nextNumber, token, finalDisplayName);
            existingParticipant = engine.db.getParticipantByToken(token);
        }
        else if (finalDisplayName && finalDisplayName !== existingParticipant.display_name) {
            engine.db.updateParticipantName(token, finalDisplayName);
            existingParticipant = engine.db.getParticipantByToken(token);
        }
        return res.status(200).json({
            status: 'accepted',
            code: null,
            rev: engine.rev,
            token,
            participant: {
                id: existingParticipant.id,
                number: existingParticipant.participant_number,
                display_name: existingParticipant.display_name,
            },
            join_mode: engine.joinMode,
        });
    });
    // Participant View (reconcile / fallback)
    router.get('/p/view', (req, res) => {
        const token = getParticipantToken(req);
        const view = engine.buildParticipantView(token || undefined);
        return res.status(200).json(view);
    });
    // Participant Submit response (Normative 12-check pipeline)
    router.post('/p/submit', (req, res) => {
        const { proto = 1, submission_id, slide_id, step, payload } = req.body;
        const token = getParticipantToken(req);
        // 1. Check size limit
        if (JSON.stringify(req.body).length > 16384) {
            return res.status(413).json({ status: 'error', code: 'too_large' });
        }
        // 2. Well-formed check
        if (!submission_id || !slide_id || !payload) {
            return res.status(400).json({ status: 'error', code: 'bad_request' });
        }
        // 3. Participant token check
        if (!token) {
            return res.status(401).json({ status: 'error', code: 'unauthorized' });
        }
        const participant = engine.db.getParticipantByToken(token);
        if (!participant) {
            return res.status(401).json({ status: 'error', code: 'unauthorized' });
        }
        // 4. Participant removed check
        if (participant.is_removed) {
            return res.status(403).json({ status: 'error', code: 'removed' });
        }
        // 6. Idempotency lookup
        const existing = engine.db.findExistingSubmission(engine.presentationId || '', participant.id, submission_id);
        if (existing) {
            try {
                const storedPayload = JSON.parse(existing.payload);
                if (JSON.stringify(storedPayload) === JSON.stringify(payload) && existing.slide_id === slide_id) {
                    return res.status(200).json({
                        status: 'duplicate',
                        code: null,
                        submission_id,
                        me: { answered: true },
                        rev: engine.rev,
                    });
                }
                else {
                    return res.status(200).json({
                        status: 'refused',
                        code: 'id_conflict',
                        submission_id,
                        rev: engine.rev,
                    });
                }
            }
            catch { }
        }
        // 7. Live check
        if (!engine.isLive || !engine.presentationId) {
            return res.status(200).json({
                status: 'refused',
                code: 'not_live',
                submission_id,
                rev: engine.rev,
            });
        }
        // 8. Current slide and step check (or grace window open)
        const currentSlide = engine.getCurrentSlide();
        if (!currentSlide || currentSlide.id !== slide_id) {
            return res.status(200).json({
                status: 'refused',
                code: 'not_current',
                submission_id,
                rev: engine.rev,
            });
        }
        // 9. Accepting responses and close check
        if (!engine.acceptingResponses && !engine.isClosing) {
            return res.status(200).json({
                status: 'refused',
                code: 'closed',
                submission_id,
                rev: engine.rev,
            });
        }
        // 10. Response rule check
        const existingAnswer = engine.db.findParticipantResponseForSlide(engine.presentationId, participant.id, slide_id);
        const rule = currentSlide.settings.response_rule || 'one_per_participant';
        if (existingAnswer && rule === 'one_per_participant' && currentSlide.type_id !== 'qa') {
            return res.status(200).json({
                status: 'refused',
                code: 'already_answered',
                submission_id,
                rev: engine.rev,
            });
        }
        // 11. Slide-specific payload logic & scoring
        let isCorrect = null;
        let score = 0;
        let speedBonus = 0;
        const responseTimeMs = Date.now() - engine.stepOpenedAt;
        if (currentSlide.type_id === 'quiz') {
            const qc = currentSlide.content;
            isCorrect = payload.option_id === qc.correct_option_id;
            if (isCorrect) {
                score = qc.points || 100;
                // Speed bonus formula from PRODUCT_SPEC.md section 5:
                // floor(points * 0.5 * remaining_time / time_limit)
                const timeLimit = currentSlide.settings.timer_seconds || 30;
                const remainingSeconds = engine.remainingSeconds || 0;
                if (currentSlide.settings.speed_bonus || engine.activity.settings.speed_bonus_enabled) {
                    speedBonus = Math.floor(score * 0.5 * (remainingSeconds / timeLimit));
                }
            }
        }
        else if (currentSlide.type_id === 'qa') {
            // Question submission in Q&A
            const qText = String(payload.question || '').trim();
            if (!qText) {
                return res.status(200).json({ status: 'refused', code: 'invalid', submission_id });
            }
            const qId = generateId(16);
            engine.db.addQAQuestion(qId, engine.presentationId, slide_id, participant.id, participant.is_name_hidden ? `Participant ${participant.participant_number}` : (participant.display_name || `Participant ${participant.participant_number}`), qText);
        }
        // 12. Durable commit in SQLite
        const responseId = generateId(16);
        engine.db.saveResponse(responseId, engine.presentationId, slide_id, step || engine.currentStep, participant.id, submission_id, payload, isCorrect, score, speedBonus, responseTimeMs);
        // Bump rev and notify audience
        engine.bumpRev();
        engine.broadcastViews();
        return res.status(200).json({
            status: 'accepted',
            code: null,
            submission_id,
            me: { answered: true },
            rev: engine.rev,
        });
    });
    // Upvote Q&A Question
    router.post('/p/qa/upvote', (req, res) => {
        const { question_id } = req.body;
        const token = getParticipantToken(req);
        if (!token)
            return res.status(401).json({ error: 'unauthorized' });
        const participant = engine.db.getParticipantByToken(token);
        if (!participant)
            return res.status(401).json({ error: 'unauthorized' });
        const isUpvoted = engine.db.upvoteQAQuestion(question_id, participant.id);
        engine.bumpRev();
        engine.broadcastViews();
        return res.json({ success: true, upvoted: isUpvoted });
    });
    // -------------------------------------------------------------
    // PROJECTOR ROUTES
    // -------------------------------------------------------------
    // Mint one-time projector token
    router.get('/projector/token', (_req, res) => {
        const token = engine.generateProjectorToken();
        return res.json({ token });
    });
    // Network & Intranet info endpoint
    router.get('/system/network-info', (req, res) => {
        const reqHost = req.get('host');
        const status = getNetworkStatus(reqHost);
        engine.setAppUrl(status.activeUrl);
        return res.json({
            appUrl: status.activeUrl,
            localIps: status.interfaces.map((i) => i.address),
            port: status.port,
            isCloud: status.isCloud,
            storedConnectionMissing: status.storedConnectionMissing,
            missingDetails: status.missingDetails,
        });
    });
    // Comprehensive Network Interfaces & Priority Helper Endpoint
    router.get('/system/network-interfaces', (req, res) => {
        const reqHost = req.get('host');
        const status = getNetworkStatus(reqHost);
        return res.json(status);
    });
    // Save chosen network connection (interface or custom URL)
    router.post('/system/network-interfaces/save', requireFacilitatorAuth, async (req, res) => {
        const { mode, selectedInterfaceName, selectedAddress, customUrl } = req.body;
        const port = Number(process.env.PORT || 3000);
        if (mode === 'custom' && (!customUrl || !customUrl.trim().startsWith('http'))) {
            return res.status(400).json({ error: 'Please enter a valid URL starting with http:// or https://' });
        }
        const saved = saveStoredSettings({
            mode: mode || 'auto',
            selectedInterfaceName: selectedInterfaceName || undefined,
            selectedAddress: selectedAddress || undefined,
            customUrl: customUrl ? customUrl.trim() : undefined,
            port,
        });
        if (!saved) {
            return res.status(500).json({ error: 'Failed to persist network settings to disk' });
        }
        const status = getNetworkStatus(req.get('host'));
        await engine.setAppUrl(status.activeUrl, true);
        return res.json({
            success: true,
            activeUrl: status.activeUrl,
            status,
        });
    });
    // Generate QR Code for arbitrary URL (for connection testing)
    router.post('/system/network-test/qr', async (req, res) => {
        const { url } = req.body;
        if (!url || typeof url !== 'string') {
            return res.status(400).json({ error: 'Invalid URL provided' });
        }
        const qrDataUrl = await generateQrDataUrl(url);
        return res.json({ qrDataUrl });
    });
    // Mobile Phone Ping endpoint (hit when phone visits /test-connection)
    router.post('/system/network-test/ping', (req, res) => {
        const { sessionId, userAgent } = req.body;
        if (!sessionId) {
            return res.status(400).json({ error: 'sessionId is required' });
        }
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
        recordTestPing(sessionId, clientIp, userAgent || req.headers['user-agent']);
        return res.json({
            success: true,
            timestamp: Date.now(),
            clientIp,
        });
    });
    // Facilitator status poll for phone connection
    router.get('/system/network-test/status', (req, res) => {
        const sessionId = req.query.session;
        if (!sessionId) {
            return res.json({ connected: false });
        }
        const result = getTestPingStatus(sessionId);
        return res.json(result);
    });
    // Get Projector View
    router.get('/projector/view', (req, res) => {
        const appUrl = getAppBaseUrl(req);
        engine.setAppUrl(appUrl);
        const view = engine.buildProjectorView(appUrl);
        return res.json(view);
    });
    // -------------------------------------------------------------
    // FACILITATOR & PRESENTATION CONTROL ROUTES (Restricted to localhost / authorized facilitator)
    // -------------------------------------------------------------
    // Host PIN Verification endpoint (Rate-limited, brute-force protected)
    router.post('/auth/verify-host', (req, res) => {
        const rawIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || req.socket.remoteAddress || '127.0.0.1';
        const { pin } = req.body;
        const result = verifyHostPin(pin, rawIp);
        if (result.success) {
            return res.json({ success: true, token: result.token });
        }
        return res.status(401).json(result);
    });
    // Check if current token is valid
    router.get('/auth/check-host', (req, res) => {
        const token = req.headers['x-facilitator-token'] ||
            (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : null) ||
            req.query.fac_token;
        const isValid = validateHostToken(String(token || ''));
        return res.json({ authenticated: isValid });
    });
    // Change Host PIN from within running app
    router.post('/auth/change-pin', requireFacilitatorAuth, (req, res) => {
        const { currentPin, newPin } = req.body;
        const result = updateHostPin(currentPin, newPin);
        if (result.success) {
            return res.json({ success: true, message: 'Host PIN successfully updated.' });
        }
        return res.status(400).json({ success: false, error: result.error });
    });
    // Log out current Host session
    router.post('/auth/logout-host', (req, res) => {
        const token = req.headers['x-facilitator-token'] ||
            (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : null) ||
            req.query.fac_token;
        if (token) {
            revokeHostToken(String(token));
        }
        return res.json({ success: true });
    });
    // Server security storage info (safe path info for facilitator recovery)
    router.get('/auth/security-info', requireFacilitatorAuth, (_req, res) => {
        return res.json(getSecurityStorageInfo());
    });
    // Roster endpoints
    router.get('/activity/roster', requireFacilitatorAuth, (_req, res) => {
        return res.json(engine.activity.roster || []);
    });
    router.post('/activity/roster', requireFacilitatorAuth, (req, res) => {
        const { roster } = req.body;
        if (Array.isArray(roster)) {
            const formatted = roster.map((item) => {
                let pin = String(item.pin || '').trim().toUpperCase();
                if (!/^[A-Z]{4}[0-9]{4}$/.test(pin)) {
                    pin = generate8CharPin();
                }
                return {
                    id: String(item.id || '').trim(),
                    name: String(item.name || '').trim(),
                    pin,
                };
            });
            engine.activity.roster = formatted;
            engine.activity.manifest.has_roster = formatted.length > 0;
            engine.db.setRoster(formatted);
            engine.bumpRev();
            return res.json({ success: true, roster: formatted });
        }
        return res.status(400).json({ error: 'Invalid roster data' });
    });
    router.post('/activity/roster/import-csv', requireFacilitatorAuth, (req, res) => {
        const csvText = req.body.csvText || req.body.csv;
        if (!csvText)
            return res.status(400).json({ error: 'No CSV content provided' });
        const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 1)
            return res.status(400).json({ error: 'Empty CSV file' });
        const parsed = [];
        const firstLine = lines[0].toLowerCase();
        const hasHeader = firstLine.includes('id') || firstLine.includes('name');
        const startIdx = hasHeader ? 1 : 0;
        for (let i = startIdx; i < lines.length; i++) {
            const parts = lines[i].split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
            if (parts.length >= 2 && parts[0]) {
                let pin = parts[2] ? parts[2].toUpperCase() : '';
                if (!/^[A-Z]{4}[0-9]{4}$/.test(pin)) {
                    pin = generate8CharPin();
                }
                parsed.push({
                    id: parts[0],
                    name: parts[1] || `Participant ${parts[0]}`,
                    pin,
                });
            }
        }
        engine.activity.roster = parsed;
        engine.activity.manifest.has_roster = parsed.length > 0;
        engine.db.setRoster(parsed);
        engine.bumpRev();
        return res.json({ success: true, count: parsed.length, roster: parsed });
    });
    router.get('/activity/roster/export-csv', requireFacilitatorAuth, (_req, res) => {
        const roster = engine.activity.roster || [];
        let csv = 'ID,Name,PIN\n';
        for (const r of roster) {
            csv += `"${r.id.replace(/"/g, '""')}","${r.name.replace(/"/g, '""')}",${r.pin}\n`;
        }
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="airact_roster.csv"');
        return res.send(csv);
    });
    router.get('/facilitator/state', requireFacilitatorAuth, (_req, res) => {
        return res.json(engine.getFacilitatorState());
    });
    router.get('/activity', requireFacilitatorAuth, (_req, res) => {
        return res.json(engine.activity);
    });
    router.put('/activity', requireFacilitatorAuth, (req, res) => {
        const updated = req.body;
        if (updated.manifest && updated.slides) {
            engine.activity = updated;
            engine.bumpRev();
            engine.broadcastViews();
            return res.json({ success: true, activity: engine.activity });
        }
        return res.status(400).json({ error: 'Invalid activity data' });
    });
    // Presentation controls
    router.post('/presentation/start', requireFacilitatorAuth, async (req, res) => {
        const { startIndex = 0, joinMode = 'anonymous', limit = 200 } = req.body;
        const appUrl = getAppBaseUrl(req);
        engine.setAppUrl(appUrl);
        const code = await engine.startPresentation(startIndex, joinMode, limit, appUrl);
        return res.json({ success: true, join_code: code, state: engine.getFacilitatorState() });
    });
    router.post('/presentation/end', requireFacilitatorAuth, (_req, res) => {
        engine.endPresentation();
        return res.json({ success: true, state: engine.getFacilitatorState() });
    });
    router.post('/presentation/next-step', requireFacilitatorAuth, (_req, res) => {
        engine.nextStep();
        return res.json({ success: true, state: engine.getFacilitatorState() });
    });
    router.post('/presentation/prev-step', requireFacilitatorAuth, (_req, res) => {
        engine.prevStep();
        return res.json({ success: true, state: engine.getFacilitatorState() });
    });
    router.post('/presentation/next-slide', requireFacilitatorAuth, (_req, res) => {
        engine.nextSlide();
        return res.json({ success: true, state: engine.getFacilitatorState() });
    });
    router.post('/presentation/prev-slide', requireFacilitatorAuth, (_req, res) => {
        engine.prevSlide();
        return res.json({ success: true, state: engine.getFacilitatorState() });
    });
    router.post('/presentation/goto-slide', requireFacilitatorAuth, (req, res) => {
        const { index } = req.body;
        engine.goToSlide(Number(index));
        return res.json({ success: true, state: engine.getFacilitatorState() });
    });
    router.post('/presentation/toggle-accepting', requireFacilitatorAuth, (req, res) => {
        const { accepting } = req.body;
        engine.toggleAcceptingResponses(Boolean(accepting));
        return res.json({ success: true, state: engine.getFacilitatorState() });
    });
    router.post('/presentation/close-now', requireFacilitatorAuth, (_req, res) => {
        engine.closeNow();
        return res.json({ success: true, state: engine.getFacilitatorState() });
    });
    router.post('/presentation/timer/pause', requireFacilitatorAuth, (_req, res) => {
        engine.pauseTimer();
        return res.json({ success: true, state: engine.getFacilitatorState() });
    });
    router.post('/presentation/timer/resume', requireFacilitatorAuth, (_req, res) => {
        engine.resumeTimer();
        return res.json({ success: true, state: engine.getFacilitatorState() });
    });
    router.post('/presentation/timer/set', requireFacilitatorAuth, (req, res) => {
        const { seconds = 30, autoStart = true } = req.body;
        engine.setTimer(Number(seconds), Boolean(autoStart));
        return res.json({ success: true, state: engine.getFacilitatorState() });
    });
    router.post('/presentation/timer/reset', requireFacilitatorAuth, (req, res) => {
        const { seconds = 30 } = req.body;
        engine.resetTimer(Number(seconds));
        return res.json({ success: true, state: engine.getFacilitatorState() });
    });
    router.post('/presentation/timer/clear', requireFacilitatorAuth, (_req, res) => {
        engine.clearTimer();
        return res.json({ success: true, state: engine.getFacilitatorState() });
    });
    router.post('/presentation/timer/extend', requireFacilitatorAuth, (req, res) => {
        const { seconds = 30 } = req.body;
        engine.extendTimer(Number(seconds));
        return res.json({ success: true, state: engine.getFacilitatorState() });
    });
    router.post('/presentation/toggle-results', requireFacilitatorAuth, (req, res) => {
        const { visible } = req.body;
        engine.toggleResultsVisibility(Boolean(visible));
        return res.json({ success: true, state: engine.getFacilitatorState() });
    });
    router.post('/presentation/blank', requireFacilitatorAuth, (req, res) => {
        const { blanked } = req.body;
        engine.setBlanked(Boolean(blanked));
        return res.json({ success: true, state: engine.getFacilitatorState() });
    });
    router.post('/presentation/freeze', requireFacilitatorAuth, (req, res) => {
        const { frozen } = req.body;
        engine.setFrozen(Boolean(frozen));
        return res.json({ success: true, state: engine.getFacilitatorState() });
    });
    // Participant management
    router.post('/presentation/participant/remove', requireFacilitatorAuth, (req, res) => {
        const { participantId } = req.body;
        engine.db.removeParticipant(participantId);
        // Find socket and close it with code 4002 (removed)
        for (const [ws, client] of engine.participantClients.entries()) {
            if (client.participantId === participantId) {
                try {
                    ws.send(JSON.stringify({ type: 'bye', code: 'removed', retry: false }));
                    ws.close(4002, 'You have been removed');
                }
                catch { }
            }
        }
        engine.bumpRev();
        engine.broadcastViews();
        return res.json({ success: true });
    });
    router.post('/presentation/participant/hide-name', requireFacilitatorAuth, (req, res) => {
        const { participantId, hide } = req.body;
        engine.db.hideParticipantName(participantId, Boolean(hide));
        engine.bumpRev();
        engine.broadcastViews();
        return res.json({ success: true });
    });
    // Q&A moderation
    router.post('/presentation/qa/status', requireFacilitatorAuth, (req, res) => {
        const { questionId, status } = req.body;
        engine.db.updateQAStatus(questionId, status);
        engine.bumpRev();
        engine.broadcastViews();
        return res.json({ success: true });
    });
    // Reset slide or entire activity (with safety copy)
    router.post('/activity/reset-slide', requireFacilitatorAuth, (req, res) => {
        const { slideId } = req.body;
        const dbBuf = engine.db.getDatabaseBuffer();
        createSafetyBackup(engine.activity, dbBuf);
        engine.db.resetSlideData(engine.presentationId, slideId);
        engine.bumpRev();
        engine.broadcastViews();
        return res.json({ success: true, message: 'Slide responses reset with safety backup created' });
    });
    router.post('/activity/reset-all', requireFacilitatorAuth, (_req, res) => {
        if (engine.isLive) {
            return res.status(400).json({ error: 'Cannot reset all data while Live' });
        }
        const dbBuf = engine.db.getDatabaseBuffer();
        createSafetyBackup(engine.activity, dbBuf);
        engine.db.resetAllData();
        engine.bumpRev();
        engine.broadcastViews();
        return res.json({ success: true, message: 'All response data reset with safety backup created' });
    });
    // Import / Export .actvty file
    router.get('/activity/export-actvty', requireFacilitatorAuth, async (_req, res) => {
        try {
            const dbBuf = engine.db.getDatabaseBuffer();
            const zipBuffer = await packageActivityToZip(engine.activity, dbBuf);
            const filename = `${engine.activity.manifest.meta.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.actvty`;
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            return res.send(zipBuffer);
        }
        catch (err) {
            return res.status(500).json({ error: err.message });
        }
    });
    router.post('/activity/import-actvty', requireFacilitatorAuth, express.raw({ type: '*/*', limit: '50mb' }), async (req, res) => {
        try {
            const buffer = req.body;
            const { activity } = await unpackActivityFromZip(buffer);
            engine.activity = activity;
            engine.bumpRev();
            engine.broadcastViews();
            return res.json({ success: true, activity });
        }
        catch (err) {
            return res.status(400).json({ error: 'Failed to unpack .actvty file: ' + err.message });
        }
    });
    // Report Export (HTML, CSV)
    router.get('/activity/export-report', requireFacilitatorAuth, (req, res) => {
        const format = req.query.format || 'html';
        const slide = engine.getCurrentSlide();
        const slidesData = engine.activity.slides.map((s, idx) => {
            const responses = engine.presentationId ? engine.db.getResponsesForSlide(engine.presentationId, s.id) : [];
            return {
                slide: s,
                index: idx + 1,
                responses,
                aggregates: engine.getAggregatesForSlide(s),
            };
        });
        if (format === 'csv') {
            let csv = 'Slide Number,Slide Title,Type,Total Responses\n';
            for (const item of slidesData) {
                const title = item.slide.content.title || item.slide.content.question || '';
                csv += `${item.index},"${title.replace(/"/g, '""')}",${item.slide.type_id},${item.responses.length}\n`;
            }
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="presentation_report.csv"');
            return res.send(csv);
        }
        // Default: Clean HTML report with provenance block
        const now = new Date().toISOString();
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Presentation Report - ${engine.activity.manifest.meta.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 900px; margin: 40px auto; padding: 20px; color: #1e293b; background: #f8fafc; }
          .card { background: #fff; padding: 24px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; background: #e0e7ff; color: #4338ca; font-size: 12px; font-weight: 600; }
          h1 { margin-top: 0; color: #0f172a; }
          .provenance { font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e2e8f0; }
          th { background: #f1f5f9; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>${engine.activity.manifest.meta.name}</h1>
          <p><strong>Total Slides:</strong> ${engine.activity.slides.length} &nbsp;|&nbsp; <strong>Join Mode:</strong> ${engine.joinMode} &nbsp;|&nbsp; <strong>Export Date:</strong> ${now}</p>
        </div>

        ${slidesData.map((d) => `
          <div class="card">
            <span class="badge">Slide ${d.index} · ${d.slide.type_id.toUpperCase()}</span>
            <h3>${d.slide.content.title || d.slide.content.question || 'Slide'}</h3>
            <p><strong>Stored Responses:</strong> ${d.responses.length}</p>
            ${d.aggregates && d.aggregates.options ? `
              <table>
                <thead>
                  <tr><th>Option</th><th>Votes</th><th>Percentage</th></tr>
                </thead>
                <tbody>
                  ${d.aggregates.options.map((opt) => {
            const optText = d.slide.content.options?.find((o) => o.id === opt.option_id)?.text || opt.option_id;
            return `<tr><td>${optText}</td><td>${opt.count}</td><td>${opt.percentage}%</td></tr>`;
        }).join('')}
                </tbody>
              </table>
            ` : ''}
          </div>
        `).join('')}

        <div class="card provenance">
          <strong>Provenance:</strong> Generated by AirAct Interactive Presentations v1.0.0. All percentages calculated from active participants at step conclusion.
        </div>
      </body>
      </html>
    `;
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
    });
    return router;
}
// Attach WebSockets to server
export function setupWebSocketServer(server, engine = defaultEngine) {
    const wss = new WebSocketServer({ noServer: true });
    server.on('upgrade', (req, socket, head) => {
        const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
        const pathname = url.pathname;
        if (pathname === '/ws/p' || pathname === '/ws/projector' || pathname === '/ws/facilitator') {
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('connection', ws, req, pathname);
            });
        }
        else {
            socket.destroy();
        }
    });
    wss.on('connection', (ws, req, pathname) => {
        const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
        if (pathname === '/ws/facilitator') {
            const facToken = url.searchParams.get('token');
            if (!facToken || !validateHostToken(facToken)) {
                ws.send(JSON.stringify({ type: 'error', error: 'Unauthorized Facilitator Token' }));
                ws.close(4401, 'Unauthorized Facilitator');
                return;
            }
            engine.facilitatorClients.add(ws);
            // Send initial state immediately
            ws.send(JSON.stringify({
                type: 'facilitator_update',
                rev: engine.rev,
                state: engine.getFacilitatorState(),
            }));
            ws.on('message', (data) => {
                try {
                    const msg = JSON.parse(data.toString());
                    if (msg.type === 'ping')
                        ws.send(JSON.stringify({ type: 'pong' }));
                }
                catch { }
            });
            ws.on('close', () => {
                engine.facilitatorClients.delete(ws);
            });
        }
        else if (pathname === '/ws/projector') {
            engine.projectorClients.add(ws);
            const appUrl = getAppBaseUrl(req);
            engine.setAppUrl(appUrl);
            ws.send(JSON.stringify(engine.buildProjectorView(appUrl)));
            ws.on('message', (data) => {
                try {
                    const msg = JSON.parse(data.toString());
                    if (msg.type === 'hello') {
                        ws.send(JSON.stringify(engine.buildProjectorView(appUrl)));
                    }
                    else if (msg.type === 'next-step') {
                        engine.nextStep();
                    }
                    else if (msg.type === 'prev-step') {
                        engine.prevStep();
                    }
                    else if (msg.type === 'next-slide') {
                        engine.nextSlide();
                    }
                    else if (msg.type === 'prev-slide') {
                        engine.prevSlide();
                    }
                    else if (msg.type === 'freeze') {
                        engine.setFrozen(msg.frozen !== undefined ? Boolean(msg.frozen) : !engine.isFrozen);
                    }
                    else if (msg.type === 'blank') {
                        engine.setBlanked(msg.blanked !== undefined ? Boolean(msg.blanked) : !engine.isBlanked);
                    }
                    else if (msg.type === 'aspect-ratio' || msg.type === 'set-aspect-ratio') {
                        if (msg.aspectRatio)
                            engine.setAspectRatio(msg.aspectRatio);
                    }
                }
                catch { }
            });
            ws.on('close', () => {
                engine.projectorClients.delete(ws);
            });
        }
        else if (pathname === '/ws/p') {
            const token = url.searchParams.get('token') || undefined;
            const client = {
                ws,
                token,
                participantId: token ? engine.db.getParticipantByToken(token)?.id : undefined,
                lastPong: Date.now(),
            };
            engine.participantClients.set(ws, client);
            // Send initial view
            ws.send(JSON.stringify(engine.buildParticipantView(token)));
            ws.on('pong', () => {
                client.lastPong = Date.now();
            });
            ws.on('message', (data) => {
                try {
                    const msg = JSON.parse(data.toString());
                    if (msg.type === 'hello') {
                        if (msg.token && !client.token) {
                            client.token = msg.token;
                            client.participantId = engine.db.getParticipantByToken(msg.token)?.id;
                        }
                        client.lastPong = Date.now();
                        ws.send(JSON.stringify(engine.buildParticipantView(client.token)));
                    }
                }
                catch { }
            });
            ws.on('close', () => {
                engine.participantClients.delete(ws);
                engine.checkActiveParticipants();
            });
        }
    });
    return wss;
}
