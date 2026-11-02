
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles = [] }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function verifySession() {
      const token = sessionStorage.getItem("agriverseToken");

      if (!token) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/session/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            sessionStorage.removeItem("agriverseToken");
            localStorage.removeItem("agriverseCurrentUser");
            localStorage.removeItem("agriverseUser");
            localStorage.removeItem("agriverseLoggedIn");
          }

          setAuthorized(false);
          return;
        }

        const data = await response.json();

        if (!data.success || !data.user) {
          setAuthorized(false);
          return;
        }

        if (
          data.user.status &&
          data.user.status !== "active"
        ) {
          setAuthorized(false);
          return;
        }

        setUser(data.user);

        if (
          allowedRoles.length === 0 ||
          allowedRoles.includes(data.user.role)
        ) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Session verification failed");
          setAuthorized(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    verifySession();

    return () => controller.abort();
  }, [allowedRoles.join(",")]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <p className="text-green-700 text-xl font-semibold">
          Verifying your session...
        </p>
      </div>
    );
  }

  if (!authorized) {
    if (user) {
      const dashboard =
        user.role === "farmer"
          ? "/farmer-dashboard"
          : user.role === "buyer"
            ? "/customer-dashboard"
            : "/auth";

      return <Navigate to={dashboard} replace />;
    }

    return <Navigate to="/auth" replace />;
  }

  return children;
}

export default ProtectedRoute;
