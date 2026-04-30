/**
 * Shared SQL fragments for scoping rows via leads (team + personal leads without team).
 * Alias `l` must be the leads table.
 */
export function leadScopeWhereClause(
  isGlobal: boolean,
  teamIds: string[],
  userId: string,
  paramOffset: number,
): { clause: string; nextParamIndex: number; params: string[] } {
  if (isGlobal) {
    return { clause: 'TRUE', nextParamIndex: paramOffset, params: [] };
  }
  if (teamIds.length > 0) {
    const start = paramOffset;
    const placeholders = teamIds.map((_, i) => `$${start + i}`).join(', ');
    const createdByIdx = start + teamIds.length;
    return {
      clause: `(l.team_id IN (${placeholders}) OR l.created_by = $${createdByIdx})`,
      nextParamIndex: createdByIdx + 1,
      params: [...teamIds, userId],
    };
  }
  return {
    clause: `l.created_by = $${paramOffset}`,
    nextParamIndex: paramOffset + 1,
    params: [userId],
  };
}
