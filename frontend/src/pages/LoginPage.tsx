import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/authService";
import { useAuthStore } from "../stores/authStore";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { accessToken, refreshToken } = await authService.login(
        email,
        password,
      );
      login({ email }, accessToken, refreshToken);
      navigate("/dashboard");
    } catch {
      setError("Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-brand-darkest">
          Connexion
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" loading={loading} className="w-full">
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-brand-dark">
          Pas encore de compte ?{" "}
          <Link
            to="/register"
            className="font-medium text-brand-primary hover:underline"
          >
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
