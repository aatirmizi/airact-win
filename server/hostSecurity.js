import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, '../data');
const SECURITY_FILE = path.join(DATA_DIR, 'host-security.json');
// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
const SESSIONS_FILE = path.join(DATA_DIR, 'host-sessions.json');
function loadSessions() {
    const map = new Map();
    try {
        if (fs.existsSync(SESSIONS_FILE)) {
            const content = fs.readFileSync(SESSIONS_FILE, 'utf-8');
            const data = JSON.parse(content);
            const now = Date.now();
            if (Array.isArray(data)) {
                for (const item of data) {
                    if (item && item.token && typeof item.expiresAt === 'number' && item.expiresAt > now) {
                        map.set(item.token, item);
                    }
                }
            }
        }
    }
    catch (err) {
        console.error('Error reading host-sessions.json, starting with clean session store:', err);
    }
    return map;
}
function saveSessions(sessionsMap) {
    try {
        const now = Date.now();
        const list = Array.from(sessionsMap.values()).filter((s) => s.expiresAt > now);
        fs.writeFileSync(SESSIONS_FILE, JSON.stringify(list, null, 2), 'utf-8');
    }
    catch (err) {
        console.error('Failed to write host-sessions.json:', err);
    }
}
const activeSessions = loadSessions();
const rateLimitMap = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const WINDOW_DURATION_MS = 10 * 60 * 1000; // 10 minutes window
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
/**
 * Initializes or loads the security config from /data/host-security.json
 */
export function getSecurityConfig() {
    try {
        if (fs.existsSync(SECURITY_FILE)) {
            const content = fs.readFileSync(SECURITY_FILE, 'utf-8');
            const parsed = JSON.parse(content);
            if (parsed && typeof parsed.host_pin === 'string' && parsed.host_pin.trim().length > 0) {
                return parsed;
            }
        }
    }
    catch (err) {
        console.error('Error reading host-security.json, will regenerate fallback:', err);
    }
    // Fallback / initial creation
    const initialPin = (process.env.HOST_PIN || '8842').trim();
    const config = {
        host_pin: initialPin,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        note: 'This file stores the AirAct Facilitator / Host PIN. You can change it in the app or edit host_pin here directly.',
    };
    try {
        fs.writeFileSync(SECURITY_FILE, JSON.stringify(config, null, 2), 'utf-8');
    }
    catch (err) {
        console.error('Failed to write host-security.json:', err);
    }
    return config;
}
/**
 * Check if an IP address is currently locked out from PIN attempts
 */
export function checkRateLimit(ip) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry) {
        return { isLocked: false, waitSeconds: 0 };
    }
    if (entry.lockedUntil > now) {
        const waitSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
        return { isLocked: true, waitSeconds };
    }
    // Reset if window has elapsed
    if (now - entry.firstAttemptAt > WINDOW_DURATION_MS) {
        rateLimitMap.delete(ip);
    }
    return { isLocked: false, waitSeconds: 0 };
}
/**
 * Record a failed attempt from an IP address
 */
export function recordFailedAttempt(ip) {
    const now = Date.now();
    let entry = rateLimitMap.get(ip);
    if (!entry || now - entry.firstAttemptAt > WINDOW_DURATION_MS) {
        entry = { attempts: 1, firstAttemptAt: now, lockedUntil: 0 };
    }
    else {
        entry.attempts += 1;
    }
    if (entry.attempts >= MAX_FAILED_ATTEMPTS) {
        entry.lockedUntil = now + LOCKOUT_DURATION_MS;
        rateLimitMap.set(ip, entry);
        const waitSeconds = Math.ceil(LOCKOUT_DURATION_MS / 1000);
        return { isLocked: true, waitSeconds, attemptsLeft: 0 };
    }
    rateLimitMap.set(ip, entry);
    return {
        isLocked: false,
        waitSeconds: 0,
        attemptsLeft: MAX_FAILED_ATTEMPTS - entry.attempts,
    };
}
/**
 * Reset failed attempts upon successful authentication
 */
export function resetRateLimit(ip) {
    rateLimitMap.delete(ip);
}
/**
 * Verifies candidate PIN and issues a new session token if valid
 */
export function verifyHostPin(candidatePin, ip) {
    // 1. Check rate limit
    const rateLimit = checkRateLimit(ip);
    if (rateLimit.isLocked) {
        return {
            success: false,
            error: `Too many failed attempts. Locked out for ${rateLimit.waitSeconds}s.`,
            isLocked: true,
            waitSeconds: rateLimit.waitSeconds,
        };
    }
    const config = getSecurityConfig();
    const expectedPin = String(config.host_pin).trim();
    const provided = String(candidatePin || '').trim();
    // Timing-safe comparison to prevent timing attacks
    const expectedBuf = Buffer.from(expectedPin);
    const providedBuf = Buffer.from(provided);
    const isMatch = expectedBuf.length === providedBuf.length &&
        crypto.timingSafeEqual(expectedBuf, providedBuf);
    if (!isMatch) {
        const penalty = recordFailedAttempt(ip);
        return {
            success: false,
            error: penalty.isLocked
                ? `Too many failed attempts. Locked out for ${penalty.waitSeconds}s.`
                : `Invalid Host PIN. ${penalty.attemptsLeft} attempts remaining before temporary lockout.`,
            isLocked: penalty.isLocked,
            waitSeconds: penalty.waitSeconds,
            attemptsLeft: penalty.attemptsLeft,
        };
    }
    // Success: Clear rate limits & issue session token
    resetRateLimit(ip);
    const token = 'pv_host_' + crypto.randomBytes(24).toString('hex');
    const now = Date.now();
    activeSessions.set(token, {
        token,
        createdAt: now,
        expiresAt: now + SESSION_TTL_MS,
    });
    saveSessions(activeSessions);
    return {
        success: true,
        token,
    };
}
/**
 * Validates a session token
 */
export function validateHostToken(token) {
    if (!token)
        return false;
    const session = activeSessions.get(token);
    if (!session)
        return false;
    if (Date.now() > session.expiresAt) {
        activeSessions.delete(token);
        saveSessions(activeSessions);
        return false;
    }
    return true;
}
/**
 * Revokes a session token (logout)
 */
export function revokeHostToken(token) {
    const result = activeSessions.delete(token);
    if (result) {
        saveSessions(activeSessions);
    }
    return result;
}
/**
 * Updates the Host PIN and saves it to /data/host-security.json
 */
export function updateHostPin(currentPin, newPin) {
    const config = getSecurityConfig();
    const expectedPin = String(config.host_pin).trim();
    const provided = String(currentPin || '').trim();
    const target = String(newPin || '').trim();
    if (provided !== expectedPin) {
        return { success: false, error: 'Current Host PIN is incorrect.' };
    }
    if (target.length < 4) {
        return { success: false, error: 'New PIN must be at least 4 characters long.' };
    }
    if (target.length > 32) {
        return { success: false, error: 'New PIN cannot exceed 32 characters.' };
    }
    config.host_pin = target;
    config.updated_at = new Date().toISOString();
    try {
        fs.writeFileSync(SECURITY_FILE, JSON.stringify(config, null, 2), 'utf-8');
        return { success: true };
    }
    catch (err) {
        return { success: false, error: 'Failed to write updated PIN to host-security.json: ' + err.message };
    }
}
/**
 * Public info about security storage location
 */
export function getSecurityStorageInfo() {
    const config = getSecurityConfig();
    return {
        storageFile: 'data/host-security.json',
        absolutePath: SECURITY_FILE,
        updatedAt: config.updated_at,
    };
}
