"use client";

import { Arcade } from "./Arcade";
import { Board } from "./Board";
import { Commits } from "./Commits";
import { Lab } from "./Lab";
import { Studio } from "./Studio";
import { Timeline } from "./Timeline";
import { Tower } from "./Tower";
import { Workshop } from "./Workshop";

/** Every place on the island. Each one owns its own colliders. */
export function Places() {
  return (
    <>
      <Studio />
      <Workshop />
      <Lab />
      <Arcade />
      <Tower />
      <Timeline />
      <Board />
      <Commits />
    </>
  );
}
