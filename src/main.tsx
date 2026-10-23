import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeModeProvider } from './session/ThemeModeProvider';
import { ThemedApp } from './ThemedApp';

// The league fixtures preview answers API calls from sample data (see
// mock/previewApi.ts). Off in every normal build, where this import is dropped.
if (import.meta.env.VITE_PREVIEW_MOCK === 'true') {
  const { installPreviewApi } = await import('./mock/previewApi');
  installPreviewApi();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeModeProvider>
      <ThemedApp />
    </ThemeModeProvider>
  </StrictMode>,
);
