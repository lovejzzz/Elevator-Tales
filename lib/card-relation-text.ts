/** Preserve units and timing while removing repeated prose from comparison cards. */
export function compactRelationText(text: string): string {
  return text
    .replace(/Each ascent costs (\d+) extra power/gu, '+$1 power/floor')
    .replace(/Each ascent immediately −(\d+)/gu, '−$1 coins/floor')
    .replace(/Each ascent \+(\d+) agitation/gu, '+$1 agitation/floor')
    .replace(/Both use ×(\d+) power per floor/gu, 'Both: power ×$1')
    .replace(/Own arrival \+(\d+) coins\/person/gu, 'Own arrival +$1 coins/neighbor');
}
