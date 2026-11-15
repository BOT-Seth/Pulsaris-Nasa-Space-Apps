"""Continuous anatomical mesh: reference facial profile, original whole-body UVs."""
import bpy,math,json,base64,struct,shutil
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

root=Path(__file__).resolve().parents[1]
out=root/'output/body-model-v10';out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root/'output/body-model-v7/body-ai.blend'))
obj=next(o for o in bpy.context.scene.objects if o.type=='MESH' and o.name!='Translucent skin shell')
bpy.data.objects.remove(bpy.data.objects['Translucent skin shell'],do_unlink=True)
with bpy.data.libraries.load(str(root/'output/body-model-v2/body-ai.blend')) as (data,loaded):
    loaded.objects=[name for name in data.objects if name.startswith('Mesh')][:1]
reference=loaded.objects[0]
surface=BVHTree.FromPolygons([v.co for v in reference.data.vertices],[list(p.vertices) for p in reference.data.polygons])
def ease(t):
    t=max(0,min(1,t));return t*t*(3-2*t)
changed=0
for v in obj.data.vertices:
    x,y,z=v.co
    if z<.858 or z>.972 or y>-.008:continue
    hit=surface.ray_cast(Vector((x,-1,z)),Vector((0,1,0)))
    if hit[0] is None:continue
    # A front-axis projection retains topology and lateral/head proportions.
    # No surface cutting, new neck, head transplant, UV transfer or color override.
    weight=ease((z-.858)/.015)*ease((.975-z)/.015)*ease((.056-abs(x))/.015)*ease((-y-.008)/.015)
    if weight:
        v.co.y=y*(1-weight)+hit[0].y*weight;changed+=1
obj.data.update()
bpy.data.objects.remove(reference,do_unlink=True)
for p in obj.data.polygons:p.use_smooth=True
image=bpy.data.images.load(str(root/'output/body-model-v7/muscle-color.png'),check_existing=False)
image.pack()
core=bpy.data.materials.new('Unified anatomical surface');core.use_nodes=True
nodes=core.node_tree.nodes;bsdf=nodes['Principled BSDF'];tex=nodes.new('ShaderNodeTexImage');tex.image=image
core.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
bsdf.inputs['Metallic'].default_value=0;bsdf.inputs['Roughness'].default_value=.48
bsdf.inputs['Coat Weight'].default_value=.06
obj.data.materials.clear();obj.data.materials.append(core)
for p in obj.data.polygons:p.material_index=0
skin=bpy.data.materials.new('Unified translucent blue skin');skin.use_nodes=True
bsdf=skin.node_tree.nodes['Principled BSDF']
bsdf.inputs['Base Color'].default_value=(.30,.49,.62,1)
bsdf.inputs['Alpha'].default_value=.10;bsdf.inputs['Roughness'].default_value=.35
bsdf.inputs['Transmission Weight'].default_value=.25;bsdf.inputs['IOR'].default_value=1.32
shell=obj.copy();shell.data=obj.data.copy();bpy.context.collection.objects.link(shell);shell.name='Translucent skin shell'
for v in shell.data.vertices:v.co+=v.normal*.0015
shell.data.materials.clear();shell.data.materials.append(skin)
for p in shell.data.polygons:p.material_index=0
bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);shell.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(out/'body-ai.glb'),export_format='GLB',use_selection=True)
mesh=obj.data;mesh.calc_loop_triangles();uvs=mesh.uv_layers.active.data
positions=[];normals=[];uv=[];indices=[];mapping={};q=32767
for tri in mesh.loop_triangles:
    for li in tri.loops:
        vi=mesh.loops[li].vertex_index;pair=tuple(uvs[li].uv);key=(vi,round(pair[0],6),round(pair[1],6))
        if key not in mapping:
            mapping[key]=len(positions);v=mesh.vertices[vi];p=v.co;n=v.normal
            positions.append((p.x,p.z,-p.y));normals.append((n.x,n.z,-n.y));uv.append(pair)
        indices.append(mapping[key])
assert len(positions)<65536
def packed(values,kind):
    return base64.b64encode(struct.pack('<%d%s'%(len(values),kind),*values)).decode()
info=dict(source='Local FLUX.2/TRELLIS muscle reconstruction; continuous original mesh and UVs; facial depth projected to earlier reference without replacing head or neck.',vertices=len(positions),triangles=len(indices)//3,quant=q,halfWidth=max(abs(p[0]) for p in positions),positions=packed([round(c*q) for p in positions for c in p],'h'),normals=packed([round(c*q) for n in normals for c in n],'h'),indices=packed(indices,'H'),uv=packed([c for pair in uv for c in pair],'f'))
shutil.copyfile(root/'output/body-model-v7/muscle-color.png',out/'muscle-color.png')
info['texture']='data:image/png;base64,'+base64.b64encode((out/'muscle-color.png').read_bytes()).decode()
(out/'body-model-ai.json').write_text(json.dumps(info))
(out/'geometry-report.json').write_text(json.dumps(dict(changedFaceVertices=changed,headTransplanted=False,neckCut=False,wholeBodyMaterialCount=1),indent=2))
scene=bpy.context.scene
for angle in (0,45,90,180,270):
    a=math.radians(angle);cam=scene.camera;cam.data.ortho_scale=1.12
    cam.location=(math.sin(a)*2,-math.cos(a)*2,.53);cam.rotation_euler=(Vector((0,0,.5))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(out/f'body-{angle}.png');bpy.ops.render.render(write_still=True)
for angle in (0,45,90):
    a=math.radians(angle);cam.data.ortho_scale=.32
    cam.location=(math.sin(a)*2,-math.cos(a)*2,.89);cam.rotation_euler=(Vector((0,0,.89))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(out/f'face-neck-{angle}.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'body-ai.blend'))
print('CONTINUOUS MESH',changed,'facial vertices adjusted;',len(positions),'vertices;',len(indices)//3,'triangles')
