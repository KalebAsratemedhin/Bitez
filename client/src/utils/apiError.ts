/**
 * Normalize API error bodies from Bitez services.
 * Supports unified shape `{ error: { code, message, requestId } }` and legacy `{ error: string }`, `{ message: string }`.
 */
export function newClientRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `req_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
  }
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeApiErrorBody(data: unknown): {
  message: string;
  requestId?: string;
  code?: string;
} {
  if (data == null || typeof data !== "object") {
    return { message: "Request failed" };
  }
  const d = data as Record<string, unknown>;
  const nested = d.error;
  if (nested != null && typeof nested === "object" && "message" in nested) {
    const e = nested as { message?: unknown; requestId?: unknown; code?: unknown };
    return {
      message: typeof e.message === "string" ? e.message : "Request failed",
      requestId: typeof e.requestId === "string" ? e.requestId : undefined,
      code: typeof e.code === "string" ? e.code : undefined,
    };
  }
  if (typeof d.message === "string") {
    return { message: d.message };
  }
  if (typeof d.error === "string") {
    return { message: d.error };
  }
  return { message: "Request failed" };
}
