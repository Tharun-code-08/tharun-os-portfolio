"use client";

import { useFrame } from "@react-three/fiber";
import { BallCollider, CylinderCollider, RigidBody, type IntersectionEnterPayload } from "@react-three/rapier";
import { runtime } from "@/game/runtime";
import { canControl, useGame } from "@/game/store";
import { heightAt } from "@/game/terrain";
import { COMMITS, INTERACTABLE_BY_ID, INTERACTABLES, ZONES, type ZoneId } from "@/game/zones";
import { botSay } from "@/lib/bot";
import { sfx } from "@/game/audio";

const isPlayer = (p: IntersectionEnterPayload) => p.other.rigidBodyObject?.name === "player";

/**
 * Every trigger volume on the island in one fixed body: zone regions, the
 * reach of each interactable, and the five commits. Rapier reports enter/exit;
 * nothing here measures distances every frame except picking the nearest of
 * the handful currently in reach.
 */
export function Sensors() {
  useFrame(() => {
    const g = useGame.getState();
    if (!canControl(g) || runtime.inReach.size === 0) {
      if (g.focus && !g.panelOpen) g.setFocus(null);
      return;
    }
    const p = runtime.player.position;
    let best: string | null = null;
    let bestD = Infinity;
    for (const id of runtime.inReach) {
      const it = INTERACTABLE_BY_ID[id];
      if (!it) continue;
      const d = Math.hypot(it.position[0] - p.x, it.position[2] - p.z);
      if (d < bestD) {
        bestD = d;
        best = id;
      }
    }
    g.setFocus(best);
  });

  const enterZone = (id: ZoneId) => {
    runtime.inZones.add(id);
    const g = useGame.getState();
    const first = !g.visited.includes(id);
    g.enterZone(id);
    if (first) botSay(`zone:${id}`);
  };

  const leaveZone = (id: ZoneId) => {
    runtime.inZones.delete(id);
    useGame.getState().leaveZone(id);
  };

  return (
    <RigidBody type="fixed" colliders={false} name="sensors">
      {ZONES.filter((z) => z.radius > 0).map((z) => (
        <CylinderCollider
          key={z.id}
          sensor
          args={[4, z.radius]}
          position={[z.center[0], heightAt(z.center[0], z.center[1]) + 2, z.center[1]]}
          onIntersectionEnter={(p) => isPlayer(p) && enterZone(z.id)}
          onIntersectionExit={(p) => isPlayer(p) && leaveZone(z.id)}
        />
      ))}

      {INTERACTABLES.map((it) => (
        <BallCollider
          key={it.id}
          sensor
          args={[it.reach]}
          position={it.position}
          onIntersectionEnter={(p) => {
            if (!isPlayer(p)) return;
            runtime.inReach.add(it.id);
            if (it.id.startsWith("stone:")) {
              const g = useGame.getState();
              g.lightStone(Number(it.id.slice(6)));
              if (g.zone !== "timeline") enterZone("timeline");
              sfx("chime");
            }
          }}
          onIntersectionExit={(p) => {
            if (!isPlayer(p)) return;
            runtime.inReach.delete(it.id);
            if (it.id.startsWith("stone:") && ![...runtime.inReach].some((id) => id.startsWith("stone:"))) {
              leaveZone("timeline");
            }
          }}
        />
      ))}

      {COMMITS.map((c) => (
        <BallCollider
          key={c.id}
          sensor
          args={[0.85]}
          position={[c.x, c.y, c.z]}
          onIntersectionEnter={(p) => {
            if (!isPlayer(p)) return;
            const g = useGame.getState();
            if (g.collected.includes(c.id)) return;
            g.collect(c.id);
            sfx("collect");
            botSay("collect");
          }}
        />
      ))}
    </RigidBody>
  );
}
