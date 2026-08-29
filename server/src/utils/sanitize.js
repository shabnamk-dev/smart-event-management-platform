/**
 * Sanitizes a raw database user record to ensure sensitive fields are NEVER exposed to the client.
 * Strips password_hash, attendance_token_hash, etc.
 * Parses JSON arrays for skills, preferred_roles, and interests.
 * @param {object} user 
 * @returns {object} Safe user profile
 */
export function sanitizeUser(user) {
  if (!user) return null;

  const {
    password_hash,
    attendance_token_hash,
    ...safeUser
  } = user;

  return {
    ...safeUser,
    skills: typeof safeUser.skills === 'string' ? JSON.parse(safeUser.skills || '[]') : safeUser.skills || [],
    preferred_roles: typeof safeUser.preferred_roles === 'string' ? JSON.parse(safeUser.preferred_roles || '[]') : safeUser.preferred_roles || [],
    interests: typeof safeUser.interests === 'string' ? JSON.parse(safeUser.interests || '[]') : safeUser.interests || [],
    checked_in: Boolean(safeUser.checked_in),
    is_demo: Boolean(safeUser.is_demo),
  };
}
