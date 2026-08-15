import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from './theme/theme';
import { AuthProvider } from './auth/AuthContext';
import { CurrentTeamProvider } from './session/CurrentTeamContext';
import { NavPreferenceProvider } from './session/NavPreferenceContext';
import { SplashGate } from './components/SplashGate';
import App from './App.tsx';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <CurrentTeamProvider>
              <NavPreferenceProvider>
                <SplashGate>
                  <App />
                </SplashGate>
              </NavPreferenceProvider>
            </CurrentTeamProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
