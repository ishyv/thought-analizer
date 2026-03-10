import type { GraphEdge } from '$lib/graph';
import type { RelationType } from '$lib/types';

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
