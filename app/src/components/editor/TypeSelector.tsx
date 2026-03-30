import { useSchemaStore } from "@/store/schemaStore";
import type { JsonSchema, JsonSchemaType } from "@/types/jsonSchema";
import { JSON_SCHEMA_TYPES } from "@/types/jsonSchema";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

interface TypeSelectorProps {
  path: string[];
  nodeSchema: JsonSchema;
}

export function TypeSelector({ path, nodeSchema }: TypeSelectorProps) {
  const { updateNodeField, removeNodeField } = useSchemaStore();
  const currentType = nodeSchema.type;
  const isMultiType = Array.isArray(currentType);
  const [multiMode, setMultiMode] = useState(isMultiType);

  const handleSingleTypeChange = (value: string) => {
    if (value === "__none__") {
      removeNodeField(path, "type");
    } else {
      updateNodeField(path, "type", value);
    }
  };

  const handleMultiTypeToggle = (type: JsonSchemaType, checked: boolean) => {
    const current = Array.isArray(currentType) ? [...currentType] : currentType ? [currentType] : [];
    let next: JsonSchemaType[];
    if (checked) {
      next = [...current, type];
    } else {
      next = current.filter((t) => t !== type);
    }
    if (next.length === 0) {
      removeNodeField(path, "type");
    } else if (next.length === 1 && !multiMode) {
      updateNodeField(path, "type", next[0]);
    } else {
      updateNodeField(path, "type", next);
    }
  };

  const handleModeSwitch = (multi: boolean) => {
    setMultiMode(multi);
    if (!multi && Array.isArray(currentType)) {
      // Switch to single: keep just the first type
      if (currentType.length > 0) {
        updateNodeField(path, "type", currentType[0]);
      }
    } else if (multi && currentType && !Array.isArray(currentType)) {
      updateNodeField(path, "type", [currentType]);
    }
  };

  const selectedTypes = Array.isArray(currentType)
    ? currentType
    : currentType
    ? [currentType]
    : [];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Type</Label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Multi-type</span>
          <Switch
            checked={multiMode}
            onCheckedChange={handleModeSwitch}
          />
        </div>
      </div>

      {multiMode ? (
        <div className="grid grid-cols-2 gap-2">
          {JSON_SCHEMA_TYPES.map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={selectedTypes.includes(t)}
                onCheckedChange={(checked) =>
                  handleMultiTypeToggle(t, !!checked)
                }
              />
              {t}
            </label>
          ))}
        </div>
      ) : (
        <Select
          value={typeof currentType === "string" ? currentType : "__none__"}
          onValueChange={handleSingleTypeChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">
              <span className="text-muted-foreground">(none)</span>
            </SelectItem>
            {JSON_SCHEMA_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
