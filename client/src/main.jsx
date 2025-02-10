import { StrictMode } from 'react'

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import AppRoutes from "./AppRoutes";
import './index.css'

import UserContextProvider from './context/UserContextProvider'
import ProjectContextProvider from './context/ProjectContextProvider'
import { Toaster } from "@/components/ui/toaster"

const root = document.getElementById("root");

ReactDOM.createRoot(root).render(
  <StrictMode>
      <BrowserRouter>
        <UserContextProvider>
          <ProjectContextProvider>
            <AppRoutes />
            <Toaster />
          </ProjectContextProvider>
        </UserContextProvider>
      </BrowserRouter>
  </StrictMode>
);