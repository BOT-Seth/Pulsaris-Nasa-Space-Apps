"""Use the actual earlier reference head, retaining the current muscle palette/UVs."""
import bpy,bmesh,math,base64,json,struct
import numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.geometry import barycentric_transform
from mathutils.bvhtree import BVHTree

root=Path(__file__).resolve().parents[1]
out=root/'output/body-model-v9';out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root/'output/body-model-v7/body-ai.blend'))
obj=next(o for o in bpy.context.scene.objects if o.type=='MESH' and o.name!='Translucent skin shell')
bpy.data.objects.remove(bpy.data.objects['Translucent skin shell'],do_unlink=True)
with bpy.data.libraries.load(str(root/'output/body-model-v2/body-ai.blend')) as (data,loaded):
    loaded.objects=[name for name in data.objects if name.startswith('Mesh')][:1]
head=loaded.objects[0];bpy.context.collection.objects.link(head)
head.name='Reference head geometry'
# The reference head keeps its own clean UV chart. Nearest-surface UV transfer
# crossed atlas seams, so give it a continuous chart in the same blue palette.
bpy.ops.object.select_all(action='DESELECT');head.select_set(True)
bpy.context.view_layer.objects.active=head
if not head.data.uv_layers:head.data.uv_layers.new(name='UVMap')
head.data.materials.clear()
for mat in obj.data.materials:head.data.materials.append(mat)
for p in head.data.polygons:p.material_index=0
original=BVHTree.FromPolygons([v.co for v in obj.data.vertices],[list(p.vertices) for p in obj.data.polygons])
# Match the neck only. The nose, lips, chin and remaining head stay reference geometry.
for v in head.data.vertices:
    z=v.co.z
    if .815<z<.855:
        near=original.find_nearest(v.co)
        if near:
            w=max(0,min(1,(.855-z)/.017));w=w*w*(3-2*w)
            target=near[0].copy();target.z=z
            if z<.838:target.x*=.99;target.y*=.99
            v.co=v.co.lerp(target,w)
def cut(mesh,keep_above,z):
    bm=bmesh.new();bm.from_mesh(mesh)
    bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=1e-7,plane_co=(0,0,z),plane_no=(0,0,1),clear_inner=keep_above,clear_outer=not keep_above)
    bm.to_mesh(mesh);bm.free();mesh.update()

# Put the untouched body texture above a softly graded head swatch in a 2:1 atlas.
source_image=next(n.image for m in obj.data.materials if m.use_nodes for n in m.node_tree.nodes if n.type=='TEX_IMAGE' and n.image)
w,h=source_image.size
body_pixels=np.array(source_image.pixels[:],dtype=np.float32).reshape(h,w,4)
head_pixels=np.empty_like(body_pixels)
# Continue the existing neck texture into the reference neck, fading it before
# the face. This removes the hard texture boundary without repainting the face.
grid=np.empty((96,128,3),dtype=np.float32)
for row in range(96):
 z=.815+.19*row/95
 blend=max(0,min(1,(z-.85)/.03));blend=blend*blend*(3-2*blend)
 base=np.array([.52,.61,.69])*(.97+.08*row/95)
 for col in range(128):
  angle=(col/127-.5)*2*math.pi
  near=original.find_nearest(Vector((math.sin(angle)*.034,-math.cos(angle)*.032,z)))
  color=base
  if near and blend<1:
   face=obj.data.polygons[near[2]];ids=list(face.vertices)[:3];loops=list(face.loop_indices)[:3]
   points=[obj.data.vertices[i].co for i in ids]
   uvs=[Vector((*obj.data.uv_layers.active.data[i].uv,0)) for i in loops]
   uv=barycentric_transform(near[0],*points,*uvs)
   color=body_pixels[min(h-1,max(0,int(uv.y*h))),min(w-1,max(0,int(uv.x*w))),:3]*(1-blend)+base*blend
  grid[row,col]=color
# Bilinear interpolation of the continuous cylindrical head chart.
for channel in range(3):
 horizontal=np.array([np.interp(np.linspace(0,127,w),np.arange(128),line[:,channel]) for line in grid])
 for col in range(w):head_pixels[:,col,channel]=np.interp(np.linspace(0,95,h),np.arange(96),horizontal[:,col])
head_pixels[:,:,3]=1
atlas=bpy.data.images.new('Continuous blue anatomy atlas',width=w,height=h*2,alpha=True)
atlas.pixels.foreach_set(np.concatenate([head_pixels,body_pixels],axis=0).ravel())
atlas.filepath_raw=str(out/'muscle-color.png');atlas.file_format='PNG';atlas.save();atlas.pack()
for loop in obj.data.uv_layers.active.data:loop.uv.y=.5+.5*loop.uv.y
for loop in head.data.loops:
 v=head.data.vertices[loop.vertex_index].co
 head.data.uv_layers.active.data[loop.index].uv=(.5+math.atan2(v.x,-v.y)/(2*math.pi),.005+.49*max(0,min(1,(v.z-.815)/.19)))
for mat in obj.data.materials:
 if mat.use_nodes:
  for node in mat.node_tree.nodes:
   if node.type=='TEX_IMAGE':node.image=atlas
cut(head.data,True,.855)
cut(obj.data,False,.825)
bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);head.select_set(True)
bpy.context.view_layer.objects.active=obj;bpy.ops.object.join()
# Stitch the two open neck rings instead of overlapping two separate surfaces.
bm=bmesh.new();bm.from_mesh(obj.data);uv_layer=bm.loops.layers.uv.active
lower=sorted([v for v in bm.verts if abs(v.co.z-.825)<1e-5],key=lambda v:math.atan2(v.co.x,-v.co.y))
upper=sorted([v for v in bm.verts if abs(v.co.z-.855)<1e-5],key=lambda v:math.atan2(v.co.x,-v.co.y))
if len(lower)<3 or len(upper)<3:raise RuntimeError('Missing neck boundary rings')
i=j=0
while i<len(lower) or j<len(upper):
 a=lower[i%len(lower)];b=upper[j%len(upper)]
 if i<len(lower) and (j==len(upper) or (i+1)/len(lower)<(j+1)/len(upper)):
  points=[a,lower[(i+1)%len(lower)],b];i+=1
 else:
  points=[a,upper[(j+1)%len(upper)],b];j+=1
 try:
  face=bm.faces.new(points)
  for loop in face.loops:
   v=loop.vert.co
   loop[uv_layer].uv=(.5+math.atan2(v.x,-v.y)/(2*math.pi),.005+.49*max(0,min(1,(v.z-.815)/.19)))
 except ValueError:pass
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(obj.data);bm.free();obj.data.update()
bpy.ops.object.shade_smooth()

skin=bpy.data.materials.get('Pulsaris translucent blue glass')
shell=obj.copy();shell.data=obj.data.copy();bpy.context.collection.objects.link(shell);shell.name='Translucent skin shell'
for v in shell.data.vertices:v.co+=v.normal*.0015
shell.data.materials.clear();shell.data.materials.append(skin)
for p in shell.data.polygons:p.material_index=0
bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);shell.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(out/'body-ai.glb'),export_format='GLB',use_selection=True)
muscle=True
source=(root/'scripts/prepare-ai-body.py').read_text()
exec(source[source.index('mesh = obj.data'):source.index('scene = bpy.context.scene')])
scene=bpy.context.scene
for angle in (0,90,180,270):
    a=math.radians(angle);cam=scene.camera;cam.data.ortho_scale=1.12
    cam.location=(math.sin(a)*2,-math.cos(a)*2,.53);cam.rotation_euler=(Vector((0,0,.5))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(out/f'body-{angle:03}.png');bpy.ops.render.render(write_still=True)
for angle in (0,45,90):
    a=math.radians(angle);cam.data.ortho_scale=.28
    cam.location=(math.sin(a)*2,-math.cos(a)*2,.915);cam.rotation_euler=(Vector((0,0,.915))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(out/f'face-{angle}.png');bpy.ops.render.render(write_still=True)
cam.data.ortho_scale=1.12
bpy.ops.wm.save_as_mainfile(filepath=str(out/'body-ai.blend'))
