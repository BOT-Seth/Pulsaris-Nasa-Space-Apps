"""Build a self-contained rotatable preview using the app's actual fragment shader."""
import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
out = root / ('output/' + (sys.argv[1] if len(sys.argv) > 1 else 'body-model-v3'))
s = (root/'output/body-model/interactive-preview.html').read_text(encoding='utf-8')
model = (out/'body-model-ai.json').read_text()
s = re.sub(r'const model=.*?;const cv=', lambda _: 'const model='+model+';const cv=', s, count=1, flags=re.S)
s = s.replace('varying vec3 N;varying vec3 V;', 'uniform float uShell;varying vec2 vUv;attribute vec2 uv;varying vec3 vN;varying vec3 vV;varying vec3 vPos;varying float vRegion;')
s = s.replace('r*(p-vec3(0.,.5,0.))', 'r*(p+normal*uShell*.0015-vec3(0.,.5,0.))')
s = s.replace('N=r*normal;V=v;', 'vN=r*normal;vV=vec3(0.,0.,1.);vPos=p;vUv=uv;vRegion=-10.;')
source = (root/'src/ui/Body3D.tsx').read_text()
frag = re.search(r'const FRAG = /\* glsl \*/ `(.*?)`;', source, re.S).group(1)
s = re.sub(r'shader\(gl.FRAGMENT_SHADER,`.*?`\)', lambda _: 'shader(gl.FRAGMENT_SHADER,`'+frag+'`)', s, count=1, flags=re.S)
s = s.replace("['normal',n]", "['normal',n],['uv',decode(model.uv,Float32Array)]")
s = s.replace('gl.vertexAttribPointer(a,3,', "gl.vertexAttribPointer(a,name==='uv'?2:3,")
s = s.replace('let b=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b);', '''const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([120,160,190,255]));const im=new Image();im.onload=()=>{gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);gl.generateMipmap(gl.TEXTURE_2D);gl.uniform1f(gl.getUniformLocation(prog,'uHasTexture'),1)};im.src=model.texture;
let b=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b);''')
s = s.replace('gl.drawElements(gl.TRIANGLES,idx.length,gl.UNSIGNED_SHORT,0);', '''gl.uniform1f(gl.getUniformLocation(prog,'uSel'),-1);gl.uniform1f(gl.getUniformLocation(prog,'uHover'),-1);gl.disable(gl.BLEND);gl.depthMask(true);gl.uniform1f(gl.getUniformLocation(prog,'uShell'),0);gl.drawElements(gl.TRIANGLES,idx.length,gl.UNSIGNED_SHORT,0);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.uniform1f(gl.getUniformLocation(prog,'uShell'),1);gl.drawElements(gl.TRIANGLES,idx.length,gl.UNSIGNED_SHORT,0);gl.depthMask(true);''')
s = s.replace('background:var(--card);', 'background:linear-gradient(135deg,#f7f5f2,#e4ebef);')
s = s.replace('↶ Rotate','Left').replace('Rotate ↷','Right')
(out/'interactive-preview.html').write_text(s,encoding='utf-8')
