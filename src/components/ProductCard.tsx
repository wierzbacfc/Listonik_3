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
          onClick={() => toggleItemPurchased(item.id)}
          className="text-zinc-400 transition-transform shrink-0"
        >
          {item.purchased ? (
            <CheckCircle2 className="text-primary-500" size={20} />
          ) : (
            <Circle size={20} />
          )}
        </motion.button>

        <button 
          onClick={() => toggleItemPurchased(item.id)}
          className={cn(
          "font-display font-medium flex-1 truncate text-base text-left align-middle",
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
            className="flex items-center justify-center w-8 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shrink-0"
          >
            x{item.quantity}
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEdit}
            className={cn(
              "flex items-center justify-center h-7 w-[4.5rem] rounded-lg text-xs font-medium transition-colors shrink-0",
              item.promoType !== 'Brak'
                ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            <Tag size={12} className="mr-1 shrink-0" />
            <span className="truncate leading-none pt-[1px]">{item.promoType !== 'Brak' ? item.promoType : 'Promo'}</span>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleUrgentToggle}
            className={cn(
              "flex items-center justify-center w-7 h-7 rounded-lg transition-all",
              item.urgent ? "text-red-600 bg-red-100 dark:bg-red-500/20 dark:text-red-500 ring-2 ring-red-400/50" : "text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            <AlertCircle size={14} />
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => deleteItem(item.id)}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
          >
            <Trash2 size={14} />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};
