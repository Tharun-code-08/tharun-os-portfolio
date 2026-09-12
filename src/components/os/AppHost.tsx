"use client";

import { memo } from "react";
import type { AppId } from "@/lib/apps";
import { MeApp } from "../apps/MeApp";
import { ProjectApp, WorkApp } from "../apps/WorkApp";
import { FailuresApp, LabApp, NotesApp } from "../apps/LabApp";
import { LogApp } from "../apps/LogApp";
import { NowApp, StackApp } from "../apps/StackApp";
import { ContactApp, ProofApp } from "../apps/ProofApp";
import { TerminalApp } from "../apps/TerminalApp";

/**
 * Memoised so dragging a window does not re-render its contents.
 */
export const AppHost = memo(function AppHost({
  appId,
  payload,
}: {
  appId: AppId;
  payload?: string;
}) {
  switch (appId) {
    case "me":
      return <MeApp />;
    case "work":
      return <WorkApp />;
    case "project":
      return <ProjectApp payload={payload} />;
    case "lab":
      return <LabApp />;
    case "failures":
      return <FailuresApp />;
    case "notes":
      return <NotesApp />;
    case "log":
      return <LogApp />;
    case "stack":
      return <StackApp />;
    case "now":
      return <NowApp />;
    case "proof":
      return <ProofApp />;
    case "contact":
      return <ContactApp />;
    case "terminal":
      return <TerminalApp />;
  }
});
