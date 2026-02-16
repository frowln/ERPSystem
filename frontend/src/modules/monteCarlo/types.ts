export type SimulationStatus = 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface MonteCarloSimulation {
  id: string;
  name: string;
  description?: string;
  projectId?: string;
  projectName?: string;
  status: SimulationStatus;
  iterations: number;
  confidenceLevel: number;
  tasks: SimulationTask[];
  results?: SimulationResults;
  createdAt: string;
  updatedAt: string;
}

export interface SimulationTask {
  id: string;
  name: string;
  optimisticDuration: number;
  mostLikelyDuration: number;
  pessimisticDuration: number;
  predecessors?: string[];
  unit: 'DAYS' | 'WEEKS' | 'MONTHS';
}

export interface SimulationResults {
  p50Duration: number;
  p85Duration: number;
  p95Duration: number;
  p50Date?: string;
  p85Date?: string;
  p95Date?: string;
  meanDuration: number;
  standardDeviation: number;
  minDuration: number;
  maxDuration: number;
  completedIterations: number;
  calculatedAt: string;
}
