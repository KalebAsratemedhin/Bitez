export const UserRole = {
  ADMIN: "admin",
  CUSTOMER: "customer",
  RESTAURANT_OWNER: "restaurant_owner",
  DELIVERY_PERSON: "delivery_person",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export function userHasRole(
  role: string | string[],
  expected: string
): boolean {
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(expected);
}
