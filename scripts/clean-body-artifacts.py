"""Remove the generated upper-lip dark band without replacing the head."""
import base64, json, math, struct
from pathlib import Path
import bpy
import numpy as np
from mathutils import Vector

root=Path(__file__).resolve().parents[1]
out=root/'output/body-model-v7'
out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root/'output/body-model-v5/body-ai.blend'))
obj=next(o for o in bpy.context.scene.objects if o.type=='MESH' and o.name!='Translucent skin shell')
bpy.data.objects.remove(bpy.data.objects['Translucent skin shell'],do_unlink=True)
bpy.context.view_layer.objects.active=obj
# Smooth the actual raised surface over a broad supported area, not a fixed-depth cut.
for name,cx,cz,rx,rz,factor,iterations in [
 ('Mouth ridge',0,.885,.029,.016,.5,12),
 ('Left chest tip',-.062,.706,.018,.018,.65,32),
 ('Right chest tip',.062,.706,.018,.018,.65,32),
]:
 group=obj.vertex_groups.new(name=name)
 for v in obj.data.vertices:
  x,y,z=v.co;r=((x-cx)/rx)**2+((z-cz)/rz)**2
  if r<1 and y<-.035:group.add([v.index],min(1,(1-r)*2),'REPLACE')
 mod=obj.modifiers.new(name,'SMOOTH');mod.vertex_group=group.name;mod.factor=factor;mod.iterations=iterations
 bpy.ops.object.modifier_apply(modifier=mod.name)
mesh=obj.data;mesh.calc_loop_triangles()
source_image=next(node.image for mat in mesh.materials if mat.use_nodes for node in mat.node_tree.nodes if node.type=='TEX_IMAGE' and node.image)
w,h=source_image.size
pixels=np.array(source_image.pixels[:],dtype=np.float32).reshape(h,w,4)
image=bpy.data.images.new('Clean upper lip anatomy',width=w,height=h,alpha=True)
original=pixels.copy()
layer=mesh.uv_layers.active.data
# Paint only the lips and nipple artifacts, matching nearby blue tissue.
regions=[(0,.885,.030,.016),(-.062,.706,.009,.009),(.062,.706,.009,.009)]
colors=[]
for cx,cz,rx,rz in regions:
 samples=[]
 for loop in mesh.loops:
  p=mesh.vertices[loop.vertex_index].co
  r=((p.x-cx)/rx)**2+((p.z-cz)/rz)**2
  if 1.1<r<2.5 and p.y<-.04:
   uv=layer[loop.index].uv;samples.append(original[min(h-1,int(uv.y*h)),min(w-1,int(uv.x*w)),:3])
 colors.append(np.median(samples,axis=0))
painted=0
for tri in mesh.loop_triangles:
 pos=np.array([tuple(mesh.vertices[i].co) for i in tri.vertices])
 if pos[:,1].min()>-.035:continue
 for (cx,cz,rx,rz),color in zip(regions,colors):
  if pos[:,0].min()>cx+rx or pos[:,0].max()<cx-rx or pos[:,2].min()>cz+rz or pos[:,2].max()<cz-rz:continue
  uv=np.array([tuple(layer[i].uv) for i in tri.loops])*[w-1,h-1]
  lo=np.maximum(0,np.floor(uv.min(axis=0)).astype(int));hi=np.minimum([w-1,h-1],np.ceil(uv.max(axis=0)).astype(int))
  xx,yy=np.meshgrid(np.arange(lo[0],hi[0]+1),np.arange(lo[1],hi[1]+1));points=np.stack([xx.ravel(),yy.ravel()],axis=1)
  matrix=np.column_stack([uv[1]-uv[0],uv[2]-uv[0]])
  if abs(np.linalg.det(matrix))<1e-7:continue
  ab=(points-uv[0])@np.linalg.inv(matrix).T;bary=np.column_stack([1-ab.sum(axis=1),ab]);world=bary@pos
  radius=((world[:,0]-cx)/rx)**2+((world[:,2]-cz)/rz)**2
  mask=(bary.min(axis=1)>=-.001)&(radius<1)&(world[:,1]<-.035)
  if not mask.any():continue
  pt=points[mask];weight=np.clip((1-radius[mask])*3,0,1);weight=weight*weight*(3-2*weight)
  old=original[pt[:,1],pt[:,0],:3];pixels[pt[:,1],pt[:,0],:3]=old*(1-weight[:,None])+color*weight[:,None];painted+=len(pt)
color=colors[0]
image.pixels.foreach_set(pixels.ravel())
image.filepath_raw=str(out/'muscle-color.png');image.file_format='PNG';image.save();image.pack()
for mat in mesh.materials:
    if mat.use_nodes:
        for node in mat.node_tree.nodes:
            if node.type=='TEX_IMAGE':node.image=image
skin=bpy.data.materials.get('Pulsaris translucent blue glass')
shell=obj.copy();shell.data=mesh.copy();bpy.context.collection.objects.link(shell);shell.name='Translucent skin shell'
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
    cam.location=(math.sin(a)*2,-math.cos(a)*2,.53)
    cam.rotation_euler=(Vector((0,0,.5))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(out/f'body-{angle:03}.png');bpy.ops.render.render(write_still=True)
cam.data.ortho_scale=.20;cam.location=(0,-2,.915)
cam.rotation_euler=(Vector((0,0,.915))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(out/'face-detail.png');bpy.ops.render.render(write_still=True)
cam.data.ortho_scale=.23;cam.location=(0,-2,.723)
cam.rotation_euler=(Vector((0,0,.723))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(out/'chest-detail.png');bpy.ops.render.render(write_still=True)
cam.data.ortho_scale=1.12
bpy.ops.wm.save_as_mainfile(filepath=str(out/'body-ai.blend'))
print('UPPER LIP TEXTURE PIXELS',painted,'MATCHED COLOR',color)
