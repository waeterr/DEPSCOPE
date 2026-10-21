import type {
  DependencyEdge,
  DependencyGraph,
  DependencyNode,
} from "../models/types.js";

export interface GraphIndexes {
  outgoing: ReadonlyMap<string, readonly DependencyEdge[]>;
  incoming: ReadonlyMap<string, readonly DependencyEdge[]>;
  byName: ReadonlyMap<string, readonly DependencyNode[]>;
  byNameVersion: ReadonlyMap<string, readonly DependencyNode[]>;
}

export function buildIndexes(graph: DependencyGraph): GraphIndexes {
  const outgoing = new Map<string, DependencyEdge[]>();
  const incoming = new Map<string, DependencyEdge[]>();
  const byName = new Map<string, DependencyNode[]>();
  const byNameVersion = new Map<string, DependencyNode[]>();

  for (const node of graph.nodes.values()) {
    append(byName, node.name, node);
    append(byNameVersion, `${node.name}@${node.version}`, node);
  }
  for (const edge of graph.edges) {
    append(outgoing, edge.from, edge);
    append(incoming, edge.to, edge);
  }

  return { outgoing, incoming, byName, byNameVersion };
}

function append<T>(map: Map<string, T[]>, key: string, value: T): void {
  const values = map.get(key);
  if (values) values.push(value);
  else map.set(key, [value]);
}
