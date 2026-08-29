import { describe, it, expect } from 'vitest';
import {
  calculateEvaluationScore,
  calculateAggregateScore,
  RUBRIC_WEIGHTS,
} from '../src/services/scoring.service.js';

describe('Judging Rubric Scoring Service', () => {
  it('should calculate weighted score based on 25% Innovation, 35% Tech, 25% Impact, 15% Presentation', () => {
    // Score = (10*0.25 + 10*0.35 + 10*0.25 + 10*0.15) * 10 = 100.0
    const perfectScore = calculateEvaluationScore({
      innovation: 10,
      technical: 10,
      impact: 10,
      presentation: 10,
    });
    expect(perfectScore).toBe(100.0);

    // Score = (8*0.25 + 9*0.35 + 7*0.25 + 8*0.15) * 10 = (2.0 + 3.15 + 1.75 + 1.2) * 10 = 81.0
    const realisticScore = calculateEvaluationScore({
      innovation: 8,
      technical: 9,
      impact: 7,
      presentation: 8,
    });
    expect(realisticScore).toBe(81.0);
  });

  it('should throw error when any score is out of 0.0 - 10.0 boundary', () => {
    expect(() => {
      calculateEvaluationScore({ innovation: 11, technical: 8, impact: 8, presentation: 8 });
    }).toThrow(/between 0.0 and 10.0/);

    expect(() => {
      calculateEvaluationScore({ innovation: 8, technical: -1, impact: 8, presentation: 8 });
    }).toThrow(/between 0.0 and 10.0/);
  });

  it('should aggregate multiple judge evaluations accurately', () => {
    const evaluations = [
      {
        innovation_score: 9.0,
        technical_score: 9.0,
        impact_score: 9.0,
        presentation_score: 9.0,
        total_score: 90.0,
      },
      {
        innovation_score: 8.0,
        technical_score: 8.0,
        impact_score: 8.0,
        presentation_score: 8.0,
        total_score: 80.0,
      },
    ];

    const aggregate = calculateAggregateScore(evaluations);
    expect(aggregate.evaluationCount).toBe(2);
    expect(aggregate.averageTotalScore).toBe(85.0);
    expect(aggregate.averageInnovation).toBe(8.5);
    expect(aggregate.averageTechnical).toBe(8.5);
  });

  it('should handle zero evaluations safely', () => {
    const aggregate = calculateAggregateScore([]);
    expect(aggregate.evaluationCount).toBe(0);
    expect(aggregate.averageTotalScore).toBe(0);
  });
});
