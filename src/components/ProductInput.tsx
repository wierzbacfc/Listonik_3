import React, { useState, useRef, useEffect } from 'react';
import { useShoppingStore } from '../store/shoppingStore';
import { initialCatalog } from '../data/catalog';
import { classifyProductWithGemini } from '../lib/gemini';
import { PromoType } from '../store/shoppingStore';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { triggerActionFeedback } from '../lib/audio';
import { Send, Loader2, Plus, Sparkles, Tag, Check } from 'lucide-react';

export const ProductInput: React.FC = () => {
  const [input, setInput] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [promoType, setPromoType] = useState<PromoType>('Brak');
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
    setQuantity(1);
    setPromoType('Brak');
    setShowSuggestions(false);
    inputRef.current?.focus();
    triggerActionFeedback('add');

    if (predefinedCategory) {
      addItem(capitalizedName, predefinedCategory as any, quantity, promoType);
      return;
    }

    // 1. Initial catalog exact match
    const initialExactMatch = initialCatalog.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (initialExactMatch) {
      const matchName = initialExactMatch.name.charAt(0).toUpperCase() + initialExactMatch.name.slice(1);
      addItem(matchName, initialExactMatch.category, quantity, promoType);
      return;
    }

    // 2. Initial catalog partial match
    const initialPartialMatch = initialCatalog.find(c => 
      c.name.toLowerCase().includes(trimmed.toLowerCase()) || 
      trimmed.toLowerCase().includes(c.name.toLowerCase())
    );

    if (initialPartialMatch) {
      addItem(capitalizedName, initialPartialMatch.category, quantity, promoType);
      return;
    }

    // 3. User catalog exact match (we do this last so that bad previous entries like 'chleb' -> 'Inne' are overridden by initial partial match)
    const userExactMatch = userCatalog.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (userExactMatch) {
      const matchName = userExactMatch.name.charAt(0).toUpperCase() + userExactMatch.name.slice(1);
      addItem(matchName, userExactMatch.category, quantity, promoType);
      return;
    }
    
    // 4. Gemini classification
    setIsClassifying(true);
    try {
      const category = await classifyProductWithGemini(trimmed, preferences.geminiApiKey);
      addToUserCatalog(capitalizedName, category);
      addItem(capitalizedName, category, quantity, promoType);
    } catch (error) {
      console.error("Classification failed", error);
      addToUserCatalog(capitalizedName, 'Inne');
      addItem(capitalizedName, 'Inne', quantity, promoType);
    } finally {
      setIsClassifying(false);
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

      <div className="flex flex-col gap-2 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] shadow-xl overflow-hidden transition-all">
        <div className="flex items-center gap-2">
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
            className="flex-1 min-w-0 bg-transparent border-none outline-none pl-5 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 py-2.5 text-lg"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAdd(input)}
            disabled={!input.trim() || isClassifying}
            className="w-14 h-14 shrink-0 rounded-[1.25rem] bg-primary-500 hover:bg-primary-600 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 text-white flex items-center justify-center shadow-md border-none outline-none"
          >
            {isClassifying ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Plus size={26} />
            )}
          </motion.button>
        </div>
        
        <AnimatePresence>
          {(input.trim().length > 0 || quantity > 1 || promoType !== 'Brak') && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-col gap-3 px-3 pb-2 pt-1"
            >
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden h-9 shadow-sm">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 h-full bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors font-medium"
                  >
                    -
                  </button>
                  <div className="w-8 text-center text-sm font-bold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900">{quantity}</div>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 h-full bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors font-medium"
                  >
                    +
                  </button>
                </div>
                
                <div className="w-[1px] h-6 bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block"></div>
                
                {(['Brak', '1+1', '2+1', '2+2', 'Wielosztuka', 'Karta', 'Kupon'] as PromoType[]).map(promo => (
                  <button
                    key={promo}
                    onClick={() => setPromoType(promo)}
                    className={cn(
                      "px-3 h-9 rounded-xl border text-[11px] sm:text-xs font-medium whitespace-nowrap transition-colors shrink-0",
                      promoType === promo 
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    )}
                  >
                    {promo}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
