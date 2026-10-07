import cv2, numpy as np, sys
W,H=540,960
sift=cv2.SIFT_create(3000); bf=cv2.BFMatcher()
def load(t): return cv2.imread(f'{sys.argv[1]}/f_{int(round(t*10)):04d}.jpg',0)
def run(t0,t1,hfov):
    f=(W/2)/np.tan(np.radians(hfov/2)); K=np.array([[f,0,W/2],[0,f,H/2],[0,0,1.]]); Ki=np.linalg.inv(K)
    a,b=load(t0),load(t1); ka,da=sift.detectAndCompute(a,None); kb,db=sift.detectAndCompute(b,None)
    m=[x for x,y in bf.knnMatch(da,db,k=2) if x.distance<0.7*y.distance]
    if len(m)<12: return f'{t0}->{t1}: only {len(m)} matches'
    p0=np.float32([ka[x.queryIdx].pt for x in m]); p1=np.float32([kb[x.trainIdx].pt for x in m])
    E,inl=cv2.findEssentialMat(p0,p1,K,cv2.RANSAC,0.999,1.5); inl=inl.ravel().astype(bool)
    p0,p1=p0[inl],p1[inl]
    def bear(p):
        h=np.c_[p,np.ones(len(p))]@Ki.T; return h/np.linalg.norm(h,axis=1,keepdims=True)
    A,B=bear(p0),bear(p1); best=None
    rng=np.random.default_rng(0)
    for _ in range(300):   # RANSAC pure-rotation
        s=rng.choice(len(A),3,replace=False); U,_,Vt=np.linalg.svd(B[s].T@A[s]); R=U@np.diag([1,1,np.linalg.det(U@Vt)])@Vt
        r=np.degrees(np.arccos(np.clip(np.sum((A@R.T)*B,1),-1,1)))*f*np.pi/180
        c=(r<2).sum()
        if best is None or c>best[0]: best=(c,r)
    c,r=best
    return f'{t0:5.1f}->{t1:5.1f}  E-inliers={len(A):4d}  rotation-only: {100*c/len(A):5.1f}% within 2px, median resid {np.median(r):6.2f}px (of 540px width)'
pairs=[(0.1,10.8),(0.1,11.0),(1.0,10.9),(11.0,12.8),(12.8,15.6),(13.6,15.6),(10.5,13.6),(0.2,15.6),(0.2,13.6),(3.0,17.1),(4.0,18.0),(6.5,18.6),(8.5,19.8),(0.2,24.5),(12.8,24.5),(15.6,24.5),(4.0,30.0)]
for hf in (68,74):
    print('hfov',hf)
    for p in pairs: print(' ',run(*p,hf))
