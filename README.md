# JSON Schema Editor

A visual, browser-based editor for creating and editing JSON Schemas. Built with React, TypeScript, and Vite.

## Features

- Visual tree-based schema editing
- Support for JSON Schema types: `string`, `number`, `integer`, `boolean`, `array`, `object`, `null`
- Composition keywords: `allOf`, `anyOf`, `oneOf`, `not`
- `$ref` support with definition management
- Drag-and-drop property reordering
- Live JSON preview with Monaco Editor
- Schema validation against sample JSON data
- Undo/redo history
- Dark/light theme toggle
- Auto-save to local storage
- Import/export JSON Schema files
- Sample schemas included (Person, Product, Order)

## Getting Started

```bash
cd app
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## Tech Stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) components
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Zustand](https://zustand-demo.pmnd.rs/) for state management
- [Zod](https://zod.dev/) / [AJV](https://ajv.js.org/) for schema validation
