"""
Tharun, the playable character — built, rigged, animated and exported from
scratch by this one script, so the model is reproducible and editable as code.

    blender --background --factory-startup --python art/build_tharun.py -- <repo root>

Change LOOK below (hair, skin, clothes, glasses, beard) and re-run: the GLB in
public/models/tharun.glb and the .blend in art/ are regenerated.

Conventions: metres, Z up, the character faces -Y (which glTF/three.js turn
into +Z forward). Bones follow Blender's .L = character's left = +X.
"""

import math
import os
import sys
import traceback

import bmesh
import bpy
from mathutils import Vector

# ----------------------------------------------------------------- look -----

# Tharun, as described by Tharun: textured hair with volume on top, medium
# brown skin, glasses, stubble and a moustache, black tee and jeans.
LOOK = {
    "skin": "#c98c5e",
    "skin_shadow": "#a87049",
    "hair": "#1c1410",
    "hair_style": "textured",  # "textured" | "fringe" | "spiky"
    "eyes": "#15151b",
    "shirt": "#26262d",
    "shirt_logo": "#ffb020",
    "pants": "#3d5d8c",
    "shoes": "#ece7de",
    "soles": "#3a3a40",
    "glasses": True,
    "glasses_frame": "#141418",
    "beard": "stubble",  # False | "stubble" | "full"
    # Stubble is a darker shade of the skin, not a hair colour; a full beard
    # would use something close to "hair".
    "beard_color": "#7a5139",
    "moustache": True,
    "moustache_color": "#2e211b",
}

# --------------------------------------------------------------- setup ------

ARGV = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
ROOT = os.path.abspath(ARGV[0]) if ARGV else os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT_GLB = os.path.join(ROOT, "public", "models", "tharun.glb")
OUT_BLEND = os.path.join(ROOT, "art", "tharun.blend")
PREVIEW_DIR = ARGV[1] if len(ARGV) > 1 else os.path.join(ROOT, "art", "previews")
LOG = os.path.join(PREVIEW_DIR, "build.log")
os.makedirs(PREVIEW_DIR, exist_ok=True)
os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)

_log_lines = []


def log(*a):
    line = " ".join(str(x) for x in a)
    _log_lines.append(line)
    with open(LOG, "w", encoding="utf-8") as f:
        f.write("\n".join(_log_lines))


def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_rgba(h):
    h = h.lstrip("#")
    r, g, b = (int(h[i : i + 2], 16) / 255 for i in (0, 2, 4))
    return (srgb_to_linear(r), srgb_to_linear(g), srgb_to_linear(b), 1.0)


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


MATS = {}


def mat(name, color, rough=0.75):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = hex_rgba(color)
    bsdf.inputs["Roughness"].default_value = rough
    m.diffuse_color = hex_rgba(color)
    MATS[name] = m
    return m


def smoothstep(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


# ----------------------------------------------------------- geometry -------


def new_object(name, bm, material, smooth=True):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(obj)
    me.materials.append(material)
    for p in me.polygons:
        p.use_smooth = smooth
    return obj


def lathe(name, p0, p1, profile, material, segs=12, squash=(1.0, 1.0), smooth=True):
    """
    A tube along p0→p1. `profile` is a list of (t, radius) with t in [0, 1]
    along the axis (values just outside 0..1 make rounded caps). `squash`
    scales the cross-section (side, front) to make ellipses — torsos, shoes.
    """
    p0 = Vector(p0)
    p1 = Vector(p1)
    axis = p1 - p0
    length = axis.length
    d = axis.normalized()
    # Cross-section frame: `side` stays as close to world X as possible.
    side = Vector((1, 0, 0))
    if abs(d.dot(side)) > 0.9:
        side = Vector((0, 0, 1))
    front = d.cross(side).normalized()
    side = front.cross(d).normalized()

    bm = bmesh.new()
    rings = []
    for t, r in profile:
        c = p0 + d * (t * length)
        ring = []
        for i in range(segs):
            a = (i / segs) * math.tau
            off = side * (math.cos(a) * r * squash[0]) + front * (math.sin(a) * r * squash[1])
            ring.append(bm.verts.new(c + off))
        rings.append(ring)
    for k in range(len(rings) - 1):
        for i in range(segs):
            a, b = rings[k][i], rings[k][(i + 1) % segs]
            c, e = rings[k + 1][(i + 1) % segs], rings[k + 1][i]
            bm.faces.new((a, b, c, e))
    # Close the ends.
    for ring, t in ((rings[0], profile[0][0]), (rings[-1], profile[-1][0])):
        center = bm.verts.new(p0 + d * (t * length))
        for i in range(segs):
            v1, v2 = ring[i], ring[(i + 1) % segs]
            try:
                if ring is rings[0]:
                    bm.faces.new((center, v2, v1))
                else:
                    bm.faces.new((center, v1, v2))
            except ValueError:
                pass
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return new_object(name, bm, material, smooth)


def ellipsoid(name, center, radii, material, u=20, v=14, smooth=True):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=1.0)
    for vert in bm.verts:
        vert.co = Vector((vert.co.x * radii[0], vert.co.y * radii[1], vert.co.z * radii[2])) + Vector(center)
    return new_object(name, bm, material, smooth)


def sweep(name, points, radius, material, closed=False, segs=8, plane_normal=(0.0, 1.0, 0.0), radii=None):
    """A round tube along a polyline (frames, temples, moustache)."""
    pts = [Vector(p) for p in points]
    n = len(pts)
    bm = bmesh.new()
    rings = []
    pn = Vector(plane_normal)
    for i, p in enumerate(pts):
        a = pts[(i - 1) % n] if (closed or i > 0) else p
        b = pts[(i + 1) % n] if (closed or i < n - 1) else p
        t = (b - a).normalized()
        side = t.cross(pn)
        if side.length < 1e-6:
            side = t.cross(Vector((0, 0, 1)))
        side.normalize()
        up = side.cross(t).normalized()
        r = radii[i] if radii else radius
        rings.append([bm.verts.new(p + (side * math.cos(k / segs * math.tau) + up * math.sin(k / segs * math.tau)) * r) for k in range(segs)])
    last = n if closed else n - 1
    for i in range(last):
        r0, r1 = rings[i], rings[(i + 1) % n]
        for k in range(segs):
            bm.faces.new((r0[k], r0[(k + 1) % segs], r1[(k + 1) % segs], r1[k]))
    if not closed:
        for ring, rev in ((rings[0], True), (rings[-1], False)):
            c = bm.verts.new(sum((v.co for v in ring), Vector()) / segs)
            for k in range(segs):
                v1, v2 = ring[k], ring[(k + 1) % segs]
                bm.faces.new((c, v2, v1) if rev else (c, v1, v2))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return new_object(name, bm, material, True)


def rounded_rect(center, w, h, r, steps=5):
    """Points of a rounded rectangle in the XZ plane (a glasses rim)."""
    c = Vector(center)
    pts = []
    corners = [(w / 2 - r, h / 2 - r, 0), (-(w / 2 - r), h / 2 - r, 90), (-(w / 2 - r), -(h / 2 - r), 180), (w / 2 - r, -(h / 2 - r), 270)]
    for cx, cz, start in corners:
        for k in range(steps + 1):
            a = math.radians(start + 90 * k / steps)
            pts.append(c + Vector((cx + math.cos(a) * r, 0.0, cz + math.sin(a) * r)))
    return pts


def keyed(points, x):
    """Smoothstep between (x, y) keypoints — a soft curve through them."""
    if x <= points[0][0]:
        return points[0][1]
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        if x <= x1:
            return y0 + (y1 - y0) * smoothstep(x0, x1, x)
    return points[-1][1]


def head_band(name, c, radii, grow, phi_max, top, bottom, material, nu=48, nv=12):
    """
    A patch of the head's own surface between two curves — top(phi) and
    bottom(phi), phi measured around the head from the front. Its edges follow
    those curves exactly, so beards and hairlines come out smooth instead of
    stair-stepped along mesh faces.
    """
    rx, ry, rz = (r * grow for r in radii)
    bm = bmesh.new()
    grid = []
    for i in range(nu + 1):
        phi = -phi_max + 2 * phi_max * i / nu
        zt, zb = top(phi), bottom(phi)
        row = []
        for j in range(nv + 1):
            z = zt + (zb - zt) * j / nv
            s = math.sqrt(max(0.0, 1 - (z / rz) ** 2))
            row.append(bm.verts.new(c + Vector((rx * math.sin(phi) * s, -ry * math.cos(phi) * s, z))))
        grid.append(row)
    for i in range(nu):
        for j in range(nv):
            f = bm.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]))
            f.normal_update()
            if f.normal.dot(f.calc_center_median() - c) < 0:
                f.normal_flip()
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    return new_object(name, bm, material, True)


def on_face(x, z, push, c, radii):
    """A point on the front of the head ellipsoid at (x, z), pushed outward."""
    rx, ry, rz = radii
    k = max(0.0, 1 - (x / rx) ** 2 - (z / rz) ** 2)
    return Vector((x, -ry * math.sqrt(k) - push, z)) + c


def smile(name, center, material, width=0.075, depth=0.022, thick=0.0075):
    """A small curved mouth: a tube along an upturned arc."""
    bm = bmesh.new()
    steps, segs = 10, 6
    rings = []
    for i in range(steps + 1):
        t = i / steps * 2 - 1  # -1 … 1
        p = Vector(center) + Vector((t * width / 2, 0.0, -depth * (1 - t * t)))
        ring = []
        for k in range(segs):
            a = k / segs * math.tau
            ring.append(bm.verts.new(p + Vector((0.0, math.sin(a) * thick, math.cos(a) * thick))))
        rings.append(ring)
    for i in range(steps):
        for k in range(segs):
            bm.faces.new((rings[i][k], rings[i][(k + 1) % segs], rings[i + 1][(k + 1) % segs], rings[i + 1][k]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return new_object(name, bm, material, True)


def box(name, center, size, material, bevel=0.0, smooth=False):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for vert in bm.verts:
        vert.co = Vector((vert.co.x * size[0], vert.co.y * size[1], vert.co.z * size[2])) + Vector(center)
    if bevel > 0:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel, segments=2, affect="EDGES", profile=0.5)
    return new_object(name, bm, material, smooth)


# --------------------------------------------------------------- body -------

H = {
    "ankle": 0.085,
    "knee": 0.34,
    "hip": 0.62,
    "waist": 0.72,
    "chest": 0.92,
    "shoulder": 1.01,
    "neck": 1.07,
    "head": 1.37,
}
LEG_X = 0.115
ARM_X = 0.255
HEAD_R = (0.285, 0.265, 0.275)

# Each part says which bones may move it, so weights are computed, not painted.
PARTS = []


def part(obj, rule):
    PARTS.append((obj, rule))
    return obj


def build_body():
    skin = mat("Skin", LOOK["skin"])
    shirt = mat("Shirt", LOOK["shirt"], 0.85)
    pants = mat("Pants", LOOK["pants"], 0.9)
    shoes = mat("Shoes", LOOK["shoes"], 0.6)
    soles = mat("Soles", LOOK["soles"], 0.9)
    logo = mat("Logo", LOOK["shirt_logo"], 0.8)

    # Legs, pants all the way down. Knee loops are dense so the bend is clean.
    for s, tag in ((1, "L"), (-1, "R")):
        x = LEG_X * s
        part(
            lathe(
                f"leg.{tag}",
                (x, 0, H["hip"] + 0.04),
                (x, 0.0, H["ankle"] + 0.02),
                [(-0.02, 0.07), (0.0, 0.112), (0.2, 0.108), (0.4, 0.1), (0.48, 0.096), (0.52, 0.095), (0.6, 0.093), (0.85, 0.09), (1.0, 0.088), (1.03, 0.06)],
                pants,
                segs=12,
            ),
            ("leg", tag),
        )
        # Sneakers: a rounded wedge, toe forward (-Y).
        part(
            lathe(
                f"shoe.{tag}",
                (x, 0.085, 0.055),
                (x, -0.17, 0.055),
                [(-0.04, 0.04), (0.0, 0.075), (0.25, 0.085), (0.7, 0.08), (0.95, 0.06), (1.02, 0.03)],
                shoes,
                segs=12,
                squash=(1.0, 0.72),
            ),
            ("foot", tag),
        )
        part(box(f"sole.{tag}", (x, -0.045, 0.014), (0.148, 0.255, 0.026), soles, bevel=0.009), ("foot", tag))

    # Hips (pants) and torso (tee), elliptical.
    part(
        lathe("hips", (0, 0.0, H["hip"] - 0.06), (0, 0.0, H["waist"] + 0.02), [(-0.1, 0.12), (0.0, 0.188), (0.5, 0.194), (1.0, 0.18)], pants, segs=16, squash=(1.12, 0.75)),
        ("torso", None),
    )
    part(
        lathe(
            "torso",
            (0, 0.0, H["waist"] - 0.03),
            (0, 0.0, H["neck"]),
            [(-0.02, 0.185), (0.0, 0.224), (0.1, 0.216), (0.45, 0.215), (0.7, 0.218), (0.85, 0.2), (0.95, 0.15), (1.0, 0.09), (1.02, 0.0)],
            shirt,
            segs=18,
            squash=(1.12, 0.74),
        ),
        ("torso", None),
    )
    # The T on the shirt.
    part(box("logo.bar", (0, -0.155, 0.935), (0.15, 0.02, 0.035), logo, bevel=0.004), ("torso", None))
    part(box("logo.stem", (0, -0.158, 0.865), (0.042, 0.02, 0.11), logo, bevel=0.004), ("torso", None))

    # Neck.
    part(lathe("neck", (0, 0, H["neck"] - 0.04), (0, 0, H["neck"] + 0.1), [(0, 0.068), (1, 0.064)], skin, segs=10), ("neck", None))

    # Arms: short sleeve over the shoulder, bare forearm, mitten hand.
    for s, tag in ((1, "L"), (-1, "R")):
        sh = Vector((ARM_X * s, 0, H["shoulder"]))
        wrist = Vector((ARM_X * s + 0.05 * s, 0, 0.6))
        part(
            lathe(f"sleeve.{tag}", sh + Vector((-0.02 * s, 0, 0.03)), sh + (wrist - sh) * 0.42, [(-0.05, 0.06), (0.0, 0.092), (0.6, 0.088), (1.0, 0.086), (1.02, 0.06)], shirt, segs=12),
            ("arm", tag),
        )
        part(
            lathe(f"arm.{tag}", sh, wrist, [(0.0, 0.066), (0.3, 0.064), (0.45, 0.062), (0.55, 0.06), (0.8, 0.056), (1.0, 0.052), (1.04, 0.035)], skin, segs=10),
            ("arm", tag),
        )
        part(ellipsoid(f"hand.{tag}", wrist + Vector((0.005 * s, 0, -0.06)), (0.06, 0.05, 0.075), skin, 14, 10), ("hand", tag))
        part(ellipsoid(f"thumb.{tag}", wrist + Vector((-0.012 * s, -0.04, -0.045)), (0.024, 0.024, 0.034), skin, 8, 6), ("hand", tag))


def build_head():
    skin = mat("Skin", LOOK["skin"])
    blush = mat("SkinShadow", LOOK["skin_shadow"])
    hair = mat("Hair", LOOK["hair"], 0.9)
    eyes = mat("Eyes", LOOK["eyes"], 0.3)
    c = Vector((0, 0, H["head"]))
    rx, ry, rz = HEAD_R

    part(ellipsoid("head", c, (rx, ry, rz), skin, 28, 20), ("head", None))
    # Ears.
    for s in (1, -1):
        part(ellipsoid(f"ear.{s}", c + Vector((rx * 0.98 * s, 0.01, -0.02)), (0.035, 0.05, 0.06), skin, 10, 8), ("head", None))
    # Nose: a soft bump.
    part(ellipsoid("nose", c + Vector((0, -ry * 0.97, -0.045)), (0.03, 0.025, 0.03), blush, 10, 8), ("head", None))
    # Eyes: tall ovals sitting on the face.
    for s in (1, -1):
        e = c + Vector((0.095 * s, -ry * 0.9, -0.0))
        part(ellipsoid(f"eye.{s}", e, (0.03, 0.02, 0.045), eyes, 12, 8), ("head", None))
        part(ellipsoid(f"glint.{s}", e + Vector((0.008 * s, -0.016, 0.018)), (0.009, 0.006, 0.01), mat("Glint", "#ffffff", 0.2), 6, 4), ("head", None))
        # Brows.
        part(box(f"brow.{s}", c + Vector((0.095 * s, -ry * 0.93, 0.072)), (0.07, 0.018, 0.016), hair, bevel=0.005), ("head", None))
    # Mouth: a small dark line, slight smile.
    mouth_z = -0.118 if LOOK.get("moustache") else -0.095
    part(smile("mouth", on_face(0.0, mouth_z, -0.004, c, (rx, ry, rz)), mat("Mouth", "#6a3226"), width=0.064, depth=0.018), ("head", None))

    # Hair cap: a slightly larger ellipsoid with the face cut out.
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=30, radius=1.0)
    for vert in bm.verts:
        vert.co = Vector((vert.co.x * rx * 1.07, vert.co.y * ry * 1.08, vert.co.z * rz * 1.06)) + c
    textured = LOOK["hair_style"] == "textured"
    # Textured: hairline sits higher and the sides are a tight fade.
    hairline = 0.15 if textured else 0.11
    face_cut = [v for v in bm.verts if (v.co.y - c.y) < -0.06 and (v.co.z - c.z) < hairline]
    low_cut = [v for v in bm.verts if (v.co.z - c.z) < (-0.12 if (v.co.y - c.y) > 0.05 else -0.02)]
    if textured:
        for v in bm.verts:
            rel = v.co - c
            # Pull the sides in toward the scalp so the volume reads on top.
            if rel.z < 0.12:
                v.co = c + Vector((rel.x * 0.975, rel.y * 0.985, rel.z))
    bmesh.ops.delete(bm, geom=list(set(face_cut + low_cut)), context="VERTS")
    cap = new_object("hair.cap", bm, hair, smooth=True)
    mod = cap.modifiers.new("thick", "SOLIDIFY")
    mod.thickness = 0.02
    part(cap, ("head", None))

    # Fringe / spikes, depending on the style.
    style = LOOK["hair_style"]
    if style == "textured":
        # Three rows of chunky clumps: a front quiff that lifts up and
        # forward, a full middle, and a back row swept back.
        rows = [
            ([-0.14, -0.07, 0.0, 0.07, 0.14], -0.17, 0.185, (0.0, -0.05, 0.12), 0.06),
            ([-0.18, -0.11, -0.04, 0.04, 0.11, 0.18], -0.08, 0.245, (0.0, -0.015, 0.13), 0.062),
            ([-0.16, -0.08, 0.0, 0.08, 0.16], 0.02, 0.27, (0.0, 0.04, 0.12), 0.062),
            ([-0.13, -0.045, 0.045, 0.13], 0.11, 0.24, (0.0, 0.08, 0.09), 0.058),
            ([-0.08, 0.08], 0.18, 0.16, (0.0, 0.09, 0.05), 0.055),
        ]
        k = 0
        for xs, y, z, tip, rad in rows:
            for x in xs:
                wob = ((k * 37) % 7 - 3) * 0.012
                base = c + Vector((x, y, z - abs(x) * 0.35))
                t = base + Vector((x * 0.35 + wob, tip[1] + wob * 0.5, tip[2] - abs(x) * 0.25))
                part(lathe(f"clump.{k}", base, t, [(0.0, rad), (0.4, rad * 0.85), (0.78, rad * 0.58), (1.0, 0.03)], hair, segs=8, smooth=True), ("head", None))
                k += 1
    if style in ("fringe", "spiky"):
        locks = [(-0.17, 0.2), (-0.09, 0.0), (0.0, -0.12), (0.09, 0.1), (0.17, -0.2)]
        for i, (x, tilt) in enumerate(locks):
            base = c + Vector((x, -ry * 0.82, 0.16))
            tip = base + Vector((x * 0.25 + tilt * 0.05, -0.08, -0.13 + (i % 2) * 0.02))
            part(lathe(f"lock.{i}", base, tip, [(0.0, 0.07), (0.5, 0.05), (1.0, 0.012)], hair, segs=7, smooth=False), ("head", None))
    if style == "spiky":
        for i in range(6):
            a = (i / 6) * math.tau
            base = c + Vector((math.cos(a) * 0.15, math.sin(a) * 0.12 + 0.04, 0.22))
            tip = base + Vector((math.cos(a) * 0.08, math.sin(a) * 0.08 + 0.05, 0.12))
            part(lathe(f"spike.{i}", base, tip, [(0.0, 0.07), (1.0, 0.01)], hair, segs=6, smooth=False), ("head", None))
    # A little volume on the crown so the silhouette reads as hair, not a helmet.
    if style == "textured":
        part(ellipsoid("hair.crown", c + Vector((0.0, -0.01, 0.215)), (0.225, 0.215, 0.12), hair, 16, 10), ("head", None))
    else:
        part(ellipsoid("hair.crown", c + Vector((0.0, 0.03, 0.2)), (0.2, 0.18, 0.11), hair, 14, 8), ("head", None))
        for s in (1, -1):
            part(ellipsoid(f"hair.side.{s}", c + Vector((0.24 * s, 0.03, 0.06)), (0.07, 0.15, 0.12), hair, 10, 8), ("head", None))

    radii = (rx, ry, rz)
    if LOOK["glasses"]:
        frame = mat("Glasses", LOOK["glasses_frame"], 0.3)
        fw, fh, fz = 0.122, 0.096, 0.004
        fy = -ry - 0.012
        for s in (1, -1):
            cx = 0.098 * s
            rim = [p + Vector((0, 0, fz)) + c for p in rounded_rect((cx, fy, 0.0), fw, fh, 0.026)]
            part(sweep(f"rim.{s}", rim, 0.0065, frame, closed=True), ("head", None))
            # Temple arm: from the rim's outer edge back to the ear.
            outer = c + Vector(((0.098 + fw / 2) * s, fy + 0.01, fz + 0.012))
            hinge = c + Vector(((rx * 0.93) * s, -ry * 0.55, 0.02))
            ear = c + Vector(((rx * 1.0) * s, 0.0, 0.0))
            part(sweep(f"temple.{s}", [outer, hinge, ear], 0.0055, frame), ("head", None))
        bridge_y = fy - 0.004
        part(sweep("bridge", [c + Vector((-0.037, bridge_y, fz + 0.016)), c + Vector((0.0, bridge_y - 0.006, fz + 0.022)), c + Vector((0.037, bridge_y, fz + 0.016))], 0.0058, frame), ("head", None))

    if LOOK.get("beard"):
        beard = mat("Beard", LOOK.get("beard_color", LOOK["hair"]), 0.95)
        full = LOOK["beard"] == "full"
        deg = math.radians
        # Top edge: under the lip at the chin, up past the mouth corners to
        # meet the moustache, then a low line along the jaw (stubble doesn't
        # climb the cheeks) up into short sideburns.
        top_keys = (
            [(0, -0.152), (deg(11), -0.15), (deg(20), -0.092), (deg(40), -0.07), (deg(70), -0.03), (deg(98), 0.05)]
            if full
            else [(0, -0.152), (deg(11), -0.15), (deg(20), -0.095), (deg(42), -0.105), (deg(72), -0.07), (deg(98), 0.02)]
        )
        bottom_keys = [(0, -rz * 0.995), (deg(60), -rz * 0.97), (deg(98), -0.11)]
        b = head_band(
            "beard",
            c,
            radii,
            1.03 if full else 1.016,
            deg(98),
            lambda phi: keyed(top_keys, abs(phi)),
            lambda phi: keyed(bottom_keys, abs(phi)),
            beard,
        )
        sol = b.modifiers.new("thick", "SOLIDIFY")
        sol.thickness = 0.022 if full else 0.007
        sol.offset = 1.0
        part(b, ("head", None))

    if LOOK.get("moustache"):
        hair_m = mat("Moustache", LOOK.get("moustache_color", LOOK["hair"]), 0.95)
        pts, rads = [], []
        for i in range(9):
            t = i / 8 * 2 - 1
            x = t * 0.058
            z = -0.082 - 0.016 * t * t
            pts.append(on_face(x, z, 0.012, c, radii))
            rads.append(0.0075 + 0.0075 * (1 - t * t))
        part(sweep("moustache", pts, 0.012, hair_m, radii=rads), ("head", None))


# ----------------------------------------------------------- armature -------

BONES = {
    # name: (head, tail, parent)
    "root": ((0, 0, 0), (0, 0.15, 0), None),
    "hips": ((0, 0, H["hip"]), (0, 0, H["waist"] + 0.04), "root"),
    "spine": ((0, 0, H["waist"] + 0.04), (0, 0, H["chest"]), "hips"),
    "chest": ((0, 0, H["chest"]), (0, 0, H["neck"]), "spine"),
    "neck": ((0, 0, H["neck"]), (0, 0, H["neck"] + 0.09), "chest"),
    "head": ((0, 0, H["neck"] + 0.09), (0, 0, H["head"] + 0.3), "neck"),
}
for s, tag in ((1, "L"), (-1, "R")):
    sh = (ARM_X * s, 0, H["shoulder"])
    el = (ARM_X * s + 0.025 * s, 0, 0.8)
    wr = (ARM_X * s + 0.05 * s, 0, 0.6)
    BONES[f"upperarm.{tag}"] = (sh, el, "chest")
    BONES[f"forearm.{tag}"] = (el, wr, f"upperarm.{tag}")
    BONES[f"hand.{tag}"] = (wr, (wr[0] + 0.005 * s, 0, 0.5), f"forearm.{tag}")
    BONES[f"thigh.{tag}"] = ((LEG_X * s, 0, H["hip"]), (LEG_X * s, 0, H["knee"]), "hips")
    BONES[f"shin.{tag}"] = ((LEG_X * s, 0, H["knee"]), (LEG_X * s, 0, H["ankle"]), f"thigh.{tag}")
    BONES[f"foot.{tag}"] = ((LEG_X * s, 0, H["ankle"]), (LEG_X * s, -0.13, 0.03), f"shin.{tag}")


def build_armature():
    arm_data = bpy.data.armatures.new("TharunRig")
    rig = bpy.data.objects.new("TharunRig", arm_data)
    bpy.context.scene.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    for name, (head, tail, parent) in BONES.items():
        eb = arm_data.edit_bones.new(name)
        eb.head = head
        eb.tail = tail
        eb.roll = 0.0
        if parent:
            eb.parent = arm_data.edit_bones[parent]
            eb.use_connect = False
    bpy.ops.object.mode_set(mode="OBJECT")
    arm_data.bones["root"].use_deform = False
    return rig


# ------------------------------------------------------------- weights ------


def weights_for(rule, co):
    """Bone weights for a vertex, by which part it belongs to and where it is."""
    kind, tag = rule
    z = co.z
    if kind == "leg":
        k = smoothstep(H["knee"] - 0.05, H["knee"] + 0.05, z)
        w = {f"thigh.{tag}": k, f"shin.{tag}": 1 - k}
        top = smoothstep(H["hip"] - 0.04, H["hip"] + 0.06, z)
        if top > 0:
            w = {f"thigh.{tag}": k * (1 - top * 0.5), f"shin.{tag}": 1 - k, "hips": top * 0.5}
        return w
    if kind == "foot":
        a = smoothstep(0.06, 0.13, z)
        return {f"foot.{tag}": 1 - a, f"shin.{tag}": a}
    if kind == "arm":
        sh_z = H["shoulder"]
        el_z = 0.8
        k = smoothstep(el_z - 0.05, el_z + 0.05, z)
        w = {f"upperarm.{tag}": k, f"forearm.{tag}": 1 - k}
        top = smoothstep(sh_z - 0.06, sh_z + 0.03, z)
        if top > 0:
            w = {f"upperarm.{tag}": k * (1 - top * 0.5), f"forearm.{tag}": 1 - k, "chest": top * 0.5}
        return w
    if kind == "hand":
        return {f"hand.{tag}": 1.0}
    if kind == "torso":
        h = 1 - smoothstep(H["waist"] - 0.06, H["waist"] + 0.04, z)
        c = smoothstep(H["chest"] - 0.06, H["chest"] + 0.04, z)
        return {"hips": h, "spine": max(0.0, 1 - h - c), "chest": c}
    if kind == "neck":
        k = smoothstep(H["neck"], H["neck"] + 0.09, z)
        return {"neck": 1 - k * 0.5, "head": k * 0.5}
    return {"head": 1.0}


def skin(rig):
    for obj, rule in PARTS:
        # Bake modifiers (e.g. hair thickness) before weighting.
        if obj.modifiers:
            bpy.context.view_layer.objects.active = obj
            for m in list(obj.modifiers):
                bpy.ops.object.modifier_apply(modifier=m.name)
        groups = {}
        for v in obj.data.vertices:
            w = weights_for(rule, obj.matrix_world @ v.co)
            total = sum(w.values()) or 1.0
            for bone, val in w.items():
                if val <= 1e-4:
                    continue
                if bone not in groups:
                    groups[bone] = obj.vertex_groups.new(name=bone)
                groups[bone].add([v.index], val / total, "REPLACE")

    # Join every part into one mesh: one draw call in three.js.
    bpy.ops.object.select_all(action="DESELECT")
    objs = [o for o, _ in PARTS]
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    body = bpy.context.view_layer.objects.active
    body.name = "Tharun"
    body.data.name = "Tharun"
    body.parent = rig
    mod = body.modifiers.new("Rig", "ARMATURE")
    mod.object = rig
    return body


# ----------------------------------------------------------- animation ------

FPS = 30
FWD = -1.0  # rotating a hanging limb by -X swings its tip toward -Y (forward)


def pose_bone_names(rig):
    return [b.name for b in rig.pose.bones if b.name != "root"]


def apply_pose(rig, pose):
    for name in pose_bone_names(rig):
        pb = rig.pose.bones[name]
        pb.rotation_mode = "XYZ"
        r = pose.get(name, (0.0, 0.0, 0.0))
        pb.rotation_euler = r
        pb.location = (0.0, 0.0, 0.0)
    if "hips_loc" in pose:
        rig.pose.bones["hips"].location = pose["hips_loc"]


def key_pose(rig, frame):
    for name in pose_bone_names(rig):
        pb = rig.pose.bones[name]
        pb.keyframe_insert("rotation_euler", frame=frame)
    rig.pose.bones["hips"].keyframe_insert("location", frame=frame)


def make_action(rig, name, keys):
    """keys: list of (frame, pose dict). Pushed to its own NLA track."""
    act = bpy.data.actions.new(name)
    act.use_fake_user = True
    rig.animation_data_create()
    rig.animation_data.action = act
    for frame, pose in keys:
        apply_pose(rig, pose)
        key_pose(rig, frame)
    track = rig.animation_data.nla_tracks.new()
    track.name = name
    strip = track.strips.new(name, int(keys[0][0]), act)
    strip.name = name
    rig.animation_data.action = None
    log("action", name, "frames", keys[0][0], "→", keys[-1][0])
    return act


def L(x=0.0, y=0.0, z=0.0):
    return (x, y, z)


def walk_pose(phase, stride, knee, arm, bob, lean, elbow=0.0):
    """One instant of a walk/run cycle; phase in [0, 1)."""
    s = math.sin(phase * math.tau)
    c = math.cos(phase * math.tau)
    sl = s
    sr = -s
    return {
        "thigh.L": L(FWD * stride * sl),
        "thigh.R": L(FWD * stride * sr),
        # Knees only ever bend backward, most while the leg swings through.
        "shin.L": L(knee * max(0.0, -c) + 0.08),
        "shin.R": L(knee * max(0.0, c) + 0.08),
        "foot.L": L(-0.25 * max(0.0, sl)),
        "foot.R": L(-0.25 * max(0.0, sr)),
        "upperarm.L": L(-FWD * arm * sl, 0, -0.08),
        "upperarm.R": L(-FWD * arm * sr, 0, 0.08),
        "forearm.L": L(FWD * (elbow + 0.15 + 0.2 * max(0.0, -sl))),
        "forearm.R": L(FWD * (elbow + 0.15 + 0.2 * max(0.0, -sr))),
        "spine": L(lean, 0.06 * s),
        "chest": L(0.0, -0.1 * s),
        "head": L(-lean * 0.6, 0.04 * s),
        "hips_loc": (0.0, bob * abs(c), 0.0),
        "hips": L(0.0, 0.08 * s),
    }


def build_actions(rig):
    rest = {"upperarm.L": L(0, 0, -0.1), "upperarm.R": L(0, 0, 0.1), "forearm.L": L(FWD * 0.12), "forearm.R": L(FWD * 0.12)}

    # Idle: breathing, a slow weight shift, arms settling. 2s loop.
    keys = []
    for i in range(5):
        t = i / 4
        b = math.sin(t * math.tau)
        keys.append(
            (
                1 + i * 15,
                {
                    **rest,
                    "chest": L(0.025 * b),
                    "spine": L(0.0, 0.0, 0.0),
                    "head": L(-0.02 * b, 0.05 * math.sin(t * math.tau * 0.5)),
                    "upperarm.L": L(0.03 * b, 0, -0.1 - 0.025 * b),
                    "upperarm.R": L(0.03 * b, 0, 0.1 + 0.025 * b),
                    "hips_loc": (0.0, -0.006 * b, 0.0),
                },
            )
        )
    make_action(rig, "Idle", keys)

    # Walk: 1s, two steps.
    make_action(rig, "Walk", [(1 + i * 3.75, walk_pose(i / 8, 0.55, 0.75, 0.5, 0.035, 0.05)) for i in range(9)])
    # Run: 0.6s, bigger everything, elbows bent, leaning in.
    make_action(rig, "Run", [(1 + i * 2.25, walk_pose(i / 8, 0.95, 1.35, 0.95, 0.07, 0.22, elbow=1.1)) for i in range(9)])

    jump = {
        "thigh.L": L(FWD * 0.9),
        "thigh.R": L(FWD * 0.2),
        "shin.L": L(1.2),
        "shin.R": L(0.45),
        "upperarm.L": L(FWD * 0.6, 0, -2.0),
        "upperarm.R": L(FWD * 0.6, 0, 2.15),
        "forearm.L": L(FWD * 0.2, 0, 0.35),
        "forearm.R": L(FWD * 0.2, 0, -0.35),
        "spine": L(-0.08),
        "head": L(-0.15),
    }
    make_action(rig, "Jump", [(1, jump), (9, jump)])

    def fall(w):
        return {
            "thigh.L": L(FWD * 0.35),
            "thigh.R": L(FWD * -0.15),
            "shin.L": L(0.5),
            "shin.R": L(0.7),
            "upperarm.L": L(0, 0, -1.25 - w),
            "upperarm.R": L(0, 0, 1.25 + w),
            "forearm.L": L(FWD * 0.25, 0, -0.3),
            "forearm.R": L(FWD * 0.25, 0, 0.3),
            "head": L(0.15),
        }

    make_action(rig, "Fall", [(1, fall(0.0)), (5, fall(0.18)), (9, fall(0.0))])

    crouch = {
        **rest,
        "thigh.L": L(FWD * 0.7),
        "thigh.R": L(FWD * 0.7),
        "shin.L": L(1.2),
        "shin.R": L(1.2),
        "foot.L": L(-0.45),
        "foot.R": L(-0.45),
        "spine": L(0.3),
        "upperarm.L": L(0, 0, -0.6),
        "upperarm.R": L(0, 0, 0.6),
        "hips_loc": (0.0, -0.13, 0.0),
    }
    make_action(rig, "Land", [(1, crouch), (5, crouch), (10, rest)])

    # Wave: right hand up and waving. Loops at 1s.
    def wave(w):
        return {
            **rest,
            "upperarm.R": L(FWD * 0.15, 0, 2.2),
            "forearm.R": L(FWD * 0.1, 0, -0.45 + w),
            "hand.R": L(0, 0, w * 0.4),
            "head": L(0.02, -0.12, 0.08),
            "chest": L(0, 0, -0.04),
        }

    make_action(rig, "Wave", [(1, wave(-0.35)), (8, wave(0.35)), (16, wave(-0.35)), (23, wave(0.35)), (31, wave(-0.35))])

    # Interact: both hands forward, typing.
    def type_(a, b):
        return {
            "upperarm.L": L(FWD * 0.75, 0, 0.05),
            "upperarm.R": L(FWD * 0.75, 0, -0.05),
            "forearm.L": L(FWD * (0.95 + a)),
            "forearm.R": L(FWD * (0.95 + b)),
            "hand.L": L(0.25),
            "hand.R": L(0.25),
            "head": L(0.18),
            "spine": L(0.08),
        }

    make_action(rig, "Interact", [(1, type_(0, 0.08)), (5, type_(0.08, 0)), (9, type_(0, 0.08)), (13, type_(0.06, 0.02)), (17, type_(0, 0.08))])

    # Victory: a little celebration for achievements.
    def cheer(up):
        return {
            "upperarm.L": L(FWD * 0.3, 0, -2.4 - 0.2 * up),
            "upperarm.R": L(FWD * 0.3, 0, 2.4 + 0.2 * up),
            "forearm.L": L(0, 0, -0.3),
            "forearm.R": L(0, 0, 0.3),
            "thigh.L": L(FWD * 0.15 * up),
            "thigh.R": L(FWD * 0.15 * up),
            "shin.L": L(0.3 * up),
            "shin.R": L(0.3 * up),
            "head": L(-0.2),
            "hips_loc": (0.0, 0.05 * (1 - up) - 0.04 * up, 0.0),
        }

    make_action(rig, "Victory", [(1, cheer(1)), (7, cheer(0)), (13, cheer(1)), (19, cheer(0)), (25, cheer(1))])
    apply_pose(rig, {})


# ------------------------------------------------------------- export -------


def export_glb(rig, body):
    bpy.ops.object.select_all(action="DESELECT")
    rig.select_set(True)
    body.select_set(True)
    props = {p.identifier for p in bpy.ops.export_scene.gltf.get_rna_type().properties}
    want = {
        "filepath": OUT_GLB,
        "export_format": "GLB",
        "use_selection": True,
        "export_animations": True,
        "export_animation_mode": "NLA_TRACKS",
        "export_nla_strips": True,
        "export_apply": True,
        "export_yup": True,
        "export_skins": True,
        "export_morph": False,
        "export_def_bones": True,
        "export_force_sampling": True,
        "export_frame_range": False,
        "export_anim_single_armature": True,
        "export_reset_pose_bones": True,
        "export_optimize_animation_size": True,
        "export_materials": "EXPORT",
        "export_extras": False,
        "export_cameras": False,
        "export_lights": False,
    }
    args = {k: v for k, v in want.items() if k in props}
    log("gltf props used:", sorted(args.keys()))
    bpy.ops.export_scene.gltf(**args)
    log("exported", OUT_GLB, os.path.getsize(OUT_GLB), "bytes")


# ------------------------------------------------------------- preview ------


def render_previews(rig):
    scene = bpy.context.scene
    world = bpy.data.worlds.new("W")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.08, 0.07, 0.1, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = 0.6
    scene.world = world

    sun = bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", "SUN"))
    sun.data.energy = 3.5
    sun.rotation_euler = (math.radians(50), 0, math.radians(-35))
    scene.collection.objects.link(sun)

    cam = bpy.data.objects.new("Cam", bpy.data.cameras.new("Cam"))
    cam.data.lens = 60
    scene.collection.objects.link(cam)
    scene.camera = cam

    scene.render.resolution_x = 900
    scene.render.resolution_y = 1100
    scene.render.film_transparent = False
    engines = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items]
    scene.render.engine = "BLENDER_EEVEE" if "BLENDER_EEVEE" in engines else ("BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in engines else "BLENDER_WORKBENCH")
    log("render engine", scene.render.engine)

    def shoot(name, loc, target=(0, 0, 0.85), action=None, frame=1):
        cam.location = loc
        d = Vector(target) - Vector(loc)
        cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
        if action:
            rig.animation_data.action = bpy.data.actions[action]
        else:
            rig.animation_data.action = None
            apply_pose(rig, {})
        scene.frame_set(frame)
        scene.render.filepath = os.path.join(PREVIEW_DIR, f"{name}.png")
        bpy.ops.render.render(write_still=True)
        log("rendered", name)

    # Mute NLA so a single action can be previewed.
    for t in rig.animation_data.nla_tracks:
        t.mute = True
    shoot("front", (1.1, -3.4, 1.15))
    shoot("face", (0.0, -1.35, 1.4), target=(0, 0, 1.38))
    shoot("face34", (0.75, -1.1, 1.45), target=(0, 0, 1.4))
    shoot("back", (-1.2, 3.2, 1.3))
    shoot("side", (3.6, -0.4, 1.0))
    shoot("walk", (2.6, -2.6, 1.0), action="Walk", frame=1)
    shoot("run", (3.2, -1.2, 1.0), action="Run", frame=3)
    shoot("wave", (0.9, -3.3, 1.2), action="Wave", frame=8)
    shoot("jump", (2.8, -2.4, 1.1), action="Jump", frame=1)
    for t in rig.animation_data.nla_tracks:
        t.mute = False
    rig.animation_data.action = None


# ---------------------------------------------------------------- main ------


def main():
    log("building Tharun →", ROOT)
    clear_scene()
    bpy.context.scene.render.fps = FPS
    build_body()
    build_head()
    rig = build_armature()
    body = skin(rig)
    build_actions(rig)
    tris = sum(len(p.vertices) - 2 for p in body.data.polygons)
    log("triangles", tris, "vertices", len(body.data.vertices))
    export_glb(rig, body)
    bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
    log("saved", OUT_BLEND)
    if "--no-preview" not in ARGV:
        render_previews(rig)
    log("done")


try:
    main()
except Exception:
    log("FAILED\n" + traceback.format_exc())
    raise
