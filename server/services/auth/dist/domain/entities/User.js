export const UserRole = {
    ADMIN: "admin",
    CUSTOMER: "customer",
    RESTAURANT_OWNER: "restaurant_owner",
    DELIVERY_PERSON: "delivery_person",
};
export function userHasRole(role, expected) {
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(expected);
}
