export const dashboardStats = {
  totalProjects: { value: 15, change: 5 },
  totalTasks: { value: 10, change: 2 },
  inReviews: { value: 23, change: 12 },
  completedTasks: { value: 50, change: 15 },
};

export const performanceScore = 86;
export const performanceChange = 15;

export const performanceChartData = [
  { day: "Seg", value: 78 },
  { day: "Ter", value: 82 },
  { day: "Qua", value: 92 },
  { day: "Qui", value: 85 },
  { day: "Sex", value: 88 },
  { day: "Sáb", value: 80 },
].map((d, i, arr) => {
  const isMax = d.value === Math.max(...arr.map((x) => x.value));
  return { ...d, isHighlight: isMax };
});

export type ProjectStatus = "in_progress" | "completed" | "on_hold";

export interface TodayTask {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  projectColor: string;
  dueDate: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  status: ProjectStatus;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  dueDate: string;
  ownerName: string;
  ownerAvatarSeed: string;
}

export const todayTasks: TodayTask[] = [
  {
    id: "1",
    name: "Preparar relatório do Q2",
    projectId: "p1",
    projectName: "Projeto Fintech",
    projectColor: "blue",
    dueDate: "12 Mar 2024",
  },
  {
    id: "2",
    name: "Revisar mockups de design",
    projectId: "p2",
    projectName: "Sistema de Design",
    projectColor: "violet",
    dueDate: "14 Mar 2024",
  },
  {
    id: "3",
    name: "Atualizar documentação da API",
    projectId: "p3",
    projectName: "API de Backend",
    projectColor: "cyan",
    dueDate: "15 Mar 2024",
  },
  {
    id: "4",
    name: "Corrigir bug no fluxo de login",
    projectId: "p1",
    projectName: "Projeto Fintech",
    projectColor: "blue",
    dueDate: "12 Mar 2024",
  },
  {
    id: "5",
    name: "Agendar alinhamento da equipe",
    projectId: "p4",
    projectName: "Marketing",
    projectColor: "pink",
    dueDate: "16 Mar 2024",
  },
];

const projectSeeds: Omit<Project, "id">[] = [
  { name: "Projeto Fintech", color: "blue", status: "in_progress", progress: 70, totalTasks: 20, completedTasks: 14, dueDate: "12 Mar 2024", ownerName: "Michael M.", ownerAvatarSeed: "michael" },
  { name: "Sistema de Design", color: "violet", status: "in_progress", progress: 45, totalTasks: 15, completedTasks: 7, dueDate: "20 Mar 2024", ownerName: "Sarah K.", ownerAvatarSeed: "sarah" },
  { name: "API de Backend", color: "cyan", status: "completed", progress: 100, totalTasks: 12, completedTasks: 12, dueDate: "10 Mar 2024", ownerName: "James L.", ownerAvatarSeed: "james" },
  { name: "Marketing", color: "pink", status: "on_hold", progress: 30, totalTasks: 8, completedTasks: 2, dueDate: "25 Mar 2024", ownerName: "Emily R.", ownerAvatarSeed: "emily" },
  { name: "Aplicativo Móvel", color: "amber", status: "in_progress", progress: 60, totalTasks: 25, completedTasks: 15, dueDate: "18 Mar 2024", ownerName: "David T.", ownerAvatarSeed: "david" },
  { name: "Redesenho Brodo", color: "blue", status: "in_progress", progress: 55, totalTasks: 18, completedTasks: 10, dueDate: "22 Mar 2024", ownerName: "Alex P.", ownerAvatarSeed: "alex" },
  { name: "Configuração de RH", color: "violet", status: "completed", progress: 100, totalTasks: 10, completedTasks: 10, dueDate: "08 Mar 2024", ownerName: "Jordan L.", ownerAvatarSeed: "jordan" },
  { name: "Pipeline de Dados", color: "cyan", status: "in_progress", progress: 80, totalTasks: 14, completedTasks: 11, dueDate: "15 Mar 2024", ownerName: "Sam R.", ownerAvatarSeed: "sam" },
  { name: "Portal do Cliente", color: "pink", status: "on_hold", progress: 25, totalTasks: 22, completedTasks: 5, dueDate: "30 Mar 2024", ownerName: "Morgan K.", ownerAvatarSeed: "morgan" },
  { name: "API Gateway", color: "amber", status: "in_progress", progress: 90, totalTasks: 8, completedTasks: 7, dueDate: "14 Mar 2024", ownerName: "Casey M.", ownerAvatarSeed: "casey" },
  { name: "Painel v2", color: "blue", status: "in_progress", progress: 40, totalTasks: 30, completedTasks: 12, dueDate: "28 Mar 2024", ownerName: "Taylor W.", ownerAvatarSeed: "taylor" },
  { name: "Serviço de Autenticação", color: "violet", status: "completed", progress: 100, totalTasks: 6, completedTasks: 6, dueDate: "05 Mar 2024", ownerName: "Riley B.", ownerAvatarSeed: "riley" },
  { name: "Campanha de E-mail", color: "pink", status: "on_hold", progress: 15, totalTasks: 12, completedTasks: 2, dueDate: "02 Abr 2024", ownerName: "Quinn F.", ownerAvatarSeed: "quinn" },
  { name: "Site de Documentação", color: "cyan", status: "in_progress", progress: 65, totalTasks: 16, completedTasks: 10, dueDate: "19 Mar 2024", ownerName: "Avery S.", ownerAvatarSeed: "avery" },
  { name: "Fluxo de Pagamento", color: "amber", status: "in_progress", progress: 75, totalTasks: 11, completedTasks: 8, dueDate: "21 Mar 2024", ownerName: "Reese N.", ownerAvatarSeed: "reese" },
  { name: "Onboarding", color: "blue", status: "completed", progress: 100, totalTasks: 9, completedTasks: 9, dueDate: "11 Mar 2024", ownerName: "Parker D.", ownerAvatarSeed: "parker" },
  { name: "Análise de Dados", color: "violet", status: "in_progress", progress: 50, totalTasks: 20, completedTasks: 10, dueDate: "24 Mar 2024", ownerName: "Drew H.", ownerAvatarSeed: "drew" },
  { name: "Notificações", color: "cyan", status: "on_hold", progress: 35, totalTasks: 7, completedTasks: 2, dueDate: "05 Abr 2024", ownerName: "Blake J.", ownerAvatarSeed: "blake" },
  { name: "Índice de Busca", color: "pink", status: "in_progress", progress: 85, totalTasks: 13, completedTasks: 11, dueDate: "16 Mar 2024", ownerName: "Cameron T.", ownerAvatarSeed: "cameron" },
  { name: "Relatórios", color: "amber", status: "completed", progress: 100, totalTasks: 15, completedTasks: 15, dueDate: "09 Mar 2024", ownerName: "Jamie V.", ownerAvatarSeed: "jamie" },
];

export const projects: Project[] = projectSeeds.map((p, i) => ({ ...p, id: `p${i + 1}` }));

export const welcomeSummary = {
  userName: "LN",
  tasksDueToday: 4,
  overdueTasks: 2,
  upcomingDeadlines: 8,
};

export const lastUpdated = "12 Mai 2025";
