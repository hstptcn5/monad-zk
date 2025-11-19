export enum Tab {
  DASHBOARD = 'DASHBOARD',
  CODE = 'CODE',
  BENCHMARK = 'BENCHMARK'
}

export interface CodeSnippet {
  filename: string;
  language: string;
  content: string;
  description: string;
}

export interface PipelineStep {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  log: string[];
}

export interface BenchmarkData {
  name: string;
  gasUsed: number;
  verifyTime: number;
}