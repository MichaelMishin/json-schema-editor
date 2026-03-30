import { useSchemaStore } from "@/store/schemaStore";
import type { JsonSchema } from "@/types/jsonSchema";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface NumberFieldsProps {
  path: string[];
  nodeSchema: JsonSchema;
}

export function NumberFields({ path, nodeSchema }: NumberFieldsProps) {
  const { updateNodeField, removeNodeField } = useSchemaStore();

  const handleNumberField = (field: string, value: string) => {
    if (value === "") {
      removeNodeField(path, field);
    } else {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        updateNodeField(path, field, num);
      }
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Number Constraints
      </h4>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label className="text-xs">Minimum</Label>
          <Input
            type="number"
            value={nodeSchema.minimum ?? ""}
            onChange={(e) => handleNumberField("minimum", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-2">
          <Label className="text-xs">Maximum</Label>
          <Input
            type="number"
            value={nodeSchema.maximum ?? ""}
            onChange={(e) => handleNumberField("maximum", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label className="text-xs">Exclusive Min</Label>
          <Input
            type="number"
            value={
              typeof nodeSchema.exclusiveMinimum === "number"
                ? nodeSchema.exclusiveMinimum
                : ""
            }
            onChange={(e) =>
              handleNumberField("exclusiveMinimum", e.target.value)
            }
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-2">
          <Label className="text-xs">Exclusive Max</Label>
          <Input
            type="number"
            value={
              typeof nodeSchema.exclusiveMaximum === "number"
                ? nodeSchema.exclusiveMaximum
                : ""
            }
            onChange={(e) =>
              handleNumberField("exclusiveMaximum", e.target.value)
            }
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label className="text-xs">Multiple Of</Label>
        <Input
          type="number"
          min={0}
          step="any"
          value={nodeSchema.multipleOf ?? ""}
          onChange={(e) => handleNumberField("multipleOf", e.target.value)}
          className="h-8 text-sm"
        />
      </div>
    </div>
  );
}
