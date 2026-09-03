/**
 * FV-285 — ElevenLabs bake-off tooling: pure-function coverage for the TTS
 * provider wrapper (scripts/lib/tts.ts). No network calls — synthesizeSpeech
 * itself (which does `fetch`) is intentionally NOT exercised here.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clampElevenLabsSpeed,
  estimateCostUsd,
  resolveElevenLabsVoiceId,
  resolveProvider,
} from "../scripts/lib/tts.ts";

describe("resolveProvider", () => {
  const originalEnv = process.env.TTS_PROVIDER;

  beforeEach(() => {
    delete process.env.TTS_PROVIDER;
  });

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.TTS_PROVIDER;
    else process.env.TTS_PROVIDER = originalEnv;
  });

  it("defaults to openai with no env and no explicit provider", () => {
    expect(resolveProvider()).toBe("openai");
  });

  it("reads TTS_PROVIDER=elevenlabs from env", () => {
    process.env.TTS_PROVIDER = "elevenlabs";
    expect(resolveProvider()).toBe("elevenlabs");
  });

  it("reads TTS_PROVIDER=openai from env explicitly", () => {
    process.env.TTS_PROVIDER = "openai";
    expect(resolveProvider()).toBe("openai");
  });

  it("an explicit provider option wins over TTS_PROVIDER env", () => {
    process.env.TTS_PROVIDER = "elevenlabs";
    expect(resolveProvider("openai")).toBe("openai");

    delete process.env.TTS_PROVIDER;
    expect(resolveProvider("elevenlabs")).toBe("elevenlabs");
  });

  it("falls back to openai and warns once on an unrecognized value", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    process.env.TTS_PROVIDER = "not-a-real-provider";
    expect(resolveProvider()).toBe("openai");
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain("not-a-real-provider");
    warnSpy.mockRestore();
  });
});

describe("estimateCostUsd", () => {
  it("prices openai (default provider) at $0.60 per million characters", () => {
    expect(estimateCostUsd(1_000_000)).toBeCloseTo(0.6, 6);
    expect(estimateCostUsd(1_000_000, "openai")).toBeCloseTo(0.6, 6);
  });

  it("prices elevenlabs non-flash models at $0.10 per 1k characters", () => {
    expect(estimateCostUsd(1_000, "elevenlabs", "eleven_multilingual_v2")).toBeCloseTo(0.1, 6);
    expect(estimateCostUsd(1_000, "elevenlabs", "eleven_v3")).toBeCloseTo(0.1, 6);
    // No modelId at all — still non-flash default.
    expect(estimateCostUsd(1_000, "elevenlabs")).toBeCloseTo(0.1, 6);
  });

  it("prices elevenlabs flash models at half — $0.05 per 1k characters", () => {
    expect(estimateCostUsd(1_000, "elevenlabs", "eleven_flash_v2_5")).toBeCloseTo(0.05, 6);
  });

  it("flash detection is case-insensitive", () => {
    expect(estimateCostUsd(1_000, "elevenlabs", "ELEVEN_FLASH_V2_5")).toBeCloseTo(0.05, 6);
  });

  it("scales linearly with character count", () => {
    expect(estimateCostUsd(2_000_000, "openai")).toBeCloseTo(1.2, 6);
    expect(estimateCostUsd(10_000, "elevenlabs")).toBeCloseTo(1.0, 6);
  });
});

describe("clampElevenLabsSpeed", () => {
  it("passes speeds already inside 0.7-1.2 through unchanged", () => {
    expect(clampElevenLabsSpeed(1.0)).toBe(1.0);
    expect(clampElevenLabsSpeed(0.7)).toBe(0.7);
    expect(clampElevenLabsSpeed(1.2)).toBe(1.2);
  });

  it("clamps speeds below 0.7 up to 0.7", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(clampElevenLabsSpeed(0.5)).toBe(0.7);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("clamps speeds above 1.2 down to 1.2 — e.g. the breath-threshold script's 1.1x is untouched", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(clampElevenLabsSpeed(1.1)).toBe(1.1);
    expect(warnSpy).not.toHaveBeenCalled();

    expect(clampElevenLabsSpeed(1.5)).toBe(1.2);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe("resolveElevenLabsVoiceId", () => {
  const saved = process.env.ELEVENLABS_VOICE_ID;
  afterEach(() => {
    if (saved === undefined) delete process.env.ELEVENLABS_VOICE_ID;
    else process.env.ELEVENLABS_VOICE_ID = saved;
  });

  it("passes a non-OpenAI voice string through as an ElevenLabs voice ID", () => {
    delete process.env.ELEVENLABS_VOICE_ID;
    expect(resolveElevenLabsVoiceId("21m00Tcm4TlvDq8ikWAM")).toBe("21m00Tcm4TlvDq8ikWAM");
  });

  it("maps an OpenAI voice name (e.g. a committed script's \"ash\") to ELEVENLABS_VOICE_ID", () => {
    process.env.ELEVENLABS_VOICE_ID = "voice-from-env";
    expect(resolveElevenLabsVoiceId("ash")).toBe("voice-from-env");
  });

  it("throws a pointed error for an OpenAI voice name when ELEVENLABS_VOICE_ID is unset", () => {
    delete process.env.ELEVENLABS_VOICE_ID;
    expect(() => resolveElevenLabsVoiceId("ash")).toThrow(/ELEVENLABS_VOICE_ID is not set/);
  });
});
