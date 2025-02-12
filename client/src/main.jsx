import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './index.css'

import App from "./App";
import UserContextProvider from './context/UserContextProvider';
import ProjectContextProvider from './context/ProjectContextProvider';
import { Toaster } from "@/components/ui/toaster";

const root = document.getElementById("root");

ReactDOM.createRoot(root).render(
  <StrictMode>
      <BrowserRouter>
        <UserContextProvider>
          <ProjectContextProvider>
            <App />
            <Toaster />
          </ProjectContextProvider>
        </UserContextProvider>
      </BrowserRouter>
  </StrictMode>
);