import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./components/AuthContext";
import { BrowserRouter } from "react-router-dom";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ''}>
    <BrowserRouter>
      <AuthProvider>
        <React.StrictMode>
          <App />
        </React.StrictMode>
      </AuthProvider>
    </BrowserRouter>
  </GoogleOAuthProvider>
);
