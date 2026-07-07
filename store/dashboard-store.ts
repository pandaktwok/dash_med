import { create } from "zustand";

interface DashboardStore {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tasksSearchQuery: string;
  tasksProjectFilter: string[];
  projectsSearchQuery: string;
  projectStatusFilter: string;
  setTasksSearchQuery: (query: string) => void;
  setTasksProjectFilter: (projectIds: string[]) => void;
  toggleTasksProjectFilter: (projectId: string) => void;
  setProjectsSearchQuery: (query: string) => void;
  setProjectStatusFilter: (filter: string) => void;
  clearFilters: () => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  activeTab: "painel",
  setActiveTab: (tab) => set({ activeTab: tab }),
  tasksSearchQuery: "",
  tasksProjectFilter: [],
  projectsSearchQuery: "",
  projectStatusFilter: "all",
  setTasksSearchQuery: (query) => set({ tasksSearchQuery: query }),
  setTasksProjectFilter: (projectIds) => set({ tasksProjectFilter: projectIds }),
  toggleTasksProjectFilter: (projectId) =>
    set((state) => ({
      tasksProjectFilter: state.tasksProjectFilter.includes(projectId)
        ? state.tasksProjectFilter.filter((id) => id !== projectId)
        : [...state.tasksProjectFilter, projectId],
    })),
  setProjectsSearchQuery: (query) => set({ projectsSearchQuery: query }),
  setProjectStatusFilter: (filter) => set({ projectStatusFilter: filter }),
  clearFilters: () =>
    set({
      activeTab: "painel",
      tasksSearchQuery: "",
      tasksProjectFilter: [],
      projectsSearchQuery: "",
      projectStatusFilter: "all",
    }),
}));
