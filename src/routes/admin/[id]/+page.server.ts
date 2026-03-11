/**
 * Admin dashboard — detail view server load + delete action.
 * Fetches a single analysis by id, deserializes and validates
 * the JSON, and returns it for the page component.
 *
 * Supports both legacy ThoughtAnalysis and new FullAnalysis payloads.
 * Legacy payloads are wrapped as { extraction, reading: null, reframe: null }.
 */

import { error, redirect } from "@sveltejs/kit";

import type { Actions, PageServerLoad } from "./$types";

import { validateAnalysis } from "$lib/analysis/validate";
import { deleteAnalysis, getAnalysisById } from "$lib/db";
import type { FullAnalysis } from "$lib/types";

/** Type guard for FullAnalysis shape in stored JSON. */
function isFullAnalysis(value: unknown): value is FullAnalysis {
  return (
    typeof value === 'object' &&
    value !== null &&
    'extraction' in value
  );
}

export const load: PageServerLoad = async ({ params }) => {
  const row = getAnalysisById(params.id);
  if (!row) throw error(404, "Analysis not found");

  const parsed = JSON.parse(row.analysisJson) as unknown;

  let fullAnalysis: FullAnalysis;

  if (isFullAnalysis(parsed)) {
    // New format — validate the extraction within
    const extraction = validateAnalysis(parsed.extraction);

    if (!extraction) {
      throw error(500, "Stored analysis data is invalid");
    }

    fullAnalysis = {
      extraction,
      reading: parsed.reading ?? null,
      reframe: parsed.reframe ?? null
    };
  } else {
    // Legacy format — single ThoughtAnalysis
    const analysis = validateAnalysis(parsed);

    if (!analysis) {
      throw error(500, "Stored analysis data is invalid");
    }

    fullAnalysis = {
      extraction: analysis,
      reading: null,
      reframe: null
    };
  }

  return {
    fullAnalysis,
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
