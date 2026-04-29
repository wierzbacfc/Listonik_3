import React, { useState, useEffect } from 'react';
import { useShoppingStore } from '../store/shoppingStore';
import { motion, AnimatePresence } from 'motion/react';
import { X, Moon, Sun, Key, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { preferences, setTheme, setPrimaryColor, setGeminiApiKey } = useShoppingStore();
  const [apiKeyInput, setApiKeyInput] = useState(preferences.geminiApiKey);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<'none' | 'success' | 'error'>('none');

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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden z-50 border border-zinc-200 dark:border-zinc-800"
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
                <div className="space-y-3 pt-2">
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

                {/* API Key */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => {
                          setApiKeyInput(e.target.value);
                          setTestResult('none');
                        }}
                        placeholder="Wklej klucz API Gemini..."
                        className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary-500 outline-none transition-shadow placeholder:text-zinc-400"
                      />
                    </div>
                    <button
                      onClick={handleTestKey}
                      disabled={isTestLoading || !apiKeyInput.trim()}
                      className={cn(
                        "px-4 rounded-2xl font-medium text-sm transition-colors flex items-center justify-center min-w-[80px]",
                        testResult === 'success' 
                          ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400" 
                          : testResult === 'error'
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:pointer-events-none"
                      )}
                    >
                      {isTestLoading ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : testResult === 'success' ? (
                        'OK'
                      ) : testResult === 'error' ? (
                        'Błąd'
                      ) : (
                        'Sprawdź'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={handleSave}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 rounded-2xl transition-colors"
              >
                Zapisz ustawienia
              </button>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
