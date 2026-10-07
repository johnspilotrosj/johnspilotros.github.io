import cv2,numpy as np,sys
from PIL import Image
S=sys.argv[1]; exec(open(S+'/scripts/floor_h.py').read().split("sift=cv2.SIFT_create")[0].replace("S=sys.argv[1]; ",""))
Hm=np.load(S+'/floorB/H.npy')
wB=cv2.warpPerspective(fB,Hm,(F,F)).astype(np.float32); wm=cv2.warpPerspective(mB,Hm,(F,F),flags=cv2.INTER_NEAREST)
wm=cv2.erode(wm,np.ones((5,5),np.uint8))
ov=(wm>0)&(mA>0); g=np.median(fA[ov].astype(np.float32),0)/np.maximum(np.median(wB[ov],0),1); wB*=g
wa=cv2.GaussianBlur(cv2.erode(mA,np.ones((71,71),np.uint8)).astype(np.float32),(0,0),18)
wa=np.where(wm>0,wa,mA.astype(np.float32))
blend=fA.astype(np.float32)*wa[...,None]+wB*(1-wa[...,None])
fmask=((mA>0)|(wm>0)).astype(np.uint8)
lat_r=np.pi/2-(np.arange(H)+.5)/H*np.pi; lon_r=(np.arange(W)+.5)/W*2*np.pi-np.pi
rows=np.where(lat_r<-30*np.pi/180)[0]; LON,LAT=np.meshgrid(lon_r,lat_r[rows])
ex,ey,ez=np.cos(LAT)*np.sin(LON),np.sin(LAT),np.cos(LAT)*np.cos(LON)
px=(((ex/(-ey))/tf+1)/2*(F-1)).astype(np.float32); py=(((ez/ey)/tf+1)/2*(F-1)).astype(np.float32)
fc=cv2.remap(blend,px,py,cv2.INTER_LINEAR); fm=cv2.remap(fmask,px,py,cv2.INTER_NEAREST); wq=cv2.remap(np.where(wm>0,wa,1.0).astype(np.float32),px,py,cv2.INTER_LINEAR)
aE=cv2.erode((A[...,3]>250).astype(np.uint8),np.ones((15,15),np.uint8))
out=A.copy(); sub=out[rows]; ar=aE[rows]
put=(fm>0)&((ar==0)|(wq<0.995))
sub[...,:3][put]=np.clip(fc[put],0,255).astype(np.uint8); sub[...,3][put]=255; out[rows]=sub
Image.fromarray(cv2.cvtColor(out,cv2.COLOR_BGRA2RGBA)).save(S+'/stitch/pano3.tif')
w_=np.cos(lat_r)[:,None]
print('real coverage %.1f%% -> %.1f%%'%(100*((A[...,3]>250)*w_).sum()/(w_.sum()*W),100*((out[...,3]>250)*w_).sum()/(w_.sum()*W)))
bot=[lat_r[np.where(out[:,x,3]>250)[0].max()] for x in range(0,W,64)]
print('lowest real pixel per column: min %.1f° median %.1f°'%(np.degrees(max(bot)),np.degrees(np.median(bot))))
