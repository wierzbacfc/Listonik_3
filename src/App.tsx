import React, { useEffect, useState, useRef } from 'react';
import { useShoppingStore, ShoppingItem } from './store/shoppingStore';
import { ProductCard } from './components/ProductCard';
import { ProductInput } from './components/ProductInput';
import { SettingsModal } from './components/SettingsModal';
import { ItemEditModal } from './components/ItemEditModal';
import { ProductEditModal } from './components/ProductEditModal';
import { Settings, Plus, List, Trash2, Lock, Users, MoreVertical, Edit2, Download, Cloud, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { useFirebaseSync } from './hooks/useFirebaseSync';

export default function App() {
  useFirebaseSync();
  const { lists, currentListId, addList, setCurrentList, preferences, clearPurchased, deleteList, updateList } = useShoppingStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingProductItemId, setEditingProductItemId] = useState<string | null>(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListVisibility, setNewListVisibility] = useState<'private' | 'shared'>('shared');
  const [listToDelete, setListToDelete] = useState<string | null>(null);
  const [notifyListId, setNotifyListId] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  const [listMenuContext, setListMenuContext] = useState<{ id: string, x: number, y: number } | null>(null);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListName, setEditingListName] = useState('');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const wasDragged = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

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
    document.documentElement.setAttribute('data-theme', preferences.primaryColor || 'emerald');
  }, [preferences.theme, preferences.primaryColor]);

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
      addList(newListName.trim(), newListVisibility);
      setNewListName('');
      setNewListVisibility('shared');
      setIsAddingList(false);
    }
  };

  const handleNotifyMissing = async () => {
    if (!notifyListId) return;
    const list = lists.find(l => l.id === notifyListId);
    if (!list) {
      setNotifyListId(null);
      return;
    }
    const missingItems = list.items.filter(i => !i.purchased);
    if (missingItems.length === 0) {
      alert("Wszystkie produkty na tej liście zostały już kupione!");
      setNotifyListId(null);
      return;
    }

    const text = `Hej, zostało nam jeszcze do kupienia z listy "${list.name}":\n\n` + 
      missingItems.map(i => `- ${i.name}${i.quantity > 1 ? ` (${i.quantity} szt.)` : ''}`).join('\n') + 
      `\n\nCzy możesz po to wstąpić?`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Braki na liście: ${list.name}`,
          text: text
        });
      } else {
        await navigator.clipboard.writeText(text);
        alert("Tekst został skopiowany do schowka, ponieważ Twoja przeglądarka nie obsługuje natywnego udostępniania.");
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        console.error("Error sharing", e);
      }
    }
    setNotifyListId(null);
  };

  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col font-sans transition-colors duration-300 relative">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 w-full h-16 flex items-center justify-between gap-2 relative">
          
          <div className="flex items-center gap-2 pr-1 shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAddingList(true)}
              className="p-2 rounded-xl bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-500/30 transition-colors shrink-0 flex items-center justify-center shadow-sm"
            >
              <Plus size={22} />
            </motion.button>
            <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 shrink-0 ml-1" />
          </div>

          <div 
            ref={scrollContainerRef}
            onMouseDown={onMouseDown}
            onMouseLeave={onMouseLeave}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
            style={{ maskImage: 'linear-gradient(to right, transparent, black 12px, black calc(100% - 12px), transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 12px, black calc(100% - 12px), transparent)' }}
            className="flex-1 overflow-x-auto flex items-center gap-2 no-scrollbar touch-pan-x pl-2 pr-4 py-1 h-full cursor-grab active:cursor-grabbing select-none"
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
                      "w-32 px-3 py-1.5 rounded-full text-xs font-medium bg-primary-50 text-primary-900 border border-primary-500 outline-none shadow-sm dark:bg-primary-900/30 dark:text-primary-100 dark:border-primary-500/50"
                    )}
                  />
                </form>
              ) : (
                <motion.button
                  key={list.id}
                  whileHover={{ scale: currentListId === list.id ? 1.05 : 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleListClick(e, list.id)}
                  className={cn(
                    "whitespace-nowrap pl-2 pr-4 py-1.5 rounded-xl border transition-all duration-200 shrink-0 flex items-center gap-2.5 relative shadow-sm text-sm font-display",
                    currentListId === list.id
                      ? "bg-primary-500 border-primary-600 dark:border-primary-400 text-white font-semibold shadow-md"
                      : "bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/80 text-zinc-600 dark:text-zinc-300 font-medium hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-200 dark:hover:border-primary-500/30 hover:text-primary-700 dark:hover:text-primary-300"
                  )}
                >
                  {list.visibility === 'shared' ? (
                    <div className={cn(
                      "flex items-center justify-center p-1.5 rounded-lg shrink-0",
                      currentListId === list.id 
                        ? "bg-white/25 text-white shadow-inner" 
                        : "bg-blue-50 border border-blue-200/50 text-blue-600 dark:bg-blue-500/20 dark:border-blue-500/30 dark:text-blue-400"
                    )}>
                      <Cloud size={14} className={currentListId === list.id ? "" : "opacity-80"} />
                    </div>
                  ) : (
                    <div className={cn(
                      "flex items-center justify-center p-1.5 rounded-lg shrink-0",
                      currentListId === list.id 
                        ? "bg-white/20 text-white shadow-inner" 
                        : "bg-zinc-100 border border-zinc-200 text-zinc-500 dark:bg-zinc-700/50 dark:border-zinc-600 dark:text-zinc-400"
                    )}>
                      <Lock size={14} className={currentListId === list.id ? "opacity-90" : "opacity-80"} />
                    </div>
                  )}
                  <div className="flex flex-col items-start leading-[1.1] justify-center mt-0.5">
                    <span className={cn(
                      "text-[9px] uppercase font-bold tracking-[0.08em]",
                      currentListId === list.id 
                        ? "opacity-80" 
                        : list.visibility === 'shared' 
                          ? "text-blue-500 dark:text-blue-400 opacity-90" 
                          : "text-zinc-400 dark:text-zinc-500"
                    )}>
                      {list.visibility === 'shared' ? 'Z chmury' : 'Lokalna'}
                    </span>
                    <span>{list.name}</span>
                  </div>
                </motion.button>
              )
            ))}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {deferredPrompt && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleInstallClick}
                className="p-2 rounded-full text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-colors"
                title="Zainstaluj aplikację na urządzeniu"
              >
                <Download size={22} />
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              <Settings size={22} />
            </motion.button>
          </div>
        </div>
        
        {/* Animated Progress Bar */}
        <div className="w-full h-[18px] bg-zinc-200 dark:bg-zinc-800/80 relative flex items-center justify-center overflow-hidden">
          <motion.div 
            className="absolute left-0 top-0 bottom-0 bg-primary-500 shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]"
            initial={{ width: 0 }}
            animate={{ width: `${items.length > 0 ? (items.filter(i => i.purchased).length / items.length) * 100 : 0}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          <span className="relative z-10 text-[11px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] tracking-wider">
            {items.filter(i => i.purchased).length} / {items.length}
          </span>
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
              <button
                onClick={() => {
                  setNotifyListId(listMenuContext.id);
                  setListMenuContext(null);
                }}
                className="flex items-center gap-2 px-2 py-2 rounded-xl text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors text-left"
              >
                <Bell size={16} /> Powiadom o brakach
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
              <img 
                src="https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=300&h=300&fit=crop" 
                alt="Sad cat" 
                className="w-40 h-40 object-cover rounded-3xl mb-4 opacity-70 sepia-[.3]"
              />
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Brak produktów</p>
            </motion.div>
          ) : (
            <motion.div 
              key={currentListId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
            <motion.div layout className="space-y-1">
              <AnimatePresence>
                {Object.entries(groupedItems).map(([category, catItems]) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }} 
                    transition={{ duration: 0.2 }}
                    key={category} 
                    className="space-y-0.5"
                  >
                    <motion.h3 layout className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1 sticky top-12 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-sm z-10 py-1">
                      {category}
                    </motion.h3>
                    <motion.div layout className="flex flex-col relative pb-1 gap-1">
                      <AnimatePresence initial={false}>
                        {catItems.map(item => (
                          <ProductCard 
                            key={item.id} 
                            item={item} 
                            onEdit={() => setEditingItemId(item.id)}
                            onEditProduct={() => setEditingProductItemId(item.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            <AnimatePresence>
              {purchasedItems.length > 0 && (
                <motion.div 
                  layout
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.2 }}
                  className="pt-4 border-t border-zinc-200 dark:border-zinc-800"
                >
                  <motion.h3 layout className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1 mb-2">
                    W koszyku
                  </motion.h3>
                  <motion.div layout className="flex flex-col mb-4 relative pb-1 gap-1">
                    <AnimatePresence initial={false}>
                      {purchasedItems.map(item => (
                        <ProductCard 
                          key={item.id} 
                          item={item} 
                          onEdit={() => setEditingItemId(item.id)}
                          onEditProduct={() => setEditingProductItemId(item.id)}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                  
                  <motion.button
                    layout
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={clearPurchased}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
                  >
                    <Trash2 size={16} />
                    Usuń kupione ({purchasedItems.length})
                  </motion.button>
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

      <ProductEditModal
        isOpen={!!editingProductItemId}
        item={items.find(i => i.id === editingProductItemId) || null}
        onClose={() => setEditingProductItemId(null)}
      />

      {/* Add List Modal */}
      <AnimatePresence>
        {isAddingList && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingList(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xl border border-zinc-200 dark:border-zinc-800"
            >
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Nowa lista zakupów</h3>
              <form onSubmit={handleAddList} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nazwa listy</label>
                  <input
                    autoFocus
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="np. Zakupy na weekend"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Typ listy</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewListVisibility('shared')}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors border",
                        newListVisibility === 'shared'
                          ? "bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-500/20 dark:border-primary-500/30 dark:text-primary-300"
                          : "bg-transparent border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
                      )}
                    >
                      <Users size={16} />
                      Wspólna
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewListVisibility('private')}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors border",
                        newListVisibility === 'private'
                          ? "bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-500/20 dark:border-primary-500/30 dark:text-primary-300"
                          : "bg-transparent border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
                      )}
                    >
                      <Lock size={16} />
                      Prywatna
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingList(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    disabled={!newListName.trim()}
                    className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-primary-500 hover:bg-primary-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Dodaj
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

      {/* Notify Missing Modal */}
      <AnimatePresence>
        {notifyListId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNotifyListId(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xl border border-zinc-200 dark:border-zinc-800"
            >
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Powiadom o brakach</h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-sm">
                Czy chcesz wysłać powiadomienie do drugiego użytkownika z listą rzeczy do kupienia? Wysłanie spowoduje udostępnienie tekstu do innej aplikacji.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setNotifyListId(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleNotifyMissing}
                  className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-primary-500 hover:bg-primary-600 text-white transition-colors"
                >
                  Wyślij
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
