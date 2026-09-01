import { normalizeReport } from './report';

const STORAGE_KEY = 'launchlens_ideas';

export interface Score {
  dimension: string;
  score: number;
  reason: string;
}

export interface Critique {
  title: string;
  body: string;
}

export interface TaskItem {
  week: number;
  title: string;
  tasks: string[];
  tip: string;
}

export interface IdeaReport {
  scores: Score[];
  overall: number;
  insight: string;
  critiques: Critique[];
  roadmap: TaskItem[];
}

export interface IdeaEntry {
  id: string;
  name: string;
  problem: string;
  customer: string;
  monetization: string;
  userEmail: string;
  createdAt: string;
  report: IdeaReport;
}

export function saveIdea(idea: Omit<IdeaEntry, 'id' | 'createdAt'>): string {
  const ideas = getIdeas();
  const id = crypto.randomUUID();
  const entry: IdeaEntry = {
    id,
    ...idea,
    report: normalizeReport(idea.report),
    createdAt: new Date().toISOString()
  };
  ideas.unshift(entry);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
  } catch (e) {
    // Storage write failed
    throw new Error('Could not save your report. Try shortening your answers or clearing browser storage.');
  }
  return id;
}

export function getIdeas(): IdeaEntry[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

export function getIdeaById(id: string): IdeaEntry | null {
  return getIdeas().find(i => i.id === id) || null;
}

export function getUserIdeas(email: string): IdeaEntry[] {
  return getIdeas().filter(i => i.userEmail === email);
}
