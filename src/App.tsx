import React, { useEffect, useState, useRef } from 'react';
import { useShoppingStore, ShoppingItem } from './store/shoppingStore';
import { ProductCard } from './components/ProductCard';
import { ProductInput } from './components/ProductInput';
import { SettingsModal } from './components/SettingsModal';
import { ItemEditModal } from './components/ItemEditModal';
import { Settings, Plus, List, Trash2, Lock, Users, MoreVertical, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

export default function App() {
  const { lists, currentListId, addList, setCurrentList, preferences, clearPurchased, deleteList, updateList } = useShoppingStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [listToDelete, setListToDelete] = useState<string | null>(null);
  
  const [listMenuContext, setListMenuContext] = useState<{ id: string, x: number, y: number } | null>(null);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListName, setEditingListName] = useState('');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const wasDragged = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    isDragging.current = true;
    wasDragged.current = false;
    startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeft.current = scrollContainerRef.current.scrollLeft;
  };

  const onMouseLeave = () => {
    isDragging.current = false;
  };

  const onMouseUp = () => {
    isDragging.current = false;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    if (Math.abs(walk) > 5) {
      wasDragged.current = true;
    }
    scrollContainerRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleListClick = (e: React.MouseEvent<HTMLButtonElement>, listId: string) => {
    if (wasDragged.current) {
      wasDragged.current = false;
      return;
    }
    if (currentListId === listId) {
      const rect = e.currentTarget.getBoundingClientRect();
      setListMenuContext({
        id: listId,
        x: rect.left,
        y: rect.bottom + 8
      });
    } else {
      setCurrentList(listId);
    }
  };

  // Initial load theme
  useEffect(() => {
    if (preferences.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences.theme]);

  // Create initial list if none exists
  useEffect(() => {
    if (lists.length === 0) {
      addList('Moje zakupy');
    }
  }, [lists, addList]);

  const currentList = lists.find(l => l.id === currentListId);
  const items = currentList?.items || [];

  const unpurchasedItems = items.filter(i => !i.purchased);
  const purchasedItems = items.filter(i => i.purchased);

  // Group items by category (unpurchased only)
  const groupedItems = unpurchasedItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  const handleAddList = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListName.trim()) {
      addList(newListName.trim());
      setNewListName('');
      setIsAddingList(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col font-sans transition-colors duration-300 relative">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-2 w-full h-12 flex items-center justify-between gap-2 relative">
          
          <div className="flex items-center">
            {isAddingList ? (
              <form onSubmit={handleAddList} className="flex items-center pr-2">
                <input
                  autoFocus
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  onBlur={() => setIsAddingList(false)}
                  placeholder="Nowa lista..."
                  className="w-28 px-3 py-1.5 rounded-full text-xs bg-white dark:bg-zinc-900 border border-emerald-500 outline-none shadow-sm"
                />
              </form>
            ) : (
              <button
                onClick={() => setIsAddingList(true)}
                className="p-1.5 mr-2 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors shrink-0 flex items-center justify-center shadow-sm"
              >
                <Plus size={18} />
              </button>
            )}
            {!isAddingList && <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 shrink-0 mr-2" />}
          </div>

          <div 
            ref={scrollContainerRef}
            onMouseDown={onMouseDown}
            onMouseLeave={onMouseLeave}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
            className="flex-1 overflow-x-auto flex items-center gap-1.5 no-scrollbar touch-pan-x pr-2 h-full cursor-grab active:cursor-grabbing select-none"
          >
            {lists.map(list => (
              editingListId === list.id ? (
                <form 
                  key={list.id} 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (editingListName.trim()) updateList(list.id, { name: editingListName.trim() });
                    setEditingListId(null);
                  }}
                  className="flex items-center shrink-0"
                >
                  <input
                    autoFocus
                    value={editingListName}
                    onChange={(e) => setEditingListName(e.target.value)}
                    onBlur={() => {
                        if (editingListName.trim()) updateList(list.id, { name: editingListName.trim() });
                        setEditingListId(null);
                    }}
                    className={cn(
                      "w-32 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-500 outline-none shadow-sm dark:bg-emerald-900/30 dark:text-emerald-100 dark:border-emerald-500/50"
                    )}
                  />
                </form>
              ) : (
                <button
                  key={list.id}
                  onClick={(e) => handleListClick(e, list.id)}
                  className={cn(
                    "whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 flex items-center gap-1 relative",
                    currentListId === list.id
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  )}
                >
                  {list.visibility === 'shared' ? <Users size={12} className="opacity-70" /> : <Lock size={12} className="opacity-70" />}
                  {list.name}
                </button>
              )
            ))}
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors shrink-0"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* List Dropdown Menu */}
      <AnimatePresence>
        {listMenuContext && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setListMenuContext(null)}
              className="fixed inset-0 z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              style={{ 
                top: listMenuContext.y, 
                left: Math.max(10, Math.min(listMenuContext.x, window.innerWidth - 180)) 
              }}
              className="fixed z-50 w-44 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-1.5 flex flex-col gap-1 overflow-hidden"
            >
              <div className="px-2 py-1.5 mb-1 border-b border-zinc-100 dark:border-zinc-800/50">
                <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Ustawienia listy
                </span>
              </div>
              <button
                onClick={() => {
                  setEditingListId(listMenuContext.id);
                  setEditingListName(lists.find(l => l.id === listMenuContext.id)?.name || '');
                  setListMenuContext(null);
                }}
                className="flex items-center gap-2 px-2 py-2 rounded-xl text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors text-left"
              >
                <Edit2 size={16} /> Zmień nazwę
              </button>
              <div className="h-px bg-zinc-100 dark:bg-zinc-800/50 my-0.5" />
              <button
                onClick={() => {
                  updateList(listMenuContext.id, { visibility: 'private' });
                  setListMenuContext(null);
                }}
                className="flex items-center gap-2 px-2 py-2 rounded-xl text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors text-left"
              >
                <Lock size={16} /> Prywatna
              </button>
              <button
                onClick={() => {
                  updateList(listMenuContext.id, { visibility: 'shared' });
                  setListMenuContext(null);
                }}
                className="flex items-center gap-2 px-2 py-2 rounded-xl text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors text-left"
              >
                <Users size={16} /> Współdzielona
              </button>
              <div className="h-px bg-zinc-100 dark:bg-zinc-800/50 my-0.5" />
              <button
                onClick={() => {
                  setListToDelete(listMenuContext.id);
                  setListMenuContext(null);
                }}
                className="flex items-center gap-2 px-2 py-2 rounded-xl text-sm hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors text-left"
              >
                <Trash2 size={16} /> Usuń listę
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-2 pb-24 pt-3 relative">
        <AnimatePresence mode="wait">
          {items.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col items-center justify-center text-center opacity-50 mt-10"
            >
              <List size={40} className="mb-3 text-zinc-300 dark:text-zinc-700" />
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">Brak produktów na liście.</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Dodaj coś za pomocą pola poniżej.</p>
            </motion.div>
          ) : (
            <motion.div 
              key={currentListId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
            <motion.div layout className="space-y-4">
              <AnimatePresence mode="popLayout">
                {Object.entries(groupedItems).map(([category, catItems]) => (
                  <motion.div 
                    layout 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }} 
                    key={category} 
                    className="space-y-1"
                  >
                    <h3 className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1 sticky top-12 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-sm z-10 py-1">
                      {category}
                    </h3>
                    <motion.div layout className="flex flex-col relative pb-1 gap-1">
                      <AnimatePresence mode="popLayout">
                        {catItems.map(item => (
                          <ProductCard 
                            key={item.id} 
                            item={item} 
                            onEdit={() => setEditingItemId(item.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            <AnimatePresence mode="popLayout">
              {purchasedItems.length > 0 && (
                <motion.div 
                  layout 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  className="pt-4 border-t border-zinc-200 dark:border-zinc-800"
                >
                  <h3 className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1 mb-2">
                    W koszyku
                  </h3>
                  <motion.div layout className="flex flex-col mb-4 relative pb-1 gap-1">
                    <AnimatePresence mode="popLayout">
                      {purchasedItems.map(item => (
                        <ProductCard 
                          key={item.id} 
                          item={item} 
                          onEdit={() => setEditingItemId(item.id)}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                  
                  <button
                    onClick={clearPurchased}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
                  >
                    <Trash2 size={16} />
                    Usuń kupione ({purchasedItems.length})
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </main>

      {/* Fixed Bottom Input */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-zinc-50 via-zinc-50 to-transparent dark:from-zinc-950 dark:via-zinc-950 pb-6 pt-12 z-40 px-4">
        <div className="max-w-2xl mx-auto relative drop-shadow-xl">
          <ProductInput />
        </div>
      </div>

      <ItemEditModal
        isOpen={!!editingItemId}
        item={items.find(i => i.id === editingItemId) || null}
        onClose={() => setEditingItemId(null)}
      />

      {/* Delete List Modal */}
      <AnimatePresence>
        {listToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setListToDelete(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xl border border-zinc-200 dark:border-zinc-800"
            >
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Usuwanie listy</h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-sm">
                Czy na pewno chcesz usunąć tę listę zakupów? Tej operacji nie można cofnąć.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setListToDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={() => {
                    deleteList(listToDelete);
                    setListToDelete(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  Usuń listę
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}
