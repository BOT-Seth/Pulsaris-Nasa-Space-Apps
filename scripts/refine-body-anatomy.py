"""Targeted corrections to the accepted muscle model; preserve its UVs and texture."""
import bpy, math
from pathlib import Path
from mathutils import Vector
import numpy as np

root = Path(__file__).resolve().parents[1]
out = root/'output/body-model-v5'
out.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root/'output/body-model-v3/body-ai.blend'))
obj = next(o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name != 'Translucent skin shell')
shell = bpy.data.objects.get('Translucent skin shell')
bpy.data.objects.remove(shell, do_unlink=True)
# Preserve the original anatomy, UVs and material. Fit the surrounding local
# surface and trim only excess projection above it; never push below that fit.
counts = dict(face=0, chest=0, knees=0)
coords = np.array([tuple(v.co) for v in obj.data.vertices])
for label, cx, cz, inner, outer, keep in [
    ('chest', -.062, .706, .012, .027, .0015),
    ('chest', .062, .706, .012, .027, .0015),
    ('knees', -.071, .281, .020, .043, .0035),
    ('knees', .071, .281, .020, .043, .0035),
]:
    dx, dz = coords[:,0]-cx, coords[:,2]-cz
    distance = np.sqrt(dx*dx+dz*dz)
    ring = (distance>inner)&(distance<outer)&(coords[:,1]<0)
    def basis(x,z): return np.column_stack([np.ones_like(x),x,z,x*x,x*z,z*z])
    coefficients = np.linalg.lstsq(basis(dx[ring],dz[ring]), -coords[ring,1], rcond=None)[0]
    for i in np.where((distance<inner)&(coords[:,1]<0))[0]:
        fit = float(basis(dx[i:i+1],dz[i:i+1]) @ coefficients)
        front = -coords[i,1]
        limit = fit + keep
        if front>limit:
            # Convex blend with a locally supported surface, never an arbitrary depth.
            w=(1-(distance[i]/inner)**2)**2
            obj.data.vertices[int(i)].co.y += (front-limit)*w*.8
            counts[label] += 1
# Gentle smoothing only on the existing facial geometry; no head transplant.
face_group=obj.vertex_groups.new(name='Gentle facial cleanup')
for v in obj.data.vertices:
    if .875<v.co.z<.975 and v.co.y<0:
        w=min(1,(v.co.z-.875)/.012,(.975-v.co.z)/.012)
        face_group.add([v.index],w,'REPLACE')
        counts['face']+=1
bpy.context.view_layer.objects.active=obj
mod=obj.modifiers.new('Gentle facial cleanup','SMOOTH')
mod.vertex_group=face_group.name;mod.factor=.22;mod.iterations=3
bpy.ops.object.modifier_apply(modifier=mod.name)
obj.data.update()
skin = bpy.data.materials.get('Pulsaris translucent blue glass')
shell=obj.copy(); shell.data=obj.data.copy(); bpy.context.collection.objects.link(shell)
shell.name='Translucent skin shell'
for v in shell.data.vertices: v.co += v.normal*.0015
shell.data.materials.clear(); shell.data.materials.append(skin)
for p in shell.data.polygons: p.material_index=0
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True);shell.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(out/'body-ai.glb'),export_format='GLB',use_selection=True)
(out/'muscle-color.png').write_bytes((root/'output/body-model-v3/muscle-color.png').read_bytes())
# Reuse the exact quantization/UV export used by the reconstruction pipeline.
source=(root/'scripts/prepare-ai-body.py').read_text()
muscle=True
import base64,json,struct
exec(source[source.index('mesh = obj.data'):source.index('scene = bpy.context.scene')])
scene=bpy.context.scene
for angle in (0,90,180,270):
    a=math.radians(angle);cam=scene.camera
    cam.location=(math.sin(a)*2,-math.cos(a)*2,.53)
    cam.rotation_euler=(Vector((0,0,.5))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(out/f'body-{angle:03}.png')
    bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'body-ai.blend'))
(out/'corrections.json').write_text(json.dumps(counts,indent=2))
print('CORRECTED',counts)
