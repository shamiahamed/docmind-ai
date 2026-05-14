import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
        <div className="dm-text-muted">Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}
