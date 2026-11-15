"""Refine only facial topology and project it onto the accepted reference depth."""
import bpy,bmesh,math,json,base64,struct
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

root=Path(__file__).resolve().parents[1];out=root/'output/body-model-v11'
out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root/'output/body-model-v10/body-ai.blend'))
obj=next(o for o in bpy.context.scene.objects if o.type=='MESH' and o.name!='Translucent skin shell')
bpy.data.objects.remove(bpy.data.objects['Translucent skin shell'],do_unlink=True)
bm=bmesh.new();bm.from_mesh(obj.data)
edges=[e for e in bm.edges if all(v.co.z>.86 and v.co.y<-.005 for v in e.verts)]
bmesh.ops.subdivide_edges(bm,edges=edges,cuts=1,use_grid_fill=True)
bmesh.ops.triangulate(bm,faces=list(bm.faces));bm.to_mesh(obj.data);bm.free()
with bpy.data.libraries.load(str(root/'output/body-model-v2/body-ai.blend')) as (data,loaded):
    loaded.objects=[name for name in data.objects if name.startswith('Mesh')][:1]
reference=loaded.objects[0]
surface=BVHTree.FromPolygons([v.co for v in reference.data.vertices],[list(p.vertices) for p in reference.data.polygons])
def ease(t):
    t=max(0,min(1,t));return t*t*(3-2*t)
for v in obj.data.vertices:
    x,y,z=v.co
    if z<.858 or z>.975 or y>-.008:continue
    hit=surface.ray_cast(Vector((x,-1,z)),Vector((0,1,0)))
    if hit[0] is not None:
        w=ease((z-.858)/.015)*ease((.978-z)/.012)*ease((.056-abs(x))/.015)*ease((-y-.008)/.015)
        v.co.y=y*(1-w)+hit[0].y*w
bpy.data.objects.remove(reference,do_unlink=True);obj.data.update()
for p in obj.data.polygons:p.use_smooth=True
skin=bpy.data.materials.get('Unified translucent blue skin')
shell=obj.copy();shell.data=obj.data.copy();bpy.context.collection.objects.link(shell);shell.name='Translucent skin shell'
for v in shell.data.vertices:v.co+=v.normal*.0015
shell.data.materials.clear();shell.data.materials.append(skin)
for p in shell.data.polygons:p.material_index=0
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
def packed(values,kind):return base64.b64encode(struct.pack('<%d%s'%(len(values),kind),*values)).decode()
info=dict(source='Continuous local FLUX/TRELLIS body, locally refined facial topology and reference facial depth; high-resolution locally generated face texture.',vertices=len(positions),triangles=len(indices)//3,quant=q,halfWidth=max(abs(p[0]) for p in positions),positions=packed([round(c*q) for p in positions for c in p],'h'),normals=packed([round(c*q) for n in normals for c in n],'h'),indices=packed(indices,'H'),uv=packed([c for pair in uv for c in pair],'f'))
(out/'body-model-ai.json').write_text(json.dumps(info))
bpy.ops.wm.save_as_mainfile(filepath=str(out/'body-ai.blend'))
print('REFINED',len(positions),'vertices',len(indices)//3,'triangles')
