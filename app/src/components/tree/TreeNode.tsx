import { useState, useRef } from "react";
import { useSchemaStore } from "@/store/schemaStore";
import type { TreeNode } from "@/types/jsonSchema";
import { getNodeAtPath } from "@/utils/schemaUtils";
import { useDragContext } from "./DragContext";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Link2,
  Asterisk,
  Layers,
  List,
  Hash,
  Type,
  ToggleLeft,
  Circle,
  Braces,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TreeContextMenu } from "./TreeContextMenu";

interface TreeNodeProps {
  node: TreeNode;
  depth: number;
}

const typeIcons: Record<string, React.ReactNode> = {
  string: <Type className="h-3 w-3 text-green-600" />,
  number: <Hash className="h-3 w-3 text-blue-600" />,
  integer: <Hash className="h-3 w-3 text-blue-500" />,
  boolean: <ToggleLeft className="h-3 w-3 text-purple-600" />,
  null: <Circle className="h-3 w-3 text-gray-400" />,
  object: <Braces className="h-3 w-3 text-orange-500" />,
  array: <List className="h-3 w-3 text-teal-600" />,
};

function getTypeIcon(node: TreeNode) {
  if (node.isRef) return <Link2 className="h-3 w-3 text-indigo-500" />;
  if (node.hasComposition) return <Layers className="h-3 w-3 text-amber-500" />;
  if (Array.isArray(node.jsonType)) {
    return typeIcons[node.jsonType[0]] || <Circle className="h-3 w-3" />;
  }
  if (node.jsonType) return typeIcons[node.jsonType] || <Circle className="h-3 w-3" />;
  return <Circle className="h-3 w-3 text-gray-300" />;
}

function getTypeBadgeLabel(node: TreeNode): string {
  if (node.isRef) {
    const name = node.refTarget?.split("/").pop() || "$ref";
    return `→ ${name}`;
  }
  if (node.hasComposition) return node.hasComposition;
  if (!node.jsonType) return "any";
  if (Array.isArray(node.jsonType)) return node.jsonType.join(" | ");
  return node.jsonType;
}

export function TreeNodeComponent({ node, depth }: TreeNodeProps) {
  const { schema, selectedPath, selectNode, expandedPaths, toggleExpand, reorderProperty } =
    useSchemaStore();
  const drag = useDragContext();
  const [contextMenuPos, setContextMenuPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [dropPosition, setDropPosition] = useState<"above" | "below" | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const pathKey = node.path.join(".");
  const isSelected =
    selectedPath !== null && selectedPath.join(".") === pathKey;
  const isExpanded = expandedPaths.has(pathKey);
  const hasChildren = node.children && node.children.length > 0;

  // Determine if this node is a reorderable property
  const isProperty =
    node.path.length >= 2 &&
    node.path[node.path.length - 2] === "properties";
  const parentObjectPath = isProperty ? node.path.slice(0, -2) : null;
  const propName = isProperty ? node.path[node.path.length - 1] : null;

  let propIndex = -1;
  let propCount = 0;
  let siblingKeys: string[] = [];
  if (isProperty && parentObjectPath && schema) {
    const parentNode = getNodeAtPath(schema, parentObjectPath);
    siblingKeys = Object.keys(parentNode?.properties ?? {});
    propIndex = siblingKeys.indexOf(propName!);
    propCount = siblingKeys.length;
  }

  const handleClick = () => selectNode(node.path);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExpand(pathKey);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleMove = (e: React.MouseEvent, direction: "up" | "down") => {
    e.stopPropagation();
    if (parentObjectPath && propName) {
      reorderProperty(parentObjectPath, propName, direction);
    }
  };

  // ── Drag-and-drop handlers ──────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent) => {
    if (!isProperty) return;
    drag.setDragPath(node.path);
    e.dataTransfer.effectAllowed = "move";
    // Set transparent drag image so we keep the custom visual
    const ghost = document.createElement("div");
    ghost.style.position = "absolute";
    ghost.style.top = "-9999px";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragEnd = () => {
    drag.setDragPath(null);
    setDropPosition(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isProperty || !drag.dragPath) return;
    // Only accept same-parent drops
    const srcPath = drag.dragPath;
    if (
      srcPath.slice(0, -1).join(".") !==
      node.path.slice(0, -1).join(".")
    ) return;
    if (srcPath.join(".") === node.path.join(".")) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    const rect = rowRef.current?.getBoundingClientRect();
    if (rect) {
      setDropPosition(e.clientY < rect.top + rect.height / 2 ? "above" : "below");
    }
  };

  const handleDragLeave = () => setDropPosition(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const srcPath = drag.dragPath;
    setDropPosition(null);
    drag.setDragPath(null);

    if (!srcPath || !parentObjectPath || !propName || !schema) return;
    if (srcPath.slice(0, -1).join(".") !== node.path.slice(0, -1).join(".")) return;

    const srcName = srcPath[srcPath.length - 1];
    if (srcName === propName) return;

    const parentNode = getNodeAtPath(schema, parentObjectPath);
    if (!parentNode?.properties) return;

    const entries = Object.entries(parentNode.properties);
    const fromIdx = entries.findIndex(([k]) => k === srcName);
    const toIdx = entries.findIndex(([k]) => k === propName);
    if (fromIdx === -1 || toIdx === -1) return;

    const [moved] = entries.splice(fromIdx, 1);
    const insertAt = dropPosition === "above" ? toIdx - (fromIdx < toIdx ? 1 : 0) : toIdx + (fromIdx > toIdx ? 1 : 0);
    entries.splice(Math.max(0, insertAt), 0, moved);

    // Build new properties order and update via store
    const newProperties = Object.fromEntries(entries);
    const updatedParent = { ...parentNode, properties: newProperties };
    useSchemaStore.getState().updateNode(parentObjectPath, updatedParent as never);
  };

  return (
    <div
      ref={rowRef}
      className={cn(
        "relative",
        dropPosition === "above" && "before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-indigo-500 before:rounded",
        dropPosition === "below" && "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-500 after:rounded"
      )}
      onDragOver={isProperty ? handleDragOver : undefined}
      onDragLeave={isProperty ? handleDragLeave : undefined}
      onDrop={isProperty ? handleDrop : undefined}
    >
      <button
        draggable={isProperty}
        onDragStart={isProperty ? handleDragStart : undefined}
        onDragEnd={isProperty ? handleDragEnd : undefined}
        className={cn(
          "flex items-center w-full px-1 py-0.5 rounded text-sm hover:bg-accent/50 transition-colors group",
          isSelected && "bg-accent text-accent-foreground"
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Drag handle — only for property nodes */}
        {isProperty ? (
          <span className="w-4 h-4 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-40 cursor-grab active:cursor-grabbing mr-0.5">
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </span>
        ) : (
          /* Expand/collapse chevron */
          <span
            className="w-4 h-4 flex items-center justify-center shrink-0"
            onClick={hasChildren ? handleToggle : undefined}
          >
            {hasChildren && (
              <ChevronRight
                className={cn(
                  "h-3 w-3 text-muted-foreground transition-transform",
                  isExpanded && "rotate-90"
                )}
              />
            )}
          </span>
        )}

        {/* Expand/collapse chevron (for property nodes that also have children) */}
        {isProperty && (
          <span
            className="w-4 h-4 flex items-center justify-center shrink-0"
            onClick={hasChildren ? handleToggle : undefined}
          >
            {hasChildren && (
              <ChevronRight
                className={cn(
                  "h-3 w-3 text-muted-foreground transition-transform",
                  isExpanded && "rotate-90"
                )}
              />
            )}
          </span>
        )}

        {/* Type icon */}
        <span className="mr-1.5 shrink-0">{getTypeIcon(node)}</span>

        {/* Label */}
        <span className="truncate text-left flex-1">{node.label}</span>

        {/* Required indicator */}
        {node.isRequired && (
          <Asterisk className="h-3 w-3 text-red-500 shrink-0 mr-1" />
        )}

        {/* Reorder buttons — visible on hover */}
        {isProperty && propCount > 1 && (
          <span className="hidden group-hover:flex items-center shrink-0 ml-1">
            <span
              role="button"
              aria-label="Move up"
              onClick={(e) => handleMove(e, "up")}
              className={cn(
                "p-0.5 rounded hover:bg-muted-foreground/20",
                propIndex === 0 && "opacity-25 pointer-events-none"
              )}
            >
              <ChevronUp className="h-3 w-3 text-muted-foreground" />
            </span>
            <span
              role="button"
              aria-label="Move down"
              onClick={(e) => handleMove(e, "down")}
              className={cn(
                "p-0.5 rounded hover:bg-muted-foreground/20",
                propIndex === propCount - 1 && "opacity-25 pointer-events-none"
              )}
            >
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </span>
          </span>
        )}

        {/* Type badge */}
        <Badge
          variant="secondary"
          className="text-[10px] px-1 py-0 h-4 font-normal shrink-0 ml-1"
        >
          {getTypeBadgeLabel(node)}
        </Badge>
      </button>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {/* Context menu */}
      {contextMenuPos && (
        <TreeContextMenu
          node={node}
          position={contextMenuPos}
          onClose={() => setContextMenuPos(null)}
        />
      )}
    </div>
  );
}
