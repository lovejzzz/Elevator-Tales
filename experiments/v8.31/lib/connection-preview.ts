/**
 * A drag preview belongs only to an edge whose visible relationship is newly
 * created or changed by the prospective placement. Unrelated empty edges and
 * unchanged existing links must keep their normal presentation.
 */
export function shouldPreviewConnection(
  previewing: boolean,
  currentActive: boolean,
  nextActive: boolean,
  currentConflict: string | null,
  nextConflict: string | null,
): boolean {
  if (!previewing || (!nextActive && !nextConflict)) return false;
  return currentActive !== nextActive || currentConflict !== nextConflict;
}
