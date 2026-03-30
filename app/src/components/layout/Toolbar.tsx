import { useRef, useState } from "react";
import { useSchemaStore } from "@/store/schemaStore";
import { useTemporalStore } from "@/store/useTemporalStore";
import {
  Undo2,
  Redo2,
  Download,
  Upload,
  FilePlus,
  Moon,
  Sun,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SCHEMA_DRAFTS } from "@/types/jsonSchema";
import { useTheme } from "@/hooks/useTheme";
import { ValidateDialog } from "@/components/validate/ValidateDialog";

export function Toolbar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { schema, setSchema, newSchema, fileName } = useSchemaStore();
  const { undo, redo, pastStates, futureStates } = useTemporalStore();
  const { theme, toggleTheme } = useTheme();
  const [validateOpen, setValidateOpen] = useState(false);

  const handleLoad = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        setSchema(json, file.name);
      } catch (err) {
        alert("Invalid JSON file: " + (err as Error).message);
      }
    };
    reader.readAsText(file);
    // Reset so same file can be re-loaded
    e.target.value = "";
  };

  const handleSave = () => {
    if (!schema) return;
    const json = JSON.stringify(schema, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "schema.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDraftChange = (draft: string) => {
    if (!schema) return;
    setSchema({ ...schema, $schema: draft }, fileName ?? undefined);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b bg-background">
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" title="New Schema" onClick={() => newSchema()}>
          <FilePlus className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" title="Load Schema File" onClick={handleLoad}>
          <Upload className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" title="Download Schema" onClick={handleSave} disabled={!schema}>
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-border mx-1" />

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          title="Undo (Ctrl+Z)"
          onClick={() => undo()}
          disabled={pastStates.length === 0}
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          title="Redo (Ctrl+Shift+Z)"
          onClick={() => redo()}
          disabled={futureStates.length === 0}
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-border mx-1" />

      {schema && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Draft:</span>
          <Select
            value={schema.$schema || ""}
            onValueChange={handleDraftChange}
          >
            <SelectTrigger className="w-[140px] h-8 text-xs">
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
      )}

      {schema && (
        <>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            variant="outline"
            size="sm"
            title="Validate data against schema"
            onClick={() => setValidateOpen(true)}
            className="gap-1.5"
          >
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs">Validate</span>
          </Button>
        </>
      )}

      <div className="flex-1" />

      {fileName && (
        <span className="text-sm text-muted-foreground truncate max-w-[200px]">
          {fileName}
        </span>
      )}

      <Button variant="ghost" size="sm" title="Toggle Dark Mode" onClick={toggleTheme}>
        {theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      <ValidateDialog open={validateOpen} onOpenChange={setValidateOpen} />
    </div>
  );
}
