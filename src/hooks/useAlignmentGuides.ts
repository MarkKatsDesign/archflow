import { useCallback, useState, useRef, useEffect } from "react";
import type { Node, NodeChange, XYPosition } from "reactflow";

export interface AlignmentGuide {
  type: "vertical" | "horizontal";
  position: number; // x for vertical, y for horizontal
  start: number; // start of the line
  end: number; // end of the line
}

interface AlignmentResult {
  guides: AlignmentGuide[];
  snappedPosition: XYPosition | null;
}

interface UseAlignmentGuidesOptions {
  threshold?: number; // Distance in pixels to trigger alignment (default: 5)
  magneticStrength?: number; // How strongly nodes snap (default: 5)
  enabled?: boolean;
}

// Standard node dimensions (matching CustomNode)
const NODE_WIDTH = 160;
const NODE_HEIGHT = 64;

export function useAlignmentGuides(
  _nodes: Node[],
  options: UseAlignmentGuidesOptions = {}
) {
  const { threshold = 5, enabled = true } = options;

  const [guides, setGuides] = useState<AlignmentGuide[]>([]);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const draggingNodeId = useRef<string | null>(null);

  // Track Shift key state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftPressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const findAlignments = useCallback(
    (
      draggingNode: Node,
      allNodes: Node[]
    ): AlignmentResult => {
      if (!enabled) {
        return { guides: [], snappedPosition: null };
      }

      const otherNodes = allNodes.filter((n) => n.id !== draggingNode.id);
      if (otherNodes.length === 0) {
        return { guides: [], snappedPosition: null };
      }

      const newGuides: AlignmentGuide[] = [];
      let snapX: number | null = null;
      let snapY: number | null = null;

      // Get dragging node boundaries
      const dragWidth = draggingNode.width || NODE_WIDTH;
      const dragHeight = draggingNode.height || NODE_HEIGHT;
      const dragLeft = draggingNode.position.x;
      const dragRight = dragLeft + dragWidth;
      const dragCenterX = dragLeft + dragWidth / 2;
      const dragTop = draggingNode.position.y;
      const dragBottom = dragTop + dragHeight;
      const dragCenterY = dragTop + dragHeight / 2;

      // Check alignment with each other node
      for (const node of otherNodes) {
        const nodeWidth = node.width || NODE_WIDTH;
        const nodeHeight = node.height || NODE_HEIGHT;
        const nodeLeft = node.position.x;
        const nodeRight = nodeLeft + nodeWidth;
        const nodeCenterX = nodeLeft + nodeWidth / 2;
        const nodeTop = node.position.y;
        const nodeBottom = nodeTop + nodeHeight;
        const nodeCenterY = nodeTop + nodeHeight / 2;

        // Vertical alignments (X-axis)
        // Left edge to left edge
        if (Math.abs(dragLeft - nodeLeft) <= threshold) {
          if (snapX === null) snapX = nodeLeft;
          newGuides.push({
            type: "vertical",
            position: nodeLeft,
            start: Math.min(dragTop, nodeTop) - 20,
            end: Math.max(dragBottom, nodeBottom) + 20,
          });
        }
        // Right edge to right edge
        if (Math.abs(dragRight - nodeRight) <= threshold) {
          if (snapX === null) snapX = nodeRight - dragWidth;
          newGuides.push({
            type: "vertical",
            position: nodeRight,
            start: Math.min(dragTop, nodeTop) - 20,
            end: Math.max(dragBottom, nodeBottom) + 20,
          });
        }
        // Center to center (X)
        if (Math.abs(dragCenterX - nodeCenterX) <= threshold) {
          if (snapX === null) snapX = nodeCenterX - dragWidth / 2;
          newGuides.push({
            type: "vertical",
            position: nodeCenterX,
            start: Math.min(dragTop, nodeTop) - 20,
            end: Math.max(dragBottom, nodeBottom) + 20,
          });
        }
        // Left edge to right edge
        if (Math.abs(dragLeft - nodeRight) <= threshold) {
          if (snapX === null) snapX = nodeRight;
          newGuides.push({
            type: "vertical",
            position: nodeRight,
            start: Math.min(dragTop, nodeTop) - 20,
            end: Math.max(dragBottom, nodeBottom) + 20,
          });
        }
        // Right edge to left edge
        if (Math.abs(dragRight - nodeLeft) <= threshold) {
          if (snapX === null) snapX = nodeLeft - dragWidth;
          newGuides.push({
            type: "vertical",
            position: nodeLeft,
            start: Math.min(dragTop, nodeTop) - 20,
            end: Math.max(dragBottom, nodeBottom) + 20,
          });
        }

        // Horizontal alignments (Y-axis)
        // Top edge to top edge
        if (Math.abs(dragTop - nodeTop) <= threshold) {
          if (snapY === null) snapY = nodeTop;
          newGuides.push({
            type: "horizontal",
            position: nodeTop,
            start: Math.min(dragLeft, nodeLeft) - 20,
            end: Math.max(dragRight, nodeRight) + 20,
          });
        }
        // Bottom edge to bottom edge
        if (Math.abs(dragBottom - nodeBottom) <= threshold) {
          if (snapY === null) snapY = nodeBottom - dragHeight;
          newGuides.push({
            type: "horizontal",
            position: nodeBottom,
            start: Math.min(dragLeft, nodeLeft) - 20,
            end: Math.max(dragRight, nodeRight) + 20,
          });
        }
        // Center to center (Y)
        if (Math.abs(dragCenterY - nodeCenterY) <= threshold) {
          if (snapY === null) snapY = nodeCenterY - dragHeight / 2;
          newGuides.push({
            type: "horizontal",
            position: nodeCenterY,
            start: Math.min(dragLeft, nodeLeft) - 20,
            end: Math.max(dragRight, nodeRight) + 20,
          });
        }
        // Top edge to bottom edge
        if (Math.abs(dragTop - nodeBottom) <= threshold) {
          if (snapY === null) snapY = nodeBottom;
          newGuides.push({
            type: "horizontal",
            position: nodeBottom,
            start: Math.min(dragLeft, nodeLeft) - 20,
            end: Math.max(dragRight, nodeRight) + 20,
          });
        }
        // Bottom edge to top edge
        if (Math.abs(dragBottom - nodeTop) <= threshold) {
          if (snapY === null) snapY = nodeTop - dragHeight;
          newGuides.push({
            type: "horizontal",
            position: nodeTop,
            start: Math.min(dragLeft, nodeLeft) - 20,
            end: Math.max(dragRight, nodeRight) + 20,
          });
        }
      }

      // Deduplicate guides
      const uniqueGuides = newGuides.reduce<AlignmentGuide[]>((acc, guide) => {
        const exists = acc.some(
          (g) =>
            g.type === guide.type &&
            Math.abs(g.position - guide.position) < 1
        );
        if (!exists) {
          acc.push(guide);
        } else {
          // Extend existing guide
          const existing = acc.find(
            (g) =>
              g.type === guide.type &&
              Math.abs(g.position - guide.position) < 1
          );
          if (existing) {
            existing.start = Math.min(existing.start, guide.start);
            existing.end = Math.max(existing.end, guide.end);
          }
        }
        return acc;
      }, []);

      const snappedPosition =
        snapX !== null || snapY !== null
          ? {
              x: snapX !== null ? snapX : draggingNode.position.x,
              y: snapY !== null ? snapY : draggingNode.position.y,
            }
          : null;

      return { guides: uniqueGuides, snappedPosition };
    },
    [enabled, threshold]
  );

  // Enhanced onNodesChange that applies alignment snapping
  const onNodesChangeWithAlignment = useCallback(
    (
      changes: NodeChange[],
      originalOnNodesChange: (changes: NodeChange[]) => void,
      currentNodes: Node[]
    ) => {
      // If Shift is pressed, use grid snapping instead
      if (isShiftPressed) {
        const gridSize = 15;
        const modifiedChanges = changes.map((change) => {
          if (change.type === "position" && change.position) {
            return {
              ...change,
              position: {
                x: Math.round(change.position.x / gridSize) * gridSize,
                y: Math.round(change.position.y / gridSize) * gridSize,
              },
            };
          }
          return change;
        });
        setGuides([]);
        originalOnNodesChange(modifiedChanges);
        return;
      }

      // Find dragging node
      const positionChange = changes.find(
        (c) => c.type === "position" && c.dragging
      );

      if (positionChange && positionChange.type === "position") {
        draggingNodeId.current = positionChange.id;

        // Find the node being dragged with its new position
        const draggingNode = currentNodes.find(
          (n) => n.id === positionChange.id
        );
        if (draggingNode && positionChange.position) {
          const tempNode = {
            ...draggingNode,
            position: positionChange.position,
          };

          const { guides: newGuides, snappedPosition } = findAlignments(
            tempNode,
            currentNodes
          );
          setGuides(newGuides);

          // Apply magnetic snapping
          if (snappedPosition) {
            const modifiedChanges = changes.map((change) => {
              if (
                change.type === "position" &&
                change.id === positionChange.id &&
                change.position
              ) {
                return {
                  ...change,
                  position: snappedPosition,
                };
              }
              return change;
            });
            originalOnNodesChange(modifiedChanges);
            return;
          }
        }
      }

      // Check if dragging ended
      const dragEndChange = changes.find(
        (c) =>
          c.type === "position" &&
          c.id === draggingNodeId.current &&
          !c.dragging
      );
      if (dragEndChange) {
        draggingNodeId.current = null;
        setGuides([]);
      }

      originalOnNodesChange(changes);
    },
    [findAlignments, isShiftPressed]
  );

  const clearGuides = useCallback(() => {
    setGuides([]);
  }, []);

  return {
    guides,
    isShiftPressed,
    onNodesChangeWithAlignment,
    clearGuides,
  };
}
