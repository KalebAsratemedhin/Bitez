import bcrypt from "bcryptjs";
export class AuthUseCase {
    deps;
    constructor(deps) {
        this.deps = deps;
    }
    async signup(input) {
        const { name, email, password, phoneNumber, address, role } = input;
        const isActive = role === "customer";
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = (await this.deps.userRepository.create({
            name,
            email,
            password: hashedPassword,
            phoneNumber,
            address,
            role,
            isActive,
        }));
        const userId = String(user._id);
        await this.deps.eventPublisher.publish("user.registered", {
            userId,
            name: name ?? "",
            email: email ?? "",
            phoneNumber: phoneNumber ?? "",
            role: Array.isArray(role) ? role[0] : role,
        });
        const roleVal = Array.isArray(user.role) ? user.role[0] : user.role;
        const token = await this.deps.tokenService.sign({ id: userId, role: roleVal });
        return { token, user: { id: userId, name, email, role: roleVal } };
    }
    async signin(input) {
        const user = await this.deps.userRepository.findByEmail(input.email, { includePassword: true });
        if (!user)
            throw new Error("Invalid credential");
        const u = user;
        if (!(await bcrypt.compare(input.password, u.password))) {
            throw new Error("Invalid credentials");
        }
        const userId = String(u._id);
        const token = await this.deps.tokenService.sign({ id: userId, role: u.role });
        return { token, user: { id: userId, role: u.role } };
    }
    async logout(input) {
        await this.deps.blacklistedTokenRepository.add(input.token);
        return { message: "logged out successfully" };
    }
    async getCurrentUser(input) {
        const user = await this.deps.userRepository.findById(input.userId, { excludePassword: true });
        if (!user)
            throw new Error("User not found");
        const u = user;
        const roleVal = Array.isArray(u.role) ? u.role[0] : u.role;
        if (roleVal === "delivery_person") {
            const dp = await this.deps.deliveryPersonRepository.findByUserId(input.userId);
            const d = dp;
            const rating = d != null && typeof d === "object" && "rating" in d && typeof d.rating === "number"
                ? d.rating
                : 0;
            return { ...u, role: roleVal, deliveryPersonRating: rating };
        }
        return user;
    }
    /** Internal: return minimal user fields for enrichment (no auth). */
    async getInternalUserById(userId) {
        const user = await this.deps.userRepository.findById(userId, { excludePassword: true });
        if (!user)
            return null;
        const u = user;
        return {
            _id: String(u._id ?? userId),
            name: String(u.name ?? ""),
            phoneNumber: u.phoneNumber != null ? String(u.phoneNumber) : undefined,
        };
    }
    async updateProfile(userId, data) {
        const user = await this.deps.userRepository.findById(userId, { excludePassword: true });
        if (!user)
            throw new Error("User not found");
        if (data.email != null) {
            const existing = await this.deps.userRepository.findByEmail(data.email);
            if (existing) {
                const existingId = String(existing._id);
                if (existingId !== userId)
                    throw new Error("Email already in use");
            }
        }
        const update = {};
        if (data.name !== undefined)
            update.name = data.name;
        if (data.email !== undefined)
            update.email = data.email;
        if (data.phoneNumber !== undefined)
            update.phoneNumber = data.phoneNumber;
        if (data.address !== undefined)
            update.address = data.address;
        if (Object.keys(update).length === 0)
            return user;
        const updated = await this.deps.userRepository.findByIdAndUpdate(userId, update);
        if (!updated)
            throw new Error("User not found");
        return updated;
    }
}
