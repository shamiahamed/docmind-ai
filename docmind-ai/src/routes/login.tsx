import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { success, error: showError, info } = useToast();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [banner, setBanner] = useState<{ type: "error" | "success"; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      console.log("[Auth] User already logged in, redirecting to /chat", user);
      router.navigate({ to: "/chat" });
    }
  }, [user, router]);

  const clearBanner = () => setBanner(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearBanner();
    setBusy(true);

    try {
      if (mode === "signup") {
        console.log("[Auth] Attempting signup for:", email);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/chat`,
            data: { display_name: name || email.split("@")[0] },
          },
        });

        if (error) throw error;

        // Supabase returns a user even if email confirmation is needed
        const needsConfirmation = data.user && !data.session;
        if (needsConfirmation) {
          console.log("[Auth] Signup success — email confirmation required");
          info("Check your inbox for a confirmation link.");
          setBanner({ type: "success", msg: "Account created! Please check your email to confirm before signing in." });
        } else {
          console.log("[Auth] Signup + auto-login success", data.user?.id);
          success("Account created! Welcome to DocMind.");
          router.navigate({ to: "/chat" });
        }
      } else {
        console.log("[Auth] Attempting sign-in for:", email);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.navigate({ to: "/chat" });          
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      console.error("[Auth] Error:", msg, e);
      showError(msg);
      setBanner({ type: "error", msg });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh", background: "var(--dm-bg)" }}
    >
      <div
        className="dm-surface p-4"
        style={{ width: 400, borderRadius: 20, border: "1px solid var(--dm-border)" }}
      >
        {/* Logo */}
        <Link to="/" className="d-flex align-items-center gap-2 mb-4 dm-link text-decoration-none">
          <div
            style={{
              width: 32, height: 32, borderRadius: 9,
              background: "linear-gradient(135deg,var(--dm-accent),var(--dm-accent-2))",
              display: "grid", placeItems: "center",
            }}
          >
            <Brain size={18} color="#06231f" />
          </div>
          <strong style={{ color: "var(--dm-text)", fontSize: 17 }}>DocMind</strong>
        </Link>

        <h4 className="mb-1" style={{ fontWeight: 700 }}>
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h4>
        <p className="dm-text-muted mb-4" style={{ fontSize: 13 }}>
          {mode === "signin" ? "Sign in to access your documents." : "Start asking your documents anything."}
        </p>

        {/* Inline banner */}
        {banner && (
          <div
            className="mb-3 p-3 d-flex align-items-start gap-2"
            style={{
              borderRadius: 12,
              fontSize: 13,
              background: banner.type === "error" ? "rgba(248,113,113,0.08)" : "rgba(74,222,128,0.08)",
              border: `1px solid ${banner.type === "error" ? "rgba(248,113,113,0.3)" : "rgba(74,222,128,0.3)"}`,
              color: banner.type === "error" ? "#f87171" : "#4ade80",
            }}
          >
            <span style={{ flex: 1 }}>{banner.msg}</span>
            <button
              onClick={clearBanner}
              style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, fontSize: 16, lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={submit}>
          {mode === "signup" && (
            <div className="mb-2">
              <input
                id="signup-name"
                className="form-control"
                placeholder="Display name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={busy}
                autoComplete="name"
              />
            </div>
          )}

          <div className="mb-2">
            <input
              id="auth-email"
              className="form-control"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              autoComplete="email"
            />
          </div>

          <div className="mb-4">
            <input
              id="auth-password"
              className="form-control"
              type="password"
              required
              minLength={8}
              placeholder="Password (min. 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>

          <button
            id="auth-submit"
            type="submit"
            disabled={busy}
            className="btn btn-dm w-100 d-flex align-items-center justify-content-center gap-2"
            style={{ height: 44, borderRadius: 12, fontWeight: 600 }}
          >
            {busy && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="text-center mt-3" style={{ fontSize: 13, color: "var(--dm-text-muted)" }}>
          {mode === "signin" ? (
            <>New here?{" "}
              <button
                className="dm-link bg-transparent border-0 p-0"
                onClick={() => { setMode("signup"); clearBanner(); }}
              >
                Create an account
              </button>
            </>
          ) : (
            <>Have an account?{" "}
              <button
                className="dm-link bg-transparent border-0 p-0"
                onClick={() => { setMode("signin"); clearBanner(); }}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
