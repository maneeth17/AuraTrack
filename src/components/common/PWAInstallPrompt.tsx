'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-24 left-4 right-4 lg:bottom-6 lg:left-auto lg:right-6 lg:max-w-sm z-50"
        >
          <div className="glass rounded-2xl p-4 border border-white/10 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white">Install AuraTrack</h3>
                <p className="text-xs text-white/40 mt-0.5">Add to your home screen for quick access</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleInstall}
                    className="flex-1 btn-primary py-2 text-xs font-medium flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Install
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white/70 hover:bg-white/5 transition-colors"
                  >
                    Not now
                  </button>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors shrink-0"
              >
                <X className="w-4 h-4 text-white/30" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
