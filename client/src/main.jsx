import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './index.css'

import App from "./App";
import ContextProviderWrapper from './context/ContextProviderWrapper';
import { Toaster } from "@/components/ui/toaster";

const root = document.getElementById("root");

ReactDOM.createRoot(root).render(
  // <StrictMode>
      <BrowserRouter>
        <ContextProviderWrapper>
          <App />
          <Toaster />
        </ContextProviderWrapper>
      </BrowserRouter>
  // </StrictMode>
);