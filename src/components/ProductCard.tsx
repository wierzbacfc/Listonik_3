import React, { useRef } from 'react';
import { ShoppingItem, useShoppingStore } from '../store/shoppingStore';
import { triggerActionFeedback } from '../lib/audio';
import { motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Circle, Tag, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ProductCardProps {
  item: ShoppingItem;
  onEdit: () => void;
  onEditProduct: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ item, onEdit, onEditProduct }) => {
  const { updateItem, toggleItemPurchased, deleteItem } = useShoppingStore();
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const startPress = () => {
    isLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      onEditProduct();
    }, 500); // 500ms long press
  };

  const cancelPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleTogglePurchased = () => {
    triggerActionFeedback('check');
    toggleItemPurchased(item.id);
  };

  const handleUrgentToggle = () => {
    updateItem(item.id, { urgent: !item.urgent });
  };

  return (
    <motion.div
      layout
      layoutId={item.id}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full overflow-hidden"
    >
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
        "group relative flex items-center gap-2 p-2 rounded-xl transition-colors w-full cursor-pointer",
        item.purchased 
          ? "border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50 opacity-60" 
          : item.urgent
            ? "border-2 border-red-400 bg-red-50 dark:border-red-500/60 dark:bg-red-950/30 shadow-md transform scale-[1.01]"
            : "border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm hover:shadow-md"
      )}>
        <motion.button 
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85 }}
          onClick={handleTogglePurchased}
          className="text-zinc-400 transition-transform shrink-0"
        >
          {item.purchased ? (
            <CheckCircle2 className="text-primary-500" size={20} />
          ) : (
            <Circle size={20} />
          )}
        </motion.button>

        <button 
          onClick={(e) => {
             if (isLongPress.current) {
               e.preventDefault();
               isLongPress.current = false;
             } else {
               handleTogglePurchased();
             }
             cancelPress();
          }}
          onTouchStart={startPress}
          onTouchEnd={cancelPress}
          onTouchMove={cancelPress}
          onMouseDown={startPress}
          onMouseUp={cancelPress}
          onMouseLeave={cancelPress}
          className={cn(
          "font-display font-medium flex-1 text-left align-middle line-clamp-2 leading-[1.15] text-[13.5px] pr-1",
          item.purchased ? "line-through text-zinc-400 dark:text-zinc-500" : "text-zinc-900 dark:text-zinc-100",
          item.urgent && !item.purchased && "text-red-700 dark:text-red-400 font-semibold"
        )}>
          {item.name}
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onEdit}
            className={cn(
              "flex items-center justify-center h-8 w-9 rounded-xl text-[11px] sm:text-xs transition-all shrink-0 border overflow-hidden",
              item.quantity > 1 
                ? "bg-amber-100 border-amber-300/60 text-amber-700 dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-400 shadow-sm transform-gpu font-bold" 
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-transparent dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-medium"
            )}
          >
            x{item.quantity}
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEdit}
            className={cn(
              "flex items-center justify-center h-8 px-2 min-w-[3.5rem] rounded-xl text-[10px] sm:text-[11px] transition-all shrink-0 border overflow-hidden",
              item.promoType !== 'Brak'
                ? "bg-amber-100 border-amber-300/60 text-amber-700 dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-400 shadow-sm"
                : "bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            <span className="truncate leading-none pt-[1px]">{item.promoType !== 'Brak' ? <span className="font-bold tracking-wide">{item.promoType}</span> : <span className="font-medium tracking-normal">Promo</span>}</span>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleUrgentToggle}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-xl transition-all",
              item.urgent ? "text-red-600 bg-red-100 dark:bg-red-500/20 dark:text-red-500 ring-2 ring-red-400/50" : "text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            <AlertCircle size={15} />
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => deleteItem(item.id)}
            className="flex items-center justify-center w-8 h-8 rounded-xl text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
          >
            <Trash2 size={15} />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};
