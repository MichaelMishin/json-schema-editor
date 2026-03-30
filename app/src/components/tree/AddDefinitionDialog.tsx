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

interface AddDefinitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddDefinitionDialog({
  open,
  onOpenChange,
}: AddDefinitionDialogProps) {
  const { addDefinition } = useSchemaStore();
  const [name, setName] = useState("");
  const [type, setType] = useState<JsonSchemaType>("object");

  const handleAdd = () => {
    if (!name.trim()) return;
    const schema =
      type === "object"
        ? { type: type as JsonSchemaType, properties: {}, additionalProperties: false as const }
        : { type: type as JsonSchemaType };
    addDefinition(name.trim(), schema);
    setName("");
    setType("object");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Definition</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="def-name">Name</Label>
            <Input
              id="def-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="DefinitionName"
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
