import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Brain, FileText, Sparkles, ShieldCheck, ArrowRight, Zap, Globe, Lock } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/chat" />;

  return (
    <div style={{ background: "var(--dm-bg)", color: "var(--dm-text)", minHeight: "100vh", overflowX: "hidden" }}>
      {/* Decorative background gradients */}
      <div 
        style={{
          position: "absolute", top: "-10%", left: "50%", width: "80%", height: "60%",
          background: "radial-gradient(circle, rgba(79,209,197,0.08) 0%, transparent 70%)",
          filter: "blur(100px)", zIndex: 0, transform: "translateX(-50%)"
        }}
      />

      <header className="container d-flex justify-content-between align-items-center py-4 position-relative" style={{ zIndex: 10 }}>
        <div className="d-flex align-items-center gap-2">
          <div
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg,var(--dm-accent),var(--dm-accent-2))",
              display: "grid", placeItems: "center",
            }}
          >
            <Brain size={20} color="#06231f" />
          </div>
          <strong style={{ fontSize: 20, letterSpacing: -0.5 }}>DocMind</strong>
        </div>
        <div className="d-flex align-items-center gap-3">
          <Link to="/login" className="dm-link" style={{ fontSize: 14 }}>Sign in</Link>
          <Link to="/login" className="btn btn-dm px-3 py-1" style={{ fontSize: 14 }}>Get started</Link>
        </div>
      </header>

      <main className="container py-5 position-relative" style={{ zIndex: 10 }}>
        {/* Hero Section */}
        <div className="row align-items-center g-5 py-5">
          <div className="col-lg-7">
            <div className="dm-chip mb-4 py-2 px-3" style={{ background: "rgba(79,209,197,0.05)", borderColor: "rgba(79,209,197,0.2)" }}>
              <span className="dot" style={{ background: "var(--dm-accent)" }} /> 
              <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: 0.5 }}>MULTI-AGENT RAG ECOSYSTEM</span>
            </div>
            <h1 className="display-3 mb-4" style={{ fontWeight: 800, letterSpacing: -2, lineHeight: 0.95 }}>
              Your documents, <br />
              <span style={{ 
                background: "linear-gradient(90deg, var(--dm-accent), #a5f3fc)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
              }}>intelligent</span> conversations.
            </h1>
            <p className="dm-text-muted mb-5" style={{ fontSize: 19, maxWidth: 580, lineHeight: 1.6 }}>
              DocMind uses a team of specialized AI agents to analyze, calculate, and verify your data. 
              Get answers that are grounded in your private documents with verifiable citations.
            </p>
            <div className="d-flex flex-wrap gap-3">
              <Link to="/login" className="btn btn-dm px-5 py-3 d-flex align-items-center gap-2" style={{ borderRadius: 14, fontSize: 16 }}>
                Start Analyzing <ArrowRight size={18} />
              </Link>
              <a href="#demo" className="btn btn-ghost px-5 py-3" style={{ borderRadius: 14, fontSize: 16 }}>
                View Demo
              </a>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="position-relative">
              <div className="dm-surface p-4 shadow-2xl" style={{ borderRadius: 24, border: "1px solid rgba(255,255,255,0.05)", background: "rgba(18,24,38,0.8)", backdropFilter: "blur(20px)" }}>
                <div className="d-flex flex-wrap gap-2 mb-4">
                  <span className="dm-chip done" style={{ fontSize: 10 }}><span className="dot" /> Supervisor</span>
                  <span className="dm-chip done" style={{ fontSize: 10 }}><span className="dot" /> Retriever</span>
                  <span className="dm-chip running" style={{ fontSize: 10 }}><span className="dot" /> Synthesizer</span>
                  <span className="dm-chip" style={{ fontSize: 10 }}><span className="dot" /> Critic</span>
                </div>
                
                <div className="dm-surface-2 p-4 mb-3" style={{ fontSize: 15, lineHeight: 1.7, borderRadius: 16, border: "1px solid var(--dm-border)" }}>
                  <div className="dm-text-muted mb-2" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Draft Response</div>
                  Revenue grew <strong className="dm-accent">18% YoY</strong> with operating margin at <strong className="dm-accent">22.4%</strong> <span className="dm-citation">1</span>. 
                  Strategy memo confirms <strong className="dm-accent">EMEA mid-market</strong> focus for FY26 <span className="dm-citation">2</span>.
                </div>

                <div className="d-flex align-items-center gap-2 p-3 dm-surface-2" style={{ borderRadius: 12, border: "1px solid var(--dm-ok)", background: "rgba(74,222,128,0.03)" }}>
                  <ShieldCheck size={18} className="dm-grade-pass" />
                  <div>
                    <div className="dm-grade-pass" style={{ fontSize: 13, fontWeight: 700 }}>Critic Verdict: Pass</div>
                    <div className="dm-text-muted" style={{ fontSize: 11 }}>All claims grounded in provided documents.</div>
                  </div>
                </div>
              </div>

              {/* Floaties */}
              <div 
                className="position-absolute dm-surface p-2 d-flex align-items-center gap-2 shadow-lg animate-bounce"
                style={{ top: -20, right: -20, borderRadius: 12, fontSize: 11, animation: "float 6s infinite ease-in-out" }}
              >
                <Zap size={14} className="dm-accent" /> Processing chunks...
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div id="demo" className="row g-4 mt-5 pt-5">
          {[
            { Icon: FileText, t: "Smart Ingestion", d: "Drop PDF or DOCX files. We automatically parse, chunk, and embed them into your private vector store.", color: "#4fd1c5" },
            { Icon: Globe, t: "Multi-Agent Logic", d: "A supervisor orchestrates specialized agents—Retriever, Comparison, and Math—to handle complex reasoning.", color: "#7c5cff" },
            { Icon: Lock, t: "Privacy First", d: "Your data is encrypted and isolated. We use Supabase Auth and private Chroma collections per user.", color: "#f4b740" },
          ].map(({ Icon, t, d, color }) => (
            <div key={t} className="col-md-4">
              <div className="dm-surface p-5 h-100 hover-lift" style={{ borderRadius: 28 }}>
                <div 
                  className="mb-4 d-flex align-items-center justify-content-center"
                  style={{ width: 48, height: 48, borderRadius: 14, background: `${color}15`, color }}
                >
                  <Icon size={24} />
                </div>
                <h4 className="mb-3" style={{ fontWeight: 700 }}>{t}</h4>
                <p className="dm-text-muted mb-0" style={{ fontSize: 15, lineHeight: 1.6 }}>{d}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="container py-5 mt-5" style={{ borderTop: "1px solid var(--dm-border)" }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-4">
          <div className="dm-text-muted" style={{ fontSize: 13 }}>
            © 2026 DocMind AI. Built with Lovable, LangGraph, and Supabase.
          </div>
          <div className="d-flex gap-4">
            <a href="#" className="dm-link" style={{ fontSize: 13 }}>Privacy</a>
            <a href="#" className="dm-link" style={{ fontSize: 13 }}>Terms</a>
            <a href="#" className="dm-link" style={{ fontSize: 13 }}>Contact</a>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce {
          animation: float 4s infinite ease-in-out;
        }
        .hover-lift { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .hover-lift:hover { transform: translateY(-8px); border-color: var(--dm-accent); box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
      `}</style>
    </div>
  );
}
