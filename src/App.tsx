import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { weddingConfig } from "./config/weddingConfig";
import { InvitationPage } from "./pages/InvitationPage";

export function App() {
  useEffect(() => {
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={`/invite/${weddingConfig.sampleUuid}`} replace />}
      />
      <Route
        path="/invite/:uuid"
        element={<InvitationPage />}
      />
      <Route
        path="*"
        element={<Navigate to={`/invite/${weddingConfig.sampleUuid}`} replace />}
      />
    </Routes>
  );
}
