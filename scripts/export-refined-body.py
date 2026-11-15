"""Attach the verified final albedo and export the refined portable asset + renders."""
import bpy,math
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1];out=root/'output/body-model-v11'
bpy.ops.wm.open_mainfile(filepath=str(out/'body-ai.blend'))
image=bpy.data.images.load(str(out/'muscle-color.jpg'),check_existing=False);image.pack()
obj=next(o for o in bpy.context.scene.objects if o.type=='MESH' and o.name!='Translucent skin shell')
for material in obj.data.materials:
    for node in material.node_tree.nodes:
        if node.type=='TEX_IMAGE':node.image=image
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.context.scene.objects:
    if o.type=='MESH':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(out/'body-ai.glb'),export_format='GLB',use_selection=True)
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
