import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import AuthProvider from "@/context/Auth/Auth";
import LabelProvider from "@/context/Label/Label";
import ToastProvider from "@/context/Toast/Toast";
import ErrorBoundary from "@/components/ErrorBoundary/ErrorBoundary";

import App from "./App";

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find the root element. Check your index.html");
}
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <LabelProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </LabelProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
