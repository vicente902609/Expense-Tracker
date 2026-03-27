import { AuthView } from "../features/auth/AuthView.js";
import { TrackerShell } from "../features/app/TrackerShell.js";
import { useAuth } from "../hooks/use-auth.js";

export const App = () => {
  const auth = useAuth();

  if (!auth.isAuthenticated || !auth.user) {
    return <AuthView onAuthenticated={auth.saveSession} />;
  }

  return <TrackerShell user={auth.user} onLogout={auth.clearSession} />;
};
