import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode> //TODO rimuovere la strictMode alla fine degli sviluppi, fa partire tutte le query il doppio delle volte
);

// If you want to start measuring performance in your app, pass a function (for example: reportWebVitals(console.log))
reportWebVitals();
