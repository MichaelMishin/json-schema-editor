import { useSchemaStore } from "@/store/schemaStore";
import type { JsonSchema } from "@/types/jsonSchema";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface MetaFieldsProps {
  path: string[];
  nodeSchema: JsonSchema;
}

export function MetaFields({ path, nodeSchema }: MetaFieldsProps) {
  const { updateNodeField, removeNodeField } = useSchemaStore();

  const handleChange = (field: string, value: string) => {
    if (value === "") {
      removeNodeField(path, field);
    } else {
      updateNodeField(path, field, value);
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Metadata
      </h4>
      <div className="grid gap-2">
        <Label htmlFor="title" className="text-xs">Title</Label>
        <Input
          id="title"
          value={(nodeSchema.title as string) || ""}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Schema title"
          className="h-8 text-sm"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description" className="text-xs">Description</Label>
        <textarea
          id="description"
          value={(nodeSchema.description as string) || ""}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Description"
          className="w-full px-3 py-2 border rounded-md text-sm bg-background min-h-[60px] resize-y"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="default" className="text-xs">Default Value</Label>
        <Input
          id="default"
          value={nodeSchema.default !== undefined ? String(nodeSchema.default) : ""}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "") {
              removeNodeField(path, "default");
            } else {
              // Try to parse as JSON, fallback to string
              try {
                updateNodeField(path, "default", JSON.parse(v));
              } catch {
                updateNodeField(path, "default", v);
              }
            }
          }}
          placeholder="Default value"
          className="h-8 text-sm"
        />
      </div>
    </div>
  );
}
