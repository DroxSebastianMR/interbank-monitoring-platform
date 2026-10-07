import "@/global.css";
import React from "react";

import { AppShell } from "@/src/application/AppShell";
import { AppProviders } from "@/src/application/providers/AppProviders";
import { ErrorBoundary } from "@/src/modules/system/error/ErrorBoundary";

export default function App() {
  return (
    <AppProviders>
      <ErrorBoundary>
        <AppShell />
      </ErrorBoundary>
    </AppProviders>
  );
}
