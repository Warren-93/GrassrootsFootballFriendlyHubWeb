import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeModeProvider } from './session/ThemeModeProvider';
import { ThemedApp } from './ThemedApp';

// The league fixtures preview fills in the league parts with sample data (see
// mock/previewApi.ts). Off in every normal build, where this import is dropped.
const previewMock = import.meta.env.VITE_PREVIEW_MOCK;
if (previewMock === 'full' || previewMock === 'overlay') {
  const { installPreviewApi } = await import('./mock/previewApi');
  installPreviewApi(previewMock);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeModeProvider>
      <ThemedApp />
    </ThemeModeProvider>
  </StrictMode>,
);
