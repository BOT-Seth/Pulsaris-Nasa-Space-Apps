"""Local RX 9070 XT workflow. No hosted image or 3D APIs.
Run with E:/AI/ComfyUI/venv/Scripts/python.exe; mode: image or mesh.
"""
import json
import sys
import urllib.request
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/body-model'
OUT.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, 'E:/AI')
import queue_flux_props

def submit(graph, name):
    (OUT / (name + '-workflow.json')).write_text(json.dumps(graph, indent=2))
    req = urllib.request.Request('http://127.0.0.1:8188/prompt', json.dumps({'prompt': graph}).encode(), {'Content-Type': 'application/json'})
    try:
        result = json.load(urllib.request.urlopen(req, timeout=30))
    except urllib.error.HTTPError as e:
        print(e.read().decode())
        raise
    (OUT / (name + '-job.json')).write_text(json.dumps(result, indent=2))
    print(result)

if sys.argv[1] == 'muscle':
    for seed in (9170, 9171):
        g = queue_flux_props.graph('body', seed, prefix=f'pulsaris/muscle-s{seed}')
        g['4']['inputs']['image'] = g['5']['inputs']['image'] = 'pulsaris-body-reference.png'
        g['9']['inputs']['text'] = ('A full body anatomical muscular system teaching model, in the exact standing pose and proportions of the reference. '
            'Skin removed to reveal all superficial muscle groups, detailed individual muscle bundles with fine longitudinal striated fibers, '
            'distinct pectoralis major, deltoids, biceps, serratus anterior, segmented rectus abdominis, obliques, quadriceps and calf muscles. '
            'Pale ivory connective tendons separating the steel blue muscle groups. Clear deeply defined separation between muscles. '
            'Entire figure monochromatic cool blue and white, polished scientific medical visualization. '
            'Bald head with facial muscle anatomy, relaxed arms slightly separated from torso, separate legs, accurate hands and feet. '
            'Opaque solid anatomical sculpture for 3D reconstruction, frontal orthographic view, full body head to toes centered, '
            'plain white background. No glass, no transparency, no blood, no wounds, no red colors, no labels, no text, no pedestal.')
        g['17']['inputs'].update(width=768, height=1280)
        g['18']['inputs'].update(width=768, height=1280)
        submit(g, f'muscle-{seed}')
elif sys.argv[1] == 'image':
    ref = Image.open(r'C:/Users/altai/.t3/userdata/attachments/823ad673-418c-4859-8982-ed9cb782c5d1-7dceb9c5-6d62-4ab1-94ad-79e59cfa3f1f.png')
    ref.crop((277, 505, 395, 779)).resize((448, 1024)).save('E:/AI/ComfyUI/input/pulsaris-body-reference.png')
    for seed in (9070, 9071):
        g = queue_flux_props.graph('body', seed, prefix=f'pulsaris/body-s{seed}')
        g['4']['inputs']['image'] = g['5']['inputs']['image'] = 'pulsaris-body-reference.png'
        g['9']['inputs']['text'] = ('Recreate the single full-body human medical mannequin from the reference as a clean high resolution 3D studio render. '
            'One adult anatomically proportioned androgynous athletic human figure, bald smooth neutral face, accurate hands and feet, '
            'standing straight facing the camera, arms relaxed slightly away from torso, hands beside upper thighs, legs slightly separated. '
            'Smooth opaque pale steel blue resin with sculpted anatomical muscle definition, subtle ivory blue highlights. '
            'Medical visualization mannequin, smooth modest featureless pelvis, no clothing. Entire body visible head to toes, centered symmetrical front view. '
            'Plain white background. Remove all orange markers, dots, glows, text, labels, UI, lines and icons. No pedestal, no extra objects.')
        g['17']['inputs'].update(width=768, height=1280)
        g['18']['inputs'].update(width=768, height=1280)
        submit(g, f'image-{seed}')
elif sys.argv[1] == 'mesh':
    g = json.loads(Path('E:/AI/ComfyUI/input/api_trellis2_image_to_3d.json').read_text())
    g['122']['inputs']['image'] = sys.argv[2]
    g['322']['inputs']['filename_prefix'] = 'pulsaris/body-3d'
    g['94']['inputs']['target_resolution'] = 1024
    submit(g, 'mesh')
