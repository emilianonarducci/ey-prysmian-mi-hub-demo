import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PrysmianLogo from "@/components/PrysmianLogo";
import { api } from "@/lib/api";
import { authenticate } from "@/lib/users";

const WARMUP_TIMEOUT_MS = 90000;

async function warmupBackend(onProgress: (msg: string) => void): Promise<void> {
  const start = Date.now();
  let attempt = 0;
  while (Date.now() - start < WARMUP_TIMEOUT_MS) {
    attempt++;
    try {
      const r = await api.get("/health", { timeout: 8000 });
      if (r.status === 200) return;
    } catch {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      onProgress(`Connecting to backend... (${elapsed}s)`);
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
  throw new Error("Backend did not respond in time. Please retry.");
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const nav = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    const user = authenticate(email, password);
    if (!user) {
      setError("Invalid credentials");
      return;
    }
    setLoading(true);
    setStatusMsg("Signing in...");
    try {
      await warmupBackend((msg) => setStatusMsg(msg));
      sessionStorage.setItem("mi_hub_user", user.email);
      sessionStorage.setItem("mi_hub_role", user.role);
      if (user.buId) sessionStorage.setItem("mi_hub_bu", user.buId);
      else sessionStorage.removeItem("mi_hub_bu");
      if (user.displayName) sessionStorage.setItem("mi_hub_name", user.displayName);
      if (remember) {
        localStorage.setItem("mi_hub_user_remembered", user.email);
      }
      nav("/", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Login failed. Please retry.");
    } finally {
      setLoading(false);
      setStatusMsg(null);
    }
  }

  return (
    <div className="min-h-screen flex relative">
      <div className="absolute top-6 right-6 z-20">
        <PrysmianLogo variant="full" height={40} />
      </div>
      {/* Left: hero */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden"
        style={{
          backgroundImage: "url(/mockup-reference/image1.jpg)",
          backgroundSize: "auto 115%",
          backgroundPosition: "center bottom",
          backgroundRepeat: "no-repeat",
          backgroundColor: "#0a2233",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-ey-navy/85 via-ey-navy/70 to-prysmian-green/40" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div />
          <div className="max-w-lg">
            <h1 className="text-4xl font-bold leading-tight mb-4">
              Market Intelligence Hub
            </h1>
            <p className="text-lg text-white/80 mb-6">
              AI-powered always-on intelligence on cable industry, energy markets, and mining commodities.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Feature label="6 Always-On AI Agents" />
              <Feature label="EU AI Act–ready" />
              <Feature label="Audit-grade evidence trail" />
              <Feature label="Mockup-aligned UX" />
            </div>
          </div>
          <div className="text-xs text-white/60">
            Powered by EY · Production-aligned scaffold
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-ey-navy mb-2 mt-12">Sign in</h2>
          <p className="text-sm text-gray-600 mb-6">
            Access your Marketing Intelligence Hub
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="name@prysmian.com"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-prysmian-green"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-prysmian-green"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded text-prysmian-green focus:ring-prysmian-green"
                />
                Remember me
              </label>
              <a className="text-sm text-prysmian-green hover:underline" href="#">
                Forgot password?
              </a>
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-prysmian-green hover:bg-prysmian-green-dark text-white font-semibold py-2.5 rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (statusMsg || "Signing in...") : "Sign in"}
            </button>
            {loading && statusMsg && (
              <div className="text-xs text-gray-500 text-center">
                First sign-in of the day may take up to 60 seconds while the service wakes up.
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function Feature({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-prysmian-green-light" />
      <span>{label}</span>
    </div>
  );
}
