import { useState, useRef } from "react";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { useSchemaStore } from "@/store/schemaStore";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  Upload,
  AlertTriangle,
  FileJson,
  ClipboardPaste,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  dataFileName?: string;
}

interface ValidationError {
  path: string;
  message: string;
  keyword: string;
  params?: Record<string, unknown>;
}

interface ValidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ValidateDialog({ open, onOpenChange }: ValidateDialogProps) {
  const { schema } = useSchemaStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [pasteValue, setPasteValue] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);

  const validate = (data: unknown, fileName?: string) => {
    if (!schema) return;
    setParseError(null);

    try {
      const ajv = new Ajv({ allErrors: true, strict: false });
      addFormats(ajv);

      // Strip $schema before compiling — Ajv v8 doesn't support draft-04/06 meta-schema URIs
      // but handles their keywords correctly for data validation
      const { $schema: _metaSchema, ...schemaWithoutMeta } = schema;
      const compiledValidate = ajv.compile(schemaWithoutMeta);
      const valid = compiledValidate(data);

      const errors: ValidationError[] = (compiledValidate.errors || []).map(
        (err) => ({
          path: err.instancePath || "/",
          message: err.message || "Unknown error",
          keyword: err.keyword,
          params: err.params as Record<string, unknown> | undefined,
        })
      );

      setResult({ valid: !!valid, errors, dataFileName: fileName });
    } catch (err) {
      setResult({
        valid: false,
        errors: [
          {
            path: "/",
            message: `Schema compilation error: ${(err as Error).message}`,
            keyword: "schema",
          },
        ],
        dataFileName: fileName,
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        validate(data, file.name);
      } catch (err) {
        setParseError(`Invalid JSON file: ${(err as Error).message}`);
        setResult(null);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handlePasteValidate = () => {
    if (!pasteValue.trim()) return;
    try {
      const data = JSON.parse(pasteValue);
      validate(data, "pasted JSON");
    } catch (err) {
      setParseError(`Invalid JSON: ${(err as Error).message}`);
      setResult(null);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setResult(null);
      setParseError(null);
      setPasteValue("");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Validate Data Against Schema
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3">
        <Tabs defaultValue="file" className="flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file" className="gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="paste" className="gap-1.5">
              <ClipboardPaste className="h-3.5 w-3.5" />
              Paste JSON
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-3 mt-3">
            <div className="flex flex-col items-center gap-3 p-6 border-2 border-dashed rounded-lg">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Upload a JSON file to validate against the current schema
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                Choose File
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </TabsContent>

          <TabsContent value="paste" className="space-y-3 mt-3 flex-1 min-h-0 flex flex-col">
            <textarea
              className="flex-1 min-h-[150px] w-full px-3 py-2 border rounded-md text-sm bg-background font-mono resize-y"
              placeholder='Paste your JSON data here...\n{\n  "key": "value"\n}'
              value={pasteValue}
              onChange={(e) => {
                setPasteValue(e.target.value);
                setParseError(null);
              }}
            />
            <Button
              onClick={handlePasteValidate}
              disabled={!pasteValue.trim()}
              className="self-end"
            >
              Validate
            </Button>
          </TabsContent>
        </Tabs>

        {/* Parse error */}
        {parseError && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-destructive">{parseError}</p>
          </div>
        )}

        {/* Validation results */}
        {result && (
          <div className="space-y-3">
            {/* Summary */}
            <div
              className={`flex items-center gap-2 p-3 rounded-md border ${
                result.valid
                  ? "bg-green-500/10 border-green-500/20"
                  : "bg-destructive/10 border-destructive/20"
              }`}
            >
              {result.valid ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    result.valid ? "text-green-700 dark:text-green-400" : "text-destructive"
                  }`}
                >
                  {result.valid ? "Validation passed!" : "Validation failed"}
                </p>
                {result.dataFileName && (
                  <p className="text-xs text-muted-foreground">
                    File: {result.dataFileName}
                  </p>
                )}
              </div>
              {!result.valid && (
                <Badge variant="destructive" className="text-xs">
                  {result.errors.length}{" "}
                  {result.errors.length === 1 ? "error" : "errors"}
                </Badge>
              )}
            </div>

            {/* Error list */}
            {result.errors.length > 0 && (
              <ScrollArea>
                <div className="space-y-2">
                  {result.errors.map((err, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2 bg-muted/50 rounded text-sm"
                    >
                      <XCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">
                            {err.path || "/"}
                          </code>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1 py-0 h-4"
                          >
                            {err.keyword}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {err.message}
                        </p>
                        {err.params &&
                          Object.keys(err.params).length > 0 && (
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">
                              {JSON.stringify(err.params)}
                            </p>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
