import { AuthView } from "@/features/auth/AuthView";
import { TrackerShell } from "@/features/app/TrackerShell";
import { useAuth } from "@/hooks/use-auth";

export const App = () => {
  const auth = useAuth();

  if (!auth.isAuthenticated || !auth.user) {
    return <AuthView onAuthenticated={auth.saveSession} />;
  }

  return <TrackerShell onLogout={auth.clearSession} />;
};
