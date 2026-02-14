import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

import { AuthProvider } from "./context/AuthContext";
import LabelManager from "./config/Label";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <LabelManager>
      <AuthProvider>
        <App />
      </AuthProvider>
    </LabelManager>
  </React.StrictMode>,
);

reportWebVitals();
