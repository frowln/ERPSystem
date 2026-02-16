import { apiClient } from './client';
import type {
  ProjectTask,
  TaskStatus,
  TaskPriority,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

/* ─── Extended task types ─── */

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
  projectId?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  estimatedHours?: number;
  parentTaskId?: string;
  tags?: string[];
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
  comments?: BackendTaskCommentResponse[] | null;
  dependencies?: BackendTaskDependencyResponse[] | null;
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
    dependsOnTaskCode: String(dep.dependsOnTaskId),
    dependsOnTaskTitle: String(dep.dependsOnTaskId),
    type: normalizeDependencyType(dep.dependencyType),
  };
}

function mapTask(task: BackendTaskResponse): ProjectTask {
  return {
    id: String(task.id),
    code: task.code ?? '',
    title: task.title ?? '',
    projectName: task.projectName ?? undefined,
    status: task.status,
    priority: task.priority,
    assigneeName: task.assigneeName ?? undefined,
    plannedStartDate: task.plannedStartDate ?? undefined,
    plannedEndDate: task.plannedEndDate ?? undefined,
    progress: clampProgress(task.progress),
    wbsCode: task.wbsCode ?? undefined,
    subtaskCount: task.subtaskCount ?? 0,
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
    projectId: task.projectId ?? undefined,
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
    const response = await apiClient.post<BackendTaskCommentResponse>(`/tasks/${taskId}/comments`, { content });
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
};
