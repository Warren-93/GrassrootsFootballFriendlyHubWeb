import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { getTheme } from './theme/theme';
import { AuthProvider } from './auth/AuthContext';
import { CurrentTeamProvider } from './session/CurrentTeamContext';
import { NavPreferenceProvider } from './session/NavPreferenceContext';
import { useThemeMode } from './session/ThemeModeContext';
import { SplashGate } from './components/SplashGate';
import App from './App.tsx';

const queryClient = new QueryClient();

/** Resolves the active MUI theme from ThemeModeContext, then mounts the rest of the app under it. */
export function ThemedApp() {
  const { resolvedMode } = useThemeMode();
  return (
    <ThemeProvider theme={getTheme(resolvedMode)}>
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
  );
}
