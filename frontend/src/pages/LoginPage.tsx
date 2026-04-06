import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/authService";
import { useAuthStore } from "../stores/authStore";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

const BG = 'radial-gradient(ellipse at 50% 0%, #1a0a3d 0%, #070B14 65%)'

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
      const { accessToken, refreshToken } = await authService.login(email, password);
      login({ email }, accessToken, refreshToken);
      navigate("/games");
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 403) {
        setError("Veuillez vérifier votre email avant de vous connecter.")
      } else {
        setError("Email ou mot de passe incorrect");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: BG }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <p className="text-4xl font-black tracking-tight" style={{ color: '#f4b942' }}>
            Anim<span className="text-white">Box</span>
          </p>
          <p className="mt-1 text-sm text-white/30">La plateforme de jeux d'animation</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/8 bg-white/5 p-8 backdrop-blur-md">
          <h1 className="mb-6 text-xl font-bold text-white">Connexion</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} className="w-full mt-1">
              {loading ? "Connexion..." : "Se connecter"}
            </Button>

            <p className="text-right text-sm">
              <Link to="/forgot-password" className="text-white/40 hover:text-[#f4b942] transition-colors">
                Mot de passe oublié ?
              </Link>
            </p>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-white/30">
          Pas encore de compte ?{" "}
          <Link to="/register" className="font-semibold text-[#f4b942] hover:underline">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
