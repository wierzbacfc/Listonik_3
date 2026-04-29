import React from 'react';
import { ShoppingItem, useShoppingStore } from '../store/shoppingStore';
import { motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Circle, Tag, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ProductCardProps {
  item: ShoppingItem;
  onEdit: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ item, onEdit }) => {
  const { updateItem, toggleItemPurchased, deleteItem } = useShoppingStore();

  const handleUrgentToggle = () => {
    updateItem(item.id, { urgent: !item.urgent });
  };

  return (
    <motion.div
      layoutId={item.id}
      layout="position"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative flex items-center gap-2 p-2 rounded-xl transition-all w-full",
        item.purchased 
          ? "border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50 opacity-60" 
          : item.urgent
            ? "border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 shadow-sm"
            : "border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm hover:shadow-md"
      )}
    >
      <button 
        onClick={() => toggleItemPurchased(item.id)}
        className="text-zinc-400 hover:scale-110 transition-transform shrink-0"
      >
        {item.purchased ? (
          <CheckCircle2 className="text-emerald-500" size={20} />
        ) : (
          <Circle size={20} />
        )}
      </button>

      <span className={cn(
        "font-medium flex-1 truncate text-sm",
        item.purchased ? "line-through text-zinc-400 dark:text-zinc-500" : "text-zinc-900 dark:text-zinc-100",
        item.urgent && !item.purchased && "text-amber-700 dark:text-amber-500"
      )}>
        {item.name}
      </span>

      <div className="flex items-center gap-1.5 shrink-0">
        <button 
          onClick={onEdit}
          className="flex items-center justify-center min-w-[2rem] h-7 px-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          x{item.quantity}
        </button>

        <button 
          onClick={onEdit}
          className={cn(
            "flex items-center justify-center h-7 px-1.5 rounded-lg text-xs font-medium transition-colors max-w-[5rem] sm:max-w-none truncate",
            item.promoType !== 'Brak'
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          )}
        >
          <Tag size={12} className="mr-1 shrink-0" />
          <span className="truncate">{item.promoType !== 'Brak' ? item.promoType : 'Promo'}</span>
        </button>

        <button 
          onClick={handleUrgentToggle}
          className={cn(
            "flex items-center justify-center w-7 h-7 rounded-lg transition-colors",
            item.urgent ? "text-amber-600 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-500" : "text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          )}
        >
          <AlertCircle size={14} />
        </button>

        <button 
          onClick={() => deleteItem(item.id)}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
};
