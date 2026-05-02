import React from 'react';
import { ShoppingItem, PromoType, useShoppingStore } from '../store/shoppingStore';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface ItemEditModalProps {
  item: ShoppingItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ItemEditModal: React.FC<ItemEditModalProps> = ({ item, isOpen, onClose }) => {
  const { updateItem } = useShoppingStore();

  if (!item) return null;

  const handleQtyChange = (delta: number) => {
    const newQty = Math.max(1, item.quantity + delta);
    updateItem(item.id, { quantity: newQty });
  };

  const handleSetQty = (qty: number) => {
    updateItem(item.id, { quantity: Math.max(1, qty) });
  };

  const handlePromoChange = (promo: PromoType) => {
    updateItem(item.id, { promoType: promo });
  };

  const promos: PromoType[] = ['Brak', '1+1', '2+1', '2+2', 'Wielosztuka', 'Karta', 'Kupon'];
  const qtyPresets = [1, 2, 3, 4, 5, 6, 7, 8, 9];

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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden z-50 border border-zinc-200 dark:border-zinc-800"
          >
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 truncate pr-4">
                {item.name}
              </h2>
              <button
                onClick={onClose}
                className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-zinc-600 dark:text-zinc-400 shrink-0 self-start mt-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Quantity */}
              <div className="space-y-3">
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Liczba sztuk</span>
                
                <div className="grid grid-cols-3 gap-2">
                   {qtyPresets.map(qty => (
                     <button
                       key={qty}
                       onClick={() => handleSetQty(qty)}
                       className={cn(
                         "py-2 rounded-xl text-base font-bold transition-all border",
                         item.quantity === qty
                           ? "border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 shadow-sm"
                           : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 border-zinc-100 dark:border-zinc-800/60"
                       )}
                     >
                       {qty}
                     </button>
                   ))}
                </div>
              </div>

              {/* Promo */}
              <div className="space-y-3">
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Promocja</span>
                <div className="flex flex-wrap justify-center gap-2">
                  {promos.map(promo => (
                    <button
                      key={promo}
                      onClick={() => handlePromoChange(promo)}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-3 rounded-xl border transition-all text-base font-medium",
                        item.promoType === promo
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400"
                          : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      )}
                    >
                      <span>{promo}</span>
                      {item.promoType === promo && <Check size={16} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={onClose}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 rounded-2xl transition-colors"
              >
                Gotowe
              </button>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
