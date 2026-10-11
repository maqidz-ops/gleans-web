type Identity = { id: string; email: string };
type AdminIdentity = { id?: string; email?: string };
// Only the provisioned server identity can grant admin access.
export function matchesAdmin(user: Identity | null | undefined, admin: AdminIdentity) {
  return Boolean(user && admin.id && admin.email && user.id === admin.id && user.email.toLowerCase() === admin.email.toLowerCase());
}
export function landingPage(user: Identity, admin: AdminIdentity) {
  return matchesAdmin(user, admin) ? "/admin" : "/dashboard";
}
