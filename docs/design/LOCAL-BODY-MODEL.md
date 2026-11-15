# Local AI body asset handoff

## Current approved direction: original model, opaque solid blue

The user explicitly stopped the anatomy refinement and requested the earlier model shown in their screenshot, in one opaque color. The app now uses the exact revision-2 geometry again (`output/body-model-v2/body-model-ai.json`) with a single opaque blue shader. Muscle textures, texture loading, transparent skin layers, head swaps and facial modifications are removed from the active rendering path. Drag-to-spin, rotation buttons and region picking remain. `output/body-model-solid/` contains the restored geometry, opaque `body-solid.glb`, editable `body-solid.blend` and a simple viewer. Build and all 17 tests pass. All anatomical refinement versions below are superseded experiments, not the active model. Do not resume them unless the user explicitly asks.

## Superseded: revision 10, continuous whole-body model

Revision 9 was rejected for its incompatible smooth head, neck join and material transition. It is superseded. The app now uses `output/body-model-v10/`, built by `scripts/build-coherent-body.py` from the original continuous revision-7 muscle mesh. Facial depth is projected onto the earlier reference surface along the front axis; existing X/Y-up coordinates, topology, UVs, body and neck remain unchanged. This retains the reference nose/lip depth without transplanting a head or cutting the neck. The same anatomical texture and surface material apply across the whole core, with a matching translucent shell across the entire body. No constant-color head swatch, UV transfer, neck bridge or face-color shader override remains.

Verified: original triangle indices and UV arrays match revision 7 exactly; all positions below 85% body height are unchanged; only face depth changes; indices and normal buffers are valid. The mesh has 44,040 UV-split vertices and 60,000 triangles. Whole-body front/profile renders and enlarged face-neck front, three-quarter and profile renders were inspected. The app shader was separately inspected at whole-body, head/neck/chest and profile scales before showing the result. Build and all 17 tests passed. `geometry-report.json` records the coherent construction. Package with `scripts/package-body-preview.py body-model-v10`.

## Superseded: revision 9, reference nose and lips restored

The user supplied `IMG_8215.png`, identifying the earlier revision-2 profile as the desired face shape. The app now uses `output/body-model-v9/`: the actual earlier head geometry, with intact nose, upper/lower lips and chin, on the revision-7 muscular body. The head uses a continuous matching blue atlas instead of the previous facial-muscle texture and moustache-like color band. The neck is stitched, subdivided and smoothed; artist normals are embedded so UV splits do not force independent normal recalculation. Rotation and chest corrections remain intact. `scripts/restore-reference-face.py` builds the reference head assembly; the revision directory also contains neck finishing, texture-packing and normal-export scripts. `scripts/package-body-preview.py body-model-v9` packages its offline texture and close-up viewer, including Face and Profile buttons. Enlarged front and profile views were inspected. Revision 8 was an abandoned lip-sculpt experiment and was not integrated.

## Base: revision 7, enlarged artifact corrections

Revision 6 was insufficient in the user's enlarged screenshots. `output/body-model-v7/` is now integrated. A broader local mouth smoothing/texture repair removes the curved upper-lip band; a subtle closed-mouth seam restores a mouth without the moustache-like outline. The chest receives 32 locally weighted smoothing passes per nipple region, plus targeted texture cleanup, reducing the raised tips while retaining the pectoral volumes. Existing style, palette, muscle detail, and rotation are retained. The interactive preview includes Face, Chest and Full body inspection buttons and starts at face close-up. Both enlarged views were inspected. Build and all 17 tests passed. The GLB and Blender source contain the repaired texture and corrected geometry.

## Superseded: revision 6, upper lip cleanup

`output/body-model-v6/` is integrated in the app. Starting from revision 5, only the upper lip receives a locally weighted smoothing pass and a feathered texture repair sampled from adjacent cheeks. This removes the generated moustache-like dark band without changing the face material or replacing the head. UV-space triangle rasterization confines the texture edit to that surface region. The offline app embeds a high-quality JPEG version of the repaired texture; the GLB and Blender source include the repaired texture too. Full-body views and a face close-up are provided. `scripts/clean-body-lips.py` reproduces the targeted edit. Production build passed.

## Base: revision 5, preserve original style

Revision 4 was rejected: its transplanted head changed the style/color and its fixed-depth chest adjustment produced dents. It is superseded. The app now uses `output/body-model-v5/`, rebuilt from revision 3 with its original materials, textures and head. The face receives only three gentle, locally weighted smoothing passes. Chest and knee tips are reduced toward a quadratic surface fitted to a surrounding ring of vertices; modified vertices remain above that fitted surface, avoiding the previous arbitrary-depth indentation. The correction affects 50 chest vertices, 154 knee vertices and 1,109 facial vertices. No face-color override remains in the app shader. Front, side and interactive views were inspected; production build and all 17 tests pass.

## Superseded: revision 4, shape corrections

`output/body-model-v4/` is the current asset set, integrated in the app. The neutral head from revision 2 replaces the distorted facial surface with a blended neck transition. The face uses quiet blue shading instead of the exposed facial-muscle map. Targeted vertex corrections flatten the nipple tips and recess pointed patellae, preserving surrounding muscle volumes and all UVs. Both the muscle core and skin shell include the corrections. `scripts/refine-body-anatomy.py` reproduces these edits from the saved revision 3 Blender source; `corrections.json` records affected vertices. Front and side renders were inspected, production build passed, and all 17 tests passed.

## Base: revision 3, muscles beneath skin

The user clarified that “translucent” means visible muscle structure beneath skin, rather than seeing the background through the body. Revision 3 is a new local FLUX.2 Klein muscular anatomy image (seed 9170), reconstructed by TRELLIS 2 as `E:/AI/output/pulsaris/body-3d_00002.glb`. It preserves a 2048px blue muscle/tendon texture and UV seams. Assets and four review views are in `output/body-model-v3/`; the app geometry includes embedded texture and UV data.

The app now draws an opaque, textured muscle core with depth writes, followed by an offset translucent blue shell. This prevents far-side silhouettes from showing through the body. Both layers share rotation and region selection. The separate shell is also included in the GLB and Blender source. This generated anatomy is illustrative, not an anatomically validated teaching model. No separate organs or skeleton are present.

Run `scripts/local-body-generate.py muscle` for image candidates, then its `mesh` mode with the chosen generated filename. Run `scripts/prepare-ai-body.py` with an additional final `muscle` argument to preserve the anatomy texture and export both layers. `scripts/build-body-preview.py` builds the self-contained interactive review from the same fragment shader as the app.

Earlier revision notes follow for provenance.

The app now uses the locally generated mesh in `src/data/body-model.json` through `src/ui/Body3D.tsx`. It is a full 3D body, with unlimited horizontal drag rotation, rotation buttons, raycast region picking, accessible region buttons, and the existing WebGL fallback.

## Generation

- Reference: the blue full-body figure in the supplied Pulsaris tablet concept.
- Image generation: local FLUX.2 Klein 4B FP8, seeds 9070 and 9071; selected 9071.
- Reconstruction: local TRELLIS 2 INT8, 1024 resolution.
- Hardware: AMD Radeon RX 9070 XT, ROCm PyTorch 2.13.0. GPU numerical correctness checks passed.
- ComfyUI: existing installation at `E:/AI/ComfyUI`, localhost port 8188. No hosted image/3D generation or Claude grading was used.
- Blender revision 2: merge coincident vertices, gently smooth reconstruction noise, decimate and polish; 29,997 vertices / 60,000 triangles. Reduced smoothing preserves abdominal, chest, face and limb definition.

## Files

`output/body-model/` contains the selected source PNG, exact submitted ComfyUI workflows and job IDs, normalized `body-ai.glb`, editable `body-ai.blend`, app geometry, four transparent PNG renders at 0/90/180/270 degrees, and a backup of the previous MakeHuman geometry.

The original high-resolution reconstruction is `E:/AI/output/pulsaris/body-3d_00001.glb`. The current revision is in `output/body-model-v2/`, including GLB, Blender source, geometry, renders and interactive preview. The first version remains in `output/body-model/`. The app embeds quantized geometry for its existing offline single-file build and computes smooth normals itself; no GLB loader or external service is required.

## Reproduce

With ComfyUI running, use its Python interpreter:

```powershell
& E:/AI/ComfyUI/venv/Scripts/python.exe scripts/local-body-generate.py image
& E:/AI/ComfyUI/venv/Scripts/python.exe scripts/local-body-generate.py mesh 'pulsaris/body-s9071_00001_.png [output]'
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --python scripts/prepare-ai-body.py -- E:/AI/output/pulsaris/body-3d_00001.glb C:/Users/altai/.t3/projects/orion-nasa-space-apps/output/body-model
```

ComfyUI queues asynchronously: wait for each image/mesh job to finish before running the dependent command. Repeated jobs receive incrementing output filenames; adjust the input filename accordingly. Review the four renders before copying `body-model-ai.json` into `src/data/body-model.json`.

## Visual decisions and limits

Revision 2 uses actual alpha blending in the app: back faces render first at low opacity, front faces use view-dependent transparency with brighter and more opaque edges. Depth writes are disabled on these two surface passes; picking still uses the front mesh. Contrast lighting and reduced smoothing retain muscle definition. The GLB/Blender material uses transmission 0.68, IOR 1.32 and roughness 0.19. The app's lightweight shader approximates translucent skin without physical refraction. Amber markers remain localized. The generated hands and face remain simplified; no internal organs were generated. This is an illustrative body-system navigation asset, not patient anatomy or measured organ data.

Validation: inspected front, side and back renders; TypeScript check and all 17 existing tests passed. The production build is checked after integrating the geometry. Live browser interaction has not been manually verified in this pass.
