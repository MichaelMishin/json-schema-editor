import { useSchemaStore } from "@/store/schemaStore";

export function useTemporalStore() {
  const store = useSchemaStore;
  const temporalStore = store.temporal.getState();
  const pastStates = temporalStore.pastStates;
  const futureStates = temporalStore.futureStates;

  return {
    undo: temporalStore.undo,
    redo: temporalStore.redo,
    pastStates,
    futureStates,
  };
}
