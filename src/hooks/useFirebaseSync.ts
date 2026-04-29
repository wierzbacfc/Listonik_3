import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { ShoppingItem, ShoppingList, useShoppingStore } from '../store/shoppingStore';
import { useAuth } from '../contexts/AuthContext';

export const useFirebaseSync = () => {
  const { user } = useAuth();
  const syncSharedLists = useShoppingStore(state => state.syncSharedLists);

  useEffect(() => {
    if (!user) return; // Only sync when logged in

    const qLists = query(collection(db, 'shared_lists'), where('ownerId', '==', user.uid));
    
    let unsubscribes: { [key: string]: () => void } = {};
    let listsCache: { [key: string]: ShoppingList } = {};

    const unsubLists = onSnapshot(qLists, (snapshot) => {
      const activeListIds = new Set<string>();

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const listId = docSnap.id;
        activeListIds.add(listId);

        if (!listsCache[listId]) {
          listsCache[listId] = {
            id: listId,
            name: data.name,
            createdAt: data.createdAt,
            visibility: data.visibility,
            ownerId: data.ownerId,
            items: [],
          };

          // Setup subcollection listener
          const qItems = query(collection(db, `shared_lists/${listId}/items`), where('listOwnerId', '==', user.uid));
          unsubscribes[listId] = onSnapshot(qItems, (itemSnapshot) => {
            const items = itemSnapshot.docs.map(iDoc => iDoc.data() as ShoppingItem);
            listsCache[listId] = { ...listsCache[listId], items };
            syncSharedLists(Object.values(listsCache));
          }, (err) => console.error("Item sync error:", err));
        } else {
          // Update list metadata and keep items
          listsCache[listId] = {
            ...listsCache[listId],
            name: data.name,
            createdAt: data.createdAt,
            visibility: data.visibility,
            ownerId: data.ownerId,
          };
        }
      });

      // Cleanup removed lists
      Object.keys(listsCache).forEach(id => {
        if (!activeListIds.has(id)) {
          if (unsubscribes[id]) {
            unsubscribes[id]();
            delete unsubscribes[id];
          }
          delete listsCache[id];
        }
      });

      syncSharedLists(Object.values(listsCache));
    }, (err) => console.error("List sync error:", err));

    return () => {
      unsubLists();
      Object.values(unsubscribes).forEach(unsub => unsub());
    };
  }, [user, syncSharedLists]);
};
