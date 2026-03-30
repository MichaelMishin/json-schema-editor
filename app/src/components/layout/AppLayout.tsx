import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { SchemaTree } from "@/components/tree/SchemaTree";
import { PropertyEditor } from "@/components/editor/PropertyEditor";
import { JsonPreview } from "@/components/preview/JsonPreview";

export function AppLayout() {
  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize="22%" minSize="15%" maxSize="50%">
          <div className="h-full border-r bg-muted/20">
            <div className="px-3 py-2 border-b">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Schema Navigator
              </h2>
            </div>
            <div className="h-[calc(100%-37px)]">
              <SchemaTree />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize="38%" minSize="15%">
          <div className="h-full">
            <div className="px-3 py-2 border-b">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Property Editor
              </h2>
            </div>
            <div className="h-[calc(100%-37px)]">
              <PropertyEditor />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize="40%" minSize="20%">
          <div className="h-full">
            <JsonPreview />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
