/**
 * Determines if a user can view a group's details.
 * Access is granted if the group is public OR the user is a member.
 *
 * @param {object} user - The current user
 * @param {object} group - The group object (must have is_member and is_public)
 * @returns {boolean}
 */
function canViewGroup(user, group) {
  return Boolean(user?.isAdmin) || Boolean(group.is_public) || Boolean(group.is_member);
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
