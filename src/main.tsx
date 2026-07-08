import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@your-org/design-system/dist/index.css';
import { Editor } from './examples/Editor';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

createRoot(container).render(
  <StrictMode>
    <Editor />
  </StrictMode>,
);
