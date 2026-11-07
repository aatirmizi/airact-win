import React, { useState, useEffect, useRef } from 'react';
import {
  Wifi,
  Network,
  Globe,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Smartphone,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Server,
  Zap,
} from 'lucide-react';

export interface NetworkInterfaceInfo {
  id: string;
  interfaceName: string;
  address: string;
  family: 'IPv4' | 'IPv6';
  category: 'wifi' | 'ethernet' | 'virtual' | 'loopback';
  label: string;
  priority: number;
  isLan: boolean;
  isLoopback: boolean;
  isVirtual: boolean;
  recommended: boolean;
  fullUrl: string;
}

export interface StoredNetworkSettings {
  mode: 'interface' | 'custom' | 'auto';
  selectedInterfaceName?: string;
  selectedAddress?: string;
  customUrl?: string;
  port: number;
  savedAt?: string;
}

interface NetworkSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (newUrl: string) => void;
}

export const NetworkSettingsModal: React.FC<NetworkSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [interfaces, setInterfaces] = useState<NetworkInterfaceInfo[]>([]);
  const [storedSettings, setStoredSettings] = useState<StoredNetworkSettings | null>(null);
  const [storedMissing, setStoredMissing] = useState<boolean>(false);
  const [missingDetails, setMissingDetails] = useState<{ address?: string; interfaceName?: string } | undefined>();

  const [mode, setMode] = useState<'interface' | 'custom'>('interface');
  const [selectedInterfaceId, setSelectedInterfaceId] = useState<string>('');
  const [customUrl, setCustomUrl] = useState<string>('');

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrLoading, setQrLoading] = useState<boolean>(false);

  const [copied, setCopied] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Live phone connection verification
  const [sessionId] = useState<string>(() => 'test_' + Math.random().toString(36).substring(2, 9));
  const [phoneConnected, setPhoneConnected] = useState<boolean>(false);
  const [phonePingData, setPhonePingData] = useState<{ clientIp: string; timestamp: number } | null>(null);

  const pollIntervalRef = useRef<any>(null);

  // Fetch interfaces on open
  const fetchNetworkData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/system/network-interfaces');
      if (!res.ok) throw new Error('Failed to retrieve server network interfaces');
      const data = await res.json();

      setInterfaces(data.interfaces || []);
      setStoredSettings(data.storedSettings || null);
      setStoredMissing(Boolean(data.storedConnectionMissing));
      setMissingDetails(data.missingDetails);

      if (data.storedSettings?.mode === 'custom' && data.storedSettings.customUrl) {
        setMode('custom');
        setCustomUrl(data.storedSettings.customUrl);
      } else {
        setMode('interface');
        // Pick stored interface if exists and available, else recommended
        const storedIface = data.interfaces.find(
          (i: NetworkInterfaceInfo) =>
            i.address === data.storedSettings?.selectedAddress ||
            i.interfaceName === data.storedSettings?.selectedInterfaceName
        );
        const topCandidate = storedIface || data.interfaces.find((i: NetworkInterfaceInfo) => i.recommended) || data.interfaces[0];
        if (topCandidate) {
          setSelectedInterfaceId(topCandidate.id);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error querying network configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNetworkData();
      setPhoneConnected(false);
      setPhonePingData(null);
    }
  }, [isOpen]);

  // Determine current candidate URL for preview & testing
  const getCandidateUrl = (): string => {
    if (mode === 'custom') {
      return customUrl.trim() || 'http://your-domain.com';
    }
    const found = interfaces.find((i) => i.id === selectedInterfaceId);
    return found ? found.fullUrl : (interfaces[0]?.fullUrl || 'http://localhost:3000');
  };

  const candidateUrl = getCandidateUrl();
  const testPhoneUrl = `${candidateUrl}/test-connection?session=${sessionId}`;

  // Generate QR Code whenever candidate URL changes
  useEffect(() => {
    if (!isOpen || !candidateUrl || candidateUrl.includes('your-domain.com')) return;

    let isMounted = true;
    setQrLoading(true);

    fetch('/api/system/network-test/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: testPhoneUrl }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.qrDataUrl) {
          setQrDataUrl(data.qrDataUrl);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setQrLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, candidateUrl, testPhoneUrl]);

  // Poll for phone test ping
  useEffect(() => {
    if (!isOpen) return;

    pollIntervalRef.current = setInterval(() => {
      fetch(`/api/system/network-test/status?session=${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.connected && data.ping) {
            setPhoneConnected(true);
            setPhonePingData({
              clientIp: data.ping.clientIp,
              timestamp: data.ping.timestamp,
            });
          }
        })
        .catch(() => {});
    }, 2000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isOpen, sessionId]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(candidateUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setErrorMessage('');
    const hostToken = sessionStorage.getItem('airact_host_token') || '';

    try {
      const selected = interfaces.find((i) => i.id === selectedInterfaceId);
      const payload = {
        mode,
        selectedInterfaceName: mode === 'interface' ? selected?.interfaceName : undefined,
        selectedAddress: mode === 'interface' ? selected?.address : undefined,
        customUrl: mode === 'custom' ? customUrl.trim() : undefined,
      };

      const res = await fetch('/api/system/network-interfaces/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-facilitator-token': hostToken,
          Authorization: `Bearer ${hostToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save network configuration');
      }

      setSaveSuccess(true);
      setStoredMissing(false);
      if (onSaved) onSaved(data.activeUrl);

      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving network setting');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Network Settings Helper
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  Presenter Connection Assistant
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select which server connection to use for participant URLs, join links, and projector QR codes.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Stored Connection Missing Warning Banner */}
        {storedMissing && (
          <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="flex-1">
              <span className="font-bold">Stored Network Connection Unavailable:</span>{' '}
              Previously configured address{' '}
              <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 font-mono font-bold">
                {missingDetails?.address || 'Stored IP'}
              </code>{' '}
              is no longer active. Your computer may have reconnected to a different Wi-Fi network. Please select an active network below.
            </div>
          </div>
        )}

        {/* Content Body: Two Columns */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Network Selection & Precautions */}
          <div className="lg:col-span-7 space-y-5">
            {/* Mode Selector Tabs */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
              <button
                type="button"
                onClick={() => setMode('interface')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  mode === 'interface'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>Available System Networks</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('custom')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  mode === 'custom'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Custom Domain / Fixed URL</span>
              </button>
            </div>

            {/* Mode 1: Local Interfaces List in Priority Order */}
            {mode === 'interface' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Detected Networks (Sorted by Recommended Priority)
                  </span>
                  <button
                    onClick={fetchNetworkData}
                    disabled={loading}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {loading ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                    Scanning network interfaces…
                  </div>
                ) : interfaces.length === 0 ? (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 text-center">
                    No active network interfaces detected. Check your network cables or Wi-Fi status.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {interfaces.map((iface) => {
                      const isSelected = selectedInterfaceId === iface.id;
                      const isStored = storedSettings?.selectedAddress === iface.address;

                      return (
                        <div
                          key={iface.id}
                          onClick={() => setSelectedInterfaceId(iface.id)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-xs ring-1 ring-indigo-500'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            {/* Icon based on category */}
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                iface.category === 'wifi'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                  : iface.category === 'ethernet'
                                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {iface.category === 'wifi' ? (
                                <Wifi className="w-4 h-4" />
                              ) : iface.category === 'ethernet' ? (
                                <Network className="w-4 h-4" />
                              ) : (
                                <Server className="w-4 h-4" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {iface.label}
                                </span>
                                {iface.recommended && (
                                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                                    ★ Recommended
                                  </span>
                                )}
                                {isStored && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    Stored
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 mt-0.5">
                                <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                                  {iface.address}
                                </span>
                                <span className="text-slate-300 dark:text-slate-600">·</span>
                                <span className="text-[11px] text-slate-400">
                                  {iface.isLan
                                    ? 'Local Intranet'
                                    : iface.isLoopback
                                    ? 'Host only'
                                    : iface.category.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 ml-3">
                            <input
                              type="radio"
                              name="networkSelection"
                              checked={isSelected}
                              onChange={() => setSelectedInterfaceId(iface.id)}
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Mode 2: Custom Domain / Reverse Proxy */
              <div className="space-y-3 bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Globe className="w-4 h-4 text-indigo-500" />
                  <span>Fixed Domain or Tunnel URL</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Enter a fixed domain name, enterprise DNS route, or tunneling URL (e.g. Cloudflare Tunnel, ngrok, Tailscale Funnel) if your presentation server is accessed via a domain.
                </p>

                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Full Public / Intranet URL
                  </label>
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://live.workshop.mycompany.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="text-[11px] text-slate-400">
                    Must begin with <code>http://</code> or <code>https://</code>.
                  </div>
                </div>
              </div>
            )}

            {/* General Precautions & Pro Tips Section */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center space-x-2 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Facilitator Wi-Fi Precautions & Venue Tips</span>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0">•</span>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200">Hotel & Conference Wi-Fi (AP Client Isolation):</strong>{' '}
                    Many guest Wi-Fi networks prevent devices from talking directly to each other. If attendees cannot load the join page, turn on your <strong>phone's Personal Hotspot</strong> and connect both laptop and participant phones to it.
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <span className="font-bold text-indigo-500 shrink-0">•</span>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200">Firewall Rules:</strong> Ensure incoming TCP connections on port <code>3000</code> are allowed by your operating system firewall (Windows Defender / macOS Security).
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <span className="font-bold text-emerald-500 shrink-0">•</span>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200">DHCP Reassignment:</strong> If you move between venues or disconnect Wi-Fi, the router may assign a new IP address. The app automatically detects missing addresses and alerts you.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Live Preview, QR Code & Phone Test Verification */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            {/* Live Connection Card */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4.5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Target Connection URL
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  Live Preview
                </span>
              </div>

              {/* URL Display with Copy Button */}
              <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[210px]">
                  {candidateUrl}
                </span>
                <button
                  onClick={handleCopyUrl}
                  className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                  title="Copy URL"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* QR Code Display for Phone Test */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                {qrLoading ? (
                  <div className="w-44 h-44 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                  </div>
                ) : qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Network Connection Test QR Code"
                    className="w-44 h-44 object-contain rounded-lg shadow-xs"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
                    Generating QR…
                  </div>
                )}

                <div className="mt-3 flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-200 font-bold">
                  <Smartphone className="w-4 h-4 text-indigo-500" />
                  <span>Scan with Phone Camera</span>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-400 max-w-[220px]">
                  Opens the participant test screen to instantly verify Wi-Fi reachability.
                </p>
              </div>

              {/* Live Phone Test Feedback Box */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  phoneConnected
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                    : 'bg-indigo-50/50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {phoneConnected ? (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Phone Connected Successfully!</span>
                    </div>
                    <div className="text-[11px] leading-relaxed">
                      Confirmed two-way connectivity from device{' '}
                      <code className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                        {phonePingData?.clientIp || 'client'}
                      </code>
                      . Participants will be able to join without issues!
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                    <span>Waiting for test phone connection ping…</span>
                  </div>
                )}
              </div>

              {/* Simulation link in second browser tab */}
              <div className="pt-1 text-center">
                <a
                  href={testPhoneUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center space-x-1 font-semibold"
                >
                  <span>Or test in a new tab on this computer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Error Display */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold">
                {errorMessage}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Selected: <strong className="text-slate-800 dark:text-slate-200 font-mono">{candidateUrl}</strong>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={isSaving}
              className={`px-5 py-2 rounded-xl text-xs font-extrabold text-white flex items-center space-x-1.5 transition-all shadow-md cursor-pointer ${
                saveSuccess
                  ? 'bg-emerald-600 shadow-emerald-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
              }`}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving…</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved as Default!</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Store Connection for Sessions</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
