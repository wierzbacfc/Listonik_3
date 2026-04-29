import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Category, CatalogItem, initialCatalog } from '../data/catalog';

export type PromoType = 'Brak' | '1+1' | '2+1' | '2+2' | 'Karta' | 'Kupon';

export interface ShoppingItem {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  promoType: PromoType;
  urgent: boolean;
  purchased: boolean;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
  createdAt: number;
  visibility?: 'private' | 'shared';
}

interface UserPreferences {
  theme: 'light' | 'dark';
  geminiApiKey: string;
}

interface ShoppingStore {
  lists: ShoppingList[];
  currentListId: string | null;
  userCatalog: CatalogItem[];
  preferences: UserPreferences;
  
  // Actions
  addList: (name: string, visibility?: 'private' | 'shared') => void;
  deleteList: (id: string) => void;
  updateList: (id: string, updates: Partial<ShoppingList>) => void;
  setCurrentList: (id: string) => void;
  
  addItem: (name: string, category: Category) => void;
  updateItem: (id: string, updates: Partial<ShoppingItem>) => void;
  deleteItem: (id: string) => void;
  toggleItemPurchased: (id: string) => void;
  clearPurchased: () => void;
  
  addToUserCatalog: (name: string, category: Category) => void;
  
  setTheme: (theme: 'light' | 'dark') => void;
  setGeminiApiKey: (key: string) => void;
  
  // Getters
  getFullCatalog: () => CatalogItem[];
}

export const useShoppingStore = create<ShoppingStore>()(
  persist(
    (set, get) => ({
      lists: [],
      currentListId: null,
      userCatalog: [],
      preferences: {
        theme: 'light',
        geminiApiKey: '',
      },

      addList: (name, visibility = 'shared') => set((state) => {
        const newList: ShoppingList = {
          id: uuidv4(),
          name,
          items: [],
          createdAt: Date.now(),
          visibility,
        };
        return {
          lists: [...state.lists, newList],
          currentListId: state.currentListId || newList.id,
        };
      }),

      deleteList: (id) => set((state) => ({
        lists: state.lists.filter((l) => l.id !== id),
        currentListId: state.currentListId === id 
          ? (state.lists.find(l => l.id !== id)?.id || null) 
          : state.currentListId
      })),

      updateList: (id, updates) => set((state) => ({
        lists: state.lists.map(list => list.id === id ? { ...list, ...updates } : list)
      })),

      setCurrentList: (id) => set({ currentListId: id }),

      addItem: (name, category) => set((state) => {
        if (!state.currentListId) return state;
        
        const newItem: ShoppingItem = {
          id: uuidv4(),
          name,
          category,
          quantity: 1,
          promoType: 'Brak',
          urgent: false,
          purchased: false,
        };

        const updatedLists = state.lists.map(list => {
          if (list.id === state.currentListId) {
            return { ...list, items: [...list.items, newItem] };
          }
          return list;
        });

        return { lists: updatedLists };
      }),

      updateItem: (id, updates) => set((state) => {
        if (!state.currentListId) return state;
        const updatedLists = state.lists.map(list => {
          if (list.id === state.currentListId) {
            return {
              ...list,
              items: list.items.map(item => item.id === id ? { ...item, ...updates } : item)
            };
          }
          return list;
        });
        return { lists: updatedLists };
      }),

      deleteItem: (id) => set((state) => {
        if (!state.currentListId) return state;
        const updatedLists = state.lists.map(list => {
          if (list.id === state.currentListId) {
            return {
              ...list,
              items: list.items.filter(item => item.id !== id)
            };
          }
          return list;
        });
        return { lists: updatedLists };
      }),

      toggleItemPurchased: (id) => set((state) => {
        if (!state.currentListId) return state;
        const updatedLists = state.lists.map(list => {
          if (list.id === state.currentListId) {
            return {
              ...list,
              items: list.items.map(item => item.id === id ? { ...item, purchased: !item.purchased } : item)
            };
          }
          return list;
        });
        return { lists: updatedLists };
      }),

      clearPurchased: () => set((state) => {
        if (!state.currentListId) return state;
        const updatedLists = state.lists.map(list => {
          if (list.id === state.currentListId) {
            return {
              ...list,
              items: list.items.filter(item => !item.purchased)
            };
          }
          return list;
        });
        return { lists: updatedLists };
      }),

      addToUserCatalog: (name, category) => set((state) => ({
        userCatalog: [...state.userCatalog, { name, category }]
      })),

      setTheme: (theme) => set((state) => ({
        preferences: { ...state.preferences, theme }
      })),

      setGeminiApiKey: (key) => set((state) => ({
        preferences: { ...state.preferences, geminiApiKey: key }
      })),

      getFullCatalog: () => {
        const { userCatalog } = get();
        return [...initialCatalog, ...userCatalog];
      }
    }),
    {
      name: 'shopping-storage',
    }
  )
);
