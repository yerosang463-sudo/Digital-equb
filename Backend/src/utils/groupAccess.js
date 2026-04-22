/**
 * Determines if a user can view a group.
 * Access is based solely on membership — is_public has no effect.
 *
 * @param {object} user - The current user
 * @param {object} group - The group object (must have is_member)
 * @returns {boolean}
 */
function canViewGroup(user, group) {
  return Boolean(group.is_member);
}

/**
 * Determines if a user can join a group.
 *
 * @param {object} user - The current user
 * @param {object} group - The group object
 * @returns {{ allowed: boolean, reason?: string }}
 */
function canJoinGroup(user, group) {
  if (group.is_member) {
    return { allowed: false, reason: 'already_member' };
  }
  if (group.status !== 'open') {
    return { allowed: false, reason: 'not_open' };
  }
  if (Number(group.current_members) >= Number(group.max_members)) {
    return { allowed: false, reason: 'full' };
  }
  return { allowed: true };
}

module.exports = { canViewGroup, canJoinGroup };
