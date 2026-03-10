/**
 * Admin dashboard — server load function.
 * Fetches all analyses from the database for the list view.
 * Does not deserialize analysis JSON — the list only needs metadata.
 */

import type { PageServerLoad } from "./$types";

import { listAnalyses } from "$lib/db";

export const load: PageServerLoad = async () => {
  const rows = listAnalyses();

  return {
    analyses: rows.map((row) => ({
      id: row.id,
      inputText: row.inputText,
      extractionQuality: row.extractionQuality,
      createdAt: row.createdAt,
      preview: row.inputText.slice(0, 100),
    })),
  };
};
