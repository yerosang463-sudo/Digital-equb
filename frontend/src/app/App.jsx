import { RouterProvider } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { router } from "./routes";
import { AuthProvider } from "./providers/AuthProvider";
import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || process.env.REACT_APP_GOOGLE_CLIENT_ID;

  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}
