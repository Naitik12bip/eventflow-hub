import { describe, it, expect } from "vitest";
import { supabase } from "@/integrations/supabase/client";

// Test Supabase client initialization
describe("Supabase Client", () => {
  it("should initialize Supabase client", () => {
    expect(supabase).toBeDefined();
    expect(typeof supabase).toBe("object");
    expect(supabase.auth).toBeDefined();
    expect(supabase.functions).toBeDefined();
  });

  it("should have correct project URL", () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    expect(url).toBe("https://dkezuvqhkcuyqbxswcfj.supabase.co");
  });

  it("should have publishable key", () => {
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    expect(key).toBeDefined();
    expect(key.startsWith("eyJ")).toBe(true); // JWT tokens start with eyJ
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

  it("should have correct project ID", () => {
    expect(import.meta.env.VITE_SUPABASE_PROJECT_ID).toBe("dkezuvqhkcuyqbxswcfj");
  });
});