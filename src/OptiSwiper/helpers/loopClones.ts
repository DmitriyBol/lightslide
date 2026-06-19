import { cloneElement, isValidElement } from "react";

import type { ReactElement, ReactNode } from "react";

// Builds the rendered track children for loop mode: clones of the last `loopOffset`
// slides prepended and the first `loopOffset` slides appended, so wrap-around looks
// continuous. Returns the original array unchanged when looping is off (loopOffset 0).
export function buildLoopChildren(
  childArray: ReactNode[],
  slideCount: number,
  loopOffset: number,
): ReactNode[] {
  if (loopOffset <= 0 || slideCount <= 0) return childArray;

  const prependClones = childArray
    .slice(slideCount - loopOffset)
    .map((child, i) =>
      isValidElement(child)
        ? cloneElement(child as ReactElement, { key: `__loop_pre_${i}` })
        : child,
    );

  const appendClones = childArray
    .slice(0, loopOffset)
    .map((child, i) =>
      isValidElement(child)
        ? cloneElement(child as ReactElement, { key: `__loop_post_${i}` })
        : child,
    );

  return [...prependClones, ...childArray, ...appendClones];
}
