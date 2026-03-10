import dagre, {
  type GraphEdge as DagreGraphEdge,
  type GraphLabel as DagreGraphLabel,
  type Node as DagreNode
} from '@dagrejs/dagre';

import type { RelationType, StatementRole, ThoughtAnalysis } from '$lib/types';

/**
 * Pure layout utility.
 * Takes a ThoughtAnalysis and returns pixel-space node and edge positions using Dagre.
 * No Svelte dependencies. Safe to call in any context.
 */

/** Positioned statement node in the rendered structure graph. */
export interface GraphNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  role: StatementRole;
  label: string;
}

/** Routed edge between two graph nodes in the rendered structure graph. */
export interface GraphEdge {
  id: string;
  points: { x: number; y: number }[];
  type: RelationType;
  sourceKind: 'phrase' | 'statement';
  targetKind: 'phrase' | 'statement';
}

/** Complete graph layout payload returned to the analysis view. */
export interface GraphLayout {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width: number;
  height: number;
}

interface InternalNode {
  width: number;
  height: number;
  role: StatementRole;
  label: string;
}

interface InternalEdge {
  id: string;
  type: RelationType;
  sourceKind: 'phrase' | 'statement';
  targetKind: 'phrase' | 'statement';
}

const LAYOUT_CONFIG = {
  rankdir: 'LR',
  nodesep: 40,
  ranksep: 60,
  marginx: 20,
  marginy: 20
} as const;

const NODE_SIZE = {
  width: 160,
  height: 44
} as const;

/**
 * Builds a Dagre layout for the statement graph.
 *
 * @param analysis Validated analysis used to derive graph nodes and edges.
 * @returns Pixel-space nodes, routed edges, and total graph dimensions.
 */
export function buildGraphLayout(analysis: ThoughtAnalysis): GraphLayout {
  const graph = new dagre.graphlib.Graph<DagreGraphLabel, InternalNode, InternalEdge>({
    multigraph: true
  });

  graph.setGraph(LAYOUT_CONFIG);

  for (const statement of analysis.statement_groups) {
    graph.setNode(statement.id, {
      width: NODE_SIZE.width,
      height: NODE_SIZE.height,
      role: statement.role,
      label: statement.text.slice(0, 24)
    });
  }

  // Phrase-to-phrase edges are skipped for now because the graph view is scoped
  // to statement structure until phrase-level layout becomes a first-class layer.
  const statementRelations = analysis.relations.filter(
    (relation) => relation.source.kind === 'statement' && relation.target.kind === 'statement'
  );

  for (const relation of statementRelations) {
    graph.setEdge(
      { v: relation.source.id, w: relation.target.id, name: relation.id },
      {
        id: relation.id,
        type: relation.type,
        sourceKind: relation.source.kind,
        targetKind: relation.target.kind
      }
    );
  }

  dagre.layout(graph);

  const nodes = analysis.statement_groups
    .map((statement): GraphNode | null => {
      const node = graph.node(statement.id);

      if (!node) return null;

      const dagreNode = node as unknown as DagreNode<InternalNode>;

      return {
        id: statement.id,
        x: dagreNode.x - dagreNode.width / 2,
        y: dagreNode.y - dagreNode.height / 2,
        width: dagreNode.width,
        height: dagreNode.height,
        role: statement.role,
        label: dagreNode.label ?? statement.text.slice(0, 24)
      };
    })
    .filter((node): node is GraphNode => node !== null);

  const edges = statementRelations
    .map((relation): GraphEdge | null => {
      const edge = graph.edge({ v: relation.source.id, w: relation.target.id, name: relation.id }) as
        | (InternalEdge & DagreGraphEdge)
        | undefined;

      if (!edge?.points) return null;

      return {
        id: relation.id,
        points: edge.points.map((point) => ({ x: point.x, y: point.y })),
        type: relation.type,
        sourceKind: relation.source.kind,
        targetKind: relation.target.kind
      };
    })
    .filter((edge): edge is GraphEdge => edge !== null);

  const graphLabel = graph.graph();

  return {
    nodes,
    edges,
    width: typeof graphLabel.width === 'number' ? graphLabel.width : 0,
    height: typeof graphLabel.height === 'number' ? graphLabel.height : 0
  };
}
