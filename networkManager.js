import os from 'os';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
const SETTINGS_FILE = path.resolve(process.cwd(), 'data', 'network-settings.json');
const recentTestPings = new Map();
// Clean up stale pings older than 15 minutes
setInterval(() => {
    const cutoff = Date.now() - 15 * 60 * 1000;
    for (const [key, ping] of recentTestPings.entries()) {
        if (ping.timestamp < cutoff) {
            recentTestPings.delete(key);
        }
    }
}, 60 * 1000);
/**
 * Classifies an OS network interface into Wi-Fi, Ethernet, Virtual/VPN, or Loopback
 */
export function classifyInterface(name, isInternal) {
    if (isInternal)
        return 'loopback';
    const lower = name.toLowerCase();
    // Virtual / Docker / Bridges / VPN / Tailscale
    if (/docker|veth|br-|virbr|tun|tap|utun|tailscale|wg|vmnet|vbox|hyper-v|vethernet|container/i.test(lower)) {
        return 'virtual';
    }
    // Wi-Fi heuristics (wlan, wifi, wireless, ath, en0 on macOS, etc.)
    // On macOS en0 is almost universally the built-in Wi-Fi adapter.
    if (/wlan|wifi|wireless|ath|ra[0-9]|wl[a-z0-9]|en0/i.test(lower)) {
        return 'wifi';
    }
    // Ethernet heuristics (eth, enp, eno, ethernet, en[1-9], lan)
    if (/eth|enp|eno|ethernet|en[1-9]|lan/i.test(lower)) {
        return 'ethernet';
    }
    // Default to ethernet if physical looking, otherwise virtual
    return 'ethernet';
}
/**
 * Checks if an IPv4 address is in standard private LAN ranges (RFC 1918)
 */
export function isPrivateLanIPv4(ip) {
    if (!ip)
        return false;
    if (ip.startsWith('192.168.'))
        return true;
    if (ip.startsWith('10.'))
        return true;
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip))
        return true;
    return false;
}
/**
 * Discovers and prioritizes all host network interfaces:
 * Priority 1: Wi-Fi interfaces on top
 * Priority 2: Ethernet interfaces next
 * Priority 3: Other / Virtual / Docker
 * Priority 4: Loopback
 */
export function discoverNetworkInterfaces(port = 3000) {
    const osInterfaces = os.networkInterfaces();
    const list = [];
    for (const [name, netList] of Object.entries(osInterfaces)) {
        if (!netList)
            continue;
        for (const iface of netList) {
            // Focus primarily on IPv4 for seamless phone QR code scanning
            if (iface.family !== 'IPv4')
                continue;
            const category = classifyInterface(name, Boolean(iface.internal));
            const isLan = isPrivateLanIPv4(iface.address);
            const isLoopback = Boolean(iface.internal) || iface.address === '127.0.0.1';
            const isVirtual = category === 'virtual';
            // Priority ranking:
            // 10: Wi-Fi with LAN IP (Best for room Wi-Fi)
            // 20: Wi-Fi without standard LAN IP
            // 30: Ethernet with LAN IP
            // 40: Ethernet without standard LAN IP
            // 50: Other non-internal IPv4
            // 60: Virtual / Docker / Tailscale / Bridges
            // 70: Loopback (127.0.0.1)
            let priority = 50;
            if (category === 'wifi') {
                priority = isLan ? 10 : 20;
            }
            else if (category === 'ethernet') {
                priority = isLan ? 30 : 40;
            }
            else if (category === 'virtual') {
                priority = 60;
            }
            else if (isLoopback) {
                priority = 70;
            }
            let label = name;
            if (category === 'wifi') {
                label = `Wi-Fi (${name})`;
            }
            else if (category === 'ethernet') {
                label = `Wired Ethernet (${name})`;
            }
            else if (category === 'virtual') {
                label = `Virtual / Bridge (${name})`;
            }
            else if (isLoopback) {
                label = `Localhost Only (${name})`;
            }
            list.push({
                id: `${name}:${iface.address}`,
                interfaceName: name,
                address: iface.address,
                family: 'IPv4',
                category,
                label,
                priority,
                isLan,
                isLoopback,
                isVirtual,
                recommended: false,
                fullUrl: `http://${iface.address}:${port}`,
            });
        }
    }
    // Sort strictly by priority: Wi-Fi first, then Ethernet, then Virtual, then Loopback
    list.sort((a, b) => {
        if (a.priority !== b.priority) {
            return a.priority - b.priority;
        }
        // Alphabetical / address secondary sort
        return a.address.localeCompare(b.address);
    });
    // Mark the top non-loopback interface as recommended
    const topCandidate = list.find((item) => !item.isLoopback && !item.isVirtual && item.isLan) ||
        list.find((item) => !item.isLoopback && !item.isVirtual) ||
        list[0];
    if (topCandidate) {
        topCandidate.recommended = true;
    }
    return list;
}
/**
 * Loads stored network settings from data/network-settings.json
 */
export function loadStoredSettings() {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const content = fs.readFileSync(SETTINGS_FILE, 'utf-8');
            return JSON.parse(content);
        }
    }
    catch (err) {
        console.error('[NetworkManager] Error reading network settings:', err);
    }
    return null;
}
/**
 * Saves network settings to data/network-settings.json
 */
export function saveStoredSettings(settings) {
    try {
        const dir = path.dirname(SETTINGS_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const toSave = {
            ...settings,
            savedAt: new Date().toISOString(),
        };
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(toSave, null, 2), 'utf-8');
        return true;
    }
    catch (err) {
        console.error('[NetworkManager] Error saving network settings:', err);
        return false;
    }
}
/**
 * Evaluates current network state, verifies availability of any stored connection,
 * and determines the effective active URL for presentation participant QR codes.
 */
export function getNetworkStatus(reqHost) {
    const port = Number(process.env.PORT || 3000);
    const isCloud = Boolean(process.env.APP_URL && !process.env.APP_URL.includes('localhost'));
    const interfaces = discoverNetworkInterfaces(port);
    const stored = loadStoredSettings();
    const recommendedItem = interfaces.find((i) => i.recommended) || interfaces[0];
    const recommendedUrl = recommendedItem ? recommendedItem.fullUrl : `http://localhost:${port}`;
    let activeUrl = '';
    let effectiveMode = 'auto';
    let storedConnectionMissing = false;
    let missingDetails;
    // Cloud deployment override (Cloud Run, AI Studio preview, etc.)
    if (process.env.APP_URL && process.env.APP_URL.startsWith('http')) {
        activeUrl = process.env.APP_URL.replace(/\/$/, '');
    }
    if (stored) {
        effectiveMode = stored.mode;
        if (stored.mode === 'custom' && stored.customUrl) {
            activeUrl = stored.customUrl.replace(/\/$/, '');
            storedConnectionMissing = false;
        }
        else if (stored.mode === 'interface' && stored.selectedAddress) {
            // Check if selected address is currently present
            const matchedInterface = interfaces.find((i) => i.address === stored.selectedAddress || i.interfaceName === stored.selectedInterfaceName);
            if (matchedInterface) {
                activeUrl = matchedInterface.fullUrl;
                storedConnectionMissing = false;
            }
            else {
                // The previously stored address/interface is no longer found!
                storedConnectionMissing = true;
                missingDetails = {
                    address: stored.selectedAddress,
                    interfaceName: stored.selectedInterfaceName,
                };
                // Fallback to top recommended or incoming host header
                activeUrl = recommendedUrl;
            }
        }
    }
    // If activeUrl is still empty, fallback to request host or recommended
    if (!activeUrl) {
        if (reqHost && !reqHost.includes('localhost')) {
            activeUrl = reqHost.startsWith('http') ? reqHost : `http://${reqHost}`;
        }
        else {
            activeUrl = recommendedUrl;
        }
    }
    return {
        activeUrl: activeUrl.replace(/\/$/, ''),
        effectiveMode,
        interfaces,
        storedSettings: stored,
        storedConnectionMissing,
        missingDetails,
        recommendedUrl,
        port,
        isCloud,
    };
}
/**
 * Register a successful phone test connection ping
 */
export function recordTestPing(sessionId, clientIp, userAgent) {
    recentTestPings.set(sessionId, {
        sessionId,
        clientIp,
        userAgent,
        timestamp: Date.now(),
    });
}
/**
 * Query whether a phone has successfully pinged this session
 */
export function getTestPingStatus(sessionId) {
    const ping = recentTestPings.get(sessionId);
    if (ping && Date.now() - ping.timestamp < 300000) {
        // Valid for 5 minutes
        return { connected: true, ping };
    }
    return { connected: false };
}
/**
 * Helper to generate a QR Code Data URL
 */
export async function generateQrDataUrl(url) {
    try {
        return await QRCode.toDataURL(url, {
            margin: 2,
            width: 320,
            color: { dark: '#0f172a', light: '#ffffff' },
        });
    }
    catch (err) {
        console.error('[NetworkManager] QR Code generation failed:', err);
        return '';
    }
}
