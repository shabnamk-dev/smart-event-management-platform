/**
 * Calculates Jaccard similarity between two sets/arrays: |A ∩ B| / |A ∪ B|
 */
export function calculateJaccardSimilarity(arr1 = [], arr2 = []) {
  const set1 = new Set((arr1 || []).map((s) => String(s).toLowerCase().trim()));
  const set2 = new Set((arr2 || []).map((s) => String(s).toLowerCase().trim()));

  if (set1.size === 0 && set2.size === 0) return 0;

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Calculates complementary skills score:
 * Measures skills that user B brings which user A does not currently have.
 */
export function calculateComplementarySkills(userASkills = [], userBSkills = []) {
  const setA = new Set((userASkills || []).map((s) => String(s).toLowerCase().trim()));
  const setB = new Set((userBSkills || []).map((s) => String(s).toLowerCase().trim()));

  if (setB.size === 0) return 0;

  const newSkills = [...setB].filter((s) => !setA.has(s));
  return newSkills.length / Math.max(setB.size, 1);
}

/**
 * Calculates role diversity:
 * Rewards teams with complementary preferred roles (e.g., Frontend + Backend or ML + Designer)
 */
export function calculateRoleDiversity(rolesA = [], rolesB = []) {
  const setA = new Set((rolesA || []).map((r) => String(r).toLowerCase().trim()));
  const setB = new Set((rolesB || []).map((r) => String(r).toLowerCase().trim()));

  if (setA.size === 0 || setB.size === 0) return 0.5;

  const overlap = [...setA].filter((r) => setB.has(r));
  // If no overlap, high diversity (1.0). If partial overlap, moderate (0.6). If identical, lower (0.3).
  if (overlap.length === 0) return 1.0;
  if (overlap.length < Math.max(setA.size, setB.size)) return 0.6;
  return 0.3;
}

/**
 * Calculates overall match score (0-100) and produces transparent human-readable explanations.
 */
export function calculateUserMatch(userA, userB) {
  const skillsA = Array.isArray(userA.skills) ? userA.skills : JSON.parse(userA.skills || '[]');
  const skillsB = Array.isArray(userB.skills) ? userB.skills : JSON.parse(userB.skills || '[]');
  const interestsA = Array.isArray(userA.interests) ? userA.interests : JSON.parse(userA.interests || '[]');
  const interestsB = Array.isArray(userB.interests) ? userB.interests : JSON.parse(userB.interests || '[]');
  const rolesA = Array.isArray(userA.preferred_roles) ? userA.preferred_roles : JSON.parse(userA.preferred_roles || '[]');
  const rolesB = Array.isArray(userB.preferred_roles) ? userB.preferred_roles : JSON.parse(userB.preferred_roles || '[]');

  const interestScore = calculateJaccardSimilarity(interestsA, interestsB);
  const skillScore = calculateComplementarySkills(skillsA, skillsB);
  const roleScore = calculateRoleDiversity(rolesA, rolesB);

  // Weights: Interests (40%), Complementary Skills (35%), Role Diversity (25%)
  const overallWeight = interestScore * 0.40 + skillScore * 0.35 + roleScore * 0.25;
  const matchPercentage = Math.min(100, Math.max(10, Math.round(overallWeight * 100)));

  // Generate transparent explanation reasons
  const sharedInterests = interestsA.filter((ia) =>
    interestsB.some((ib) => String(ia).toLowerCase() === String(ib).toLowerCase())
  );
  const complementarySkillsList = skillsB.filter((sb) =>
    !skillsA.some((sa) => String(sa).toLowerCase() === String(sb).toLowerCase())
  );

  const reasons = [];
  if (sharedInterests.length > 0) {
    reasons.push(`Shared interests in ${sharedInterests.slice(0, 3).join(', ')}`);
  }
  if (complementarySkillsList.length > 0) {
    reasons.push(`Brings complementary skills (${complementarySkillsList.slice(0, 3).join(', ')})`);
  }
  if (roleScore >= 0.8) {
    reasons.push('High role diversity (diverse functional coverage)');
  } else if (roleScore >= 0.5) {
    reasons.push('Balanced role distribution');
  }

  if (reasons.length === 0) {
    reasons.push('Potential collaborator available for open team slots');
  }

  return {
    score: matchPercentage,
    factors: {
      interestAlignment: Math.round(interestScore * 100),
      skillComplementarity: Math.round(skillScore * 100),
      roleDiversity: Math.round(roleScore * 100),
    },
    reasons,
  };
}
