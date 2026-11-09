import bcrypt from "bcryptjs";
import { AppError, isMongoDuplicateKeyError } from "@bitez/shared";

import type {
  IUserRepository,
  IDeliveryPersonRepository,
  ITokenService,
  IBlacklistedTokenRepository,
} from "../../domain/interfaces/index.js";
import type {
  SignupInput,
  SignupResult,
  SigninInput,
  SigninResult,
  LogoutInput,
  LogoutResult,
  GetCurrentUserInput,
} from "../dto/auth.dto.js";

export interface AuthUseCaseDeps {
  userRepository: IUserRepository;
  deliveryPersonRepository: IDeliveryPersonRepository;
  tokenService: ITokenService;
  blacklistedTokenRepository: IBlacklistedTokenRepository;
}

/** Generic client copy — do not confirm which field collided (enumeration). */
const REGISTRATION_FAILED = "Unable to create account";
const PROFILE_UPDATE_FAILED = "Unable to update profile";
const INVALID_CREDENTIALS = "Invalid credentials";

export class AuthUseCase {
  constructor(private readonly deps: AuthUseCaseDeps) {}

  async signup(input: SignupInput): Promise<SignupResult> {
    const { name, email, password, phoneNumber, address, role } = input;
    const isActive = role === "customer";
    const hashedPassword = await bcrypt.hash(password, 12);

    let user: { _id: unknown; role: string | string[] };
    try {
      user = (await this.deps.userRepository.create({
        name,
        email,
        password: hashedPassword,
        phoneNumber,
        address,
        role,
        isActive,
      })) as { _id: unknown; role: string | string[] };
    } catch (err) {
      if (isMongoDuplicateKeyError(err)) {
        throw new AppError({
          code: "CONFLICT",
          status: 409,
          message: REGISTRATION_FAILED,
          expose: true,
          details: { reason: "duplicate_key" },
          cause: err,
        });
      }
      throw err;
    }

    const userId = String(user._id);
    const roleVal = Array.isArray(user.role) ? user.role[0] : user.role;
    const token = await this.deps.tokenService.sign({ id: userId, role: roleVal });

    return { token, user: { id: userId, name, email, role: roleVal } };
  }

  async signin(input: SigninInput): Promise<SigninResult> {
    const user = await this.deps.userRepository.findByEmail(input.email, { includePassword: true });
    if (!user) {
      throw new AppError({
        code: "UNAUTHORIZED",
        status: 401,
        message: INVALID_CREDENTIALS,
        expose: true,
      });
    }

    const u = user as { password: string; _id: unknown; role: string };
    if (!(await bcrypt.compare(input.password, u.password))) {
      throw new AppError({
        code: "UNAUTHORIZED",
        status: 401,
        message: INVALID_CREDENTIALS,
        expose: true,
      });
    }

    const userId = String(u._id);
    const token = await this.deps.tokenService.sign({ id: userId, role: u.role });
    return { token, user: { id: userId, role: u.role } };
  }

  async logout(input: LogoutInput): Promise<LogoutResult> {
    await this.deps.blacklistedTokenRepository.add(input.token);
    return { message: "logged out successfully" };
  }

  async isTokenRevoked(token: string): Promise<boolean> {
    return this.deps.blacklistedTokenRepository.exists(token);
  }

  async getCurrentUser(input: GetCurrentUserInput): Promise<unknown> {
    const user = await this.deps.userRepository.findById(input.userId, { excludePassword: true });
    if (!user) {
      throw new AppError({
        code: "NOT_FOUND",
        status: 404,
        message: "User not found",
        expose: true,
      });
    }

    const u = user as { role?: string | string[]; _id?: unknown };
    const roleVal = Array.isArray(u.role) ? u.role[0] : u.role;
    if (roleVal === "delivery_person") {
      const dp = await this.deps.deliveryPersonRepository.findByUserId(input.userId);
      return { ...u, role: roleVal, deliveryPersonRating: dp?.rating ?? 0 };
    }
    return user;
  }

  /** Internal: return minimal user fields for enrichment (service token). */
  async getInternalUserById(
    userId: string,
  ): Promise<{ _id: string; name: string; email?: string; phoneNumber?: string } | null> {
    const user = await this.deps.userRepository.findById(userId, { excludePassword: true });
    if (!user) return null;
    const u = user as { _id?: unknown; name?: string; email?: string; phoneNumber?: string };
    return {
      _id: String(u._id ?? userId),
      name: String(u.name ?? ""),
      email: u.email != null ? String(u.email) : undefined,
      phoneNumber: u.phoneNumber != null ? String(u.phoneNumber) : undefined,
    };
  }

  async updateProfile(
    userId: string,
    data: { name?: string; email?: string; phoneNumber?: string; address?: string },
  ): Promise<unknown> {
    const user = await this.deps.userRepository.findById(userId, { excludePassword: true });
    if (!user) {
      throw new AppError({
        code: "NOT_FOUND",
        status: 404,
        message: "User not found",
        expose: true,
      });
    }
    if (data.email != null) {
      const existing = await this.deps.userRepository.findByEmail(data.email);
      if (existing) {
        const existingId = String((existing as { _id?: unknown })._id);
        if (existingId !== userId) {
          throw new AppError({
            code: "CONFLICT",
            status: 409,
            message: PROFILE_UPDATE_FAILED,
            expose: true,
            details: { reason: "duplicate_key" },
          });
        }
      }
    }
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.email !== undefined) update.email = data.email;
    if (data.phoneNumber !== undefined) update.phoneNumber = data.phoneNumber;
    if (data.address !== undefined) update.address = data.address;
    if (Object.keys(update).length === 0) return user;

    try {
      const updated = await this.deps.userRepository.findByIdAndUpdate(userId, update);
      if (!updated) {
        throw new AppError({
          code: "NOT_FOUND",
          status: 404,
          message: "User not found",
          expose: true,
        });
      }
      return updated;
    } catch (err) {
      if (err instanceof AppError) throw err;
      if (isMongoDuplicateKeyError(err)) {
        throw new AppError({
          code: "CONFLICT",
          status: 409,
          message: PROFILE_UPDATE_FAILED,
          expose: true,
          details: { reason: "duplicate_key" },
          cause: err,
        });
      }
      throw err;
    }
  }
}
