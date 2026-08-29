import { describe, it, expect } from 'vitest';
import {
  calculateJaccardSimilarity,
  calculateComplementarySkills,
  calculateRoleDiversity,
  calculateUserMatch,
} from '../src/services/matching.service.js';

describe('Deterministic Team Matching Engine', () => {
  it('should compute Jaccard similarity accurately for interests', () => {
    const listA = ['AI/ML', 'Healthcare', 'FinTech'];
    const listB = ['AI/ML', 'Healthcare', 'EdTech'];

    // Intersection = 2 (AI/ML, Healthcare), Union = 4 -> 2/4 = 0.5
    const sim = calculateJaccardSimilarity(listA, listB);
    expect(sim).toBe(0.5);

    // Identical
    expect(calculateJaccardSimilarity(['AI'], ['ai'])).toBe(1.0);

    // Completely disjoint
    expect(calculateJaccardSimilarity(['AI'], ['Web3'])).toBe(0.0);
  });

  it('should compute complementary skills (skills user B brings that A lacks)', () => {
    const skillsA = ['React', 'CSS'];
    const skillsB = ['React', 'Python', 'PyTorch'];

    // B has Python, PyTorch that A lacks -> 2 new skills out of 3 = 2/3 ~ 0.666
    const comp = calculateComplementarySkills(skillsA, skillsB);
    expect(comp).toBeCloseTo(0.666, 2);
  });

  it('should compute role diversity score', () => {
    const rolesFrontend = ['Frontend Developer'];
    const rolesBackend = ['Backend Developer'];

    // Completely distinct roles -> 1.0
    expect(calculateRoleDiversity(rolesFrontend, rolesBackend)).toBe(1.0);

    // Identical roles -> 0.3
    expect(calculateRoleDiversity(rolesFrontend, rolesFrontend)).toBe(0.3);
  });

  it('should calculate overall user match and generate transparent explainability reasons', () => {
    const userA = {
      skills: ['React', 'TypeScript'],
      interests: ['AI/ML', 'Healthcare'],
      preferred_roles: ['Frontend Developer'],
    };

    const userB = {
      skills: ['Python', 'PyTorch', 'FastAPI'],
      interests: ['AI/ML', 'Healthcare'],
      preferred_roles: ['ML Engineer', 'Backend Developer'],
    };

    const match = calculateUserMatch(userA, userB);

    expect(match.score).toBeGreaterThan(70);
    expect(match.factors.interestAlignment).toBe(100);
    expect(match.reasons.length).toBeGreaterThanOrEqual(2);
    expect(match.reasons.some((r) => r.includes('Shared interests'))).toBe(true);
    expect(match.reasons.some((r) => r.includes('complementary skills'))).toBe(true);
  });
});
