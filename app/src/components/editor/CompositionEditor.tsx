import { useSchemaStore } from "@/store/schemaStore";
import type { JsonSchema, JsonSchemaType } from "@/types/jsonSchema";
import { getDefinitionNames, getTypeLabel } from "@/utils/schemaUtils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Layers, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CompositionEditorProps {
  path: string[];
  nodeSchema: JsonSchema;
}

const COMPOSITION_TYPES = ["allOf", "anyOf", "oneOf", "not"] as const;
type CompositionType = (typeof COMPOSITION_TYPES)[number];

export function CompositionEditor({ path, nodeSchema }: CompositionEditorProps) {
  const {
    schema,
    addCompositionItem,
    removeCompositionItem,
    updateNode,
    selectNode,
  } = useSchemaStore();
  const [addType, setAddType] = useState<CompositionType | null>(null);

  if (!schema) return null;
  const definitions = getDefinitionNames(schema);

  const activeCompositions = COMPOSITION_TYPES.filter((t) => {
    if (t === "not") return !!nodeSchema.not;
    return Array.isArray(nodeSchema[t]) && (nodeSchema[t] as JsonSchema[]).length > 0;
  });

  const inactiveCompositions = COMPOSITION_TYPES.filter(
    (t) => !activeCompositions.includes(t)
  );

  const handleAddComposition = (type: CompositionType) => {
    if (type === "not") {
      const updated = { ...nodeSchema, not: { type: "string" as JsonSchemaType } };
      updateNode(path, updated);
    } else {
      addCompositionItem(path, type, { type: "object" as JsonSchemaType, properties: {} });
    }
    setAddType(null);
  };

  const handleAddRefItem = (type: CompositionType, defName: string) => {
    addCompositionItem(path, type, { $ref: `#/definitions/${defName}` });
  };

  const handleAddInlineItem = (type: CompositionType) => {
    addCompositionItem(path, type, { type: "object" as JsonSchemaType, properties: {} });
  };

  const handleRemoveComposition = (type: CompositionType) => {
    const updated = { ...nodeSchema };
    delete updated[type];
    updateNode(path, updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-amber-500" />
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Composition
        </h4>
      </div>

      {/* Active compositions */}
      {activeCompositions.map((type) => (
        <CompositionSection
          key={type}
          type={type}
          path={path}
          nodeSchema={nodeSchema}
          definitions={definitions}
          onRemove={() => handleRemoveComposition(type)}
          onAddRef={(defName) => handleAddRefItem(type, defName)}
          onAddInline={() => handleAddInlineItem(type)}
          onSelect={selectNode}
          onRemoveItem={(idx) => removeCompositionItem(path, type, idx)}
        />
      ))}

      {/* Add composition */}
      {inactiveCompositions.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {addType ? (
            <div className="flex gap-2">
              {inactiveCompositions.map((t) => (
                <Button
                  key={t}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleAddComposition(t)}
                >
                  {t}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setAddType(null)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setAddType("allOf")}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Composition
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface CompositionSectionProps {
  type: CompositionType;
  path: string[];
  nodeSchema: JsonSchema;
  definitions: string[];
  onRemove: () => void;
  onAddRef: (defName: string) => void;
  onAddInline: () => void;
  onSelect: (path: string[]) => void;
  onRemoveItem: (index: number) => void;
}

function CompositionSection({
  type,
  path,
  nodeSchema,
  definitions,
  onRemove,
  onAddRef,
  onAddInline,
  onSelect,
  onRemoveItem,
}: CompositionSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const items =
    type === "not"
      ? nodeSchema.not
        ? [nodeSchema.not]
        : []
      : (nodeSchema[type] as JsonSchema[]) || [];

  return (
    <div className="border rounded-md p-2 space-y-2">
      <div className="flex items-center justify-between">
        <button
          className="flex items-center gap-1 text-sm font-medium"
          onClick={() => setExpanded(!expanded)}
        >
          <ChevronRight
            className={cn(
              "h-3 w-3 transition-transform",
              expanded && "rotate-90"
            )}
          />
          <Badge variant="secondary" className="text-xs">
            {type}
          </Badge>
          <span className="text-xs text-muted-foreground">
            ({items.length} {items.length === 1 ? "item" : "items"})
          </span>
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {expanded && (
        <div className="space-y-1 ml-4">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-sm group"
            >
              <button
                className="flex-1 text-left px-2 py-1 rounded hover:bg-accent/50 transition-colors text-xs font-mono truncate"
                onClick={() =>
                  onSelect([...path, type, String(idx)])
                }
              >
                {getTypeLabel(item)}
              </button>
              {type !== "not" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemoveItem(idx)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}

          {type !== "not" && (
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={onAddInline}
              >
                <Plus className="h-3 w-3 mr-1" />
                Inline
              </Button>
              {definitions.length > 0 && (
                <Select onValueChange={(v) => onAddRef(v)}>
                  <SelectTrigger className="h-7 text-xs w-auto min-w-[120px]">
                    <SelectValue placeholder="+ $ref..." />
                  </SelectTrigger>
                  <SelectContent>
                    {definitions.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
