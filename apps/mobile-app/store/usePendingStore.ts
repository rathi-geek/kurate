import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PendingLinkRow,
  PendingThoughtRow,
  PendingGroupPostRow,
} from '@kurate/hooks';
import { mmkvStorage } from '@/libs/mmkv-storage';

interface PendingState {
  pendingLinks: PendingLinkRow[];
  pendingThoughts: PendingThoughtRow[];
  pendingGroupPosts: PendingGroupPostRow[];

  addPendingLink: (row: PendingLinkRow) => void;
  getPendingLinkByUrl: (url: string) => PendingLinkRow | undefined;
  updatePendingLinkStatus: (tempId: string, status: string) => void;
  deletePendingLink: (tempId: string) => void;

  addPendingThought: (row: PendingThoughtRow) => void;
  updatePendingThoughtStatus: (tempId: string, status: string) => void;
  deletePendingThought: (tempId: string) => void;

  addPendingGroupPost: (row: PendingGroupPostRow) => void;
  updatePendingGroupPostStatus: (
    tempId: string,
    status: string,
    serverId?: string,
  ) => void;
  deletePendingGroupPost: (tempId: string) => void;
  getPendingGroupPostsForGroup: (groupId: string) => PendingGroupPostRow[];
}

export const usePendingStore = create<PendingState>()(
  persist(
    (set, get) => ({
      pendingLinks: [],
      pendingThoughts: [],
      pendingGroupPosts: [],

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

      addPendingGroupPost: (row: PendingGroupPostRow) =>
        set(s => ({ pendingGroupPosts: [...s.pendingGroupPosts, row] })),

      updatePendingGroupPostStatus: (
        tempId: string,
        status: string,
        serverId?: string,
      ) =>
        set(s => ({
          pendingGroupPosts: s.pendingGroupPosts.map(r =>
            r.tempId === tempId
              ? {
                  ...r,
                  status: status as PendingGroupPostRow['status'],
                  ...(serverId !== undefined ? { serverId } : {}),
                }
              : r,
          ),
        })),

      deletePendingGroupPost: (tempId: string) =>
        set(s => ({
          pendingGroupPosts: s.pendingGroupPosts.filter(
            r => r.tempId !== tempId,
          ),
        })),

      getPendingGroupPostsForGroup: (groupId: string) =>
        get().pendingGroupPosts.filter(r => r.convo_id === groupId),
    }),
    {
      name: 'kurate-pending-queue',
      storage: mmkvStorage,
    },
  ),
);
