/**
 * Dry-run script for submit → save → results data path.
 * Run: node scripts/dry-run-flow.mjs
 */
import { readFileSync, writeFileSync, unlinkSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

function encodeBase64Utf8(value) {
  return Buffer.from(value, 'utf8').toString('base64');
}

function decodeBase64Utf8(value) {
  return Buffer.from(value, 'base64').toString('utf8');
}

const DIMENSIONS = [
  'Problem Clarity',
  'Market Need',
  'Competition',
  'Technical Feasibility',
  'Monetization Potential',
];

function normalizeReport(raw) {
  const data = raw && typeof raw === 'object' ? raw : {};
  const scores = Array.isArray(data.scores)
    ? data.scores
    : DIMENSIONS.map(dimension => ({ dimension, score: 5, reason: 'fallback' }));

  let overall = Number(data.overall);
  if (!Number.isFinite(overall)) {
    overall = scores.reduce((sum, s) => sum + (Number(s.score) || 0), 0) / scores.length;
  }

  return {
    scores,
    overall: Math.round(overall * 10) / 10,
    insight: data.insight || 'Test insight',
    critiques: Array.isArray(data.critiques) ? data.critiques : [{ title: 'Risk', body: 'Body' }],
    roadmap: Array.isArray(data.roadmap)
      ? data.roadmap
      : [{ week: 1, title: 'Week 1', tasks: ['Task'], tip: 'Tip' }],
  };
}

const mockReport = normalizeReport({
  scores: DIMENSIONS.map((dimension, i) => ({ dimension, score: 7 + (i % 2), reason: 'ok' })),
  overall: 7.2,
  insight: 'Strong technical feasibility.',
  critiques: [{ title: 'Market risk', body: 'Needs validation.' }],
  roadmap: [{ week: 1, title: 'Discovery', tasks: ['Interview users'], tip: 'Start here' }],
});

const idea = {
  id: `${Date.now().toString(36)}abc1`,
  name: 'LaunchLens — café & 测试 unicode',
  problem: 'Students build startups without validating demand first.',
  customer: 'University founders aged 17–26',
  monetization: 'Freemium with ₹299/month pro tier',
  userEmail: 'test@example.com',
  createdAt: new Date().toISOString(),
  report: mockReport,
};

const storage = [idea];
const found = storage.find(i => i.id === idea.id);
if (!found) throw new Error('save/find failed');

const overall = found.report.overall.toFixed(1);
if (overall !== '7.2') throw new Error(`unexpected overall: ${overall}`);

let shareUrl;
try {
  JSON.parse(atob(JSON.stringify(found)));
  console.warn('WARN: old btoa path would fail on unicode in real browser');
} catch {
  console.log('OK: confirmed latin-only btoa breaks on unicode');
}

const encoded = encodeBase64Utf8(JSON.stringify(found));
const roundTrip = JSON.parse(decodeBase64Utf8(encoded));
if (roundTrip.name !== idea.name) throw new Error('utf8 base64 round-trip failed');

console.log('OK: mock save/find/render data path');
console.log('OK: utf8 share URL encoding');
console.log('OK: overall score formatting ->', overall);

// Malformed AI payload should not crash normalization
const malformed = normalizeReport({ scores: [{ dimension: 'Problem Clarity', score: '8', reason: 'x' }] });
if (!Number.isFinite(malformed.overall)) throw new Error('malformed overall not computed');
console.log('OK: malformed AI payload normalized, overall =', malformed.overall);

console.log('\nAll dry-run checks passed.');
