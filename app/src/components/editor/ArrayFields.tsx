import { useSchemaStore } from "@/store/schemaStore";
import type { JsonSchema, JsonSchemaType } from "@/types/jsonSchema";
import { JSON_SCHEMA_TYPES, STRING_FORMATS } from "@/types/jsonSchema";
import { getDefinitionNames } from "@/utils/schemaUtils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ArrayFieldsProps {
  path: string[];
  nodeSchema: JsonSchema;
}

export function ArrayFields({ path, nodeSchema }: ArrayFieldsProps) {
  const { schema, updateNodeField, removeNodeField } = useSchemaStore();
  const items = nodeSchema.items as JsonSchema | undefined;
  const definitions = schema ? getDefinitionNames(schema) : [];

  const handleNumberField = (field: string, value: string) => {
    if (value === "") {
      removeNodeField(path, field);
    } else {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 0) {
        updateNodeField(path, field, num);
      }
    }
  };

  const handleItemsType = (value: string) => {
    if (value === "__none__") {
      removeNodeField(path, "items");
    } else if (value.startsWith("$ref:")) {
      const defName = value.substring(5);
      updateNodeField(path, "items", { $ref: `#/definitions/${defName}` });
    } else {
      updateNodeField(path, "items", { type: value as JsonSchemaType });
    }
  };

  const getCurrentItemsValue = (): string => {
    if (!items) return "__none__";
    if (items.$ref) {
      const defName = items.$ref.split("/").pop();
      return `$ref:${defName}`;
    }
    if (typeof items.type === "string") return items.type;
    return "__none__";
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Array Settings
      </h4>

      {/* Items type */}
      <div className="grid gap-2">
        <Label className="text-xs">Items Schema</Label>
        <Select value={getCurrentItemsValue()} onValueChange={handleItemsType}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Select items type" />
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
            {definitions.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                  Definitions
                </div>
                {definitions.map((d) => (
                  <SelectItem key={`$ref:${d}`} value={`$ref:${d}`}>
                    $ref → {d}
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Items format (if string) */}
      {items && typeof items.type === "string" && items.type === "string" && (
        <div className="grid gap-2">
          <Label className="text-xs">Items Format</Label>
          <Select
            value={items.format || "__none__"}
            onValueChange={(v) => {
              const updated = { ...items };
              if (v === "__none__") {
                delete updated.format;
              } else {
                updated.format = v;
              }
              updateNodeField(path, "items", updated);
            }}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">(none)</SelectItem>
              {STRING_FORMATS.map((f) => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Constraints */}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label className="text-xs">Min Items</Label>
          <Input
            type="number"
            min={0}
            value={nodeSchema.minItems ?? ""}
            onChange={(e) => handleNumberField("minItems", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-2">
          <Label className="text-xs">Max Items</Label>
          <Input
            type="number"
            min={0}
            value={nodeSchema.maxItems ?? ""}
            onChange={(e) => handleNumberField("maxItems", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-xs">Unique Items</Label>
        <Switch
          checked={nodeSchema.uniqueItems === true}
          onCheckedChange={(checked) => {
            if (checked) updateNodeField(path, "uniqueItems", true);
            else removeNodeField(path, "uniqueItems");
          }}
        />
      </div>
    </div>
  );
}
