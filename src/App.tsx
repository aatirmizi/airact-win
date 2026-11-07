import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext.js';
import { PresenterProvider } from './context/PresenterContext.js';
import { Navbar } from './components/common/Navbar.js';
import { Workspace } from './components/facilitator/Workspace.js';
import { ProjectorView } from './components/projector/ProjectorView.js';
import { ParticipantApp } from './components/participant/ParticipantApp.js';
import { HostAuthScreen } from './components/facilitator/Modals/HostAuthScreen.js';

export default function App() {
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [startModalOpen, setStartModalOpen] = useState<boolean>(false);

  // Host session token state
  const [hostToken, setHostToken] = useState<string | null>(() => {
    return sessionStorage.getItem('airact_host_token');
  });

  const pathname = window.location.pathname;

  // 1. Dedicated Projector Route (Full screen, no back navigation to presenter)
  if (pathname.startsWith('/projector')) {
    return (
      <ThemeProvider>
        <div className="relative min-h-screen bg-slate-950 font-sans">
          <ProjectorView />
        </div>
      </ThemeProvider>
    );
  }

  // 2. Facilitator / Presenter Route (/host, /presenter, /facilitator)
  const isHostRoute =
    pathname === '/host' ||
    pathname.startsWith('/host/') ||
    pathname === '/presenter' ||
    pathname.startsWith('/presenter/') ||
    pathname === '/facilitator' ||
    pathname.startsWith('/facilitator/');

  // Validate hostToken with backend on mount
  useEffect(() => {
    if (!isHostRoute || !hostToken) return;

    let isMounted = true;
    fetch('/api/auth/check-host', {
      headers: {
        'x-facilitator-token': hostToken,
        Authorization: `Bearer ${hostToken}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && !data.authenticated) {
          sessionStorage.removeItem('airact_host_token');
          setHostToken(null);
        }
      })
      .catch(() => {
        // Network lag, keep token
      });

    return () => {
      isMounted = false;
    };
  }, [isHostRoute, hostToken]);

  // Listen for unauthorized events emitted by facilitator API calls
  useEffect(() => {
    const handleUnauthorized = () => {
      sessionStorage.removeItem('airact_host_token');
      setHostToken(null);
    };

    window.addEventListener('airact_host_unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('airact_host_unauthorized', handleUnauthorized);
    };
  }, []);

  if (isHostRoute) {
    // If not authenticated, require Host PIN
    if (!hostToken) {
      return (
        <ThemeProvider>
          <HostAuthScreen
            onAuthenticated={(token) => {
              setHostToken(token);
            }}
          />
        </ThemeProvider>
      );
    }

    // Authenticated Host Workspace
    return (
      <ThemeProvider>
        <PresenterProvider>
          <div className="h-screen w-screen flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans antialiased overflow-x-auto overflow-y-hidden presenter-scroll-container">
            <div className="min-w-[1180px] h-full flex flex-col flex-1">
              <Navbar
                onOpenStartModal={() => setStartModalOpen(true)}
                onOpenPreview={() => setPreviewOpen(!previewOpen)}
                previewOpen={previewOpen}
              />
              <Workspace
                previewOpen={previewOpen}
                setPreviewOpen={setPreviewOpen}
                startModalOpen={startModalOpen}
                setStartModalOpen={setStartModalOpen}
              />
            </div>
          </div>
        </PresenterProvider>
      </ThemeProvider>
    );
  }

  // 3. Default Route: Participant / Audience View (/, /j/:code, /p, /participant, /join)
  // When participants navigate to the main URL on intranet or internet, they strictly land here!
  const code = pathname.startsWith('/j/')
    ? pathname.replace('/j/', '').split('/')[0]
    : '';

  return (
    <ThemeProvider>
      <div className="relative min-h-screen font-sans">
        <ParticipantApp initialCode={code} />
      </div>
    </ThemeProvider>
  );
}
