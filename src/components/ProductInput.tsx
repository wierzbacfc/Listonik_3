import React, { useState, useRef, useEffect } from 'react';
import { useShoppingStore } from '../store/shoppingStore';
import { initialCatalog } from '../data/catalog';
import { classifyProductWithGemini } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Loader2, Plus, Sparkles } from 'lucide-react';

export const ProductInput: React.FC = () => {
  const [input, setInput] = useState('');
  const [isClassifying, setIsClassifying] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { addItem, getFullCatalog, addToUserCatalog, preferences, userCatalog } = useShoppingStore();
  
  const fullCatalog = getFullCatalog();
  const suggestions = input.trim() 
    ? fullCatalog.filter(c => c.name.toLowerCase().includes(input.toLowerCase().trim())).slice(0, 5)
    : [];

  const handleAdd = async (name: string, predefinedCategory?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    
    const capitalizedName = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

    // Clear input immediately for UX
    setInput('');
    setShowSuggestions(false);
    inputRef.current?.focus();

    if (predefinedCategory) {
      addItem(capitalizedName, predefinedCategory as any);
      return;
    }

    // 1. Initial catalog exact match
    const initialExactMatch = initialCatalog.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (initialExactMatch) {
      const matchName = initialExactMatch.name.charAt(0).toUpperCase() + initialExactMatch.name.slice(1);
      addItem(matchName, initialExactMatch.category);
      return;
    }

    // 2. Initial catalog partial match
    const initialPartialMatch = initialCatalog.find(c => 
      c.name.toLowerCase().includes(trimmed.toLowerCase()) || 
      trimmed.toLowerCase().includes(c.name.toLowerCase())
    );

    if (initialPartialMatch) {
      addItem(capitalizedName, initialPartialMatch.category);
      return;
    }

    // 3. User catalog exact match (we do this last so that bad previous entries like 'chleb' -> 'Inne' are overridden by initial partial match)
    const userExactMatch = userCatalog.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (userExactMatch) {
      const matchName = userExactMatch.name.charAt(0).toUpperCase() + userExactMatch.name.slice(1);
      addItem(matchName, userExactMatch.category);
      return;
    }
    
    // 4. Gemini or fallback
    if (preferences.geminiApiKey) {
      setIsClassifying(true);
      try {
        const category = await classifyProductWithGemini(trimmed, preferences.geminiApiKey);
        addToUserCatalog(capitalizedName, category);
        addItem(capitalizedName, category);
      } finally {
        setIsClassifying(false);
      }
    } else {
      addToUserCatalog(capitalizedName, 'Inne');
      addItem(capitalizedName, 'Inne');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd(input);
    }
  };

  return (
    <div className="relative w-full">
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full mb-2 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-lg overflow-hidden flex flex-col"
          >
            {suggestions.map((item, idx) => (
              <motion.button
                whileHover={{ scale: 1.01, backgroundColor: "var(--zinc-50)" }}
                whileTap={{ scale: 0.99 }}
                key={idx}
                onClick={() => handleAdd(item.name, item.category)}
                className="text-left px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 transition-colors flex items-center justify-between"
              >
                <span className="text-zinc-900 dark:text-zinc-100">{item.name}</span>
                <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">{item.category}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-lg">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder="Dodaj produkt..."
          className="flex-1 bg-transparent border-none outline-none pl-4 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleAdd(input)}
          disabled={!input.trim() || isClassifying}
          className="w-10 h-10 shrink-0 rounded-full bg-primary-500 hover:bg-primary-600 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 text-white flex items-center justify-center shadow-md border-none outline-none"
        >
          {isClassifying ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Plus size={22} />
          )}
        </motion.button>
      </div>
    </div>
  );
};
