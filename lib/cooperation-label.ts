/** Current adjacency, not a promise that these neighbors remain until arrival. */
export function cooperationLabel(count: number, perNeighbor: number): string {
  return `协作邻座 ×${count} · 到站合计+${count * perNeighbor}币`;
}
