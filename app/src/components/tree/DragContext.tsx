import { createContext, useContext, useRef } from "react";

interface DragState {
  /** path of the property currently being dragged, or null */
  dragPath: string[] | null;
  setDragPath: (path: string[] | null) => void;
}

const DragContext = createContext<DragState>({
  dragPath: null,
  setDragPath: () => {},
});

export function useDragContext() {
  return useContext(DragContext);
}

/** Wrap the tree in this provider so all nodes share drag state via ref (no re-renders) */
export function DragProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<string[] | null>(null);

  // Expose via a stable object — uses a ref so dragging doesn't re-render the whole tree
  const value: DragState = {
    get dragPath() { return ref.current; },
    setDragPath(path) { ref.current = path; },
  };

  return <DragContext.Provider value={value}>{children}</DragContext.Provider>;
}
