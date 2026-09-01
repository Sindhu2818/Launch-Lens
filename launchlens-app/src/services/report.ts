import type { Critique, IdeaReport, Score, TaskItem } from './storage';

const DIMENSIONS = [
  'Problem Clarity',
  'Market Need',
  'Competition',
  'Technical Feasibility',
  'Monetization Potential',
] as const;

const DEFAULT_SCORES: Score[] = DIMENSIONS.map(dimension => ({
  dimension,
  score: 5,
  reason: 'Score unavailable — please try validating again.',
}));

function clampScore(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return 5;
  return Math.min(10, Math.max(0, Math.round(num)));
}

function normalizeScores(raw: unknown): Score[] {
  if (!Array.isArray(raw)) return DEFAULT_SCORES;

  const byDimension = new Map<string, Score>();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const entry = item as Record<string, unknown>;
    const dimension = typeof entry.dimension === 'string' ? entry.dimension.trim() : '';
    if (!dimension) continue;
    byDimension.set(dimension, {
      dimension,
      score: clampScore(entry.score),
      reason:
        typeof entry.reason === 'string' && entry.reason.trim()
          ? entry.reason.trim()
          : 'No explanation provided.',
    });
  }

  return DIMENSIONS.map(dimension => byDimension.get(dimension) ?? {
    dimension,
    score: 5,
    reason: 'No score returned for this dimension.',
  });
}

function normalizeCritiques(raw: unknown): Critique[] {
  if (!Array.isArray(raw)) {
    return [{
      title: 'Review incomplete',
      body: 'The AI response did not include critiques. Try submitting again for a full report.',
    }];
  }

  const critiques = raw
    .map(item => {
      if (!item || typeof item !== 'object') return null;
      const entry = item as Record<string, unknown>;
      const title = typeof entry.title === 'string' ? entry.title.trim() : '';
      const body = typeof entry.body === 'string' ? entry.body.trim() : '';
      if (!title && !body) return null;
      return {
        title: title || 'Potential risk',
        body: body || 'No details provided.',
      };
    })
    .filter((item): item is Critique => item !== null);

  return critiques.length > 0 ? critiques : [{
    title: 'Review incomplete',
    body: 'The AI response did not include critiques. Try submitting again for a full report.',
  }];
}

function normalizeRoadmap(raw: unknown): TaskItem[] {
  if (!Array.isArray(raw)) {
    return [{
      week: 1,
      title: 'Start customer discovery',
      tasks: ['Interview 5 potential users', 'Document their biggest pain points', 'Validate willingness to pay'],
      tip: 'Begin with the weakest area from your scorecard.',
    }];
  }

  const weeks = raw
    .map(item => {
      if (!item || typeof item !== 'object') return null;
      const entry = item as Record<string, unknown>;
      const week = clampScore(entry.week);
      const title = typeof entry.title === 'string' ? entry.title.trim() : '';
      const tasks = Array.isArray(entry.tasks)
        ? entry.tasks.filter((task): task is string => typeof task === 'string' && task.trim() !== '')
        : [];
      const tip = typeof entry.tip === 'string' ? entry.tip.trim() : '';
      if (!title && tasks.length === 0) return null;
      return {
        week: week || 1,
        title: title || `Week ${week || 1}`,
        tasks: tasks.length > 0 ? tasks : ['Define one validation experiment for this week'],
        tip,
      };
    })
    .filter((item): item is TaskItem => item !== null);

  return weeks.length > 0 ? weeks : [{
    week: 1,
    title: 'Start customer discovery',
    tasks: ['Interview 5 potential users', 'Document their biggest pain points', 'Validate willingness to pay'],
    tip: 'Begin with the weakest area from your scorecard.',
  }];
}

export function normalizeReport(raw: unknown): IdeaReport {
  const data = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const scores = normalizeScores(data.scores);

  const overallRaw = data.overall;
  let overall =
    typeof overallRaw === 'number'
      ? overallRaw
      : Number(overallRaw);

  if (!Number.isFinite(overall)) {
    overall = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
  }

  overall = Math.round(overall * 10) / 10;

  const insight =
    typeof data.insight === 'string' && data.insight.trim()
      ? data.insight.trim()
      : 'Review your lowest-scoring dimensions and validate them with real customers first.';

  return {
    scores,
    overall,
    insight,
    critiques: normalizeCritiques(data.critiques),
    roadmap: normalizeRoadmap(data.roadmap),
  };
}

export function isValidReport(report: unknown): report is IdeaReport {
  if (!report || typeof report !== 'object') return false;
  const data = report as IdeaReport;
  return Array.isArray(data.scores) && data.scores.length > 0 && Number.isFinite(data.overall);
}
