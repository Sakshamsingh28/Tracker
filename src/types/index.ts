export interface Project {
  projectName: string;
  clientName: string;
  progress: number;
  status: 'In Progress' | 'Completed' | 'On Hold' | 'Review';
  currentPhase: string;
  currentTask: string;
  lastUpdated: string;
}

export interface RoadmapPhase {
  id: string;
  phaseName: string;
  tasks: Task[];
  order: number;
}

export interface Task {
  name: string;
  completed: boolean;
}

export interface Update {
  id: string;
  title: string;
  date: string;
}

export interface PendingItem {
  id: string;
  item: string;
}

export interface ClientUpload {
  id: string;
  fileName: string;
  fileURL: string;
  uploadedAt: string;
  category: string;
}

export interface AgencyFile {
  id: string;
  fileName: string;
  fileURL: string;
}
