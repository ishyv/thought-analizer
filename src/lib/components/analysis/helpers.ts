import type {
  PhraseGroup,
  Polarity,
  StatementGroup,
  StatementRole,
  ThoughtAnalysis
} from '$lib/types';
import type { SelectableKind } from '$lib/stores';

/** Text segment with an optional attached phrase-group annotation. */
export interface AnnotatedSpan {
  text: string;
  phrase: PhraseGroup | null;
}

/** Payload shape emitted by analysis panels for hover and select events. */
export interface SelectionDetail {
  id: string;
  kind: SelectableKind;
}

/**
 * Snaps a character offset outward to the nearest word boundary so that
 * highlights never split inside a word.
 *
 * For `direction: "start"`: walks backward while the preceding character is
 * not a space and pos > 0.
 * For `direction: "end"`: walks forward while the current character is not a
 * space and pos < text.length.
 *
 * Result is clamped to [0, text.length].
 */
function snapToWordBoundary(text: string, offset: number, direction: 'start' | 'end'): number {
  if (direction === 'start') {
    let pos = offset;
    while (pos > 0 && text[pos - 1] !== ' ') pos -= 1;
    return pos;
  }

  let pos = offset;
  while (pos < text.length && text[pos] !== ' ') pos += 1;
  return pos;
}

/**
 * Converts phrase spans into a flat list of annotated text segments.
 *
 * Offsets from the LLM are clamped and snapped to word boundaries before
 * use — the model frequently miscounts by a few characters.
 *
 * @param text Raw input text.
 * @param phraseGroups Phrase spans to overlay onto the text.
 * @returns Ordered annotated spans for incremental text rendering.
 */
export function buildAnnotatedSpans(text: string, phraseGroups: PhraseGroup[]): AnnotatedSpan[] {
  const events: Array<{ pos: number; type: 'open' | 'close'; phrase: PhraseGroup }> = [];

  for (const phrase of phraseGroups) {
    const clampedStart = Math.max(0, Math.min(phrase.start, text.length));
    const clampedEnd = Math.max(clampedStart, Math.min(phrase.end, text.length));
    const safeStart = snapToWordBoundary(text, clampedStart, 'start');
    const safeEnd = snapToWordBoundary(text, clampedEnd, 'end');
    events.push({ pos: safeStart, type: 'open', phrase });
    events.push({ pos: safeEnd, type: 'close', phrase });
  }

  events.sort((left, right) => left.pos - right.pos || (left.type === 'close' ? -1 : 1));

  const annotated: AnnotatedSpan[] = [];
  let cursor = 0;
  let openPhrase: PhraseGroup | null = null;

  for (const event of events) {
    if (event.pos > cursor) {
      annotated.push({ text: text.slice(cursor, event.pos), phrase: openPhrase });
    }

    cursor = event.pos;
    openPhrase = event.type === 'open' ? event.phrase : null;
  }

  if (cursor < text.length) {
    annotated.push({ text: text.slice(cursor), phrase: null });
  }

  return annotated;
}

/**
 * Maps statement roles to the matching CSS custom-property suffix.
 *
 * @param role Statement role to translate.
 * @returns Token suffix used by the UI color system.
 */
export function roleVar(role: StatementRole): string {
  return `role-${role}`;
}

/**
 * Maps polarity values to the matching CSS custom-property suffix.
 *
 * @param polarity Phrase polarity to translate.
 * @returns Token suffix used by the UI color system.
 */
export function polarityVar(polarity: Polarity): 'pos' | 'neg' | 'neu' {
  if (polarity === 'positive') return 'pos';
  if (polarity === 'negative') return 'neg';
  return 'neu';
}

/**
 * Resolves a statement by id from the current analysis.
 *
 * @param analysis Analysis to search.
 * @param statementId Statement id to resolve.
 * @returns The matching statement group, if present.
 */
export function getStatement(
  analysis: ThoughtAnalysis,
  statementId: string | null
): StatementGroup | undefined {
  if (!statementId) return undefined;
  return analysis.statement_groups.find((statement) => statement.id === statementId);
}

/**
 * Resolves a phrase by id from the current analysis.
 *
 * @param analysis Analysis to search.
 * @param phraseId Phrase id to resolve.
 * @returns The matching phrase group, if present.
 */
export function getPhrase(analysis: ThoughtAnalysis, phraseId: string | null): PhraseGroup | undefined {
  if (!phraseId) return undefined;
  return analysis.phrase_groups.find((phrase) => phrase.id === phraseId);
}

/**
 * Resolves all phrase groups attached to a statement.
 *
 * @param analysis Analysis to search.
 * @param statement Statement whose phrases should be looked up.
 * @returns Phrase groups referenced by the statement.
 */
export function getStatementPhrases(
  analysis: ThoughtAnalysis,
  statement: StatementGroup
): PhraseGroup[] {
  return statement.phrase_ids
    .map((phraseId) => analysis.phrase_groups.find((phrase) => phrase.id === phraseId))
    .filter((phrase): phrase is PhraseGroup => Boolean(phrase));
}

