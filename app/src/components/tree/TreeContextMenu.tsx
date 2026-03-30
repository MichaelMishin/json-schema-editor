import { useEffect, useRef, useState } from "react";
import { useSchemaStore } from "@/store/schemaStore";
import type { TreeNode } from "@/types/jsonSchema";
import { getNodeAtPath } from "@/utils/schemaUtils";

interface TreeContextMenuProps {
  node: TreeNode;
  position: { x: number; y: number };
  onClose: () => void;
}

export function TreeContextMenu({
  node,
  position,
  onClose,
}: TreeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    schema,
    removeProperty,
    removeDefinition,
    selectNode,
    extractToDefinition,
    inlineRef,
  } = useSchemaStore();
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(node.label);
  const [addingProp, setAddingProp] = useState(false);
  const [newPropName, setNewPropName] = useState("");

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  if (!schema) return null;

  const isDefinition = node.schemaType === "definition";
  const isProperty = node.schemaType === "property";
  const nodeSchema = getNodeAtPath(schema, node.path);
  const isObject =
    nodeSchema &&
    !nodeSchema.$ref &&
    (nodeSchema.type === "object" || nodeSchema.properties);
  const isRef = !!nodeSchema?.$ref;

  const parentPath = isProperty
    ? node.path.slice(0, -2) // remove "properties" and the name
    : isDefinition
    ? []
    : node.path.slice(0, -1);

  const handleDelete = () => {
    if (isDefinition) {
      removeDefinition(node.label);
    } else if (isProperty) {
      removeProperty(parentPath, node.label);
    }
    onClose();
  };

  const handleRename = () => {
    if (newName && newName !== node.label) {
      if (isDefinition) {
        useSchemaStore.getState().renameDefinition(node.label, newName);
      } else if (isProperty) {
        useSchemaStore.getState().renameProperty(parentPath, node.label, newName);
      }
    }
    setRenaming(false);
    onClose();
  };

  const handleAddProperty = () => {
    if (!newPropName.trim()) return;
    useSchemaStore.getState().addProperty(node.path, newPropName.trim(), { type: "string" });
    setAddingProp(false);
    onClose();
  };

  const handleExtractToDefinition = () => {
    const defName =
      node.label.charAt(0).toUpperCase() + node.label.slice(1);
    extractToDefinition(node.path, defName);
    onClose();
  };

  const handleInlineRef = () => {
    inlineRef(node.path);
    onClose();
  };

  const handleGoToDefinition = () => {
    if (nodeSchema?.$ref) {
      const defName = nodeSchema.$ref.split("/").pop();
      if (defName) {
        selectNode(["definitions", defName]);
      }
    }
    onClose();
  };

  const menuClass =
    "bg-popover border rounded-md shadow-md py-1 z-50 min-w-[180px] text-sm";
  const itemClass =
    "px-3 py-1.5 hover:bg-accent cursor-pointer transition-colors flex items-center gap-2";

  return (
    <div
      ref={menuRef}
      className={menuClass}
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
      }}
    >
      {renaming ? (
        <div className="px-3 py-1.5">
          <input
            className="w-full px-2 py-1 border rounded text-sm bg-background"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") {
                setRenaming(false);
                onClose();
              }
            }}
            autoFocus
          />
        </div>
      ) : addingProp ? (
        <div className="px-3 py-1.5">
          <input
            className="w-full px-2 py-1 border rounded text-sm bg-background"
            placeholder="Property name"
            value={newPropName}
            onChange={(e) => setNewPropName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddProperty();
              if (e.key === "Escape") {
                setAddingProp(false);
                onClose();
              }
            }}
            autoFocus
          />
        </div>
      ) : (
        <>
          {isObject && (
            <div className={itemClass} onClick={() => setAddingProp(true)}>
              Add Property
            </div>
          )}
          {(isProperty || isDefinition) && (
            <>
              <div className={itemClass} onClick={() => setRenaming(true)}>
                Rename
              </div>
              <div
                className={`${itemClass} text-destructive`}
                onClick={handleDelete}
              >
                Delete
              </div>
            </>
          )}
          {isRef && (
            <>
              <div className="h-px bg-border my-1" />
              <div className={itemClass} onClick={handleGoToDefinition}>
                Go to Definition
              </div>
              <div className={itemClass} onClick={handleInlineRef}>
                Convert to Inline
              </div>
            </>
          )}
          {!isRef && isObject && !isDefinition && (
            <>
              <div className="h-px bg-border my-1" />
              <div className={itemClass} onClick={handleExtractToDefinition}>
                Extract to Definition
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
