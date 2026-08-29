import { BadRequestError } from '../utils/errors.js';

export const RUBRIC_WEIGHTS = {
  innovation: 0.25,
  technical: 0.35,
  impact: 0.25,
  presentation: 0.15,
};

/**
 * Calculates weighted total score for a single evaluation.
 * Returns a score on a 0 - 100 scale.
 */
export function calculateEvaluationScore({ innovation, technical, impact, presentation }) {
  const scores = [innovation, technical, impact, presentation];
  for (const s of scores) {
    if (typeof s !== 'number' || isNaN(s) || s < 0 || s > 10) {
      throw new BadRequestError('Each rubric criterion score must be a number between 0.0 and 10.0');
    }
  }

  const rawWeighted =
    innovation * RUBRIC_WEIGHTS.innovation +
    technical * RUBRIC_WEIGHTS.technical +
    impact * RUBRIC_WEIGHTS.impact +
    presentation * RUBRIC_WEIGHTS.presentation;

  // Scale from 0-10 to 0-100 and round to 2 decimal places
  const totalScore = Math.round(rawWeighted * 10 * 100) / 100;
  return totalScore;
}

/**
 * Aggregates multiple evaluations for a submission into a standardized leaderboard score.
 * @param {Array<{ innovation_score: number, technical_score: number, impact_score: number, presentation_score: number, total_score: number }>} evaluations 
 */
export function calculateAggregateScore(evaluations) {
  if (!evaluations || evaluations.length === 0) {
    return {
      evaluationCount: 0,
      averageTotalScore: 0,
      averageInnovation: 0,
      averageTechnical: 0,
      averageImpact: 0,
      averagePresentation: 0,
    };
  }

  const count = evaluations.length;
  const sumTotal = evaluations.reduce((acc, ev) => acc + ev.total_score, 0);
  const sumInnovation = evaluations.reduce((acc, ev) => acc + ev.innovation_score, 0);
  const sumTechnical = evaluations.reduce((acc, ev) => acc + ev.technical_score, 0);
  const sumImpact = evaluations.reduce((acc, ev) => acc + ev.impact_score, 0);
  const sumPresentation = evaluations.reduce((acc, ev) => acc + ev.presentation_score, 0);

  return {
    evaluationCount: count,
    averageTotalScore: Math.round((sumTotal / count) * 100) / 100,
    averageInnovation: Math.round((sumInnovation / count) * 10) / 10,
    averageTechnical: Math.round((sumTechnical / count) * 10) / 10,
    averageImpact: Math.round((sumImpact / count) * 10) / 10,
    averagePresentation: Math.round((sumPresentation / count) * 10) / 10,
  };
}
