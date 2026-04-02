import { AppLayout } from "@/app/AppLayout";
import { AuthPage } from "@/pages/auth/AuthPage";
import { useAuth } from "@/hooks/use-auth";

export const App = () => {
  const auth = useAuth();

  if (!auth.isAuthenticated || !auth.user) {
    return <AuthPage onAuthenticated={auth.saveSession} />;
  }

  return <AppLayout onLogout={auth.logout} />;
};
