import { useSchemaStore } from "@/store/schemaStore";
import type { JsonSchema } from "@/types/jsonSchema";
import { STRING_FORMATS } from "@/types/jsonSchema";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StringFieldsProps {
  path: string[];
  nodeSchema: JsonSchema;
}

export function StringFields({ path, nodeSchema }: StringFieldsProps) {
  const { updateNodeField, removeNodeField } = useSchemaStore();

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
        String Constraints
      </h4>

      <div className="grid gap-2">
        <Label className="text-xs">Format</Label>
        <Select
          value={nodeSchema.format || "__none__"}
          onValueChange={(v) => {
            if (v === "__none__") removeNodeField(path, "format");
            else updateNodeField(path, "format", v);
          }}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">
              <span className="text-muted-foreground">(none)</span>
            </SelectItem>
            {STRING_FORMATS.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label className="text-xs">Min Length</Label>
          <Input
            type="number"
            min={0}
            value={nodeSchema.minLength ?? ""}
            onChange={(e) => handleNumberField("minLength", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid gap-2">
          <Label className="text-xs">Max Length</Label>
          <Input
            type="number"
            min={0}
            value={nodeSchema.maxLength ?? ""}
            onChange={(e) => handleNumberField("maxLength", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label className="text-xs">Pattern (regex)</Label>
        <Input
          value={nodeSchema.pattern || ""}
          onChange={(e) => {
            if (e.target.value === "") removeNodeField(path, "pattern");
            else updateNodeField(path, "pattern", e.target.value);
          }}
          placeholder="^[a-z]+$"
          className="h-8 text-sm font-mono"
        />
      </div>
    </div>
  );
}
