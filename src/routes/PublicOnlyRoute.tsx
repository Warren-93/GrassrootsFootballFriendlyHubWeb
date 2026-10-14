import { Navigate, Outlet } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '../auth/AuthContext';
import { takePostAuthRedirect } from './postAuthRedirect';

/** The inverse of ProtectedRoute: an already-signed-in user hitting /welcome, /sign-in etc. goes to the dashboard instead of seeing the auth screens again. */
export function PublicOnlyRoute() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (session) return <Navigate to={takePostAuthRedirect()} replace />;
  return <Outlet />;
}
