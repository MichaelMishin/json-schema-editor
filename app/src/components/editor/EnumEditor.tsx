import { useState } from "react";
import { useSchemaStore } from "@/store/schemaStore";
import type { JsonSchema } from "@/types/jsonSchema";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";

interface EnumEditorProps {
  path: string[];
  nodeSchema: JsonSchema;
}

export function EnumEditor({ path, nodeSchema }: EnumEditorProps) {
  const { updateNodeField, removeNodeField } = useSchemaStore();
  const [newValue, setNewValue] = useState("");
  const enumValues = nodeSchema.enum as unknown[] | undefined;

  if (!enumValues && !nodeSchema.const) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateNodeField(path, "enum", [])}
            className="text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Enum
          </Button>
        </div>
      </div>
    );
  }

  const handleAddValue = () => {
    if (!newValue.trim()) return;
    const current = (enumValues || []) as unknown[];
    // Try to parse as JSON (number, boolean, null)
    let parsed: unknown;
    try {
      parsed = JSON.parse(newValue);
    } catch {
      parsed = newValue;
    }
    updateNodeField(path, "enum", [...current, parsed]);
    setNewValue("");
  };

  const handleRemoveValue = (index: number) => {
    const current = (enumValues || []) as unknown[];
    const next = current.filter((_, i) => i !== index);
    if (next.length === 0) {
      removeNodeField(path, "enum");
    } else {
      updateNodeField(path, "enum", next);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Enum Values
        </h4>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-destructive"
          onClick={() => removeNodeField(path, "enum")}
        >
          Remove Enum
        </Button>
      </div>

      {enumValues && (
        <div className="space-y-1">
          {enumValues.map((val, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="flex-1 text-sm font-mono px-2 py-1 bg-muted rounded">
                {JSON.stringify(val)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleRemoveValue(idx)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddValue()}
          placeholder="Add value..."
          className="h-8 text-sm"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddValue}
          disabled={!newValue.trim()}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
