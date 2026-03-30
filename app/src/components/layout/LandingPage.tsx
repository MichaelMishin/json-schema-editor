import { useSchemaStore } from "@/store/schemaStore";
import { Button } from "@/components/ui/button";
import { Upload, FilePlus, FileJson } from "lucide-react";
import { useRef } from "react";

export function LandingPage() {
  const { setSchema, newSchema } = useSchemaStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    e.target.value = "";
  };

  const loadSample = async (name: string) => {
    try {
      const resp = await fetch(`/samples/${name}`);
      const json = await resp.json();
      setSchema(json, name);
    } catch (err) {
      alert("Failed to load sample: " + (err as Error).message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-8 max-w-lg mx-auto px-4">
        <div className="space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10">
              <FileJson className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            JSON Schema Editor
          </h1>
          <p className="text-muted-foreground">
            Visually create and edit JSON Schema files with support for
            definitions, $ref, compositions, and more.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button size="lg" onClick={handleLoad} className="gap-2">
            <Upload className="h-5 w-5" />
            Load Schema File
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => newSchema()}
            className="gap-2"
          >
            <FilePlus className="h-5 w-5" />
            Start from Scratch
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Or load a sample
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadSample("Person.schema.json")}
            >
              Person
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadSample("Product.schema.json")}
            >
              Product
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadSample("Order.schema.json")}
            >
              Order
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
