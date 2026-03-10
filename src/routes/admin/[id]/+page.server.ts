/**
 * Admin dashboard — detail view server load + delete action.
 * Fetches a single analysis by id, deserializes and validates
 * the JSON, and returns it for the page component.
 */

import { error, redirect } from "@sveltejs/kit";

import type { Actions, PageServerLoad } from "./$types";

import { validateAnalysis } from "$lib/analysis/validate";
import { deleteAnalysis, getAnalysisById } from "$lib/db";

export const load: PageServerLoad = async ({ params }) => {
  const row = getAnalysisById(params.id);
  if (!row) throw error(404, "Analysis not found");

  const parsed = JSON.parse(row.analysisJson) as unknown;
  const analysis = validateAnalysis(parsed);

  if (!analysis) {
    throw error(500, "Stored analysis data is invalid");
  }

  return {
    analysis,
    meta: {
      id: row.id,
      createdAt: row.createdAt,
      extractionQuality: row.extractionQuality,
    },
  };
};

export const actions: Actions = {
  delete: async ({ params }) => {
    deleteAnalysis(params.id);
    throw redirect(303, "/admin");
  },
};
