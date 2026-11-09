import { describe, expect, it } from "vitest";
import { parseBody } from "@bitez/shared";
import { signupBodySchema, signinBodySchema } from "./auth.schemas.js";

describe("auth schemas", () => {
  it("accepts a valid signup body", () => {
    const body = parseBody(signupBodySchema, {
      name: "Ada",
      email: "ada@example.com",
      password: "secret1",
      phoneNumber: "0911",
      address: "Addis",
      role: "customer",
    });
    expect(body.email).toBe("ada@example.com");
  });

  it("rejects invalid signin email", () => {
    expect(() => parseBody(signinBodySchema, { email: "nope", password: "x" })).toThrow();
  });
});
