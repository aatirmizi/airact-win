import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { ActivityData, Slide, SlideTypeId, JoinMode, RosterEntry, Settings } from '../types/activity.js';
import { activityTemplates, createBlankActivity } from '../utils/templates.js';


export type FacilitatorActiveView =
  | 'slides'
  | 'host_security'
  | 'roster'
  | 'session_defaults'
  | 'templates'
  | 'open_recent';

interface PresenterContextType {
  activeView: FacilitatorActiveView;
  setActiveView: (view: FacilitatorActiveView) => void;
  activity: ActivityData | null;
  selectedSlideIndex: number;
  setSelectedSlideIndex: (idx: number) => void;
  selectedSlide: Slide | null;
  isDirty: boolean;
  liveState: any;
  isConnected: boolean;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  saveActivity: () => Promise<void>;
  newActivity: () => Promise<void>;
  addSlide: (typeId: SlideTypeId) => void;
  deleteSlide: (index: number) => void;
  duplicateSlide: (index: number) => void;
  reorderSlides: (fromIndex: number, toIndex: number) => void;
  updateSlideContent: (contentUpdates: any) => void;
  updateSlideSettings: (settingsUpdates: any) => void;
  updateActivitySettings: (settingsUpdates: Partial<Settings>) => void;
  loadTemplate: (templateActivity: ActivityData) => Promise<void>;

  updateSlideNotes: (notes: string) => void;
  updateTheme: (themeUpdates: any) => void;
  // Roster methods
  roster: RosterEntry[];
  saveRoster: (roster: RosterEntry[]) => Promise<void>;
  importRosterCSV: (csvText: string) => Promise<boolean>;
  exportRosterCSV: () => void;
  // Presentation controls
  startPresenting: (startIndex?: number, joinMode?: JoinMode, limit?: number) => Promise<string | null>;
  endPresenting: () => Promise<void>;
  nextStep: () => Promise<void>;
  prevStep: () => Promise<void>;
  nextSlide: () => Promise<void>;
  prevSlide: () => Promise<void>;
  goToSlide: (index: number) => Promise<void>;
  toggleAccepting: (accepting: boolean) => Promise<void>;
  closeNow: () => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  setTimer: (seconds: number, autoStart?: boolean) => Promise<void>;
  resetTimer: (seconds?: number) => Promise<void>;
  clearTimer: () => Promise<void>;
  extendTimer: (seconds?: number) => Promise<void>;
  toggleResultsVisibility: (visible: boolean) => Promise<void>;
  setBlanked: (blanked: boolean) => Promise<void>;
  setFrozen: (frozen: boolean) => Promise<void>;
  removeParticipant: (participantId: string) => Promise<void>;
  hideParticipantName: (participantId: string, hide: boolean) => Promise<void>;
  updateQAStatus: (questionId: string, status: string) => Promise<void>;
  resetSlideData: (slideId: string) => Promise<void>;
  resetAllData: () => Promise<void>;
  exportActvtyFile: () => void;
  importActvtyFile: (file: File) => Promise<void>;
  simulateResponse: () => void;
  changeHostPin: (currentPin: string, newPin: string) => Promise<{ success: boolean; error?: string }>;
  logoutHost: () => Promise<void>;
  // Workspace and layout state
  isActivityOpen: boolean;
  openActivityForEditing: () => void;
  closeActivity: () => void;
  aspectRatio: '16:9' | '16:10' | '4:3';
  setAspectRatio: (ratio: '16:9' | '16:10' | '4:3') => void;
  inspectorTab: 'slide' | 'theme' | 'timing';
  setInspectorTab: (tab: 'slide' | 'theme' | 'timing') => void;
  // Network Settings Helper State
  isNetworkModalOpen: boolean;
  setIsNetworkModalOpen: (open: boolean) => void;
  networkStatus: any;
  checkNetworkStatus: () => Promise<void>;
  storedConnectionMissing: boolean;
  missingNetworkDetails?: { address?: string; interfaceName?: string };
  dismissMissingNetworkWarning: () => void;
}

const PresenterContext = createContext<PresenterContextType | undefined>(undefined);

export const PresenterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<FacilitatorActiveView>('slides');
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number>(0);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [liveState, setLiveState] = useState<any>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isActivityOpen, setIsActivityOpen] = useState<boolean>(false);
  const [inspectorTab, setInspectorTab] = useState<'slide' | 'theme' | 'timing'>('slide');

  // Network Settings Helper & Missing Connection State
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState<boolean>(false);
  const [networkStatus, setNetworkStatus] = useState<any>(null);
  const [storedConnectionMissing, setStoredConnectionMissing] = useState<boolean>(false);
  const [missingNetworkDetails, setMissingNetworkDetails] = useState<{ address?: string; interfaceName?: string } | undefined>();
  const [warningDismissed, setWarningDismissed] = useState<boolean>(false);

  // Undo / Redo stacks
  const [undoStack, setUndoStack] = useState<ActivityData[]>([]);
  const [redoStack, setRedoStack] = useState<ActivityData[]>([]);

  const wsRef = useRef<WebSocket | null>(null);

  // Check network interfaces and verify stored connection availability
  const checkNetworkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/system/network-info');
      if (res.ok) {
        const data = await res.json();
        setNetworkStatus(data);
        if (data.storedConnectionMissing && !warningDismissed) {
          setStoredConnectionMissing(true);
          setMissingNetworkDetails(data.missingDetails);
        } else {
          setStoredConnectionMissing(false);
        }
      }
    } catch (err) {
      console.warn('Network check failed:', err);
    }
  }, [warningDismissed]);

  const dismissMissingNetworkWarning = useCallback(() => {
    setStoredConnectionMissing(false);
    setWarningDismissed(true);
  }, []);

  // Helper for authenticated facilitator fetches using dynamic host session token
  const facFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    const token = sessionStorage.getItem('airact_host_token') || '';
    if (token) {
      headers.set('x-facilitator-token', token);
      headers.set('Authorization', `Bearer ${token}`);
    }
    try {
      const res = await fetch(url, { ...options, headers });
      if (res.status === 401) {
        sessionStorage.removeItem('airact_host_token');
        window.dispatchEvent(new CustomEvent('airact_host_unauthorized'));
      }
      return res;
    } catch (err) {
      throw err;
    }
  }, []);

  // Fetch initial activity & live state
  const fetchState = useCallback(async () => {
    try {
      const [actRes, stateRes] = await Promise.all([
        facFetch('/api/activity'),
        facFetch('/api/facilitator/state'),
      ]);
      if (actRes.status === 401 || stateRes.status === 401) {
        sessionStorage.removeItem('airact_host_token');
        window.dispatchEvent(new CustomEvent('airact_host_unauthorized'));
        return;
      }
      if (actRes.ok) {
        const actData = await actRes.json();
        setActivity(actData);
      } else {
        console.warn('Could not load activity from server, loading default template fallback');
        setActivity((prev) => prev || activityTemplates[0].createActivity());
      }
      if (stateRes.ok) {
        const sData = await stateRes.json();
        setLiveState(sData);
        if (sData.is_live) {
          setSelectedSlideIndex(sData.current_slide_index);
          setIsActivityOpen(true);
        }
      }
    } catch (err) {
      console.error('Failed to load initial presenter state:', err);
      // Fallback so facilitator is never permanently blocked
      setActivity((prev) => prev || activityTemplates[0].createActivity());
    }
  }, [facFetch]);

  // Connect Facilitator WebSocket & Check Network
  useEffect(() => {
    fetchState();
    checkNetworkStatus();

    const hostToken = sessionStorage.getItem('airact_host_token') || '';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/facilitator?token=${hostToken}`;
    let ws: WebSocket;

    const connectWs = () => {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'facilitator_update') {
            setLiveState(msg.state);
            if (msg.state.is_live) {
              setSelectedSlideIndex(msg.state.current_slide_index);
            }
          }
        } catch {}
      };

      ws.onclose = () => {
        setIsConnected(false);
        setTimeout(connectWs, 2000);
      };
    };

    connectWs();

    return () => {
      if (ws) ws.close();
    };
  }, [fetchState]);

  // Push to undo stack helper
  const pushUndo = useCallback((currentAct: ActivityData) => {
    setUndoStack((prev) => [...prev.slice(-30), JSON.parse(JSON.stringify(currentAct))]);
    setRedoStack([]);
  }, []);

  const undo = useCallback(() => {
    if (undoStack.length === 0 || !activity) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, JSON.parse(JSON.stringify(activity))]);
    setActivity(previous);
    setIsDirty(true);
  }, [undoStack, activity]);

  const redo = useCallback(() => {
    if (redoStack.length === 0 || !activity) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(activity))]);
    setActivity(next);
    setIsDirty(true);
  }, [redoStack, activity]);

  const saveActivity = useCallback(async () => {
    if (!activity) return;
    try {
      const res = await facFetch('/api/activity', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity),
      });
      if (res.ok) {
        setIsDirty(false);
      }
    } catch (err) {
      console.error('Failed to save activity:', err);
    }
  }, [activity, facFetch]);

  // Roster Management Methods
  const saveRoster = useCallback(
    async (roster: RosterEntry[]) => {
      try {
        const res = await facFetch('/api/activity/roster', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roster }),
        });
        if (res.ok) {
          const data = await res.json();
          if (activity) {
            setActivity({
              ...activity,
              roster: data.roster,
              manifest: { ...activity.manifest, has_roster: data.roster.length > 0 },
            });
          }
        }
      } catch (err) {
        console.error('Failed to save roster:', err);
      }
    },
    [activity, facFetch]
  );

  const importRosterCSV = useCallback(
    async (csvText: string): Promise<boolean> => {
      try {
        const res = await facFetch('/api/activity/roster/import-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csvText }),
        });
        if (res.ok) {
          const data = await res.json();
          if (activity) {
            setActivity({
              ...activity,
              roster: data.roster,
              manifest: { ...activity.manifest, has_roster: data.roster.length > 0 },
            });
          }
          return true;
        }
      } catch (err) {
        console.error('Failed to import roster CSV:', err);
      }
      return false;
    },
    [activity, facFetch]
  );

  const exportRosterCSV = useCallback(() => {
    const token = sessionStorage.getItem('airact_host_token') || '';
    window.location.href = `/api/activity/roster/export-csv?fac_token=${token}`;
  }, []);

  const addSlide = useCallback(
    (typeId: SlideTypeId) => {
      if (!activity) return;
      if (liveState?.is_live) return;

      pushUndo(activity);
      const newSlideId = Math.random().toString(36).substring(2, 14);

      let content: any = {};
      let settings: any = {
        participant_visibility: true,
      };

      if (typeId === 'poll') {
        content = {
          question: 'What do you think?',
          options: [
            { id: 'opt_1', text: 'Option A' },
            { id: 'opt_2', text: 'Option B' },
          ],
        };
        settings = {
          response_mode: 'anonymous',
          response_rule: 'one_per_participant',
          close_policy: { mode: 'immediate' },
          results_visibility: 'live',
          participant_visibility: true,
          timer_seconds: 30,
        };
      } else if (typeId === 'quiz') {
        content = {
          question: 'Which answer is correct?',
          options: [
            { id: 'q_1', text: 'Answer 1' },
            { id: 'q_2', text: 'Answer 2' },
          ],
          correct_option_id: 'q_1',
          points: 100,
          explanation: 'Here is why Answer 1 is correct.',
          reveal_timing: 'after_question',
        };
        settings = {
          response_mode: 'identified',
          timer_seconds: 20,
          speed_bonus: true,
          participant_visibility: true,
        };
      } else if (typeId === 'leaderboard') {
        content = {
          title: 'Quiz Leaderboard',
          display_mode: 'top_5',
        };
      } else if (typeId === 'wordcloud') {
        content = {
          question: 'Describe this topic in one word',
          max_entries_per_user: 3,
        };
      } else if (typeId === 'open') {
        content = {
          question: 'Share your thoughts',
          max_chars: 280,
          allow_multiple: true,
        };
      } else if (typeId === 'qa') {
        content = {
          title: 'Audience Q&A',
          allow_anonymous: true,
        };
      } else if (typeId === 'welcome') {
        content = {
          title: activity.manifest.meta.name || 'Interactive Workshop & Presentation',
          presenter_name: 'Lead Facilitator',
          presenter_info: 'Skill Upgrade Network',
          join_message: 'Scan the QR code or use the link below to participate live from your phone or laptop',
          logo_url: '/assets/aistudio/AirAct_Community_Learning_Logo_44a129c1.png',
        };
        settings.participant_visibility = true;
      } else if (typeId === 'content') {
        content = {
          layout: 'title_text',
          title: 'Presentation Topic',
          body: 'Add key details and bullet points here.',
        };
        settings.participant_visibility = false;
      }

      const newSlide: Slide = {
        id: newSlideId,
        type_id: typeId,
        type_version: 1,
        content,
        settings,
        notes: '',
      };

      const updatedSlides = [...activity.slides, newSlide];
      const updatedManifest = {
        ...activity.manifest,
        slides: updatedSlides.map((s) => s.id),
      };

      setActivity({
        ...activity,
        manifest: updatedManifest,
        slides: updatedSlides,
      });
      setSelectedSlideIndex(updatedSlides.length - 1);
      setIsDirty(true);
    },
    [activity, liveState, pushUndo]
  );

  const deleteSlide = useCallback(
    (index: number) => {
      if (!activity || activity.slides.length <= 1) return;
      if (liveState?.is_live) return;

      pushUndo(activity);
      const updatedSlides = activity.slides.filter((_, i) => i !== index);
      const updatedManifest = {
        ...activity.manifest,
        slides: updatedSlides.map((s) => s.id),
      };

      setActivity({
        ...activity,
        manifest: updatedManifest,
        slides: updatedSlides,
      });
      setSelectedSlideIndex(Math.max(0, index - 1));
      setIsDirty(true);
    },
    [activity, liveState, pushUndo]
  );

  const duplicateSlide = useCallback(
    (index: number) => {
      if (!activity) return;
      if (liveState?.is_live) return;

      pushUndo(activity);
      const target = activity.slides[index];
      const cloned: Slide = {
        ...JSON.parse(JSON.stringify(target)),
        id: Math.random().toString(36).substring(2, 14),
      };

      const updatedSlides = [...activity.slides];
      updatedSlides.splice(index + 1, 0, cloned);
      const updatedManifest = {
        ...activity.manifest,
        slides: updatedSlides.map((s) => s.id),
      };

      setActivity({
        ...activity,
        manifest: updatedManifest,
        slides: updatedSlides,
      });
      setSelectedSlideIndex(index + 1);
      setIsDirty(true);
    },
    [activity, liveState, pushUndo]
  );

  const reorderSlides = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (!activity) return;
      if (liveState?.is_live) return;

      pushUndo(activity);
      const updatedSlides = [...activity.slides];
      const [moved] = updatedSlides.splice(fromIndex, 1);
      updatedSlides.splice(toIndex, 0, moved);

      const updatedManifest = {
        ...activity.manifest,
        slides: updatedSlides.map((s) => s.id),
      };

      setActivity({
        ...activity,
        manifest: updatedManifest,
        slides: updatedSlides,
      });
      setSelectedSlideIndex(toIndex);
      setIsDirty(true);
    },
    [activity, liveState, pushUndo]
  );

  const updateSlideContent = useCallback(
    (contentUpdates: any) => {
      if (!activity) return;
      const current = activity.slides[selectedSlideIndex];
      if (!current) return;

      const updatedSlide = {
        ...current,
        content: { ...current.content, ...contentUpdates },
      };

      const updatedSlides = [...activity.slides];
      updatedSlides[selectedSlideIndex] = updatedSlide;

      setActivity({
        ...activity,
        slides: updatedSlides,
      });
      setIsDirty(true);
    },
    [activity, selectedSlideIndex]
  );

  const updateSlideSettings = useCallback(
    (settingsUpdates: any) => {
      if (!activity) return;
      const current = activity.slides[selectedSlideIndex];
      if (!current) return;

      pushUndo(activity);
      const updatedSlide = {
        ...current,
        settings: { ...current.settings, ...settingsUpdates },
      };

      const updatedSlides = [...activity.slides];
      updatedSlides[selectedSlideIndex] = updatedSlide;

      setActivity({
        ...activity,
        slides: updatedSlides,
      });
      setIsDirty(true);
    },
    [activity, selectedSlideIndex, pushUndo]
  );

  const updateSlideNotes = useCallback(
    (notes: string) => {
      if (!activity) return;
      const current = activity.slides[selectedSlideIndex];
      if (!current) return;

      pushUndo(activity);
      const updatedSlide = { ...current, notes };
      const updatedSlides = [...activity.slides];
      updatedSlides[selectedSlideIndex] = updatedSlide;

      setActivity({
        ...activity,
        slides: updatedSlides,
      });
      setIsDirty(true);
    },
    [activity, selectedSlideIndex, pushUndo]
  );

  const updateTheme = useCallback(
    (themeUpdates: any) => {
      if (!activity) return;
      pushUndo(activity);
      setActivity({
        ...activity,
        theme: { ...activity.theme, ...themeUpdates },
      });
      setIsDirty(true);
    },
    [activity, pushUndo]
  );

  const updateActivitySettings = useCallback(
    (settingsUpdates: Partial<Settings>) => {
      if (!activity) return;
      const updatedActivity: ActivityData = {
        ...activity,
        settings: {
          ...activity.settings,
          ...settingsUpdates,
        },
      };
      setActivity(updatedActivity);
      setIsDirty(true);
      facFetch('/api/activity', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedActivity),
      }).catch(() => {});
    },
    [activity, facFetch]
  );

  const loadTemplate = useCallback(
    async (templateData: ActivityData) => {
      if (liveState?.is_live) return;
      if (activity) {
        pushUndo(activity);
      }
      setActivity(templateData);
      setSelectedSlideIndex(0);
      setIsDirty(false);
      setIsActivityOpen(true);
      setActiveView('slides');
      try {
        await facFetch('/api/activity', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(templateData),
        });
      } catch (err) {
        console.error('Failed to load template:', err);
      }
    },
    [activity, liveState, pushUndo, facFetch]
  );

  const newActivity = useCallback(async () => {
    if (liveState?.is_live) return;
    if (activity) {
      pushUndo(activity);
    }
    const fresh = createBlankActivity();
    setActivity(fresh);
    setSelectedSlideIndex(0);
    setIsDirty(false);
    setIsActivityOpen(true);
    setActiveView('slides');
    try {
      await facFetch('/api/activity', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fresh),
      });
    } catch (err) {
      console.error('Failed to create new blank activity:', err);
    }
  }, [activity, liveState, pushUndo, facFetch]);

  const aspectRatio: '16:9' | '16:10' | '4:3' = activity?.settings?.aspect_ratio || '16:9';

  const setAspectRatio = useCallback(
    (ratio: '16:9' | '16:10' | '4:3') => {
      updateActivitySettings({ aspect_ratio: ratio });
    },
    [updateActivitySettings]
  );

  const openActivityForEditing = useCallback(() => {
    setIsActivityOpen(true);
    setActiveView('slides');
  }, []);

  const closeActivity = useCallback(() => {
    setIsActivityOpen(false);
    setActiveView('slides');
  }, []);


  // Presenter Controls
  const startPresenting = async (startIndex: number = 0, joinMode: JoinMode = 'anonymous', limit: number = 200) => {
    try {
      const res = await facFetch('/api/presentation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startIndex, joinMode, limit }),
      });
      const data = await res.json();
      if (data.success) {
        setLiveState(data.state);
        return data.join_code;
      }
    } catch (err) {
      console.error('Failed to start presentation:', err);
    }
    return null;
  };

  const endPresenting = async () => {
    try {
      const res = await facFetch('/api/presentation/end', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setLiveState(data.state);
      }
    } catch (err) {
      console.error('Failed to end presentation:', err);
    }
  };

  const nextStep = async () => {
    await facFetch('/api/presentation/next-step', { method: 'POST' });
  };

  const prevStep = async () => {
    await facFetch('/api/presentation/prev-step', { method: 'POST' });
  };

  const nextSlide = async () => {
    await facFetch('/api/presentation/next-slide', { method: 'POST' });
  };

  const prevSlide = async () => {
    await facFetch('/api/presentation/prev-slide', { method: 'POST' });
  };

  const goToSlide = async (index: number) => {
    await facFetch('/api/presentation/goto-slide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index }),
    });
  };

  const toggleAccepting = async (accepting: boolean) => {
    await facFetch('/api/presentation/toggle-accepting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accepting }),
    });
  };

  const closeNow = async () => {
    await facFetch('/api/presentation/close-now', { method: 'POST' });
  };

  const pauseTimer = async () => {
    await facFetch('/api/presentation/timer/pause', { method: 'POST' });
  };

  const resumeTimer = async () => {
    await facFetch('/api/presentation/timer/resume', { method: 'POST' });
  };

  const setTimer = async (seconds: number, autoStart: boolean = true) => {
    await facFetch('/api/presentation/timer/set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seconds, autoStart }),
    });
  };

  const resetTimer = async (seconds?: number) => {
    await facFetch('/api/presentation/timer/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seconds }),
    });
  };

  const clearTimer = async () => {
    await facFetch('/api/presentation/timer/clear', { method: 'POST' });
  };

  const extendTimer = async (seconds: number = 30) => {
    await facFetch('/api/presentation/timer/extend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seconds }),
    });
  };

  const toggleResultsVisibility = async (visible: boolean) => {
    await facFetch('/api/presentation/toggle-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible }),
    });
  };

  const setBlanked = async (blanked: boolean) => {
    await facFetch('/api/presentation/blank', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blanked }),
    });
  };

  const setFrozen = async (frozen: boolean) => {
    await facFetch('/api/presentation/freeze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frozen }),
    });
  };

  const removeParticipant = async (participantId: string) => {
    await facFetch('/api/presentation/participant/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId }),
    });
  };

  const hideParticipantName = async (participantId: string, hide: boolean) => {
    await facFetch('/api/presentation/participant/hide-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, hide }),
    });
  };

  const updateQAStatus = async (questionId: string, status: string) => {
    await facFetch('/api/presentation/qa/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, status }),
    });
  };

  const resetSlideData = async (slideId: string) => {
    await facFetch('/api/activity/reset-slide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slideId }),
    });
  };

  const resetAllData = async () => {
    await facFetch('/api/activity/reset-all', { method: 'POST' });
  };

  const exportActvtyFile = () => {
    const token = sessionStorage.getItem('airact_host_token') || '';
    window.location.href = `/api/activity/export-actvty?fac_token=${token}`;
  };

  const importActvtyFile = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const res = await facFetch('/api/activity/import-actvty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: buffer,
    });
    if (res.ok) {
      const data = await res.json();
      setActivity(data.activity);
      setIsDirty(false);
      setIsActivityOpen(true);
      setActiveView('slides');
    }
  };

  // Preview simulation
  const simulateResponse = () => {
    if (!activity) return;
    const current = activity.slides[selectedSlideIndex];
    if (!current) return;

    if (current.type_id === 'poll' || current.type_id === 'quiz') {
      const options = (current.content as any).options || [];
      if (options.length > 0) {
        const randOpt = options[Math.floor(Math.random() * options.length)];
        fetch('/api/p/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-participant-token': 'preview_sim_' + Math.random().toString(36).substring(2, 8),
          },
          body: JSON.stringify({
            submission_id: 'sim_' + Math.random().toString(36).substring(2, 10),
            slide_id: current.id,
            step: liveState?.current_step || 'question',
            payload: { option_id: randOpt.id },
          }),
        }).catch(() => {});
      }
    } else if (current.type_id === 'wordcloud') {
      const sampleWords = ['Interactive', 'Engaging', 'Fast', 'Awesome', 'Collaborative', 'Insightful', 'Fun', 'Clean', 'Real-time'];
      const randWord = sampleWords[Math.floor(Math.random() * sampleWords.length)];
      fetch('/api/p/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-participant-token': 'preview_sim_' + Math.random().toString(36).substring(2, 8),
        },
        body: JSON.stringify({
          submission_id: 'sim_' + Math.random().toString(36).substring(2, 10),
          slide_id: current.id,
          step: 'collect',
          payload: { text: randWord },
        }),
      }).catch(() => {});
    }
  };

  const changeHostPin = useCallback(async (currentPin: string, newPin: string) => {
    try {
      const res = await facFetch('/api/auth/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin, newPin }),
      });
      const data = await res.json();
      return data;
    } catch {
      return { success: false, error: 'Network error changing PIN' };
    }
  }, [facFetch]);

  const logoutHost = useCallback(async () => {
    try {
      await facFetch('/api/auth/logout-host', { method: 'POST' });
    } catch {}
    sessionStorage.removeItem('airact_host_token');
    window.location.reload();
  }, [facFetch]);

  const selectedSlide = activity && activity.slides[selectedSlideIndex] ? activity.slides[selectedSlideIndex] : null;
  const roster = activity?.roster || [];

  return (
    <PresenterContext.Provider
      value={{
        activeView,
        setActiveView,
        activity,
        selectedSlideIndex,
        setSelectedSlideIndex,
        selectedSlide,
        isDirty,
        liveState,
        isConnected,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        undo,
        redo,
        saveActivity,
        newActivity,
        addSlide,
        deleteSlide,
        duplicateSlide,
        reorderSlides,
        updateSlideContent,
        updateSlideSettings,
        updateActivitySettings,
        loadTemplate,
        updateSlideNotes,
        updateTheme,
        roster,
        saveRoster,
        importRosterCSV,
        exportRosterCSV,
        startPresenting,
        endPresenting,
        nextStep,
        prevStep,
        nextSlide,
        prevSlide,
        goToSlide,
        toggleAccepting,
        closeNow,
        pauseTimer,
        resumeTimer,
        setTimer,
        resetTimer,
        clearTimer,
        extendTimer,
        toggleResultsVisibility,
        setBlanked,
        setFrozen,
        removeParticipant,
        hideParticipantName,
        updateQAStatus,
        resetSlideData,
        resetAllData,
        exportActvtyFile,
        importActvtyFile,
        simulateResponse,
        changeHostPin,
        logoutHost,
        isActivityOpen,
        openActivityForEditing,
        closeActivity,
        aspectRatio,
        setAspectRatio,
        inspectorTab,
        setInspectorTab,
        isNetworkModalOpen,
        setIsNetworkModalOpen,
        networkStatus,
        checkNetworkStatus,
        storedConnectionMissing,
        missingNetworkDetails,
        dismissMissingNetworkWarning,
      }}
    >
      {children}
    </PresenterContext.Provider>
  );
};

export const usePresenter = () => {
  const context = useContext(PresenterContext);
  if (!context) throw new Error('usePresenter must be used within PresenterProvider');
  return context;
};
