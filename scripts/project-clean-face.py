"""Project a locally generated sharp face reference into the existing body UV atlas."""
import base64,json,shutil
from pathlib import Path
import numpy as np
from PIL import Image

root=Path(__file__).resolve().parents[1];out=root/'output/body-model-v11'
model=json.loads((out/'body-model-ai.json').read_text())
def data(key,dtype):return np.frombuffer(base64.b64decode(model[key]),dtype=dtype)
pos=data('positions','<i2').reshape(-1,3)/model['quant']
normals=data('normals','<i2').reshape(-1,3)/model['quant']
uv=data('uv','<f4').reshape(-1,2);triangles=data('indices','<u2').reshape(-1,3)
image=Image.open(root/'output/body-model-v10/muscle-color.png').convert('RGB').resize((4096,4096),Image.Resampling.LANCZOS)
atlas=np.array(image).astype(np.float32)/255;h,w=atlas.shape[:2]
painted=np.zeros((h,w),dtype=bool)
source=Path('E:/AI/output/pulsaris/face-clean-hi-s9270_00001_.png')
shutil.copyfile(source,out/'clean-face-source.png')
photo=np.asarray(Image.open(source).convert('RGB')).astype(np.float32)/255;ph,pw=photo.shape[:2]
# Remove left/right baked illumination before the app's own light is applied.
photo=(photo+photo[:,::-1])*.5
def projected(points):
    sx=(.5+points[:,0]/(.32*2/3)*1.10)*(pw-1)
    sy=np.interp(points[:,1],[.82,.85,.86,.875,.882,.895,.904,.93,.95,.98,1.0],[1250,1020,940,835,795,730,690,540,440,260,150])
    sx=np.clip(sx,0,pw-1.001);sy=np.clip(sy,0,ph-1.001)
    ix=sx.astype(int);iy=sy.astype(int);fx=(sx-ix)[:,None];fy=(sy-iy)[:,None]
    return (photo[iy,ix]*(1-fx)+photo[iy,ix+1]*fx)*(1-fy)+(photo[iy+1,ix]*(1-fx)+photo[iy+1,ix+1]*fx)*fy
selection=(pos[:,1]>.89)&(pos[:,1]<.92)&(abs(pos[:,0])>.02)&(abs(pos[:,0])<.039)&(pos[:,2]>.02)
sample_uv=uv[selection];old=atlas[(1-sample_uv[:,1]).clip(0,.9999).__mul__(h-1).astype(int),(sample_uv[:,0].clip(0,.9999)*(w-1)).astype(int)]
ratio=np.clip(np.median(old,axis=0)/np.maximum(.01,np.median(projected(pos[selection]),axis=0)),.85,1.15)
def ease(a):
    a=np.clip(a,0,1);return a*a*(3-2*a)
pixels=0
for tri in triangles:
    points=pos[tri]
    if points[:,1].max()<.843 or points[:,2].max()<.005:continue
    chart=uv[tri]*[w-1,h-1]
    lo=np.maximum(0,np.floor(chart.min(axis=0)).astype(int));hi=np.minimum([w-1,h-1],np.ceil(chart.max(axis=0)).astype(int))
    xx,yy=np.meshgrid(np.arange(lo[0],hi[0]+1),np.arange(lo[1],hi[1]+1));target=np.stack([xx.ravel(),yy.ravel()],axis=1)
    matrix=np.column_stack([chart[1]-chart[0],chart[2]-chart[0]])
    if abs(np.linalg.det(matrix))<1e-7:continue
    ab=(target-chart[0])@np.linalg.inv(matrix).T;bary=np.column_stack([1-ab.sum(axis=1),ab]);world=bary@points;n=bary@normals[tri]
    weight=ease((world[:,1]-.843)/.025)*ease((.080-abs(world[:,0]))/.015)*ease((world[:,2]+.018)/.040)*ease((n[:,2]+.30)/.80)
    mask=(bary.min(axis=1)>=-.001)&(weight>.001)
    if not mask.any():continue
    target=target[mask];world=world[mask];weight=weight[mask,None]
    color=np.clip(projected(world)*ratio,0,1)
    # Prevent old double-lit black patches from being baked into the new albedo.
    color=np.maximum(color,np.array([.18,.23,.28]))
    original=atlas[h-1-target[:,1],target[:,0]]
    atlas[h-1-target[:,1],target[:,0]]=original*(1-weight)+color*weight
    painted[h-1-target[:,1],target[:,0]]=True
    pixels+=len(target)
from scipy.ndimage import distance_transform_edt
distance,nearest=distance_transform_edt(~painted,return_indices=True)
gutter=(distance>0)&(distance<=3)
atlas[gutter]=atlas[nearest[0][gutter],nearest[1][gutter]]
Image.fromarray((atlas.clip(0,1)*255).astype('uint8')).save(out/'muscle-color.png')
(out/'texture-report.json').write_text(json.dumps(dict(source=str(source),atlasSize=[w,h],projectedPixels=pixels,paletteRatios=ratio.tolist(),mode='registered frontal projection, feathered into unchanged original UV atlas'),indent=2))
print('PROJECTED',pixels,'pixels; palette ratios',ratio)
