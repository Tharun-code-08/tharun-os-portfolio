"""
Hero props for the island, built in headless Blender:

    blender --background --factory-startup --python art/build_props.py -- <repo root> [preview dir]

  crt       — the beige 90s monitor on the studio desk. The camera dives into
              its glass to boot THARUN OS, so it is the one prop that is seen
              from 30cm away. Origin: bottom centre of the stand; glass faces -Y.
  keyboard  — clicky, with real keys.
  mouse     — wired, obviously.

Exports public/models/props.glb; three.js picks the nodes by name.
"""

import math
import os
import sys
import traceback

import bmesh
import bpy
from mathutils import Vector

ARGV = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
ROOT = os.path.abspath(ARGV[0]) if ARGV else os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PREVIEW_DIR = ARGV[1] if len(ARGV) > 1 else os.path.join(ROOT, "art", "previews")
OUT_GLB = os.path.join(ROOT, "public", "models", "props.glb")
OUT_BLEND = os.path.join(ROOT, "art", "props.blend")
LOG = os.path.join(PREVIEW_DIR, "build.log")
os.makedirs(PREVIEW_DIR, exist_ok=True)

_lines = []


def log(*a):
    _lines.append(" ".join(str(x) for x in a))
    with open(LOG, "w", encoding="utf-8") as f:
        f.write("\n".join(_lines))


def lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def rgba(h):
    h = h.lstrip("#")
    return tuple(lin(int(h[i : i + 2], 16) / 255) for i in (0, 2, 4)) + (1.0,)


MATS = {}


def mat(name, color, rough=0.6, emit=None):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = rgba(color)
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = rgba(emit)
        b.inputs["Emission Strength"].default_value = 4.0
    MATS[name] = m
    return m


def obj_from_bm(name, bm, material, smooth=False):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    me.materials.append(material)
    for p in me.polygons:
        p.use_smooth = smooth
    return o


def rbox(name, center, size, material, bevel=0.01, segments=3, smooth=True):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2])) + Vector(center)
    if bevel:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel, segments=segments, affect="EDGES", profile=0.5)
    return obj_from_bm(name, bm, material, smooth)


def frustum(name, front_c, front_wh, back_c, back_wh, material, bevel=0.02):
    """A box that tapers from a front rectangle (in XZ) to a smaller back one."""
    bm = bmesh.new()
    fw, fh = front_wh
    bw, bh = back_wh
    f = [bm.verts.new(Vector(front_c) + Vector((x * fw / 2, 0, z * fh / 2))) for x, z in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    b = [bm.verts.new(Vector(back_c) + Vector((x * bw / 2, 0, z * bh / 2))) for x, z in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    bm.faces.new(f[::-1])
    bm.faces.new(b)
    for i in range(4):
        j = (i + 1) % 4
        bm.faces.new((f[i], f[j], b[j], b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if bevel:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel, segments=3, affect="EDGES", profile=0.5)
    return obj_from_bm(name, bm, material, True)


def text_mesh(name, body, center, size, material, rot=(math.radians(90), 0, 0)):
    cu = bpy.data.curves.new(name, "FONT")
    cu.body = body
    cu.size = size
    cu.align_x = "CENTER"
    cu.align_y = "CENTER"
    cu.extrude = 0.0015
    o = bpy.data.objects.new(name, cu)
    bpy.context.scene.collection.objects.link(o)
    o.location = center
    o.rotation_euler = rot
    o.data.materials.append(material)
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.convert(target="MESH")
    o.select_set(False)
    return bpy.data.objects[name]


def join(name, objs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    o.name = name
    o.data.name = name
    return o


# ------------------------------------------------------------------ CRT -----
# Matches the screen plane three.js draws: glass centre at z=0.3, 0.50 x 0.39,
# front of the glass at y=-0.255 (three: +z 0.255).


def build_crt():
    shell = mat("Plastic", "#d9d2c4", 0.55)
    shell_dark = mat("PlasticDark", "#bdb5a6", 0.6)
    glass = mat("Glass", "#0c1712", 0.15)
    led = mat("LED", "#3dff8a", 0.3, emit="#3dff8a")
    label = mat("Label", "#8a8478", 0.6)

    parts = []
    gz = 0.3  # glass centre height above the desk
    W, Hh = 0.64, 0.54
    sw, sh = 0.5, 0.39
    fy = -0.235  # bezel front plane

    # Bezel as a frame around the glass, deep enough to read as a recess.
    side = (W - sw) / 2
    top = (Hh - sh) / 2 + 0.01
    bot = (Hh - sh) / 2 - 0.01
    parts.append(rbox("bezel.t", (0, fy + 0.03, gz + sh / 2 + top / 2), (W, 0.07, top), shell, 0.018))
    parts.append(rbox("bezel.b", (0, fy + 0.03, gz - sh / 2 - bot / 2), (W, 0.07, bot), shell, 0.018))
    parts.append(rbox("bezel.l", (-sw / 2 - side / 2, fy + 0.03, gz), (side, 0.07, sh + 0.02), shell, 0.018))
    parts.append(rbox("bezel.r", (sw / 2 + side / 2, fy + 0.03, gz), (side, 0.07, sh + 0.02), shell, 0.018))
    # Inner lip, darker, stepping in toward the glass.
    parts.append(rbox("lip.t", (0, fy + 0.035, gz + sh / 2 + 0.006), (sw + 0.02, 0.05, 0.014), shell_dark, 0.004))
    parts.append(rbox("lip.b", (0, fy + 0.035, gz - sh / 2 - 0.006), (sw + 0.02, 0.05, 0.014), shell_dark, 0.004))
    parts.append(rbox("lip.l", (-sw / 2 - 0.006, fy + 0.035, gz), (0.014, 0.05, sh), shell_dark, 0.004))
    parts.append(rbox("lip.r", (sw / 2 + 0.006, fy + 0.035, gz), (0.014, 0.05, sh), shell_dark, 0.004))

    # Slightly domed glass behind where three.js draws the screen.
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=12, y_segments=10, size=0.5)
    for v in bm.verts:
        x, z = v.co.x * sw, v.co.y * sh * (1 / 1.0)
        bulge = 0.012 * (1 - (2 * x / sw) ** 2) * (1 - (2 * z / sh) ** 2)
        v.co = Vector((x, fy + 0.02 - bulge, gz + z))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    g = obj_from_bm("glass", bm, glass, True)
    g.data.flip_normals() if hasattr(g.data, "flip_normals") else None
    parts.append(g)

    # The tube housing, tapering back.
    parts.append(frustum("housing", (0, fy + 0.06, gz), (W - 0.02, Hh - 0.02), (0, 0.28, gz + 0.02), (0.4, 0.34), shell, 0.03))
    parts.append(rbox("back", (0, 0.29, gz + 0.02), (0.3, 0.04, 0.24), shell_dark, 0.012))
    # Vents on top.
    for i in range(7):
        parts.append(rbox(f"vent.{i}", (0, 0.02 + i * 0.03, gz + 0.235 - i * 0.012), (0.34, 0.012, 0.012), shell_dark, 0.003))

    # Stand.
    parts.append(rbox("neck", (0, 0.03, 0.045), (0.16, 0.14, 0.05), shell_dark, 0.012))
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=32, radius1=0.2, radius2=0.18, depth=0.025)
    for v in bm.verts:
        v.co = Vector((v.co.x * 1.15, v.co.y * 0.9 + 0.03, v.co.z + 0.0125))
    parts.append(obj_from_bm("base", bm, shell, True))

    # Power button + LED + badge on the bottom bezel.
    by = fy - 0.006
    bz = gz - sh / 2 - bot / 2
    parts.append(rbox("power", (0.25, by, bz), (0.035, 0.012, 0.022), shell_dark, 0.004))
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=6, radius=0.007)
    for v in bm.verts:
        v.co += Vector((0.205, by, bz))
    parts.append(obj_from_bm("led", bm, led, True))
    parts.append(text_mesh("badge", "THARUN", (-0.2, by - 0.002, bz), 0.022, label))
    parts.append(rbox("knob.a", (0.12, by, bz), (0.014, 0.01, 0.014), shell_dark, 0.004))
    parts.append(rbox("knob.b", (0.145, by, bz), (0.014, 0.01, 0.014), shell_dark, 0.004))

    return join("crt", parts)


def build_keyboard():
    shell = mat("Plastic", "#d9d2c4", 0.55)
    key = mat("Key", "#ece6da", 0.5)
    key_dark = mat("KeyDark", "#bfb7a8", 0.55)
    parts = []
    # Wedge base: thicker at the back.
    parts.append(frustum("kb.base", (0, -0.07, 0.012), (0.46, 0.022), (0, 0.075, 0.02), (0.46, 0.038), shell, 0.008))
    rows = [13, 13, 12, 11]
    for r, n in enumerate(rows):
        y = 0.05 - r * 0.031
        z = 0.034 - r * 0.003
        x0 = -(n - 1) * 0.031 / 2 + r * 0.006
        for i in range(n):
            m = key_dark if (i == 0 or i == n - 1) else key
            parts.append(rbox(f"k.{r}.{i}", (x0 + i * 0.031, y, z), (0.026, 0.026, 0.014), m, 0.004, 2))
    parts.append(rbox("space", (0.0, 0.05 - 4 * 0.031, 0.022), (0.17, 0.026, 0.014), key, 0.004, 2))
    return join("keyboard", parts)


def build_mouse():
    shell = mat("Plastic", "#d9d2c4", 0.55)
    dark = mat("PlasticDark", "#bdb5a6", 0.6)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=1)
    for v in bm.verts:
        v.co = Vector((v.co.x * 0.032, v.co.y * 0.05, max(0.0, v.co.z) * 0.022))
    body = obj_from_bm("m.body", bm, shell, True)
    seam = rbox("m.seam", (0, -0.022, 0.02), (0.002, 0.03, 0.006), dark, 0.0)
    return join("mouse", [body, seam])


def export(objs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    props = {p.identifier for p in bpy.ops.export_scene.gltf.get_rna_type().properties}
    want = {
        "filepath": OUT_GLB,
        "export_format": "GLB",
        "use_selection": True,
        "export_apply": True,
        "export_yup": True,
        "export_animations": False,
        "export_cameras": False,
        "export_lights": False,
    }
    bpy.ops.export_scene.gltf(**{k: v for k, v in want.items() if k in props})
    log("exported", OUT_GLB, os.path.getsize(OUT_GLB), "bytes")


def preview(objs):
    scene = bpy.context.scene
    w = bpy.data.worlds.new("W")
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = (0.08, 0.07, 0.1, 1)
    w.node_tree.nodes["Background"].inputs[1].default_value = 0.7
    scene.world = w
    sun = bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", "SUN"))
    sun.data.energy = 3.5
    sun.rotation_euler = (math.radians(55), 0, math.radians(-30))
    scene.collection.objects.link(sun)
    cam = bpy.data.objects.new("Cam", bpy.data.cameras.new("Cam"))
    cam.data.lens = 50
    scene.collection.objects.link(cam)
    scene.camera = cam
    cam.location = (0.75, -1.25, 0.75)
    d = Vector((0, 0, 0.22)) - cam.location
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    scene.render.resolution_x = 1000
    scene.render.resolution_y = 800
    engines = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items]
    scene.render.engine = "BLENDER_EEVEE" if "BLENDER_EEVEE" in engines else "BLENDER_WORKBENCH"
    scene.render.filepath = os.path.join(PREVIEW_DIR, "props.png")
    bpy.ops.render.render(write_still=True)
    log("rendered props")


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    crt = build_crt()
    kb = build_keyboard()
    kb.location = (0, -0.48, 0)
    mouse = build_mouse()
    mouse.location = (0.32, -0.5, 0)
    objs = [crt, kb, mouse]
    tris = sum(len(p.vertices) - 2 for o in objs for p in o.data.polygons)
    log("triangles", tris)
    # Bake the layout offsets out so each prop sits at its own origin in the GLB.
    kb.location = (0, 0, 0)
    mouse.location = (0, 0, 0)
    export(objs)
    bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
    kb.location = (0, -0.48, 0)
    mouse.location = (0.32, -0.5, 0)
    if "--no-preview" not in ARGV:
        preview(objs)
    log("done")


try:
    main()
except Exception:
    log("FAILED\n" + traceback.format_exc())
    raise
