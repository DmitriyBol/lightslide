import { useCallback, useRef } from "react";

import type { MutableRefObject, PointerEvent, RefObject } from "react";

import { getSnapIndex } from "../../utils/swipe";
import { DRAG_DIRECTION_LOCK_PX, RUBBER_BAND_DIVISOR } from "./constants";
import type { NavigateFn } from "./navigation";

type DragGestureParams = {
  trackRef: RefObject<HTMLDivElement>;
  currentIndexRef: MutableRefObject<number>;
  maxIndexRef: MutableRefObject<number>;
  isLoopRef: MutableRefObject<boolean>;
  loopOffsetRef: MutableRefObject<number>;
  autoScrollPausedRef: MutableRefObject<boolean>;
  getComputedSlideWidth: () => number;
  snapToVisual: (
    visualIndex: number,
    animate: boolean,
    onComplete?: () => void,
  ) => void;
  navigateToIndex: NavigateFn;
};

type DragHandlers = {
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: () => void;
};

// Owns all drag state in refs and mutates the track transform directly during the
// gesture (zero re-renders). Commits the snap decision through navigateToIndex on
// release. Direction-locks to horizontal on the first few px; vertical intent cancels.
export function useDragGesture({
  trackRef,
  currentIndexRef,
  maxIndexRef,
  isLoopRef,
  loopOffsetRef,
  autoScrollPausedRef,
  getComputedSlideWidth,
  snapToVisual,
  navigateToIndex,
}: DragGestureParams): DragHandlers {
  const dragStartX = useRef<number | null>(null);
  const dragStartY = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const dragVelocityX = useRef(0);
  const lastPointerX = useRef(0);
  const lastPointerTime = useRef(0);

  const visualIndexOf = useCallback(
    (logicalIndex: number) =>
      isLoopRef.current ? logicalIndex + loopOffsetRef.current : logicalIndex,
    [isLoopRef, loopOffsetRef],
  );

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      dragStartX.current = e.clientX;
      dragStartY.current = e.clientY;
      isDraggingRef.current = false;
      dragVelocityX.current = 0;
      lastPointerX.current = e.clientX;
      lastPointerTime.current = Date.now();
      autoScrollPausedRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      if (trackRef.current) trackRef.current.style.transition = "";
    },
    [trackRef, autoScrollPausedRef],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (dragStartX.current === null) return;

      const dx = e.clientX - dragStartX.current;
      const dy = e.clientY - (dragStartY.current ?? e.clientY);

      if (!isDraggingRef.current) {
        if (
          Math.abs(dx) < DRAG_DIRECTION_LOCK_PX &&
          Math.abs(dy) < DRAG_DIRECTION_LOCK_PX
        )
          return;
        if (Math.abs(dy) > Math.abs(dx)) {
          dragStartX.current = null;
          autoScrollPausedRef.current = false;
          return;
        }
        isDraggingRef.current = true;
      }

      const now = Date.now();
      const dt = now - lastPointerTime.current;
      if (dt > 0)
        dragVelocityX.current = (e.clientX - lastPointerX.current) / dt;
      lastPointerTime.current = now;
      lastPointerX.current = e.clientX;

      const atStart =
        !isLoopRef.current && currentIndexRef.current <= 0 && dx > 0;
      const atEnd =
        !isLoopRef.current &&
        currentIndexRef.current >= maxIndexRef.current &&
        dx < 0;
      const delta = atStart || atEnd ? dx / RUBBER_BAND_DIVISOR : dx;

      if (trackRef.current) {
        const sw = getComputedSlideWidth();
        const visualIndex = visualIndexOf(currentIndexRef.current);
        trackRef.current.style.transform = `translateX(${-visualIndex * sw + delta}px)`;
      }
    },
    [
      getComputedSlideWidth,
      visualIndexOf,
      trackRef,
      currentIndexRef,
      maxIndexRef,
      isLoopRef,
      autoScrollPausedRef,
    ],
  );

  const commitDrag = useCallback(
    (endX: number) => {
      autoScrollPausedRef.current = false;

      if (dragStartX.current === null || !isDraggingRef.current) {
        dragStartX.current = null;
        isDraggingRef.current = false;
        return;
      }

      const deltaX = endX - dragStartX.current;
      dragStartX.current = null;
      isDraggingRef.current = false;

      const sw = getComputedSlideWidth();
      const nextIndex = getSnapIndex(
        currentIndexRef.current,
        maxIndexRef.current,
        deltaX,
        sw,
        dragVelocityX.current,
        isLoopRef.current,
      );

      navigateToIndex(nextIndex, "drag");
    },
    [
      getComputedSlideWidth,
      navigateToIndex,
      currentIndexRef,
      maxIndexRef,
      isLoopRef,
      autoScrollPausedRef,
    ],
  );

  const onPointerUp = useCallback(
    (e: PointerEvent<HTMLDivElement>) => commitDrag(e.clientX),
    [commitDrag],
  );

  const onPointerCancel = useCallback(() => {
    autoScrollPausedRef.current = false;
    dragStartX.current = null;
    isDraggingRef.current = false;
    snapToVisual(visualIndexOf(currentIndexRef.current), true);
  }, [snapToVisual, visualIndexOf, currentIndexRef, autoScrollPausedRef]);

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}
