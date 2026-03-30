import { useEffect, useRef } from "react";
import { useSchemaStore } from "@/store/schemaStore";

const STORAGE_KEY = "json-schema-editor:autosave";
const FILENAME_KEY = "json-schema-editor:filename";
const DEBOUNCE_MS = 1000;

export function useAutoSave() {
  const { schema, fileName, setSchema } = useSchemaStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const initialLoadDone = useRef(false);

  // Save to localStorage on schema change (debounced)
  useEffect(() => {
    // Skip the initial render / restore cycle
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (schema) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(schema));
          localStorage.setItem(FILENAME_KEY, fileName || "");
        } catch {
          // Storage full or unavailable — ignore silently
        }
      } else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(FILENAME_KEY);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [schema, fileName]);

  // Restore from localStorage on mount (only if no schema loaded)
  useEffect(() => {
    const { schema: currentSchema } = useSchemaStore.getState();
    if (currentSchema) return; // Already have a schema, don't override

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedFileName = localStorage.getItem(FILENAME_KEY) || undefined;
        setSchema(parsed, savedFileName);
      }
    } catch {
      // Corrupt data — ignore
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(FILENAME_KEY);
    }
  }, []);
}

export function clearAutoSave() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(FILENAME_KEY);
}
