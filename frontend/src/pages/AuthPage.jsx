
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function AuthPage() {
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "farmer",
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  function switchMode() {
    setIsRegister((previous) => !previous);
    setError("");

    setFormData({
      username: "",
      password: "",
      role: "farmer",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isLoading) return;

    setError("");
    setIsLoading(true);

    try {
      const endpoint = isRegister
        ? "register"
        : "login";

      const requestBody = {
        username: formData.username.trim(),
        password: formData.password,
      };

      if (isRegister) {
        if (!["farmer", "buyer"].includes(formData.role)) {
          setError("Invalid registration role.");
          return;
        }

        requestBody.role = formData.role;
      }

      const response = await fetch(
        `/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message || "Authentication failed."
        );
        return;
      }

      if (
        !data.user ||
        typeof data.user.username !== "string" ||
        typeof data.user.role !== "string" ||
        typeof data.token !== "string" ||
        !data.token
      ) {
        setError("Invalid server response.");
        return;
      }

      const role = data.user.role;

      if (
        !["farmer", "buyer", "admin"].includes(role)
      ) {
        setError(
          "This account does not have an available dashboard."
        );
        return;
      }

      if (
        data.user.status &&
        data.user.status !== "active"
      ) {
        setError("This account is not active.");
        return;
      }

      const loggedInUser = {
        _id: data.user._id,
        username: data.user.username,
        role,
        status: data.user.status || "active",
        sellerName: data.user.username,
      };

      sessionStorage.setItem(
        "agriverseToken",
        data.token
      );

      localStorage.setItem(
        "agriverseCurrentUser",
        JSON.stringify(loggedInUser)
      );

      localStorage.setItem(
        "agriverseUser",
        JSON.stringify(loggedInUser)
      );

      localStorage.setItem(
        "agriverseLoggedIn",
        "true"
      );

      if (role === "admin") {
        navigate("/admin-dashboard", {
          replace: true,
        });
      } else if (role === "buyer") {
        navigate("/customer-dashboard", {
          replace: true,
        });
      } else {
        navigate("/farmer-dashboard", {
          replace: true,
        });
      }
    } catch (err) {
      console.error("Authentication request failed:", err);

      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-[3rem] p-10 w-full max-w-2xl border border-green-100 shadow-xl">
        <Link
          to="/"
          className="text-green-700 font-semibold"
        >
          ← Back to Home
        </Link>

        <h1 className="text-5xl font-extrabold text-green-700 mt-15">
          {isRegister
            ? "Create Account"
            : "Welcome Back"}
        </h1>

        <p className="text-gray-700 text-lg mt-4">
          Access AgriVerse AI ecosystem.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700"
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 mt-15"
        >
          <input
            type="text"
            name="username"
            placeholder="Username"
            autoComplete="username"
            value={formData.username}
            onChange={handleChange}
            minLength={3}
            maxLength={50}
            className="w-full border-2 border-green-200 rounded-2xl p-5 text-lg outline-none focus:border-green-600"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            autoComplete={
              isRegister
                ? "new-password"
                : "current-password"
            }
            value={formData.password}
            onChange={handleChange}
            minLength={isRegister ? 8 : undefined}
            className="w-full border-2 border-green-200 rounded-2xl p-5 text-lg outline-none focus:border-green-600"
            required
          />

          {isRegister && (
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full border-2 border-green-200 rounded-2xl p-5 text-lg outline-none focus:border-green-600"
            >
              <option value="farmer">
                Farmer
              </option>

              <option value="buyer">
                Non-Farmer / Buyer
              </option>
            </select>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-700 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading
              ? "Please wait..."
              : isRegister
                ? "Register"
                : "Login"}
          </button>
        </form>

        <button
          type="button"
          onClick={switchMode}
          disabled={isLoading}
          className="mt-15 text-green-700 text-xl font-bold disabled:opacity-60"
        >
          {isRegister
            ? "Already have an account? Login"
            : "Create new account"}
        </button>
      </div>
    </div>
  );
}

export default AuthPage;
