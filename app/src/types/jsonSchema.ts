export type JsonSchemaType = "string" | "number" | "integer" | "boolean" | "null" | "object" | "array";

export interface JsonSchema {
  $schema?: string;
  $ref?: string;
  
  // Meta
  title?: string;
  description?: string;
  default?: unknown;
  
  // Type
  type?: JsonSchemaType | JsonSchemaType[];
  enum?: unknown[];
  const?: unknown;
  format?: string;
  
  // String
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  
  // Number
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number | boolean;
  exclusiveMaximum?: number | boolean;
  multipleOf?: number;
  
  // Object
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean | JsonSchema;
  minProperties?: number;
  maxProperties?: number;
  patternProperties?: Record<string, JsonSchema>;
  
  // Array
  items?: JsonSchema | JsonSchema[];
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  
  // Composition
  allOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  not?: JsonSchema;
  
  // Definitions
  definitions?: Record<string, JsonSchema>;

  // Allow other keywords
  [key: string]: unknown;
}

export interface TreeNode {
  id: string;
  label: string;
  path: string[];
  schemaType: "property" | "definition" | "root" | "items" | "composition-item" | "pattern-property";
  jsonType?: JsonSchemaType | JsonSchemaType[];
  isRef?: boolean;
  refTarget?: string;
  isRequired?: boolean;
  hasComposition?: "allOf" | "anyOf" | "oneOf" | "not";
  children?: TreeNode[];
  isExpanded?: boolean;
}

export const JSON_SCHEMA_TYPES: JsonSchemaType[] = [
  "string", "number", "integer", "boolean", "null", "object", "array"
];

export const STRING_FORMATS = [
  "date-time", "date", "time", "email", "hostname",
  "ipv4", "ipv6", "uri", "uri-reference", "uuid", "regex"
];

export const SCHEMA_DRAFTS = [
  { value: "http://json-schema.org/draft-04/schema#", label: "Draft 04" },
  { value: "http://json-schema.org/draft-06/schema#", label: "Draft 06" },
  { value: "http://json-schema.org/draft-07/schema#", label: "Draft 07" },
];
