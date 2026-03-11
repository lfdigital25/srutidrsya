import { useEffect, useState } from 'react';

// Minimal typing for browsers that support the event
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setVisible(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    // Hide prompt if already running as standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setInstalled(true);
      setVisible(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    setVisible(false);
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'dismissed') {
      // show again later if user dismissed
      setTimeout(() => setVisible(true), 8000);
    }
    setDeferredPrompt(null);
  };

  if (installed || !visible) return null;

  return (
    <div className="fixed bottom-20 right-4 left-4 md:left-auto md:right-6 md:max-w-xs z-40">
      <div className="bg-neutral-900 border border-neutral-800 text-neutral-50 rounded-2xl shadow-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-400 flex items-center justify-center text-white font-bold">
          + 
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">Install SRUTI DRSYA</div>
          <div className="text-xs text-neutral-400">Add to home screen for faster launch & fullscreen.</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setVisible(false)}
            className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            Later
          </button>
          <button
            onClick={triggerInstall}
            className="text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg font-semibold transition-colors"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
