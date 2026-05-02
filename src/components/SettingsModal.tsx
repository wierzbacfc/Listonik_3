import React, { useState, useEffect } from 'react';
import { useShoppingStore } from '../store/shoppingStore';
import { motion, AnimatePresence } from 'motion/react';
import { X, Moon, Sun, Key, Check, LogIn, LogOut, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { preferences, setTheme, setPrimaryColor, setGeminiApiKey } = useShoppingStore();
  const [apiKeyInput, setApiKeyInput] = useState(preferences.geminiApiKey);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<'none' | 'success' | 'error'>('none');
  const { user, signIn, signOut } = useAuth();

  useEffect(() => {
    setApiKeyInput(preferences.geminiApiKey);
  }, [preferences.geminiApiKey, isOpen]);

  const handleSave = () => {
    setGeminiApiKey(apiKeyInput.trim());
    onClose();
  };

  const handleTestKey = async () => {
    if (!apiKeyInput.trim()) return;
    setIsTestLoading(true);
    setTestResult('none');
    try {
      const { testGeminiApiKey } = await import('../lib/gemini');
      const isValid = await testGeminiApiKey(apiKeyInput.trim());
      setTestResult(isValid ? 'success' : 'error');
    } catch {
      setTestResult('error');
    } finally {
      setIsTestLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-xl z-50 border border-zinc-200 dark:border-zinc-800 flex flex-col no-scrollbar"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Ustawienia</h2>
                <button
                  onClick={onClose}
                  className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-zinc-600 dark:text-zinc-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Account / Sync Settings */}
                <div className="space-y-3">
                  <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Konto i Synchronizacja</span>
                  
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 border">
                    {user ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                              <LogIn size={20} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{user.displayName || "Zalogowano"}</p>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 text-sm text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/10 p-3 rounded-xl items-start">
                          <Info size={18} className="shrink-0 mt-0.5" />
                          <p>Listy współdzielone są teraz synchronizowane w chmurze i pojawią się na Twoich pozostałych urządzeniach.</p>
                        </div>
                        <button
                          onClick={signOut}
                          className="w-full flex items-center justify-center gap-2 py-2 mt-1 rounded-xl font-medium text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <LogOut size={18} />
                          Wyloguj
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-2 text-sm text-zinc-600 dark:text-zinc-400 items-start">
                          <Info size={18} className="shrink-0 mt-0.5" />
                          <p>Zaloguj się, aby zsynchronizować "współdzielone" listy między urządzeniami. Listy prywatne pozostają w pamięci telefonu.</p>
                        </div>
                        <button
                          onClick={signIn}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-white bg-primary-500 hover:bg-primary-600 transition-colors"
                        >
                          <LogIn size={18} />
                          Zaloguj się z Google
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Theme toggle */}
                <div className="space-y-3">
                  <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Motyw</span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setTheme('light')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl border transition-all",
                        preferences.theme === 'light' 
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400" 
                          : "border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      )}
                    >
                      <Sun size={18} />
                      <span className="font-medium">Jasny</span>
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl border transition-all",
                        preferences.theme === 'dark' 
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400" 
                          : "border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      )}
                    >
                      <Moon size={18} />
                      <span className="font-medium">Ciemny</span>
                    </button>
                  </div>
                </div>

                {/* Primary Color select */}
                <div className="space-y-3 pt-2 pb-4">
                  <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Kolor wiodący</span>
                  <div className="flex gap-3">
                    {[
                      { id: 'emerald', color: '#10b981', label: 'Zielony' },
                      { id: 'blue', color: '#3b82f6', label: 'Niebieski' },
                      { id: 'violet', color: '#8b5cf6', label: 'Fioletowy' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setPrimaryColor(c.id as any)}
                        className={cn(
                          "flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 p-3 text-sm rounded-2xl border transition-all",
                          preferences.primaryColor === c.id 
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400" 
                            : "border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        )}
                      >
                        <div 
                          className="w-4 h-4 rounded-full shadow-sm shrink-0" 
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="font-medium">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 sticky bottom-0">
              <button
                onClick={handleSave}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 rounded-2xl transition-colors"
              >
                Zapisz ustawienia
              </button>
              <div className="mt-2 text-center text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                Wersja 0.0.94
              </div>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
