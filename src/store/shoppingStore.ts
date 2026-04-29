import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Category, CatalogItem, initialCatalog } from '../data/catalog';
import { auth, db } from '../firebase';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export type PromoType = 'Brak' | '1+1' | '2+1' | '2+2' | 'Karta' | 'Kupon';

export interface ShoppingItem {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  promoType: PromoType;
  urgent: boolean;
  purchased: boolean;
  listOwnerId?: string;
  updatedAt?: number;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
  createdAt: number;
  visibility?: 'private' | 'shared';
  ownerId?: string;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface UserPreferences {
  theme: 'light' | 'dark';
  primaryColor: 'emerald' | 'blue' | 'violet';
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
  setPrimaryColor: (color: 'emerald' | 'blue' | 'violet') => void;
  setGeminiApiKey: (key: string) => void;
  
  // Firebase Sync
  syncSharedLists: (sharedLists: ShoppingList[]) => void;
  
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
        primaryColor: 'emerald',
        geminiApiKey: '',
      },

      addList: (name, visibility = 'shared') => set((state) => {
        const id = uuidv4();
        if (visibility === 'shared' && auth.currentUser) {
          setDoc(doc(db, 'shared_lists', id), {
            id, name, createdAt: Date.now(), visibility, ownerId: auth.currentUser.uid
          }).catch(e => handleFirestoreError(e, OperationType.CREATE, `shared_lists/${id}`));
        }
        const newList: ShoppingList = {
          id,
          name,
          items: [],
          createdAt: Date.now(),
          visibility,
          ownerId: auth.currentUser?.uid
        };
        return {
          lists: [...state.lists, newList],
          currentListId: state.currentListId || newList.id,
        };
      }),

      deleteList: (id) => set((state) => {
        const list = state.lists.find(l => l.id === id);
        if (list?.visibility === 'shared' && auth.currentUser) {
          deleteDoc(doc(db, 'shared_lists', id)).catch(e => handleFirestoreError(e, OperationType.DELETE, `shared_lists/${id}`));
        }
        return {
          lists: state.lists.filter((l) => l.id !== id),
          currentListId: state.currentListId === id 
            ? (state.lists.find(l => l.id !== id)?.id || null) 
            : state.currentListId
        };
      }),

      updateList: (id, updates) => set((state) => {
        const list = state.lists.find(l => l.id === id);
        if (list?.visibility === 'shared' && auth.currentUser) {
          updateDoc(doc(db, 'shared_lists', id), updates as any).catch(e => handleFirestoreError(e, OperationType.UPDATE, `shared_lists/${id}`));
        }
        return {
          lists: state.lists.map(list => list.id === id ? { ...list, ...updates } : list)
        };
      }),

      setCurrentList: (id) => set({ currentListId: id }),

      addItem: (name, category) => set((state) => {
        if (!state.currentListId) return state;
        const list = state.lists.find(l => l.id === state.currentListId);
        
        const newItem: ShoppingItem = {
          id: uuidv4(),
          name,
          category,
          quantity: 1,
          promoType: 'Brak',
          urgent: false,
          purchased: false,
          listOwnerId: list?.visibility === 'shared' ? auth.currentUser?.uid : undefined,
          updatedAt: Date.now()
        };

        if (list?.visibility === 'shared' && auth.currentUser) {
          setDoc(doc(db, `shared_lists/${list.id}/items`, newItem.id), newItem as any).catch(e => handleFirestoreError(e, OperationType.CREATE, `shared_lists/${list.id}/items/${newItem.id}`));
        }

        const updatedLists = state.lists.map(l => {
          if (l.id === state.currentListId) {
            return { ...l, items: [...l.items, newItem] };
          }
          return l;
        });

        return { lists: updatedLists };
      }),

      updateItem: (id, updates) => set((state) => {
        if (!state.currentListId) return state;
        const list = state.lists.find(l => l.id === state.currentListId);
        const item = list?.items.find(i => i.id === id);
        
        if (list?.visibility === 'shared' && auth.currentUser && item) {
          updateDoc(doc(db, `shared_lists/${list.id}/items`, id), { ...updates, updatedAt: Date.now() } as any).catch(e => handleFirestoreError(e, OperationType.UPDATE, `shared_lists/${list.id}/items/${id}`));
        }

        const updatedLists = state.lists.map(l => {
          if (l.id === state.currentListId) {
            return {
              ...l,
              items: l.items.map(item => item.id === id ? { ...item, ...updates, updatedAt: Date.now() } : item)
            };
          }
          return l;
        });
        return { lists: updatedLists };
      }),

      deleteItem: (id) => set((state) => {
        if (!state.currentListId) return state;
        const list = state.lists.find(l => l.id === state.currentListId);
        
        if (list?.visibility === 'shared' && auth.currentUser) {
          deleteDoc(doc(db, `shared_lists/${list.id}/items`, id)).catch(e => handleFirestoreError(e, OperationType.DELETE, `shared_lists/${list.id}/items/${id}`));
        }

        const updatedLists = state.lists.map(l => {
          if (l.id === state.currentListId) {
            return {
              ...l,
              items: l.items.filter(item => item.id !== id)
            };
          }
          return l;
        });
        return { lists: updatedLists };
      }),

      toggleItemPurchased: (id) => set((state) => {
        if (!state.currentListId) return state;
        const list = state.lists.find(l => l.id === state.currentListId);
        const item = list?.items.find(i => i.id === id);
        
        if (list?.visibility === 'shared' && auth.currentUser && item) {
          updateDoc(doc(db, `shared_lists/${list.id}/items`, id), { purchased: !item.purchased, updatedAt: Date.now() } as any).catch(e => handleFirestoreError(e, OperationType.UPDATE, `shared_lists/${list.id}/items/${id}`));
        }

        const updatedLists = state.lists.map(l => {
          if (l.id === state.currentListId) {
            return {
              ...l,
              items: l.items.map(item => item.id === id ? { ...item, purchased: !item.purchased, updatedAt: Date.now() } : item)
            };
          }
          return l;
        });
        return { lists: updatedLists };
      }),

      clearPurchased: () => set((state) => {
        if (!state.currentListId) return state;
        const list = state.lists.find(l => l.id === state.currentListId);
        
        if (list?.visibility === 'shared' && auth.currentUser) {
          list.items.forEach(item => {
            if (item.purchased) {
              deleteDoc(doc(db, `shared_lists/${list.id}/items`, item.id)).catch(e => handleFirestoreError(e, OperationType.DELETE, `shared_lists/${list.id}/items/${item.id}`));
            }
          });
        }

        const updatedLists = state.lists.map(l => {
          if (l.id === state.currentListId) {
            return {
              ...l,
              items: l.items.filter(item => !item.purchased)
            };
          }
          return l;
        });
        return { lists: updatedLists };
      }),

      addToUserCatalog: (name, category) => set((state) => ({
        userCatalog: [...state.userCatalog, { name, category }]
      })),

      setTheme: (theme) => set((state) => ({
        preferences: { ...state.preferences, theme }
      })),

      setPrimaryColor: (color) => set((state) => ({
        preferences: { ...state.preferences, primaryColor: color }
      })),

      setGeminiApiKey: (key) => set((state) => ({
        preferences: { ...state.preferences, geminiApiKey: key }
      })),

      syncSharedLists: (sharedLists) => set((state) => {
        // Keep private lists, merge with shared lists from Firebase
        const privateLists = state.lists.filter(l => l.visibility !== 'shared');
        return { lists: [...privateLists, ...sharedLists] };
      }),

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
