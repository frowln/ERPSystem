export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';

export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';

export interface ProjectTask {
  id: string;
  code: string;
  title: string;
  description?: string;
  projectId?: string;
  projectName?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  assigneeName?: string;
  reporterId?: string;
  reporterName?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  progress: number;
  wbsCode?: string;
  parentTaskId?: string;
  subtaskCount: number;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  tasks: ProjectTask[];
  count: number;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedByName: string;
  createdAt: string;
}

export interface TaskActivityEntry {
  id: string;
  taskId: string;
  action: string;
  details: string;
  performedByName: string;
  createdAt: string;
}

export interface TaskFilterParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  projectId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  projectId?: string;
  priority: TaskPriority;
  assigneeId?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  estimatedHours?: number;
  wbsCode?: string;
  parentTaskId?: string;
  tags?: string[];
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  status?: TaskStatus;
  progress?: number;
}

export interface TaskBoardSummary {
  totalTasks: number;
  byStatus: Record<TaskStatus, number>;
  overdueTasks: number;
  completedThisWeek: number;
}
