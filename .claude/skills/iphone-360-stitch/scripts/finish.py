import cv2,numpy as np
from PIL import Image
t=Image.open('pano2.tif'); xo=int(round(t.tag_v2.get(286,0)*150)); yo=int(round(t.tag_v2.get(287,0)*150))
im=cv2.imread('pano2.tif',cv2.IMREAD_UNCHANGED); H,W=4096,8192
can=np.zeros((H,W,4),np.uint8); can[yo:yo+im.shape[0],xo:xo+im.shape[1]]=im
img=can[...,:3].astype(np.float32); alpha=(can[...,3]>250).astype(np.uint8)
alpha=cv2.erode(alpha,np.ones((41,41),np.uint8))
lat_r=np.pi/2-(np.arange(H)+.5)/H*np.pi; lon_r=(np.arange(W)+.5)/W*2*np.pi-np.pi
def pp(I,M):
    if min(I.shape[:2])<8:
        m=(I*M[...,None]).sum((0,1))/max(M.sum(),1e-6); return np.where(M[...,None]>0,I,m)
    Md=cv2.pyrDown(M); Id=cv2.pyrDown(I*M[...,None])/np.maximum(Md,1e-6)[...,None]
    C=pp(Id,(Md>1e-3).astype(np.float32))
    up=cv2.pyrUp(C,dstsize=(I.shape[1],I.shape[0]))
    return I*M[...,None]+up*(1-M[...,None])
out=img.copy(); F=2048; tf=np.tan(np.radians(70))
for sign in (1,-1):
    u=np.linspace(-tf,tf,F); U,V=np.meshgrid(u,u)
    dx,dy,dz=U,np.full_like(U,sign*1.0),V*sign
    n=np.sqrt(dx**2+dy**2+dz**2); lat=np.arcsin(dy/n); lon=np.arctan2(dx,dz)
    mx=((lon+np.pi)/(2*np.pi)*W-.5).astype(np.float32); my=((np.pi/2-lat)/np.pi*H-.5).astype(np.float32)
    face=cv2.remap(img,mx,my,cv2.INTER_LINEAR,borderMode=cv2.BORDER_WRAP)
    fm=cv2.remap(alpha.astype(np.float32),mx,my,cv2.INTER_NEAREST,borderMode=cv2.BORDER_WRAP)
    fmk=cv2.erode((fm>0.5).astype(np.uint8),np.ones((3,3),np.uint8),iterations=6).astype(np.float32); filled=pp(face,fmk); fm=fmk
    hole=(fm<0.5).astype(np.uint8); smooth=cv2.GaussianBlur(filled,(0,0),6)
    filled=np.where(hole[...,None]>0,smooth,filled)
    # back to equirect cap rows
    rows=np.where(sign*lat_r>15*np.pi/180)[0]
    LON,LAT=np.meshgrid(lon_r,lat_r[rows])
    ex,ey,ez=np.cos(LAT)*np.sin(LON),np.sin(LAT),np.cos(LAT)*np.cos(LON)
    fu=(ex/(ey*sign))/tf; fv=(ez/ey)/tf  # sign*ez/(sign*ey)
    px=((fu+1)/2*(F-1)).astype(np.float32); py=((fv+1)/2*(F-1)).astype(np.float32)
    out[rows]=cv2.remap(filled,px,py,cv2.INTER_LINEAR,borderMode=cv2.BORDER_REPLICATE)*(1)  # cap content
    out[rows]=np.where(alpha[rows,:,None]>0,img[rows],out[rows])
a=cv2.GaussianBlur(cv2.erode(alpha,np.ones((101,101),np.uint8)).astype(np.float32),(0,0),14)[...,None]
final=img*a+out*(1-a)
grain=np.random.default_rng(1).normal(0,1.2,final.shape).astype(np.float32)*(1-a)
final=np.clip(final+grain,0,255).astype(np.uint8)
small=cv2.resize(final,(4096,2048),interpolation=cv2.INTER_AREA)
cv2.imwrite('../out/pano_4096.jpg',small,[cv2.IMWRITE_JPEG_QUALITY,80])
raw=cv2.resize((img*alpha[...,None]).astype(np.uint8),(4096,2048),interpolation=cv2.INTER_AREA)
cv2.imwrite('../out/pano_4096_real_pixels_only.jpg',raw,[cv2.IMWRITE_JPEG_QUALITY,80])
cv2.imwrite('../out/preview.jpg',cv2.resize(small,(2000,1000),interpolation=cv2.INTER_AREA),[cv2.IMWRITE_JPEG_QUALITY,85])
w=np.cos(lat_r)[:,None]; print('real-pixel coverage of sphere: %.1f%%'%(100*(alpha*w).sum()/(w.sum()*W)))
