import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { PositionContextProvider } from "./store/position-context";
import { StrictMode } from "react";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PositionContextProvider>
      <App />
    </PositionContextProvider>
  </StrictMode>
);
