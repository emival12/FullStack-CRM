import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

import { AuthProvider } from "./context/Auth/Auth";
import LabelManager from "./context/Label/Label";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find the root element. Check your index.html");
}
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LabelManager>
      <AuthProvider>
        <App />
      </AuthProvider>
    </LabelManager>
  </React.StrictMode>,
);

//reportWebVitals(console.log);
