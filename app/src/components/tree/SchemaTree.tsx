import { useSchemaStore } from "@/store/schemaStore";
import { buildTreeFromSchema, buildDefinitionsTree } from "@/utils/schemaUtils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TreeNodeComponent } from "./TreeNode";
import { DragProvider } from "./DragContext";
import { Button } from "@/components/ui/button";
import { Plus, FolderTree, BookOpen } from "lucide-react";
import { useState } from "react";
import { AddPropertyDialog } from "./AddPropertyDialog";
import { AddDefinitionDialog } from "./AddDefinitionDialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SchemaTree() {
  const { schema, selectedPath, selectNode } = useSchemaStore();
  const [addPropOpen, setAddPropOpen] = useState(false);
  const [addDefOpen, setAddDefOpen] = useState(false);
  const [propsExpanded, setPropsExpanded] = useState(true);
  const [defsExpanded, setDefsExpanded] = useState(true);

  if (!schema) return null;

  const propertyNodes = buildTreeFromSchema(schema);
  const definitionNodes = buildDefinitionsTree(schema);

  const isRootSelected = selectedPath !== null && selectedPath.length === 0;

  return (
    <ScrollArea className="h-full">
      <DragProvider>
      <div className="p-2">
        {/* Root node */}
        <button
          className={cn(
            "flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm font-medium hover:bg-accent transition-colors",
            isRootSelected && "bg-accent text-accent-foreground"
          )}
          onClick={() => selectNode([])}
        >
          <FolderTree className="h-4 w-4 text-muted-foreground" />
          <span>root</span>
          {schema.type && (
            <span className="ml-auto text-xs text-muted-foreground">
              {String(schema.type)}
            </span>
          )}
        </button>

        {/* Properties section */}
        <Collapsible open={propsExpanded} onOpenChange={setPropsExpanded}>
          <div className="flex items-center mt-2">
            <CollapsibleTrigger className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1 hover:text-foreground transition-colors flex-1">
              <ChevronRight
                className={cn(
                  "h-3 w-3 transition-transform",
                  propsExpanded && "rotate-90"
                )}
              />
              Properties ({propertyNodes.length})
            </CollapsibleTrigger>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                setAddPropOpen(true);
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <CollapsibleContent>
            <div className="ml-1">
              {propertyNodes.map((node) => (
                <TreeNodeComponent key={node.id} node={node} depth={1} />
              ))}
              {propertyNodes.length === 0 && (
                <p className="text-xs text-muted-foreground px-2 py-1 italic">
                  No properties
                </p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Definitions section */}
        <Collapsible open={defsExpanded} onOpenChange={setDefsExpanded}>
          <div className="flex items-center mt-3">
            <CollapsibleTrigger className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1 hover:text-foreground transition-colors flex-1">
              <ChevronRight
                className={cn(
                  "h-3 w-3 transition-transform",
                  defsExpanded && "rotate-90"
                )}
              />
              <BookOpen className="h-3 w-3" />
              Definitions ({definitionNodes.length})
            </CollapsibleTrigger>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                setAddDefOpen(true);
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <CollapsibleContent>
            <div className="ml-1">
              {definitionNodes.map((node) => (
                <TreeNodeComponent key={node.id} node={node} depth={1} />
              ))}
              {definitionNodes.length === 0 && (
                <p className="text-xs text-muted-foreground px-2 py-1 italic">
                  No definitions
                </p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
      </DragProvider>

      <AddPropertyDialog
        open={addPropOpen}
        onOpenChange={setAddPropOpen}
        parentPath={[]}
      />
      <AddDefinitionDialog
        open={addDefOpen}
        onOpenChange={setAddDefOpen}
      />
    </ScrollArea>
  );
}
