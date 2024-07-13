import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.tsx";
import "./index.css";
import { Provider } from "react-redux";
import store from "./redux/store";
import ToasterProvider from "./providers/TosaterProvider.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToasterProvider />
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
