import { apiClient } from './client';
import { useAuthStore } from '@/stores/authStore';
import type {
  ProjectTask,
  TaskStatus,
  TaskPriority,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

/* ─── Extended task types ─── */

export interface TaskLabel {
  id: string;
  name: string;
  color: string;
  projectId?: string;
}

export interface TaskStage {
  id: string;
  name: string;
  sequence: number;
  projectId?: string;
  color?: string;
  icon?: string;
  description?: string;
  isDefault?: boolean;
  isClosed?: boolean;
  createdAt?: string;
}

export interface TaskTimeEntry {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  startedAt: string;
  stoppedAt?: string;
  durationMinutes: number;
  durationSeconds?: number;
  description?: string;
  isRunning?: boolean;
}

export interface TaskDependencyDto {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependencyType: 'FINISH_TO_START' | 'START_TO_START' | 'FINISH_TO_FINISH' | 'START_TO_FINISH';
  lagDays: number;
  predecessorTaskTitle?: string;
  successorTaskTitle?: string;
}

export interface CreateTaskDependencyRequest {
  taskId?: string;
  dependsOnTaskId?: string;
  predecessorTaskId?: string;
  successorTaskId?: string;
  dependencyType?: string;
  lagDays?: number;
}

export interface CreateTaskStageRequest {
  name: string;
  order?: number;
  projectId?: string;
  color?: string;
  isClosed?: boolean;
}

export interface MyTasksData {
  assigned: ProjectTask[];
  watching: ProjectTask[];
  created: ProjectTask[];
  overdue: ProjectTask[];
  delegatedByMe?: ProjectTask[];
  favorites?: ProjectTask[];
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  action: string;
  detail?: string;
  createdAt: string;
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependsOnTaskCode: string;
  dependsOnTaskTitle: string;
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish';
}

export type ParticipantRole = 'RESPONSIBLE' | 'CO_EXECUTOR' | 'OBSERVER';
export type TaskVisibility = 'PARTICIPANTS_ONLY' | 'PROJECT' | 'ORGANIZATION';

export interface TaskParticipant {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  role: ParticipantRole;
  roleDisplayName: string;
  addedAt: string;
  addedById?: string;
  addedByName?: string;
}

export interface TaskDetail extends ProjectTask {
  description?: string;
  reporterName?: string;
  reporterId?: string;
  assigneeId?: string;
  assigneeAvatarUrl?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  parentTaskId?: string;
  parentTaskCode?: string;
  tags: string[];
  subtasks: ProjectTask[];
  comments: TaskComment[];
  activities: TaskActivity[];
  dependencies: TaskDependency[];
  participants: TaskParticipant[];
  projectId?: string;
  visibility?: TaskVisibility;
  delegatedToId?: string;
  delegatedToName?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  assigneeName?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  estimatedHours?: number;
  parentTaskId?: string;
  tags?: string[];
  visibility?: TaskVisibility;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  progress?: number;
  actualStartDate?: string;
  actualEndDate?: string;
  actualHours?: number;
}

export interface TaskFilters extends PaginationParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  projectId?: string;
  search?: string;
}

export interface GanttTask {
  id: string;
  code: string;
  title: string;
  startDate: string;
  endDate: string;
  progress: number;
  assigneeName?: string;
  dependencies: string[];
  isMilestone: boolean;
  color?: string;
}

export interface WBSNode {
  id: string;
  code: string;
  title: string;
  children: WBSNode[];
  progress: number;
}

export interface ProjectTaskSummary {
  totalTasks: number;
  byStatus: { status: TaskStatus; count: number }[];
  byPriority: { priority: TaskPriority; count: number }[];
  overdue: number;
  completedThisWeek: number;
}

export interface Milestone {
  id: string;
  name: string;
  projectName?: string;
  projectId?: string;
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
  progress: number;
  taskCount: number;
  completedTaskCount: number;
}

interface BackendTaskCommentResponse {
  id: string;
  taskId: string;
  authorId?: string | null;
  authorName?: string | null;
  content?: string | null;
  createdAt: string;
}

interface BackendTaskDependencyResponse {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependencyType?: string | null;
  dependsOnTaskCode?: string | null;
  dependsOnTaskTitle?: string | null;
}

interface BackendTaskParticipantResponse {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  role: ParticipantRole;
  roleDisplayName?: string | null;
  addedAt: string;
  addedById?: string | null;
  addedByName?: string | null;
}

interface BackendTaskResponse {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  parentTaskId?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string | null;
  assigneeName?: string | null;
  reporterId?: string | null;
  reporterName?: string | null;
  plannedStartDate?: string | null;
  plannedEndDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  estimatedHours?: number | string | null;
  actualHours?: number | string | null;
  progress?: number | null;
  wbsCode?: string | null;
  tags?: string | null;
  visibility?: TaskVisibility | null;
  delegatedToId?: string | null;
  delegatedToName?: string | null;
  comments?: BackendTaskCommentResponse[] | null;
  dependencies?: BackendTaskDependencyResponse[] | null;
  participants?: BackendTaskParticipantResponse[] | null;
  subtaskCount?: number | null;
}

interface BackendGanttTaskResponse {
  id: string;
  code: string;
  title: string;
  status?: TaskStatus;
  plannedStartDate?: string | null;
  plannedEndDate?: string | null;
  progress?: number | null;
  assigneeName?: string | null;
  dependencies?: BackendTaskDependencyResponse[] | null;
}

interface BackendTaskSummaryResponse {
  totalTasks: number;
  statusCounts?: Record<string, number>;
  priorityCounts?: Record<string, number>;
  assigneeCounts?: Record<string, number>;
}

interface BackendMilestoneResponse {
  id: string;
  name: string;
  projectId?: string | null;
  dueDate: string;
  status: Milestone['status'];
  progress?: number | null;
}

const TASK_STATUSES: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'];
const TASK_PRIORITIES: TaskPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'];

function clampProgress(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function parseDecimal(value: number | string | null | undefined): number | undefined {
  if (value == null) return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return [];
  return tags
    .split(/[,;]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeDependencyType(type: string | null | undefined): TaskDependency['type'] {
  if (type === 'START_TO_START') return 'start_to_start';
  if (type === 'FINISH_TO_FINISH') return 'finish_to_finish';
  if (type === 'start_to_start') return 'start_to_start';
  if (type === 'finish_to_finish') return 'finish_to_finish';
  return 'finish_to_start';
}

function mapTaskComment(comment: BackendTaskCommentResponse): TaskComment {
  return {
    id: String(comment.id),
    taskId: String(comment.taskId),
    authorId: String(comment.authorId ?? ''),
    authorName: comment.authorName ?? '',
    content: comment.content ?? '',
    createdAt: comment.createdAt,
  };
}

function mapTaskDependency(dep: BackendTaskDependencyResponse): TaskDependency {
  return {
    id: String(dep.id),
    taskId: String(dep.taskId),
    dependsOnTaskId: String(dep.dependsOnTaskId),
    dependsOnTaskCode: dep.dependsOnTaskCode ?? String(dep.dependsOnTaskId).slice(0, 8),
    dependsOnTaskTitle: dep.dependsOnTaskTitle ?? '',
    type: normalizeDependencyType(dep.dependencyType),
  };
}

function mapTask(task: BackendTaskResponse): ProjectTask {
  return {
    id: String(task.id),
    code: task.code ?? '',
    title: task.title ?? '',
    projectId: task.projectId ?? undefined,
    projectName: task.projectName ?? undefined,
    status: task.status,
    priority: task.priority,
    assigneeId: task.assigneeId ?? undefined,
    assigneeName: task.assigneeName ?? undefined,
    plannedStartDate: task.plannedStartDate ?? undefined,
    plannedEndDate: task.plannedEndDate ?? undefined,
    progress: clampProgress(task.progress),
    wbsCode: task.wbsCode ?? undefined,
    subtaskCount: task.subtaskCount ?? 0,
  };
}

function mapParticipant(p: BackendTaskParticipantResponse): TaskParticipant {
  const roleLabels: Record<ParticipantRole, string> = {
    RESPONSIBLE: 'Ответственный',
    CO_EXECUTOR: 'Соисполнитель',
    OBSERVER: 'Наблюдатель',
  };
  return {
    id: String(p.id),
    taskId: String(p.taskId),
    userId: String(p.userId),
    userName: p.userName ?? '',
    role: p.role,
    roleDisplayName: p.roleDisplayName ?? roleLabels[p.role] ?? p.role,
    addedAt: p.addedAt,
    addedById: p.addedById ?? undefined,
    addedByName: p.addedByName ?? undefined,
  };
}

function mapTaskDetail(task: BackendTaskResponse): TaskDetail {
  return {
    ...mapTask(task),
    description: task.description ?? undefined,
    reporterName: task.reporterName ?? undefined,
    reporterId: task.reporterId ?? undefined,
    assigneeId: task.assigneeId ?? undefined,
    actualStartDate: task.actualStartDate ?? undefined,
    actualEndDate: task.actualEndDate ?? undefined,
    estimatedHours: parseDecimal(task.estimatedHours),
    actualHours: parseDecimal(task.actualHours),
    parentTaskId: task.parentTaskId ?? undefined,
    tags: parseTags(task.tags),
    subtasks: [],
    comments: (task.comments ?? []).map(mapTaskComment),
    activities: [],
    dependencies: (task.dependencies ?? []).map(mapTaskDependency),
    participants: (task.participants ?? []).map(mapParticipant),
    projectId: task.projectId ?? undefined,
    visibility: task.visibility ?? undefined,
    delegatedToId: task.delegatedToId ?? undefined,
    delegatedToName: task.delegatedToName ?? undefined,
  };
}

function mapMilestone(milestone: BackendMilestoneResponse): Milestone {
  return {
    id: String(milestone.id),
    name: milestone.name,
    projectId: milestone.projectId ?? undefined,
    dueDate: milestone.dueDate,
    status: milestone.status,
    progress: clampProgress(milestone.progress),
    taskCount: 0,
    completedTaskCount: 0,
  };
}

function mapGanttTask(task: BackendGanttTaskResponse): GanttTask {
  const today = new Date().toISOString().slice(0, 10);
  const startDate = task.plannedStartDate ?? today;
  const endDate = task.plannedEndDate ?? startDate;
  return {
    id: String(task.id),
    code: task.code ?? '',
    title: task.title ?? '',
    startDate,
    endDate,
    progress: clampProgress(task.progress),
    assigneeName: task.assigneeName ?? undefined,
    dependencies: (task.dependencies ?? []).map((dep) => String(dep.dependsOnTaskId)),
    isMilestone: false,
  };
}

/* ─── API ─── */

export const tasksApi = {
  getTasks: async (params?: TaskFilters): Promise<PaginatedResponse<ProjectTask>> => {
    const response = await apiClient.get<PaginatedResponse<BackendTaskResponse>>('/tasks', { params });
    return {
      ...response.data,
      content: response.data.content.map(mapTask),
    };
  },

  getTask: async (id: string): Promise<TaskDetail> => {
    const response = await apiClient.get<BackendTaskResponse>(`/tasks/${id}`);
    return mapTaskDetail(response.data);
  },

  getSubtasks: async (taskId: string): Promise<ProjectTask[]> => {
    const response = await apiClient.get<BackendTaskResponse[]>(`/tasks/${taskId}/subtasks`);
    return response.data.map(mapTask);
  },

  createTask: async (data: CreateTaskRequest): Promise<TaskDetail> => {
    const response = await apiClient.post<BackendTaskResponse>('/tasks', data);
    return mapTaskDetail(response.data);
  },

  updateTask: async (id: string, data: UpdateTaskRequest): Promise<TaskDetail> => {
    const response = await apiClient.put<BackendTaskResponse>(`/tasks/${id}`, data);
    return mapTaskDetail(response.data);
  },

  changeStatus: async (id: string, status: TaskStatus): Promise<TaskDetail> => {
    const response = await apiClient.patch<BackendTaskResponse>(`/tasks/${id}/status`, { status });
    return mapTaskDetail(response.data);
  },

  assignTask: async (id: string, assigneeId: string, assigneeName?: string): Promise<TaskDetail> => {
    const response = await apiClient.patch<BackendTaskResponse>(`/tasks/${id}/assign`, {
      assigneeId,
      assigneeName,
    });
    return mapTaskDetail(response.data);
  },

  updateProgress: async (id: string, progress: number): Promise<TaskDetail> => {
    const response = await apiClient.patch<BackendTaskResponse>(`/tasks/${id}/progress`, { progress });
    return mapTaskDetail(response.data);
  },

  addComment: async (taskId: string, content: string): Promise<TaskComment> => {
    const user = useAuthStore.getState().user;
    const authorName = user?.fullName || (user ? `${user.firstName} ${user.lastName}`.trim() : '');
    const response = await apiClient.post<BackendTaskCommentResponse>(`/tasks/${taskId}/comments`, { content, authorName });
    return mapTaskComment(response.data);
  },

  getProjectWBS: async (projectId: string): Promise<WBSNode[]> => {
    const response = await apiClient.get<BackendTaskResponse[]>(`/tasks/project/${projectId}/wbs`);
    return response.data.map((task) => ({
      id: String(task.id),
      code: task.code ?? '',
      title: task.title ?? '',
      children: [],
      progress: clampProgress(task.progress),
    }));
  },

  getGanttData: async (projectId?: string): Promise<GanttTask[]> => {
    if (projectId) {
      const response = await apiClient.get<BackendGanttTaskResponse[]>(`/tasks/project/${projectId}/gantt`);
      return response.data.map(mapGanttTask);
    }

    const response = await apiClient.get<PaginatedResponse<BackendTaskResponse>>('/tasks', {
      params: { size: 200 },
    });
    return response.data.content.map((task) =>
      mapGanttTask({
        id: task.id,
        code: task.code,
        title: task.title,
        plannedStartDate: task.plannedStartDate,
        plannedEndDate: task.plannedEndDate,
        progress: task.progress,
        assigneeName: task.assigneeName,
        dependencies: task.dependencies,
      }),
    );
  },

  getProjectTaskSummary: async (projectId?: string): Promise<ProjectTaskSummary> => {
    if (!projectId) {
      return {
        totalTasks: 0,
        byStatus: [],
        byPriority: [],
        overdue: 0,
        completedThisWeek: 0,
      };
    }

    const [summaryResponse, overdueResponse] = await Promise.all([
      apiClient.get<BackendTaskSummaryResponse>(`/tasks/project/${projectId}/summary`),
      apiClient.get<BackendTaskResponse[]>(`/tasks/project/${projectId}/overdue`),
    ]);

    const summary = summaryResponse.data;

    return {
      totalTasks: Number(summary.totalTasks ?? 0),
      byStatus: Object.entries(summary.statusCounts ?? {})
        .filter(([status]) => TASK_STATUSES.includes(status as TaskStatus))
        .map(([status, count]) => ({ status: status as TaskStatus, count: Number(count ?? 0) })),
      byPriority: Object.entries(summary.priorityCounts ?? {})
        .filter(([priority]) => TASK_PRIORITIES.includes(priority as TaskPriority))
        .map(([priority, count]) => ({ priority: priority as TaskPriority, count: Number(count ?? 0) })),
      overdue: overdueResponse.data.length,
      completedThisWeek: 0,
    };
  },

  getMilestones: async (): Promise<Milestone[]> => {
    const response = await apiClient.get<PaginatedResponse<BackendMilestoneResponse>>('/milestones');
    return response.data.content.map(mapMilestone);
  },

  createMilestone: async (
    data: { name: string; projectId?: string; dueDate: string; description?: string },
  ): Promise<Milestone> => {
    const response = await apiClient.post<BackendMilestoneResponse>('/milestones', data);
    return mapMilestone(response.data);
  },

  completeMilestone: async (id: string): Promise<Milestone> => {
    const response = await apiClient.post<BackendMilestoneResponse>(`/milestones/${id}/complete`);
    return mapMilestone(response.data);
  },

  bulkDelete: async (ids: string[]): Promise<void> => {
    await apiClient.post('/tasks/bulk-delete', { ids });
  },

  bulkChangeStatus: async (ids: string[], status: TaskStatus): Promise<void> => {
    await apiClient.post('/tasks/bulk-status', { ids, status });
  },

  getMyTasks: async (_userId?: string): Promise<MyTasksData> => {
    const response = await apiClient.get<{
      assigned: BackendTaskResponse[];
      delegatedByMe: BackendTaskResponse[];
      favorites: BackendTaskResponse[];
    }>('/tasks/my');
    const raw = response.data;
    return {
      assigned: (raw.assigned ?? []).map(mapTask),
      delegatedByMe: (raw.delegatedByMe ?? []).map(mapTask),
      favorites: (raw.favorites ?? []).map(mapTask),
      watching: [],
      created: [],
      overdue: [],
    };
  },

  delegateTask: async (id: string, delegateToId: string, delegateToName?: string, comment?: string): Promise<TaskDetail> => {
    const response = await apiClient.post<BackendTaskResponse>(`/tasks/${id}/delegate`, {
      delegateToId,
      delegateToName,
      comment,
    });
    return mapTaskDetail(response.data);
  },

  // --- Participants ---
  getParticipants: async (taskId: string): Promise<TaskParticipant[]> => {
    const response = await apiClient.get<BackendTaskParticipantResponse[]>(`/tasks/${taskId}/participants`);
    return response.data.map(mapParticipant);
  },

  addParticipant: async (taskId: string, data: { userId: string; userName: string; role: ParticipantRole }): Promise<TaskParticipant> => {
    const response = await apiClient.post<BackendTaskParticipantResponse>(`/tasks/${taskId}/participants`, data);
    return mapParticipant(response.data);
  },

  removeParticipant: async (taskId: string, userId: string, role: ParticipantRole): Promise<void> => {
    await apiClient.delete(`/tasks/${taskId}/participants/${userId}`, { params: { role } });
  },

  getActivityFeed: async (taskId: string): Promise<TaskActivity[]> => {
    const response = await apiClient.get<TaskActivity[]>(`/tasks/${taskId}/activity`);
    return response.data;
  },

  // --- Labels ---
  getLabels: async (projectId?: string): Promise<TaskLabel[]> => {
    const response = await apiClient.get<TaskLabel[]>('/task-labels', { params: projectId ? { projectId } : undefined });
    return response.data;
  },

  getTaskLabels: async (taskId: string): Promise<TaskLabel[]> => {
    const response = await apiClient.get<TaskLabel[]>(`/tasks/${taskId}/labels`);
    return response.data;
  },

  createLabel: async (data: { name: string; color: string; projectId?: string }): Promise<TaskLabel> => {
    const response = await apiClient.post<TaskLabel>('/task-labels', data);
    return response.data;
  },

  deleteLabel: async (id: string): Promise<void> => {
    await apiClient.delete(`/task-labels/${id}`);
  },

  assignLabel: async (taskId: string, labelId: string): Promise<void> => {
    await apiClient.post(`/task-labels/tasks/${taskId}/labels/${labelId}`);
  },

  removeLabel: async (taskId: string, labelId: string): Promise<void> => {
    await apiClient.delete(`/task-labels/tasks/${taskId}/labels/${labelId}`);
  },

  // --- Stages ---
  getStages: async (projectId?: string): Promise<TaskStage[]> => {
    const response = await apiClient.get<TaskStage[]>('/task-stages', { params: projectId ? { projectId } : undefined });
    return response.data;
  },

  createStage: async (data: CreateTaskStageRequest): Promise<TaskStage> => {
    const response = await apiClient.post<TaskStage>('/task-stages', data);
    return response.data;
  },

  updateStage: async (id: string, data: Partial<CreateTaskStageRequest>): Promise<TaskStage> => {
    const response = await apiClient.put<TaskStage>(`/task-stages/${id}`, data);
    return response.data;
  },

  deleteStage: async (id: string): Promise<void> => {
    await apiClient.delete(`/task-stages/${id}`);
  },

  reorderStages: async (projectId: string, stageIds: string[]): Promise<void> => {
    await apiClient.post('/task-stages/reorder', stageIds, { params: { projectId } });
  },

  // --- Time tracking ---
  getTimeEntries: async (taskId: string): Promise<TaskTimeEntry[]> => {
    const response = await apiClient.get<TaskTimeEntry[]>(`/tasks/${taskId}/time-entries`);
    return response.data;
  },

  startTimer: async (taskId: string, _description?: string, _projectId?: string): Promise<TaskTimeEntry> => {
    const response = await apiClient.post<TaskTimeEntry>(`/tasks/${taskId}/timer/start`);
    return response.data;
  },

  stopTimer: async (taskId: string, _notes?: string): Promise<TaskTimeEntry> => {
    const response = await apiClient.post<TaskTimeEntry>(`/tasks/${taskId}/timer/stop`);
    return response.data;
  },
};

/* ─── Favorites (localStorage-backed, no backend needed) ─── */

const FAVORITES_KEY = 'privod-favorite-tasks';

function readFavoriteIds(): Set<string> {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function writeFavoriteIds(ids: Set<string>) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...ids]));
}

export const taskFavoritesApi = {
  getIds: (): Set<string> => readFavoriteIds(),

  isFavorite: (taskId: string): boolean => readFavoriteIds().has(taskId),

  toggle: (taskId: string): boolean => {
    const ids = readFavoriteIds();
    const added = !ids.has(taskId);
    if (added) ids.add(taskId); else ids.delete(taskId);
    writeFavoriteIds(ids);
    return added;
  },
};

export const taskDependenciesApi = {
  getForTask: async (taskId: string): Promise<TaskDependencyDto[]> => {
    const response = await apiClient.get<TaskDependencyDto[]>(`/tasks/${taskId}/dependencies`);
    return response.data;
  },
  create: async (data: CreateTaskDependencyRequest): Promise<TaskDependencyDto> => {
    const response = await apiClient.post<TaskDependencyDto>('/task-dependencies', data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/dependencies/${id}`);
  },
};
