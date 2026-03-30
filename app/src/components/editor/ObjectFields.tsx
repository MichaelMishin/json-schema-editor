import { useState } from "react";
import { useSchemaStore } from "@/store/schemaStore";
import type { JsonSchema } from "@/types/jsonSchema";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";

interface ObjectFieldsProps {
  path: string[];
  nodeSchema: JsonSchema;
}

export function ObjectFields({ path, nodeSchema }: ObjectFieldsProps) {
  const { updateNodeField, removeNodeField, addProperty, toggleRequired } =
    useSchemaStore();
  const [newPropName, setNewPropName] = useState("");

  const properties = nodeSchema.properties
    ? Object.keys(nodeSchema.properties)
    : [];
  const required = nodeSchema.required || [];

  const handleAdditionalProperties = (checked: boolean) => {
    updateNodeField(path, "additionalProperties", !checked);
  };

  const handleAddProperty = () => {
    if (!newPropName.trim()) return;
    addProperty(path, newPropName.trim(), { type: "string" });
    setNewPropName("");
  };

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

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Object Settings
      </h4>

      {/* Additional Properties */}
      <div className="flex items-center justify-between">
        <Label className="text-xs">Disallow Additional Properties</Label>
        <Switch
          checked={nodeSchema.additionalProperties === false}
          onCheckedChange={handleAdditionalProperties}
        />
      </div>

      {/* Min/Max Properties */}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label className="text-xs">Min Properties</Label>
          <Input
            type="number"
            min={0}
            value={nodeSchema.minProperties ?? ""}
            onChange={(e) => handleNumberField("minProperties", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-2">
          <Label className="text-xs">Max Properties</Label>
          <Input
            type="number"
            min={0}
            value={nodeSchema.maxProperties ?? ""}
            onChange={(e) => handleNumberField("maxProperties", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Required fields */}
      {properties.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs">Required Properties</Label>
          <div className="space-y-1 ml-1">
            {properties.map((prop) => (
              <label
                key={prop}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <Checkbox
                  checked={required.includes(prop)}
                  onCheckedChange={() => toggleRequired(path, prop)}
                />
                <span className="font-mono text-xs">{prop}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Add property */}
      <div className="flex gap-2">
        <Input
          value={newPropName}
          onChange={(e) => setNewPropName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddProperty()}
          placeholder="New property name..."
          className="h-8 text-sm"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddProperty}
          disabled={!newPropName.trim()}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
