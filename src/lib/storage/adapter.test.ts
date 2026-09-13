import { afterEach, describe, expect, it, vi } from "vitest";
import { readEnvelope, writeEnvelope } from "./adapter";

const KEY = "test:key";
const VERSION = 1;

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("readEnvelope — Risk 1: corrupted/invalid data must not crash the app", () => {
  it("returns the default when the stored value is invalid JSON", () => {
    localStorage.setItem(KEY, "{not valid json");

    const result = readEnvelope(KEY, VERSION, { fallback: true });

    expect(result).toEqual({ fallback: true });
  });

  it("returns the default when the envelope's schemaVersion doesn't match", () => {
    localStorage.setItem(KEY, JSON.stringify({ schemaVersion: 999, data: { fallback: false } }));

    const result = readEnvelope(KEY, VERSION, { fallback: true });

    expect(result).toEqual({ fallback: true });
  });

  it("returns the default when nothing is stored yet", () => {
    const result = readEnvelope(KEY, VERSION, { fallback: true });

    expect(result).toEqual({ fallback: true });
  });

  it("returns the stored data when the envelope is valid", () => {
    localStorage.setItem(KEY, JSON.stringify({ schemaVersion: VERSION, data: { fallback: false } }));

    const result = readEnvelope(KEY, VERSION, { fallback: true });

    expect(result).toEqual({ fallback: false });
  });
});

describe("writeEnvelope — Risk 2: a storage write failure must not crash card creation", () => {
  it("returns { ok: false } instead of throwing when localStorage.setItem fails", () => {
    const setItemSpy = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new DOMException("quota exceeded", "QuotaExceededError");
    });

    const result = writeEnvelope(KEY, VERSION, { fallback: true });

    expect(result).toEqual({ ok: false });
    setItemSpy.mockRestore();
  });

  it("returns { ok: true } on a normal successful write", () => {
    const result = writeEnvelope(KEY, VERSION, { fallback: true });

    expect(result).toEqual({ ok: true });
  });
});
