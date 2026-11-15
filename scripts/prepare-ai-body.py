"""Blender: --background --python scripts/prepare-ai-body.py -- input.glb outdir.
Exports a normalized, rotatable GLB, app geometry and four review renders.
"""
import base64, json, math, struct, sys
from pathlib import Path
import bpy
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
src, dest = args[:2]
muscle = len(args) > 2 and args[2] == 'muscle'
out = Path(dest).resolve()
out.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
objects = [o for o in bpy.context.scene.objects if o.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in objects: o.select_set(True)
bpy.context.view_layer.objects.active = objects[0]
bpy.ops.object.join()
obj = bpy.context.object
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
# TRELLIS GLB imports upright in Blender Z-up.
points = [v.co for v in obj.data.vertices]
lo = Vector(tuple(min(p[i] for p in points) for i in range(3)))
hi = Vector(tuple(max(p[i] for p in points) for i in range(3)))
center = (lo + hi) / 2
height = hi.z - lo.z
for v in obj.data.vertices:
    v.co = (v.co - Vector((center.x, center.y, lo.z))) / height
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.remove_doubles(threshold=0.00006)
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode='OBJECT')
smooth = obj.modifiers.new('Remove reconstruction noise', 'SMOOTH')
smooth.factor = 0.3
smooth.iterations = 2
bpy.ops.object.modifier_apply(modifier=smooth.name)
mod = obj.modifiers.new('Tablet mesh', 'DECIMATE')
mod.ratio = min(1, 60000 / max(1, sum(len(p.vertices)-2 for p in obj.data.polygons)))
bpy.ops.object.modifier_apply(modifier=mod.name)
smooth = obj.modifiers.new('Polish surface', 'SMOOTH')
smooth.factor = 0.2
smooth.iterations = 1
bpy.ops.object.modifier_apply(modifier=smooth.name)
bpy.ops.object.shade_smooth()
mat = bpy.data.materials.new('Pulsaris translucent blue glass')
mat.diffuse_color = (0.22, 0.43, 0.58, 0.64)
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get('Principled BSDF')
bsdf.inputs['Base Color'].default_value = mat.diffuse_color
bsdf.inputs['Metallic'].default_value = 0.0
bsdf.inputs['Roughness'].default_value = 0.19
bsdf.inputs['Transmission Weight'].default_value = 0.68
bsdf.inputs['IOR'].default_value = 1.32
bsdf.inputs['Alpha'].default_value = 0.78
bsdf.inputs['Coat Weight'].default_value = 0.32
texture = None
if muscle:
    bsdf.inputs['Alpha'].default_value = 0.12
    bsdf.inputs['Transmission Weight'].default_value = 0.3
    mat.diffuse_color = (0.22, 0.43, 0.58, 0.12)
    for original in obj.data.materials:
        if original and original.use_nodes:
            for node in original.node_tree.nodes:
                if node.type == 'TEX_IMAGE' and node.image:
                    texture = node.image.copy()
                    break
        if texture: break
    if texture is None: raise RuntimeError('Muscle reconstruction has no texture')
    texture.scale(2048, 2048)
    texture.filepath_raw = str(out/'muscle-color.png')
    texture.file_format = 'PNG'
    texture.save()
    for original in obj.data.materials:
        if original and original.use_nodes:
            for node in original.node_tree.nodes:
                if node.type == 'TEX_IMAGE': node.image = texture
            principled = original.node_tree.nodes.get('Principled BSDF')
            if principled:
                principled.inputs['Roughness'].default_value = 0.5
                principled.inputs['Metallic'].default_value = 0
    shell = obj.copy()
    shell.data = obj.data.copy()
    bpy.context.collection.objects.link(shell)
    shell.name = 'Translucent skin shell'
    for v in shell.data.vertices: v.co += v.normal * 0.0015
    shell.data.materials.clear()
    shell.data.materials.append(mat)
    for face in shell.data.polygons: face.material_index = 0
    shell.select_set(True)
else:
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    for p in obj.data.polygons: p.material_index = 0
bpy.ops.export_scene.gltf(filepath=str(out/'body-ai.glb'), export_format='GLB', use_selection=True)
mesh = obj.data
mesh.calc_loop_triangles()
verts = [(v.co.x, v.co.z, -v.co.y) for v in mesh.vertices]
idx = [i for t in mesh.loop_triangles for i in t.vertices]
uv = []
if muscle:
    # Keep UV seam splits: collapsing them would smear fibers across chart boundaries.
    remap, textured_verts, idx = {}, [], []
    layer = mesh.uv_layers.active.data
    for triangle in mesh.loop_triangles:
        for li in triangle.loops:
            vi = mesh.loops[li].vertex_index
            pair = tuple(layer[li].uv)
            key = (vi, round(pair[0], 6), round(pair[1], 6))
            if key not in remap:
                remap[key] = len(textured_verts)
                textured_verts.append(verts[vi])
                uv.append(pair)
            idx.append(remap[key])
    verts = textured_verts
    if len(verts) > 65535: raise RuntimeError('UV-split mesh exceeds Uint16 vertex budget')
q = 32767
info = dict(source='Local FLUX.2 Klein 4B reference generation -> TRELLIS 2 on AMD RX 9070 XT; Blender decimation.', vertices=len(verts), triangles=len(idx)//3, quant=q, halfWidth=max(abs(p[0]) for p in verts), positions=base64.b64encode(struct.pack('<%dh'%(len(verts)*3),*[round(max(-1,min(1,c))*q) for p in verts for c in p])).decode(), indices=base64.b64encode(struct.pack('<%dH'%len(idx),*idx)).decode())
if muscle:
    info['uv'] = base64.b64encode(struct.pack('<%df'%(len(uv)*2),*[v for pair in uv for v in pair])).decode()
    info['texture'] = 'data:image/png;base64,' + base64.b64encode((out/'muscle-color.png').read_bytes()).decode()
    info['source'] += ' Blue muscle anatomy with textured muscle core and separate translucent skin shell.'
(out/'body-model-ai.json').write_text(json.dumps(info))
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.render.resolution_x = 600
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.world = bpy.data.worlds.new('Studio')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (0.7,0.8,1,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = 0.5
for pos, energy, size in [((-2,-3,3),180,3),((2,1,2),230,2),((0,-1,3),60,2)]:
    bpy.ops.object.light_add(type='AREA', location=pos)
    light = bpy.context.object
    light.data.energy, light.data.shape, light.data.size = energy, 'DISK', size
    light.rotation_euler = (Vector((0,0,0.5))-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add()
cam = bpy.context.object
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 1.12
scene.camera = cam
for angle in (0,90,180,270):
    a = math.radians(angle)
    cam.location = (math.sin(a)*2,-math.cos(a)*2,0.53)
    cam.rotation_euler = (Vector((0,0,0.5))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath = str(out/f'body-{angle:03}.png')
    bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'body-ai.blend'))
print('EXPORTED', info['vertices'], info['triangles'])
