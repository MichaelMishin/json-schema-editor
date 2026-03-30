import { useState, useCallback, useRef, useEffect } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { useSchemaStore } from "@/store/schemaStore";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, AlertCircle } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function JsonPreview() {
  const { schema, selectedPath, setSchemaFromJson } = useSchemaStore();
  const { theme } = useTheme();
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localValue, setLocalValue] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const decorationIdsRef = useRef<string[]>([]);

  const jsonString = schema ? JSON.stringify(schema, null, 2) : "";

  // Update local value when schema changes (and not in edit mode)
  useEffect(() => {
    if (!editMode) {
      setLocalValue(jsonString);
    }
  }, [jsonString, editMode]);

  const handleEditorMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance as unknown as typeof Monaco;
  };

  // Highlight the selected path in the editor
  useEffect(() => {
    const editor = editorRef.current;
    const monacoInstance = monacoRef.current;
    if (!editor || !monacoInstance || !schema) {
      decorationIdsRef.current = [];
      return;
    }

    if (!selectedPath || selectedPath.length === 0) {
      decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, []);
      return;
    }

    const lines = jsonString.split("\n");
    let searchFrom = 0;
    let foundLineIdx = -1;

    for (let pathIdx = 0; pathIdx < selectedPath.length; pathIdx++) {
      const segment = selectedPath[pathIdx];
      if (/^\d+$/.test(segment)) continue; // array index — skip search but keep depth count
      const expectedIndent = (pathIdx + 1) * 2;
      const expectedPrefix = " ".repeat(expectedIndent) + `"${segment}"`;
      let found = false;
      for (let lineIdx = searchFrom; lineIdx < lines.length; lineIdx++) {
        if (lines[lineIdx].startsWith(expectedPrefix)) {
          foundLineIdx = lineIdx;
          searchFrom = lineIdx + 1;
          found = true;
          break;
        }
      }
      if (!found) {
        decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, []);
        return;
      }
    }

    if (foundLineIdx === -1) return;

    // Find the end of the block
    const startIndent = lines[foundLineIdx].match(/^(\s*)/)?.[1].length ?? 0;
    let endLineIdx = foundLineIdx;
    for (let i = foundLineIdx + 1; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed === "") continue;
      const indent = lines[i].match(/^(\s*)/)?.[1].length ?? 0;
      if (indent <= startIndent) {
        if (trimmed === "}" || trimmed === "}," || trimmed === "]" || trimmed === "],") {
          endLineIdx = i;
        }
        break;
      }
      endLineIdx = i;
    }

    const startLine = foundLineIdx + 1; // Monaco is 1-indexed
    const endLine = endLineIdx + 1;

    decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, [
      {
        range: new monacoInstance.Range(startLine, 1, endLine, 9999),
        options: {
          isWholeLine: true,
          className: "schema-preview-highlight",
        },
      },
    ]);

    editor.revealLineInCenter(startLine);
  }, [selectedPath, jsonString, schema]);

  const handleToggleEdit = () => {
    if (editMode) {
      // Leaving edit mode: try to apply changes
      if (localValue) {
        const success = setSchemaFromJson(localValue);
        if (!success) {
          setError("Invalid JSON - changes not applied");
          return;
        }
      }
      setError(null);
    } else {
      // Entering edit mode
      setLocalValue(jsonString);
      setError(null);
    }
    setEditMode(!editMode);
  };

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (!value) return;
      setLocalValue(value);

      // Debounced validation
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        try {
          JSON.parse(value);
          setError(null);
        } catch (e) {
          setError((e as Error).message);
        }
      }, 500);
    },
    []
  );

  if (!schema) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No schema loaded
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30">
        <span className="text-xs font-medium text-muted-foreground">
          JSON Preview
        </span>
        <div className="flex items-center gap-2">
          {error && (
            <div className="flex items-center gap-1 text-destructive">
              <AlertCircle className="h-3 w-3" />
              <span className="text-xs truncate max-w-[200px]">{error}</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleEdit}
            className="h-6 text-xs gap-1"
          >
            {editMode ? (
              <>
                <Unlock className="h-3 w-3" /> Editing
              </>
            ) : (
              <>
                <Lock className="h-3 w-3" /> Read-only
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language="json"
          theme={theme === "dark" ? "vs-dark" : "light"}
          value={editMode ? localValue : jsonString}
          onChange={editMode ? handleEditorChange : undefined}
          onMount={handleEditorMount}
          options={{
            readOnly: !editMode,
            minimap: { enabled: false },
            fontSize: 12,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            tabSize: 2,
            automaticLayout: true,
            folding: true,
            renderLineHighlight: "none",
          }}
        />
      </div>
    </div>
  );
}
