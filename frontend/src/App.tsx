import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MicrosoftLogin from "./pages/MicrosoftLogin";
import EmailSpamDashboard from "./components/EmailSpamDashboard";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<"checking"|"ok"|"nope">("checking");

  React.useEffect(() => {
    fetch("http://localhost:8000/api/spam/metrics", { credentials: "include" })
      .then(res => setState(res.ok ? "ok" : "nope"))
      .catch(() => setState("nope"));
  }, []);

  if (state === "checking") return <div style={{padding:16}}>Checking sign-in…</div>;
  if (state === "nope") return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MicrosoftLogin />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <EmailSpamDashboard />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
