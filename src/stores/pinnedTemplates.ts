import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";

export interface PinnedRepo {
  id: string;
  owner: string;
  repo: string;
  name: string;
  description?: string;
  url: string;
  starred: boolean;
  watching: boolean;
  language?: string;
  starCount: number;
  lastUpdated: string;
  pinnedAt: string;
}

export interface PinnedUser {
  id: string;
  username: string;
  avatarUrl?: string;
  url: string;
  following: boolean;
  bio?: string;
  followers: number;
  publicRepos: number;
  pinnedAt: string;
}

export interface PinnedOrg {
  id: string;
  name: string;
  url: string;
  avatarUrl?: string;
  description?: string;
  followers: number;
  pinnedAt: string;
}

interface PinnedTemplatesState {
  pinnedRepos: PinnedRepo[];
  pinnedUsers: PinnedUser[];
  pinnedOrgs: PinnedOrg[];
  isHydrated: boolean;

  addPinnedRepo: (repo: PinnedRepo) => void;
  removePinnedRepo: (repoId: string) => void;
  updatePinnedRepo: (repoId: string, updates: Partial<PinnedRepo>) => void;
  getPinnedRepo: (owner: string, repo: string) => PinnedRepo | undefined;

  addPinnedUser: (user: PinnedUser) => void;
  removePinnedUser: (userId: string) => void;
  updatePinnedUser: (userId: string, updates: Partial<PinnedUser>) => void;
  getPinnedUser: (username: string) => PinnedUser | undefined;

  addPinnedOrg: (org: PinnedOrg) => void;
  removePinnedOrg: (orgId: string) => void;
  updatePinnedOrg: (orgId: string, updates: Partial<PinnedOrg>) => void;
  getPinnedOrg: (name: string) => PinnedOrg | undefined;

  hydrate: () => void;
}

export const usePinnedTemplatesStore = create<PinnedTemplatesState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        pinnedRepos: [],
        pinnedUsers: [],
        pinnedOrgs: [],
        isHydrated: false,

        addPinnedRepo: (repo) =>
          set((state) => {
            const exists = state.pinnedRepos.some((r) => r.id === repo.id);
            if (exists) return state;
            return { pinnedRepos: [...state.pinnedRepos, repo] };
          }),

        removePinnedRepo: (repoId) =>
          set((state) => ({
            pinnedRepos: state.pinnedRepos.filter((r) => r.id !== repoId),
          })),

        updatePinnedRepo: (repoId, updates) =>
          set((state) => ({
            pinnedRepos: state.pinnedRepos.map((r) =>
              r.id === repoId ? { ...r, ...updates } : r
            ),
          })),

        getPinnedRepo: (owner, repo) => {
          const state = get();
          return state.pinnedRepos.find(
            (r) => r.owner === owner && r.repo === repo
          );
        },

        addPinnedUser: (user) =>
          set((state) => {
            const exists = state.pinnedUsers.some((u) => u.id === user.id);
            if (exists) return state;
            return { pinnedUsers: [...state.pinnedUsers, user] };
          }),

        removePinnedUser: (userId) =>
          set((state) => ({
            pinnedUsers: state.pinnedUsers.filter((u) => u.id !== userId),
          })),

        updatePinnedUser: (userId, updates) =>
          set((state) => ({
            pinnedUsers: state.pinnedUsers.map((u) =>
              u.id === userId ? { ...u, ...updates } : u
            ),
          })),

        getPinnedUser: (username) => {
          const state = get();
          return state.pinnedUsers.find((u) => u.username === username);
        },

        addPinnedOrg: (org) =>
          set((state) => {
            const exists = state.pinnedOrgs.some((o) => o.id === org.id);
            if (exists) return state;
            return { pinnedOrgs: [...state.pinnedOrgs, org] };
          }),

        removePinnedOrg: (orgId) =>
          set((state) => ({
            pinnedOrgs: state.pinnedOrgs.filter((o) => o.id !== orgId),
          })),

        updatePinnedOrg: (orgId, updates) =>
          set((state) => ({
            pinnedOrgs: state.pinnedOrgs.map((o) =>
              o.id === orgId ? { ...o, ...updates } : o
            ),
          })),

        getPinnedOrg: (name) => {
          const state = get();
          return state.pinnedOrgs.find((o) => o.name === name);
        },

        hydrate: () => set({ isHydrated: true }),
      }),
      {
        name: "pinned-templates-storage",
        onRehydrateStorage: () => (state) => {
          state?.hydrate();
        },
      }
    )
  )
);
