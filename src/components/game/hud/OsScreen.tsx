"use client";

import { useEffect, useState } from "react";
import { sfx } from "@/game/audio";
import { useGame } from "@/game/store";
import { Shell } from "../../os/Shell";

/**
 * The studio computer. The camera dives into the CRT (CameraRig), the glass
 * flashes, and the full THARUN OS boots over the world. Logging off plays the
 * tube switching off while the camera pulls back out.
 */
export function OsScreen({ onExit }: { onExit: () => void }) {
  const mode = useGame((s) => s.mode);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (mode === "os") sfx("boot");
  }, [mode]);

  useEffect(() => {
    if (mode !== "os-exit") return;
    const id = window.setTimeout(() => setClosing(false), 450);
    return () => clearTimeout(id);
  }, [mode]);

  if (mode === "os-enter") {
    // The flash lands right as the dive ends.
    return <div className="animate-flash pointer-events-none absolute inset-0 z-[80] bg-[#d8ffe8]" style={{ animationDelay: "900ms" }} />;
  }

  if (mode === "os") {
    return (
      <div className="animate-crt-on absolute inset-0 z-[80] bg-bg">
        <Shell
          onExit={() => {
            setClosing(true);
            onExit();
          }}
        />
      </div>
    );
  }

  if (mode === "os-exit" && closing) {
    return <div className="animate-crt-off pointer-events-none absolute inset-0 z-[80] bg-[#d8ffe8]" />;
  }
  return null;
}
