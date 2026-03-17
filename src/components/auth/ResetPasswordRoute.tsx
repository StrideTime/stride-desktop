import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ResetPassword } from '../../pages/ResetPassword';
import { Button, Card, CardContent } from '@stridetime/ui';

export function ResetPasswordRoute() {
  const { session, loading, isPasswordRecovery } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Only show the reset form if the user arrived via a PASSWORD_RECOVERY event
  if (session && isPasswordRecovery) {
    return <ResetPassword />;
  }

  // Authenticated but not in recovery flow — go to dashboard
  if (session) {
    return <Navigate to="/" replace />;
  }

  // Not authenticated — show access denied
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <h2 className="mb-2 text-xl font-bold text-foreground">
            Access Denied
          </h2>
          <p className="mb-2 text-sm text-muted-foreground">
            This page is only accessible through a password reset email.
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            Please request a password reset from the login page.
          </p>
          <Button
            onClick={() => { window.location.href = '/login'; }}
            className="w-full"
          >
            Go to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
