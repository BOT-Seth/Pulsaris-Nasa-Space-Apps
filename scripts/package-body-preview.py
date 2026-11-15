"""Package a completed body revision for the offline app and close-up review."""
from pathlib import Path
from PIL import Image
import base64,json,re,sys

root=Path(__file__).resolve().parents[1]
out=root/'output'/sys.argv[1]
Image.open(out/'muscle-color.png').convert('RGB').save(out/'muscle-color.jpg',quality=94,subsampling=0)
model=json.loads((out/'body-model-ai.json').read_text())
model['texture']='data:image/jpeg;base64,'+base64.b64encode((out/'muscle-color.jpg').read_bytes()).decode()
(out/'body-model-ai.json').write_text(json.dumps(model))
html=(root/'output/body-model-v7/interactive-preview.html').read_text(encoding='utf-8')
html=re.sub(r'const model=.*?;const cv=',lambda _:'const model='+json.dumps(model)+';const cv=',html,count=1,flags=re.S)
html=html.replace('for(let i=0;i<n.length;i+=3)', "if(model.normals)n.set(Float32Array.from(decode(model.normals,Int16Array),v=>v/model.quant));for(let i=0;i<n.length;i+=3)")
html=re.sub(r'<button id="left">.*?</button>','<button id="left">Left</button>',html)
html=re.sub(r'<button id="right">.*?</button>','<button id="right">Right</button>',html)
html=html.replace('Drag to spin 360?','Drag to spin 360&deg;')
html=html.replace('<button id="face">Face</button>','<button id="face">Face</button><button id="profile">Profile</button>')
html=html.replace("document.querySelector('#left').onclick", "document.querySelector('#profile').onclick=()=>{zoom=5;centerY=.915;angle=Math.PI/2;auto=false};document.querySelector('#left').onclick")
(out/'interactive-preview.html').write_text(html,encoding='utf-8')
(out/'profile-preview.html').write_text(html.replace('let angle=0,auto=false','let angle=1.570796,auto=false'),encoding='utf-8')
(out/'qa-full.html').write_text(html.replace('let zoom=5,centerY=.915','let zoom=1,centerY=.5'),encoding='utf-8')
(out/'qa-neck.html').write_text(html.replace('let zoom=5,centerY=.915','let zoom=3,centerY=.875'),encoding='utf-8')
(out/'qa-profile.html').write_text(html.replace('let zoom=5,centerY=.915','let zoom=3,centerY=.875').replace('let angle=0,auto=false','let angle=1.570796,auto=false'),encoding='utf-8')
print(model['vertices'],'vertices',model['triangles'],'triangles')
