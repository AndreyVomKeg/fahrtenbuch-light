import "./cloudSync.js"; // Supabase cloud sync (silent no-op if unavailable)
import React from "react";
import ReactDOM from "react-dom/client";
import FahrtenbuchLight from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <FahrtenbuchLight />
  </React.StrictMode>
);
