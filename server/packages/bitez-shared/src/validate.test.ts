import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AppError } from "./errors.js";
import { parseBody } from "./validate.js";

describe("parseBody", () => {
  const schema = z.object({ name: z.string().min(1) });

  it("returns parsed data for valid input", () => {
    expect(parseBody(schema, { name: "Bitez" })).toEqual({ name: "Bitez" });
  });

  it("throws AppError 400 for invalid input", () => {
    try {
      parseBody(schema, { name: "" });
      expect.fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).status).toBe(400);
      expect((e as AppError).code).toBe("BAD_REQUEST");
    }
  });
});
