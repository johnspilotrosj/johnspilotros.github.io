import cv2,numpy as np,sys
from PIL import Image
S=sys.argv[1]; H,W=4096,8192; F=2048; tf=np.tan(np.radians(72))
def canvas(p):
    t=Image.open(p); xo=int(round(t.tag_v2.get(286,0)*150)); yo=int(round(t.tag_v2.get(287,0)*150))
    im=cv2.imread(p,cv2.IMREAD_UNCHANGED); c=np.zeros((H,W,4),np.uint8)
    h,w=im.shape[:2]; c[yo:yo+h,xo:xo+w]=im[:H-yo,:W-xo]; return c
def face(c,er):
    u=np.linspace(-tf,tf,F); U,V=np.meshgrid(u,u); dx,dy,dz=U,-np.ones_like(U),-V
    n=np.sqrt(dx**2+dy**2+dz**2); lat=np.arcsin(dy/n); lon=np.arctan2(dx,dz)
    mx=((lon+np.pi)/(2*np.pi)*W-.5).astype(np.float32); my=((np.pi/2-lat)/np.pi*H-.5).astype(np.float32)
    a=cv2.erode((c[...,3]>250).astype(np.uint8),np.ones((er,er),np.uint8))
    return cv2.remap(c[...,:3],mx,my,cv2.INTER_LINEAR,borderMode=cv2.BORDER_WRAP),cv2.remap(a,mx,my,cv2.INTER_NEAREST,borderMode=cv2.BORDER_WRAP)
A=canvas(S+'/stitch/pano2.tif'); B=canvas(S+'/floorB/B.tif')
fA,mA=face(A,15); fB,mB=face(B,9)
sift=cv2.SIFT_create(10000); bf=cv2.BFMatcher()
ga=cv2.cvtColor(fA,cv2.COLOR_BGR2GRAY); gb=cv2.cvtColor(fB,cv2.COLOR_BGR2GRAY)
ka,da=sift.detectAndCompute(ga,mA*255); kb,db=sift.detectAndCompute(gb,mB*255)
m=[x for x,y in bf.knnMatch(db,da,k=2) if x.distance<0.8*y.distance]
P=np.float32([kb[x.queryIdx].pt for x in m]); Q=np.float32([ka[x.trainIdx].pt for x in m])
Hm,inl=cv2.findHomography(P,Q,cv2.RANSAC,5.0,maxIters=20000); inl=inl.ravel()>0
e=np.linalg.norm(cv2.perspectiveTransform(P[inl][None],Hm)[0]-Q[inl],axis=1)
print(f'matches {len(m)}, homography inliers {inl.sum()}, median err {np.median(e):.2f}px, p90 {np.percentile(e,90):.2f}px (face 2048px)')
np.save(S+'/floorB/H.npy',Hm)
wB=cv2.warpPerspective(fB,Hm,(F,F)); wm=cv2.warpPerspective(mB,Hm,(F,F),flags=cv2.INTER_NEAREST)
ov=(wm>0)&(mA>0)
g=np.median(fA[ov].astype(np.float32),0)/np.maximum(np.median(wB[ov].astype(np.float32),0),1); print('gain',g.round(3),'overlap px',ov.sum())
viz=fA.copy(); hole=(mA==0)&(wm>0); viz[hole]=np.clip(wB[hole]*g,0,255).astype(np.uint8)
cv2.imwrite(S+'/floorB/check.jpg',cv2.resize(np.hstack([fA,viz]),(2048,1024)))
print('nadir face hole px before %d, newly covered %d'%((mA==0).sum(),hole.sum()))
