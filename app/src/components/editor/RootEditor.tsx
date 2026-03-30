import { useSchemaStore } from "@/store/schemaStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SCHEMA_DRAFTS } from "@/types/jsonSchema";

export function RootEditor() {
  const { schema, updateNodeField, removeNodeField } =
    useSchemaStore();

  if (!schema) return null;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Root Schema</h3>
          <p className="text-xs text-muted-foreground">
            Configure the top-level schema settings
          </p>
        </div>

        {/* Schema draft */}
        <div className="grid gap-2">
          <Label className="text-xs">Schema Draft</Label>
          <Select
            value={schema.$schema || ""}
            onValueChange={(v) => updateNodeField([], "$schema", v)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select draft" />
            </SelectTrigger>
            <SelectContent>
              {SCHEMA_DRAFTS.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Root type */}
        <div className="grid gap-2">
          <Label className="text-xs">Root Type</Label>
          <Select
            value={(schema.type as string) || "object"}
            onValueChange={(v) => updateNodeField([], "type", v)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="object">object</SelectItem>
              <SelectItem value="array">array</SelectItem>
              <SelectItem value="string">string</SelectItem>
              <SelectItem value="number">number</SelectItem>
              <SelectItem value="integer">integer</SelectItem>
              <SelectItem value="boolean">boolean</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Additional Properties */}
        <div className="flex items-center justify-between">
          <Label className="text-xs">Disallow Additional Properties</Label>
          <Switch
            checked={schema.additionalProperties === false}
            onCheckedChange={(checked) => {
              if (checked) updateNodeField([], "additionalProperties", false);
              else removeNodeField([], "additionalProperties");
            }}
          />
        </div>

        {/* Title & Description */}
        <div className="grid gap-2">
          <Label className="text-xs">Title</Label>
          <input
            className="w-full px-3 py-1.5 border rounded-md text-sm bg-background"
            value={(schema.title as string) || ""}
            onChange={(e) => {
              if (e.target.value) updateNodeField([], "title", e.target.value);
              else removeNodeField([], "title");
            }}
            placeholder="Schema title"
          />
        </div>

        <div className="grid gap-2">
          <Label className="text-xs">Description</Label>
          <textarea
            className="w-full px-3 py-2 border rounded-md text-sm bg-background min-h-[60px] resize-y"
            value={(schema.description as string) || ""}
            onChange={(e) => {
              if (e.target.value)
                updateNodeField([], "description", e.target.value);
              else removeNodeField([], "description");
            }}
            placeholder="Schema description"
          />
        </div>

        {/* Required fields summary */}
        {schema.required && schema.required.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs">Required Properties</Label>
            <div className="flex flex-wrap gap-1">
              {schema.required.map((r) => (
                <span
                  key={r}
                  className="px-2 py-0.5 bg-muted rounded text-xs font-mono"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
