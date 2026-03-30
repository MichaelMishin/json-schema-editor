import type { JsonSchema, TreeNode, JsonSchemaType } from "@/types/jsonSchema";

export function getNodeAtPath(schema: JsonSchema, path: string[]): JsonSchema | undefined {
  let current: unknown = schema;
  for (const segment of path) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current as JsonSchema | undefined;
}

export function setNodeAtPath(schema: JsonSchema, path: string[], value: JsonSchema | undefined): JsonSchema {
  if (path.length === 0) return value as JsonSchema;
  
  const result = { ...schema };
  const key = path[0];
  
  if (path.length === 1) {
    if (value === undefined) {
      delete result[key];
    } else {
      (result as Record<string, unknown>)[key] = value;
    }
    return result;
  }
  
  const child = (result as Record<string, unknown>)[key];

  if (Array.isArray(child)) {
    // Preserve array structure (e.g. allOf, anyOf, oneOf) — spreading an array would corrupt it to a plain object
    const idx = parseInt(path[1], 10);
    const newArr = [...child] as JsonSchema[];
    if (path.length === 2) {
      if (value === undefined) {
        newArr.splice(idx, 1);
      } else {
        newArr[idx] = value;
      }
    } else {
      newArr[idx] = setNodeAtPath(child[idx] as JsonSchema, path.slice(2), value);
    }
    (result as Record<string, unknown>)[key] = newArr;
    return result;
  }

  const childObj = (typeof child === "object" && child !== null) ? { ...child } as JsonSchema : {} as JsonSchema;
  (result as Record<string, unknown>)[key] = setNodeAtPath(childObj, path.slice(1), value);
  
  return result;
}

export function getDefinitionNames(schema: JsonSchema): string[] {
  if (!schema.definitions) return [];
  return Object.keys(schema.definitions);
}

export function resolveRef(schema: JsonSchema, ref: string): JsonSchema | undefined {
  if (!ref.startsWith("#/")) return undefined;
  const path = ref.substring(2).split("/");
  return getNodeAtPath(schema, path);
}

export function getTypeLabel(schema: JsonSchema): string {
  if (schema.$ref) {
    const name = schema.$ref.split("/").pop() || schema.$ref;
    return `$ref → ${name}`;
  }
  if (schema.allOf) return "allOf";
  if (schema.anyOf) return "anyOf";
  if (schema.oneOf) return "oneOf";
  if (schema.not) return "not";
  if (!schema.type) return "any";
  if (Array.isArray(schema.type)) return schema.type.join(" | ");
  return schema.type;
}

export function buildTreeFromSchema(schema: JsonSchema): TreeNode[] {
  const children: TreeNode[] = [];

  // Root properties
  if (schema.properties) {
    const propNodes = Object.entries(schema.properties).map(([key, value]) =>
      buildPropertyNode(key, value, ["properties", key], schema.required)
    );
    children.push(...propNodes);
  }

  // Root items (if array at root)
  if (schema.items && !Array.isArray(schema.items)) {
    children.push(buildSchemaNode("items", schema.items, ["items"], "items"));
  }

  return children;
}

export function buildDefinitionsTree(schema: JsonSchema): TreeNode[] {
  if (!schema.definitions) return [];
  return Object.entries(schema.definitions).map(([key, value]) =>
    buildSchemaNode(key, value, ["definitions", key], "definition")
  );
}

function buildPropertyNode(
  name: string,
  schema: JsonSchema,
  path: string[],
  parentRequired?: string[]
): TreeNode {
  const node = buildSchemaNode(name, schema, path, "property");
  node.isRequired = parentRequired?.includes(name) ?? false;
  return node;
}

function buildSchemaNode(
  name: string,
  schema: JsonSchema,
  path: string[],
  schemaType: TreeNode["schemaType"]
): TreeNode {
  const node: TreeNode = {
    id: path.join("."),
    label: name,
    path,
    schemaType,
    jsonType: schema.type as JsonSchemaType | JsonSchemaType[] | undefined,
    isRef: !!schema.$ref,
    refTarget: schema.$ref,
    children: [],
  };

  if (schema.$ref) {
    return node;
  }

  // Detect composition
  if (schema.allOf) node.hasComposition = "allOf";
  else if (schema.anyOf) node.hasComposition = "anyOf";
  else if (schema.oneOf) node.hasComposition = "oneOf";
  else if (schema.not) node.hasComposition = "not";

  // Children from properties
  if (schema.properties) {
    const propChildren = Object.entries(schema.properties).map(([key, value]) =>
      buildPropertyNode(key, value, [...path, "properties", key], schema.required)
    );
    node.children!.push(...propChildren);
  }

  // Children from items
  if (schema.items && !Array.isArray(schema.items)) {
    const itemSchema = schema.items;
    if (!itemSchema.$ref && (itemSchema.properties || itemSchema.type === "object")) {
      node.children!.push(buildSchemaNode("items", itemSchema, [...path, "items"], "items"));
    }
  }

  // Children from allOf/anyOf/oneOf
  const compositionKey = node.hasComposition;
  if (compositionKey && compositionKey !== "not" && Array.isArray(schema[compositionKey])) {
    const arr = schema[compositionKey] as JsonSchema[];
    arr.forEach((sub, idx) => {
      node.children!.push(
        buildSchemaNode(
          sub.$ref ? `$ref → ${sub.$ref.split("/").pop()}` : `[${idx}]`,
          sub,
          [...path, compositionKey, String(idx)],
          "composition-item"
        )
      );
    });
  }

  if (node.children!.length === 0) {
    delete node.children;
  }

  return node;
}

export function addPropertyToSchema(
  schema: JsonSchema,
  parentPath: string[],
  propertyName: string,
  propertySchema: JsonSchema
): JsonSchema {
  const parent = getNodeAtPath(schema, parentPath);
  if (!parent) return schema;
  
  const updatedParent = { ...parent };
  if (!updatedParent.properties) {
    updatedParent.properties = {};
  }
  updatedParent.properties = {
    ...updatedParent.properties,
    [propertyName]: propertySchema,
  };
  
  return setNodeAtPath(schema, parentPath, updatedParent);
}

export function removePropertyFromSchema(
  schema: JsonSchema,
  parentPath: string[],
  propertyName: string
): JsonSchema {
  const parent = getNodeAtPath(schema, parentPath);
  if (!parent?.properties) return schema;
  
  const updatedParent = { ...parent };
  const { [propertyName]: _, ...rest } = updatedParent.properties!;
  updatedParent.properties = rest;
  
  // Also remove from required if present
  if (updatedParent.required) {
    updatedParent.required = updatedParent.required.filter(r => r !== propertyName);
    if (updatedParent.required.length === 0) delete updatedParent.required;
  }
  
  return setNodeAtPath(schema, parentPath, updatedParent);
}

export function toggleRequired(
  schema: JsonSchema,
  parentPath: string[],
  propertyName: string
): JsonSchema {
  const parent = getNodeAtPath(schema, parentPath);
  if (!parent) return schema;
  
  const updatedParent = { ...parent };
  const required = new Set(updatedParent.required || []);
  
  if (required.has(propertyName)) {
    required.delete(propertyName);
  } else {
    required.add(propertyName);
  }
  
  updatedParent.required = required.size > 0 ? Array.from(required) : undefined;
  if (!updatedParent.required) delete updatedParent.required;
  
  return setNodeAtPath(schema, parentPath, updatedParent);
}

export function renameProperty(
  schema: JsonSchema,
  parentPath: string[],
  oldName: string,
  newName: string
): JsonSchema {
  if (oldName === newName) return schema;
  
  const parent = getNodeAtPath(schema, parentPath);
  if (!parent?.properties?.[oldName]) return schema;
  
  const updatedParent = { ...parent };
  const entries = Object.entries(updatedParent.properties!);
  const newEntries = entries.map(([k, v]) => [k === oldName ? newName : k, v] as [string, JsonSchema]);
  updatedParent.properties = Object.fromEntries(newEntries);
  
  // Update required array
  if (updatedParent.required) {
    updatedParent.required = updatedParent.required.map(r => r === oldName ? newName : r);
  }
  
  return setNodeAtPath(schema, parentPath, updatedParent);
}

export function extractToDefinition(
  schema: JsonSchema,
  sourcePath: string[],
  definitionName: string
): JsonSchema {
  const sourceSchema = getNodeAtPath(schema, sourcePath);
  if (!sourceSchema) return schema;
  
  // Add to definitions
  let result = { ...schema };
  if (!result.definitions) result.definitions = {};
  result.definitions = { ...result.definitions, [definitionName]: sourceSchema };
  
  // Replace source with $ref
  result = setNodeAtPath(result, sourcePath, { $ref: `#/definitions/${definitionName}` });
  
  return result;
}

export function inlineRef(schema: JsonSchema, refPath: string[]): JsonSchema {
  const refNode = getNodeAtPath(schema, refPath);
  if (!refNode?.$ref) return schema;
  
  const resolved = resolveRef(schema, refNode.$ref);
  if (!resolved) return schema;
  
  return setNodeAtPath(schema, refPath, { ...resolved });
}

export function reorderProperty(
  schema: JsonSchema,
  parentPath: string[],  // path to the object that owns `properties`
  propertyName: string,
  direction: "up" | "down"
): JsonSchema {
  const parent = getNodeAtPath(schema, parentPath);
  if (!parent?.properties) return schema;

  const entries = Object.entries(parent.properties);
  const idx = entries.findIndex(([k]) => k === propertyName);
  if (idx === -1) return schema;

  const targetIdx = direction === "up" ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= entries.length) return schema;

  // Swap the two entries
  [entries[idx], entries[targetIdx]] = [entries[targetIdx], entries[idx]];

  const updatedParent = { ...parent, properties: Object.fromEntries(entries) };
  return setNodeAtPath(schema, parentPath, updatedParent);
}

export function createEmptySchema(): JsonSchema {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    properties: {},
    required: [],
    additionalProperties: false,
  };
}
