import { describe, expect, it, vi } from "vitest";
import { AuthUseCase } from "./AuthUseCase.js";

describe("AuthUseCase.getCurrentUser delivery rating", () => {
  it("reads rating from local delivery-person projection", async () => {
    const deliveryPersonRepository = {
      findByUserId: vi.fn(async () => ({
        userId: "u1",
        deliveryPersonId: "dp1",
        rating: 4.5,
      })),
      upsertRegistration: vi.fn(),
      updateRatingByDeliveryPersonId: vi.fn(),
    };
    const userRepository = {
      findById: vi.fn(async () => ({ _id: "u1", name: "Rider", role: "delivery_person" })),
      create: vi.fn(),
      findByEmail: vi.fn(),
      findByIdAndUpdate: vi.fn(),
    };

    const useCase = new AuthUseCase({
      userRepository: userRepository as never,
      deliveryPersonRepository,
      tokenService: { sign: vi.fn(), verify: vi.fn() } as never,
      blacklistedTokenRepository: { add: vi.fn(), exists: vi.fn() } as never,
    });

    const result = (await useCase.getCurrentUser({ userId: "u1" })) as {
      deliveryPersonRating?: number;
    };
    expect(result.deliveryPersonRating).toBe(4.5);
    expect(deliveryPersonRepository.findByUserId).toHaveBeenCalledWith("u1");
  });
});
