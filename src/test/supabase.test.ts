import { describe, expect, it } from "vitest";
import { supabase } from "@/lib/supabaseClient";
// Test Supabase client initialization
describe("Supabase Client", () => {
  it("should initialize Supabase client", () => {
    expect(supabase).toBeDefined();
    expect(typeof supabase).toBe("object");
    expect(supabase.auth).toBeDefined();
    expect(supabase.functions).toBeDefined();
  });

  it("should use the configured project URL", () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    expect(url).toBeDefined();
    expect(url).toBe(`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co`);
  });

  it("should have a publishable key", () => {
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    expect(key).toBeDefined();
    expect(key.startsWith("sb_publishable_")).toBe(true);
  });
});

// Test environment variables
describe("Environment Configuration", () => {
  it("should have all required environment variables", () => {
    expect(import.meta.env.VITE_SUPABASE_URL).toBeDefined();
    expect(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY).toBeDefined();
    expect(import.meta.env.VITE_SUPABASE_PROJECT_ID).toBeDefined();
    expect(import.meta.env.VITE_TICKETMASTER_API_KEY).toBeDefined();
  });

  it("should have a project id that matches the configured URL", () => {
    expect(import.meta.env.VITE_SUPABASE_URL).toContain(import.meta.env.VITE_SUPABASE_PROJECT_ID);
  });
});