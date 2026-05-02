import React, { useState, useEffect } from 'react';
import { ShoppingItem, Category, useShoppingStore } from '../store/shoppingStore';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { classifyProductWithGemini } from '../lib/gemini';

interface ProductEditModalProps {
  item: ShoppingItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const categories: Category[] = [
  'Pieczywo', 'Nabiał i jajka', 'Mięso i wędliny', 'Owoce', 'Warzywa',
  'Napoje', 'Słodycze i przekąski', 'Kawa i herbata', 'Sypkie i makarony',
  'Przyprawy i sosy', 'Gotowe dania', 'Mrożonki', 'Dla zwierząt', 
  'Kosmetyki', 'Chemia gospodarcza', 'Inne'
];

export const ProductEditModal: React.FC<ProductEditModalProps> = ({ item, isOpen, onClose }) => {
  const { updateItem } = useShoppingStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Inne');
  const [isClassifying, setIsClassifying] = useState(false);

  useEffect(() => {
    if (item && isOpen) {
      setName(item.name);
      setCategory(item.category);
    }
  }, [item?.id, isOpen]);

  if (!item) return null;

  const handleSave = async () => {
    if (!item) return;

    if (name.trim() !== item.name && name.trim().length > 0) {
      setIsClassifying(true);
      try {
        const newCategory = await classifyProductWithGemini(name.trim());
        updateItem(item.id, { name: name.trim(), category: newCategory });
      } catch (error) {
        console.error("Classification failed after rename", error);
        updateItem(item.id, { name: name.trim(), category });
      } finally {
        setIsClassifying(false);
        onClose();
      }
    } else {
      updateItem(item.id, { category });
      onClose();
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden z-50 border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]"
          >
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 truncate pr-2">Edytuj produkt</h2>
              <button
                onClick={onClose}
                className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-zinc-600 dark:text-zinc-400 shrink-0 self-start"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto min-h-0">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 ml-1">Nazwa</label>
                  <textarea
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    rows={2}
                    className="w-full text-lg leading-tight font-semibold bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl outline-none dark:text-zinc-100 p-4 resize-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                    placeholder="Nazwa produktu"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 ml-1">Kategoria</label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCategory(c)}
                        className={cn(
                          "px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left truncate border",
                          category === c
                            ? "bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400"
                            : "bg-zinc-50 dark:bg-zinc-800/50 border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 mt-auto">
              <button
                onClick={handleSave}
                disabled={isClassifying || !name.trim()}
                className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-400 text-white font-medium py-3 rounded-2xl transition-colors flex items-center justify-center gap-2"
              >
                {isClassifying ? <><Loader2 size={20} className="animate-spin" /><span>Sprawdzanie...</span></> : 'Zapisz zmiany'}
              </button>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
