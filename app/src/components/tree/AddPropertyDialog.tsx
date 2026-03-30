import { useState } from "react";
import { useSchemaStore } from "@/store/schemaStore";
import type { JsonSchemaType } from "@/types/jsonSchema";
import { JSON_SCHEMA_TYPES } from "@/types/jsonSchema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddPropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentPath: string[];
}

export function AddPropertyDialog({
  open,
  onOpenChange,
  parentPath,
}: AddPropertyDialogProps) {
  const { addProperty } = useSchemaStore();
  const [name, setName] = useState("");
  const [type, setType] = useState<JsonSchemaType>("string");

  const handleAdd = () => {
    if (!name.trim()) return;
    const schema =
      type === "object"
        ? { type: type as JsonSchemaType, properties: {}, additionalProperties: false as const }
        : type === "array"
        ? { type: type as JsonSchemaType, items: { type: "string" as JsonSchemaType } }
        : { type: type as JsonSchemaType };
    addProperty(parentPath, name.trim(), schema);
    setName("");
    setType("string");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Property</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="prop-name">Name</Label>
            <Input
              id="prop-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="propertyName"
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as JsonSchemaType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JSON_SCHEMA_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!name.trim()}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
