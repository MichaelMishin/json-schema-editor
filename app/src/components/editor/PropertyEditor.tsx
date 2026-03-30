import { useSchemaStore } from "@/store/schemaStore";
import { getNodeAtPath } from "@/utils/schemaUtils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TypeSelector } from "./TypeSelector";
import { MetaFields } from "./MetaFields";
import { StringFields } from "./StringFields";
import { NumberFields } from "./NumberFields";
import { ObjectFields } from "./ObjectFields";
import { ArrayFields } from "./ArrayFields";
import { EnumEditor } from "./EnumEditor";
import { RefSelector } from "./RefSelector";
import { CompositionEditor } from "./CompositionEditor";
import { RootEditor } from "./RootEditor";
import type { JsonSchema } from "@/types/jsonSchema";

export function PropertyEditor() {
  const { schema, selectedPath } = useSchemaStore();

  if (!schema || selectedPath === null) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Select a property or definition to edit
      </div>
    );
  }

  // Root level
  if (selectedPath.length === 0) {
    return <RootEditor />;
  }

  const nodeSchema = getNodeAtPath(schema, selectedPath);
  if (!nodeSchema) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Node not found at path: {selectedPath.join(".")}
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <NodeEditor path={selectedPath} nodeSchema={nodeSchema} />
      </div>
    </ScrollArea>
  );
}

interface NodeEditorProps {
  path: string[];
  nodeSchema: JsonSchema;
}

function NodeEditor({ path, nodeSchema }: NodeEditorProps) {
  const isRef = !!nodeSchema.$ref;
  const type = nodeSchema.type;
  const typeStr = Array.isArray(type) ? type : type ? [type] : [];
  const hasString = typeStr.includes("string");
  const hasNumber = typeStr.includes("number") || typeStr.includes("integer");
  const hasObject = typeStr.includes("object") || !!nodeSchema.properties;
  const hasArray = typeStr.includes("array");
  const hasComposition = !!(nodeSchema.allOf || nodeSchema.anyOf || nodeSchema.oneOf || nodeSchema.not);

  // Get name from path
  const name = path[path.length - 1];
  const parentIsProperties = path.length >= 2 && path[path.length - 2] === "properties";

  return (
    <>
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-xs text-muted-foreground">
          Path: {path.join(" → ")}
        </p>
      </div>

      {/* $ref selector */}
      <RefSelector path={path} nodeSchema={nodeSchema} />

      {/* Only show other fields if not a $ref */}
      {!isRef && (
        <>
          {/* Type */}
          <TypeSelector path={path} nodeSchema={nodeSchema} />

          {/* Meta fields */}
          <MetaFields path={path} nodeSchema={nodeSchema} />

          {/* String-specific */}
          {hasString && <StringFields path={path} nodeSchema={nodeSchema} />}

          {/* Number-specific */}
          {hasNumber && <NumberFields path={path} nodeSchema={nodeSchema} />}

          {/* Enum */}
          <EnumEditor path={path} nodeSchema={nodeSchema} />

          {/* Object-specific */}
          {hasObject && <ObjectFields path={path} nodeSchema={nodeSchema} />}

          {/* Array-specific */}
          {hasArray && <ArrayFields path={path} nodeSchema={nodeSchema} />}

          {/* Composition */}
          <CompositionEditor path={path} nodeSchema={nodeSchema} />

          {/* Required toggle (if parent is properties) */}
          {parentIsProperties && (
            <RequiredToggle path={path} propName={name} />
          )}
        </>
      )}

      {/* Composition that exists */}
      {isRef && hasComposition && (
        <CompositionEditor path={path} nodeSchema={nodeSchema} />
      )}
    </>
  );
}

function RequiredToggle({ path, propName }: { path: string[]; propName: string }) {
  const { schema, toggleRequired } = useSchemaStore();
  if (!schema) return null;

  // Parent is 2 levels up from properties.name
  const parentPath = path.slice(0, -2);
  const parent = getNodeAtPath(schema, parentPath);
  const isRequired = parent?.required?.includes(propName) ?? false;

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isRequired}
          onChange={() => toggleRequired(parentPath, propName)}
          className="rounded"
        />
        Required
      </label>
    </div>
  );
}
