import type { GraphEdge } from '$lib/graph';
import type {
  PhraseGroup,
  Polarity,
  RelationType,
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
 * Converts phrase spans into a flat list of annotated text segments.
 *
 * @param text Raw input text.
 * @param phraseGroups Phrase spans to overlay onto the text.
 * @returns Ordered annotated spans for incremental text rendering.
 */
export function buildAnnotatedSpans(text: string, phraseGroups: PhraseGroup[]): AnnotatedSpan[] {
  const events: Array<{ pos: number; type: 'open' | 'close'; phrase: PhraseGroup }> = [];

  for (const phrase of phraseGroups) {
    events.push({ pos: phrase.start, type: 'open', phrase });
    events.push({ pos: phrase.end, type: 'close', phrase });
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
 * Maps relation types to the matching CSS edge color token.
 *
 * @param type Relation type to colorize.
 * @returns CSS variable reference for the relation stroke color.
 */
export function edgeColor(type: RelationType): string {
  if (type === 'contrasts_with') return 'var(--rel-contrasts-with)';
  if (type === 'blocks') return 'var(--rel-blocks)';
  if (type === 'supports') return 'var(--rel-supports)';
  return 'var(--rel-leads-to)';
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

/**
 * Converts routed graph waypoints into an SVG path string.
 *
 * @param points Dagre edge waypoints.
 * @returns SVG path data for straight or smoothed edge rendering.
 */
export function buildGraphPath(points: GraphEdge['points']): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  if (points.length === 2) return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;

  const segments = [`M${points[0].x},${points[0].y}`];

  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const afterNext = points[index + 2] ?? next;

    const controlPointOneX = current.x + (next.x - previous.x) / 6;
    const controlPointOneY = current.y + (next.y - previous.y) / 6;
    const controlPointTwoX = next.x - (afterNext.x - current.x) / 6;
    const controlPointTwoY = next.y - (afterNext.y - current.y) / 6;

    segments.push(
      `C${controlPointOneX},${controlPointOneY} ${controlPointTwoX},${controlPointTwoY} ${next.x},${next.y}`
    );
  }

  return segments.join(' ');
}

/**
 * Finds a stable label position near the midpoint of an edge.
 *
 * @param points Dagre edge waypoints.
 * @returns Midpoint coordinates suitable for a lightweight relation label.
 */
export function edgeLabelPosition(points: GraphEdge['points']): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 };

  const middleIndex = Math.floor(points.length / 2);
  const point = points[middleIndex];

  return {
    x: point.x,
    y: point.y - 10
  };
}
