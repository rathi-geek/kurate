import type { PendingDB } from '@kurate/hooks';
import { usePendingStore } from '@/store/usePendingStore';

export const mobilePendingDb: PendingDB = {
  addPendingLink: async row => {
    usePendingStore.getState().addPendingLink(row);
  },

  getPendingLinkByUrl: async url => {
    return usePendingStore.getState().getPendingLinkByUrl(url) ?? null;
  },

  updatePendingLinkStatus: async (tempId, status) => {
    usePendingStore.getState().updatePendingLinkStatus(tempId, status);
  },

  deletePendingLink: async tempId => {
    usePendingStore.getState().deletePendingLink(tempId);
  },

  getAllPendingLinks: async () => {
    return usePendingStore.getState().pendingLinks;
  },

  addPendingThought: async row => {
    usePendingStore.getState().addPendingThought(row);
  },

  updatePendingThoughtStatus: async (tempId, status) => {
    usePendingStore.getState().updatePendingThoughtStatus(tempId, status);
  },

  deletePendingThought: async tempId => {
    usePendingStore.getState().deletePendingThought(tempId);
  },

  getAllPendingThoughts: async () => {
    return usePendingStore.getState().pendingThoughts;
  },

  addPendingGroupPost: async row => {
    usePendingStore.getState().addPendingGroupPost(row);
  },

  updatePendingGroupPostStatus: async (tempId, status, serverId) => {
    usePendingStore
      .getState()
      .updatePendingGroupPostStatus(tempId, status, serverId);
  },

  deletePendingGroupPost: async tempId => {
    usePendingStore.getState().deletePendingGroupPost(tempId);
  },

  getAllPendingGroupPosts: async () => {
    return usePendingStore.getState().pendingGroupPosts;
  },

  getPendingGroupPostsForGroup: async groupId => {
    return usePendingStore.getState().getPendingGroupPostsForGroup(groupId);
  },
};
