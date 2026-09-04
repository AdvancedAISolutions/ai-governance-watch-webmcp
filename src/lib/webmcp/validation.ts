/**
 * Pure input validation for the WebMCP tool contracts.
 *
 * Rules: reject unknown fields, wrong types, out of range sizes, duplicate
 * entries, and unknown identifiers. Never silently substitute a value.
 * Whitespace is trimmed before validation.
 */

export type Validated<T> = { ok: true; value: T } | { ok: false; message: string };

export const MSR_PATTERN = /^MSR-[0-9]{3}$/;

export function asObject(input: unknown): Validated<Record<string, unknown>> {
  if (input === null || input === undefined) return { ok: true, value: {} };
  if (typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, message: "Arguments must be supplied as an object." };
  }
  return { ok: true, value: input as Record<string, unknown> };
}

export function rejectUnknownFields(
  args: Record<string, unknown>,
  allowed: readonly string[],
): Validated<true> {
  const unknown = Object.keys(args).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) {
    return {
      ok: false,
      message: `Unsupported field or fields: ${unknown.join(", ")}. Allowed: ${allowed.join(", ")}.`,
    };
  }
  return { ok: true, value: true };
}

export function optionalString(
  args: Record<string, unknown>,
  key: string,
  maxLength: number,
): Validated<string | undefined> {
  const raw = args[key];
  if (raw === undefined || raw === null) return { ok: true, value: undefined };
  if (typeof raw !== "string") {
    return { ok: false, message: `Field "${key}" must be a string.` };
  }
  const value = raw.trim();
  if (value.length === 0) return { ok: true, value: undefined };
  if (value.length > maxLength) {
    return { ok: false, message: `Field "${key}" must be ${maxLength} characters or fewer.` };
  }
  return { ok: true, value };
}

export function requiredString(
  args: Record<string, unknown>,
  key: string,
  minLength: number,
  maxLength: number,
): Validated<string> {
  const raw = args[key];
  if (typeof raw !== "string") {
    return { ok: false, message: `Field "${key}" is required and must be a string.` };
  }
  const value = raw.trim();
  if (value.length < minLength || value.length > maxLength) {
    return {
      ok: false,
      message: `Field "${key}" must be between ${minLength} and ${maxLength} characters.`,
    };
  }
  return { ok: true, value };
}

export function boundedInteger(
  args: Record<string, unknown>,
  key: string,
  min: number,
  max: number,
  fallback: number,
): Validated<number> {
  const raw = args[key];
  if (raw === undefined || raw === null) return { ok: true, value: fallback };
  if (typeof raw !== "number" || !Number.isInteger(raw)) {
    return { ok: false, message: `Field "${key}" must be an integer.` };
  }
  if (raw < min || raw > max) {
    return { ok: false, message: `Field "${key}" must be between ${min} and ${max}.` };
  }
  return { ok: true, value: raw };
}

export function slugArray(
  args: Record<string, unknown>,
  key: string,
  minItems: number,
  maxItems: number,
): Validated<string[]> {
  const raw = args[key];
  if (!Array.isArray(raw)) {
    return { ok: false, message: `Field "${key}" is required and must be an array of slugs.` };
  }
  if (raw.length < minItems || raw.length > maxItems) {
    return {
      ok: false,
      message: `Field "${key}" must contain between ${minItems} and ${maxItems} slugs.`,
    };
  }
  const values: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== "string") {
      return { ok: false, message: `Every entry in "${key}" must be a string.` };
    }
    const slug = entry.trim();
    if (slug.length === 0 || slug.length > 140) {
      return { ok: false, message: `Each slug must be 1 to 140 characters after trimming.` };
    }
    if (values.includes(slug)) {
      return { ok: false, message: `Duplicate slug supplied: ${slug}.` };
    }
    values.push(slug);
  }
  return { ok: true, value: values };
}

export function msrIdentifier(args: Record<string, unknown>, key: string): Validated<string> {
  const raw = args[key];
  if (typeof raw !== "string") {
    return { ok: false, message: `Field "${key}" is required and must be a string.` };
  }
  const value = raw.trim().toUpperCase();
  if (!MSR_PATTERN.test(value)) {
    return {
      ok: false,
      message: `Field "${key}" must match the source ledger pattern MSR-000.`,
    };
  }
  return { ok: true, value };
}
