import bcrypt from "bcryptjs";

import type {
  IUserRepository,
  IDeliveryPersonRepository,
  ITokenService,
  IBlacklistedTokenRepository,
} from "@domain/interfaces/index.js";
import type {
  SignupInput,
  SignupResult,
  SigninInput,
  SigninResult,
  LogoutInput,
  LogoutResult,
  GetCurrentUserInput,
} from "@application/dto/index.js";

export interface AuthUseCaseDeps {
  userRepository: IUserRepository;
  deliveryPersonRepository: IDeliveryPersonRepository;
  tokenService: ITokenService;
  blacklistedTokenRepository: IBlacklistedTokenRepository;
}

export class AuthUseCase {
  constructor(private readonly deps: AuthUseCaseDeps) {}

  async signup(input: SignupInput): Promise<SignupResult> {
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
    })) as { _id: unknown; role: string | string[] };

    if (role === "delivery_person") {
      await this.deps.deliveryPersonRepository.create({ userId: user._id });
    }

    const roleVal = Array.isArray(user.role) ? user.role[0] : user.role;
    const userId = String(user._id);
    const token = await this.deps.tokenService.sign({ id: userId, role: roleVal });

    return { token, user: { id: userId, name, email, role: roleVal } };
  }

  async signin(input: SigninInput): Promise<SigninResult> {
    const user = await this.deps.userRepository.findByEmail(input.email, { includePassword: true });
    if (!user) throw new Error("Invalid credential");

    const u = user as { password: string; _id: unknown; role: string };
    if (!(await bcrypt.compare(input.password, u.password))) {
      throw new Error("Invalid credentials");
    }

    const userId = String(u._id);
    const token = await this.deps.tokenService.sign({ id: userId, role: u.role });
    return { token, user: { id: userId, role: u.role } };
  }

  async logout(input: LogoutInput): Promise<LogoutResult> {
    await this.deps.blacklistedTokenRepository.add(input.token);
    return { message: "logged out successfully" };
  }

  async getCurrentUser(input: GetCurrentUserInput): Promise<unknown> {
    const user = await this.deps.userRepository.findById(input.userId, { excludePassword: true });
    if (!user) throw new Error("User not found");

    const u = user as { role?: string; _id?: unknown };
    if (u.role === "delivery_person") {
      const dp = await this.deps.deliveryPersonRepository.findByUserId(input.userId);
      if (dp) {
        const d = dp as { rating?: number };
        return { ...u, deliveryPersonRating: d.rating ?? 0 };
      }
    }
    return user;
  }
}
