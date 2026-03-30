import ReactDOM from "react-dom/client";
import React from 'react';
import App from "./App.jsx";
import { NoCodeProvider } from "./contexts/NoCodeContext.jsx";
import "./index.css";

// 创建根节点并渲染应用
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NoCodeProvider>
      <App />
    </NoCodeProvider>
  </React.StrictMode>
);

