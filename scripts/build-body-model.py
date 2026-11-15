# Builds the 3D body used by the Body map. Run with Blender, headless:
#
#   blender -b -P scripts/build-body-model.py -- <body.obj> <out-dir>
#
# Input: the "body" group of the MakeHuman base mesh (CC0 1.0, makehumancommunity/makehuman,
#        makehuman/data/3dobjs/base.obj). Joints, helpers and proxies are removed beforehand.
# Output: src/data/body-model.json (quantized positions + triangle indices, base64)
#         and preview renders (front and three-quarter) for a visual check.
#
# The mesh is decimated for tablet performance, scaled so the figure is 1.0 tall with
# its feet at y = 0, and centred on x and z. No likeness, no face detail is added.

import base64
import json
import math
import struct
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
src, out_dir = argv[0], argv[1]
TARGET_TRIS = 9000

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.obj_import(filepath=src, forward_axis="NEGATIVE_Z", up_axis="Y")
obj = bpy.context.selected_objects[0]
bpy.context.view_layer.objects.active = obj
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

mesh = obj.data
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.remove_doubles(threshold=0.0001)
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.mesh.quads_convert_to_tris()
bpy.ops.object.mode_set(mode="OBJECT")

tris = len(mesh.polygons)
mod = obj.modifiers.new("decimate", "DECIMATE")
mod.ratio = min(1.0, TARGET_TRIS / tris)
bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.ops.object.shade_smooth()

# Blender is Z-up after import. Normalize: height 1, feet at 0, centred.
zs = [v.co.z for v in mesh.vertices]
xs = [v.co.x for v in mesh.vertices]
ys = [v.co.y for v in mesh.vertices]
height = max(zs) - min(zs)
cx, cy, z0 = (max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2, min(zs)
for v in mesh.vertices:
    v.co = Vector(((v.co.x - cx) / height, (v.co.y - cy) / height, (v.co.z - z0) / height))
mesh.update()
mesh.calc_loop_triangles()

# Export in the app's axes: x right, y up, z toward the viewer.
verts = [(v.co.x, v.co.z, -v.co.y) for v in mesh.vertices]
front_sign = 1.0
# The face should point toward +z. Feet are longer in front of the ankle than behind it,
# so compare the toes and heels against the ankle line, not against the body centre.
ankle = [p[2] for p in verts if 0.05 <= p[1] < 0.09]
ankle_z = sum(ankle) / len(ankle)
feet = [p[2] for p in verts if p[1] < 0.03]
if (ankle_z - min(feet)) > (max(feet) - ankle_z):
    front_sign = -1.0
print("FRONT", front_sign, "ankle", round(ankle_z, 3), "feet", round(min(feet), 3), round(max(feet), 3))
verts = [(x * front_sign, y, z * front_sign) for (x, y, z) in verts]

Q = 32767.0
pos = struct.pack("<%dh" % (len(verts) * 3), *[int(round(max(-1.0, min(1.0, c)) * Q)) for p in verts for c in p])
idx = [i for t in mesh.loop_triangles for i in t.vertices]
if front_sign < 0:  # mirroring two axes keeps winding; nothing to flip
    pass
ind = struct.pack("<%dH" % len(idx), *idx)

half_w = max(abs(p[0]) for p in verts)
info = {
    "source": "MakeHuman base mesh, body group. CC0 1.0. Decimated in Blender.",
    "vertices": len(verts),
    "triangles": len(idx) // 3,
    "quant": Q,
    "halfWidth": round(half_w, 4),
    "positions": base64.b64encode(pos).decode("ascii"),
    "indices": base64.b64encode(ind).decode("ascii"),
}
with open(out_dir + "/body-model.json", "w") as f:
    json.dump(info, f)
print("BODY", info["vertices"], "verts", info["triangles"], "tris", "halfWidth", info["halfWidth"])

# Width profile by height, to place the region boundaries from the real mesh.
for lo in [i / 20 for i in range(20)]:
    band = [abs(p[0]) for p in verts if lo <= p[1] < lo + 0.05]
    if band:
        print("PROFILE y %.2f-%.2f  max|x| %.3f" % (lo, lo + 0.05, max(band)))

# Preview renders, so the mesh can be looked at before it goes into the app.
scene = bpy.context.scene
scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.light = "STUDIO"
scene.display.shading.color_type = "SINGLE"
scene.display.shading.single_color = (0.85, 0.85, 0.83)
scene.display.shading.show_cavity = True
scene.render.resolution_x, scene.render.resolution_y = 700, 900
scene.render.film_transparent = False
world = bpy.data.worlds.new("w")
scene.world = world
cam_data = bpy.data.cameras.new("cam")
cam_data.type = "ORTHO"
cam_data.ortho_scale = 1.25
cam = bpy.data.objects.new("cam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
for name, angle in (("front", 0.0), ("quarter", math.radians(-32))):
    r = 3.0
    # Mesh in Blender space: front is -y or +y depending on front_sign.
    fy = -1.0 if front_sign > 0 else 1.0
    cam.location = (math.sin(angle) * r, fy * math.cos(angle) * r, 0.5)
    direction = Vector((0, 0, 0.5)) - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = out_dir + "/preview-" + name + ".png"
    bpy.ops.render.render(write_still=True)
print("DONE")
