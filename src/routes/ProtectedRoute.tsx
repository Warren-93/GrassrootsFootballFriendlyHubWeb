import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '../auth/AuthContext';
import { setPostAuthRedirect } from './postAuthRedirect';

export function ProtectedRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    // A link from an email (a request, a fixture) opened while signed out:
    // come back to it after signing in rather than to the dashboard.
    if (location.pathname !== '/') setPostAuthRedirect(location.pathname + location.search);
    return <Navigate to="/welcome" replace />;
  }
  return <Outlet />;
}
