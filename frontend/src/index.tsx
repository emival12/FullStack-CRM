import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
//import reportWebVitals from "./reportWebVitals";

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

import ToastProvider from "context/Toast/Toast";
import AuthProvider from "context/Auth/Auth";
import LabelProvider from "context/Label/Label";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find the root element. Check your index.html");
}
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ToastProvider>
      <LabelProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LabelProvider>
    </ToastProvider>
  </React.StrictMode>,
);

//reportWebVitals(console.log);
