import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getItemAsync, setItemAsync, deleteItemAsync } from 'expo-secure-store';
import type { PendingLinkRow, PendingThoughtRow } from '@kurate/hooks';

interface PendingState {
  pendingLinks: PendingLinkRow[];
  pendingThoughts: PendingThoughtRow[];

  addPendingLink: (row: PendingLinkRow) => void;
  getPendingLinkByUrl: (url: string) => PendingLinkRow | undefined;
  updatePendingLinkStatus: (tempId: string, status: string) => void;
  deletePendingLink: (tempId: string) => void;

  addPendingThought: (row: PendingThoughtRow) => void;
  updatePendingThoughtStatus: (tempId: string, status: string) => void;
  deletePendingThought: (tempId: string) => void;
}

export const usePendingStore = create<PendingState>()(
  persist(
    (set, get) => ({
      pendingLinks: [],
      pendingThoughts: [],

      addPendingLink: (row: PendingLinkRow) =>
        set(s => ({ pendingLinks: [...s.pendingLinks, row] })),

      getPendingLinkByUrl: (url: string) =>
        get().pendingLinks.find(r => r.url === url),

      updatePendingLinkStatus: (tempId: string, status: string) =>
        set(s => ({
          pendingLinks: s.pendingLinks.map(r =>
            r.tempId === tempId
              ? { ...r, status: status as PendingLinkRow['status'] }
              : r,
          ),
        })),

      deletePendingLink: (tempId: string) =>
        set(s => ({
          pendingLinks: s.pendingLinks.filter(r => r.tempId !== tempId),
        })),

      addPendingThought: (row: PendingThoughtRow) =>
        set(s => ({ pendingThoughts: [...s.pendingThoughts, row] })),

      updatePendingThoughtStatus: (tempId: string, status: string) =>
        set(s => ({
          pendingThoughts: s.pendingThoughts.map(r =>
            r.tempId === tempId
              ? { ...r, status: status as PendingThoughtRow['status'] }
              : r,
          ),
        })),

      deletePendingThought: (tempId: string) =>
        set(s => ({
          pendingThoughts: s.pendingThoughts.filter(r => r.tempId !== tempId),
        })),
    }),
    {
      name: 'kurate-pending-queue',
      storage: createJSONStorage(() => ({
        getItem: getItemAsync,
        setItem: setItemAsync,
        removeItem: deleteItemAsync,
      })),
    },
  ),
);
