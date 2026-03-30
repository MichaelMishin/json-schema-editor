import { useSchemaStore } from "@/store/schemaStore";
import type { JsonSchema } from "@/types/jsonSchema";
import { getDefinitionNames } from "@/utils/schemaUtils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link2, ArrowRight, Unlink } from "lucide-react";

interface RefSelectorProps {
  path: string[];
  nodeSchema: JsonSchema;
}

export function RefSelector({ path, nodeSchema }: RefSelectorProps) {
  const { schema, updateNode, selectNode, inlineRef } = useSchemaStore();

  if (!schema) return null;
  const definitions = getDefinitionNames(schema);
  const isRef = !!nodeSchema.$ref;
  const currentRefName = nodeSchema.$ref?.split("/").pop() || "";

  const handleSetRef = (defName: string) => {
    if (defName === "__none__") {
      // Clear the $ref and reset to a plain empty inline schema
      updateNode(path, {});
    } else {
      updateNode(path, { $ref: `#/definitions/${defName}` });
    }
  };

  const handleGoToDefinition = () => {
    if (currentRefName) {
      selectNode(["definitions", currentRefName]);
    }
  };

  const handleConvertToInline = () => {
    inlineRef(path);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-indigo-500" />
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Reference ($ref)
        </h4>
      </div>

      <div className="grid gap-2">
        <Label className="text-xs">Definition Reference</Label>
        <Select
          value={isRef ? currentRefName : "__none__"}
          onValueChange={(v) => v && handleSetRef(v)}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Select definition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">
              <span className="text-muted-foreground">(inline / no ref)</span>
            </SelectItem>
            {definitions.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isRef && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoToDefinition}
            className="text-xs"
          >
            <ArrowRight className="h-3 w-3 mr-1" />
            Go to Definition
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleConvertToInline}
            className="text-xs"
          >
            <Unlink className="h-3 w-3 mr-1" />
            Convert to Inline
          </Button>
        </div>
      )}
    </div>
  );
}
