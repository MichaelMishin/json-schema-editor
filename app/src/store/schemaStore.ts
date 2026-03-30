import { create } from "zustand";
import { temporal } from "zundo";
import type { JsonSchema } from "@/types/jsonSchema";
import {
  setNodeAtPath,
  getNodeAtPath,
  addPropertyToSchema,
  removePropertyFromSchema,
  toggleRequired as toggleReq,
  renameProperty as renameProp,
  extractToDefinition as extractToDef,
  inlineRef as inlineRefUtil,
  reorderProperty as reorderPropertyUtil,
  createEmptySchema,
} from "@/utils/schemaUtils";

interface SchemaState {
  schema: JsonSchema | null;
  selectedPath: string[] | null;
  expandedPaths: Set<string>;
  fileName: string | null;
}

interface SchemaActions {
  setSchema: (schema: JsonSchema, fileName?: string) => void;
  selectNode: (path: string[] | null) => void;
  toggleExpand: (pathKey: string) => void;
  expandPath: (pathKey: string) => void;
  updateNode: (path: string[], value: JsonSchema) => void;
  updateNodeField: (path: string[], field: string, value: unknown) => void;
  removeNodeField: (path: string[], field: string) => void;
  addProperty: (parentPath: string[], name: string, propSchema: JsonSchema) => void;
  removeProperty: (parentPath: string[], name: string) => void;
  toggleRequired: (parentPath: string[], name: string) => void;
  renameProperty: (parentPath: string[], oldName: string, newName: string) => void;
  addDefinition: (name: string, defSchema: JsonSchema) => void;
  removeDefinition: (name: string) => void;
  renameDefinition: (oldName: string, newName: string) => void;
  extractToDefinition: (sourcePath: string[], definitionName: string) => void;
  inlineRef: (refPath: string[]) => void;
  reorderProperty: (parentPath: string[], propertyName: string, direction: "up" | "down") => void;
  setSchemaFromJson: (json: string) => boolean;
  newSchema: () => void;
  addCompositionItem: (parentPath: string[], compositionType: string, item: JsonSchema) => void;
  removeCompositionItem: (parentPath: string[], compositionType: string, index: number) => void;
}

export type SchemaStore = SchemaState & SchemaActions;

export const useSchemaStore = create<SchemaStore>()(
  temporal(
    (set, get) => ({
      schema: null,
      selectedPath: null,
      expandedPaths: new Set<string>(),
      fileName: null,

      setSchema: (schema, fileName) =>
        set({ schema, fileName: fileName ?? null, selectedPath: null }),

      selectNode: (path) =>
        set({ selectedPath: path }),

      toggleExpand: (pathKey) =>
        set((state) => {
          const next = new Set(state.expandedPaths);
          if (next.has(pathKey)) {
            next.delete(pathKey);
          } else {
            next.add(pathKey);
          }
          return { expandedPaths: next };
        }),

      expandPath: (pathKey) =>
        set((state) => {
          const next = new Set(state.expandedPaths);
          next.add(pathKey);
          return { expandedPaths: next };
        }),

      updateNode: (path, value) => {
        const { schema } = get();
        if (!schema) return;
        set({ schema: setNodeAtPath(schema, path, value) });
      },

      updateNodeField: (path, field, value) => {
        const { schema } = get();
        if (!schema) return;
        const node = getNodeAtPath(schema, path);
        if (!node) return;
        const updated = { ...node, [field]: value };
        set({ schema: setNodeAtPath(schema, path, updated) });
      },

      removeNodeField: (path, field) => {
        const { schema } = get();
        if (!schema) return;
        const node = getNodeAtPath(schema, path);
        if (!node) return;
        const updated = { ...node };
        delete updated[field];
        set({ schema: setNodeAtPath(schema, path, updated) });
      },

      addProperty: (parentPath, name, propSchema) => {
        const { schema } = get();
        if (!schema) return;
        set({ schema: addPropertyToSchema(schema, parentPath, name, propSchema) });
      },

      removeProperty: (parentPath, name) => {
        const { schema } = get();
        if (!schema) return;
        set({ schema: removePropertyFromSchema(schema, parentPath, name) });
        // Clear selection if the deleted property was selected
        const { selectedPath } = get();
        if (selectedPath && selectedPath.join(".").startsWith([...parentPath, "properties", name].join("."))) {
          set({ selectedPath: null });
        }
      },

      toggleRequired: (parentPath, name) => {
        const { schema } = get();
        if (!schema) return;
        set({ schema: toggleReq(schema, parentPath, name) });
      },

      renameProperty: (parentPath, oldName, newName) => {
        const { schema } = get();
        if (!schema) return;
        set({ schema: renameProp(schema, parentPath, oldName, newName) });
        // Update selection to new path
        const { selectedPath } = get();
        if (selectedPath) {
          const oldPathStr = [...parentPath, "properties", oldName].join(".");
          const currentPathStr = selectedPath.join(".");
          if (currentPathStr.startsWith(oldPathStr)) {
            const newPath = [...parentPath, "properties", newName, ...selectedPath.slice(parentPath.length + 2)];
            set({ selectedPath: newPath });
          }
        }
      },

      addDefinition: (name, defSchema) => {
        const { schema } = get();
        if (!schema) return;
        const updated = { ...schema };
        if (!updated.definitions) updated.definitions = {};
        updated.definitions = { ...updated.definitions, [name]: defSchema };
        set({ schema: updated });
      },

      removeDefinition: (name) => {
        const { schema } = get();
        if (!schema?.definitions) return;
        const { [name]: _, ...rest } = schema.definitions;
        const { definitions: _defs, ...schemaWithoutDefs } = schema;
        const updated: typeof schema =
          Object.keys(rest).length === 0
            ? schemaWithoutDefs
            : { ...schema, definitions: rest };
        set({ schema: updated });
      },

      renameDefinition: (oldName, newName) => {
        const { schema } = get();
        if (!schema?.definitions?.[oldName] || oldName === newName) return;
        const entries = Object.entries(schema.definitions);
        const newEntries = entries.map(([k, v]) => [k === oldName ? newName : k, v] as [string, JsonSchema]);
        const updated = { ...schema, definitions: Object.fromEntries(newEntries) };
        // Update all $ref references
        const jsonStr = JSON.stringify(updated);
        const updatedStr = jsonStr.replaceAll(
          `"$ref":"#/definitions/${oldName}"`,
          `"$ref":"#/definitions/${newName}"`
        );
        set({ schema: JSON.parse(updatedStr) });
      },

      extractToDefinition: (sourcePath, definitionName) => {
        const { schema } = get();
        if (!schema) return;
        set({ schema: extractToDef(schema, sourcePath, definitionName) });
      },

      inlineRef: (refPath) => {
        const { schema } = get();
        if (!schema) return;
        set({ schema: inlineRefUtil(schema, refPath) });
      },

      reorderProperty: (parentPath, propertyName, direction) => {
        const { schema } = get();
        if (!schema) return;
        set({ schema: reorderPropertyUtil(schema, parentPath, propertyName, direction) });
      },

      setSchemaFromJson: (json) => {
        try {
          const parsed = JSON.parse(json);
          set({ schema: parsed });
          return true;
        } catch {
          return false;
        }
      },

      newSchema: () => {
        set({
          schema: createEmptySchema(),
          selectedPath: null,
          expandedPaths: new Set(),
          fileName: "new-schema.json",
        });
      },

      addCompositionItem: (parentPath, compositionType, item) => {
        const { schema } = get();
        if (!schema) return;
        const node = getNodeAtPath(schema, parentPath);
        if (!node) return;
        const arr = (node[compositionType] as JsonSchema[] | undefined) || [];
        const updated = { ...node, [compositionType]: [...arr, item] };
        set({ schema: setNodeAtPath(schema, parentPath, updated) });
      },

      removeCompositionItem: (parentPath, compositionType, index) => {
        const { schema } = get();
        if (!schema) return;
        const node = getNodeAtPath(schema, parentPath);
        if (!node) return;
        const arr = (node[compositionType] as JsonSchema[] | undefined) || [];
        const updated = { ...node, [compositionType]: arr.filter((_, i) => i !== index) };
        if ((updated[compositionType] as JsonSchema[]).length === 0) delete updated[compositionType];
        set({ schema: setNodeAtPath(schema, parentPath, updated) });
      },
    }),
    {
      limit: 50,
      equality: (pastState, currentState) =>
        JSON.stringify(pastState.schema) === JSON.stringify(currentState.schema),
    }
  )
);
