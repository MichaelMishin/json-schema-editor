import { useEffect } from 'react';
import { useSchemaStore } from '@/store/schemaStore';
import { Toolbar } from '@/components/layout/Toolbar';
import { AppLayout } from '@/components/layout/AppLayout';
import { LandingPage } from '@/components/layout/LandingPage';
import { useTemporalStore } from '@/store/useTemporalStore';
import { useAutoSave } from '@/hooks/useAutoSave';

function App() {
  const { schema } = useSchemaStore();
  const { undo, redo } = useTemporalStore();

  // Auto-save schema to localStorage
  useAutoSave();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  if (!schema) {
    return <LandingPage />;
  }

  return (
    <div className="flex flex-col h-screen">
      <Toolbar />
      <AppLayout />
    </div>
  );
}

export default App;
