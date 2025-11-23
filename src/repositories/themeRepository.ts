// src/repositories/themeRepository.ts
import { supabase } from "../lib/supabase";
import type { Json } from "../types/database.types";
// Fixed: 2025-01-24 - Eradicated 6 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types


export interface UserThemeRow {
  id: string;
  user_id: string;
  name: string;
  description?: string | undefined;
  thumbnail_light?: string | undefined;
  thumbnail_dark?: string | undefined;
  theme_json: Json;
  created_at: string;
  updated_at: string;
}

export const themeRepository = {
  // 🔹 Create or insert new theme
  async createTheme(theme: {
    userId: string;
    name: string;
    description?: string;
    themeJson: Json;
    thumbnailLight?: string;
    thumbnailDark?: string;
  }): Promise<UserThemeRow> {
    const { data, error } = await supabase
      .from("user_themes")
      .insert([
        {
          user_id: theme.userId,
          name: theme.name,
          description: theme.description || undefined,
          theme_json: theme.themeJson,
          thumbnail_light: theme.thumbnailLight || undefined,
          thumbnail_dark: theme.thumbnailDark || undefined,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(`[themeRepository.createTheme] ${error.message}`);
    return data as UserThemeRow;
  },

  // 🔹 Read all themes by user
  async getThemesByUser(userId: string): Promise<UserThemeRow[]> {
    const { data, error } = await supabase
      .from("user_themes")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(`[themeRepository.getThemesByUser] ${error.message}`);
    return (data || []) as UserThemeRow[];
  },

  // 🔹 Update theme
  async updateTheme(
    id: string,
    updates: Partial<Pick<UserThemeRow, "name" | "description" | "theme_json" | "thumbnail_light" | "thumbnail_dark">>
  ): Promise<UserThemeRow> {
    const { data, error } = await supabase
      .from("user_themes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`[themeRepository.updateTheme] ${error.message}`);
    return data as UserThemeRow;
  },

  // 🔹 Delete theme
  async deleteTheme(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("user_themes")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw new Error(`[themeRepository.deleteTheme] ${error.message}`);
  },
};
