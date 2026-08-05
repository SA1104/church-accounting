export function isSystemAdmin(user) {
  if (!user) return false;
  
  if (user.role === 'SYSTEM_ADMIN') return true;
  if (user.roles && (user.roles.platform === 'SYSTEM_ADMIN' || user.roles.church_think === 'SYSTEM_ADMIN')) return true;
  if (user.isAdmin) return true;
  if (user.username === 'admin' || user.email === 'admin@boozathink.com') return true;
  
  return false;
}
