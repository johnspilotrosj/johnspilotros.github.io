import cv2, numpy as np, glob, json, sys
d=sys.argv[1]; files=sorted(glob.glob(d+'/f_*.jpg'))
W,H=540,960; f=(W/2)/np.tan(np.radians(34)); K=np.array([[f,0,W/2],[0,f,H/2],[0,0,1.]]); Ki=np.linalg.inv(K)
sift=cv2.SIFT_create(2000); bf=cv2.BFMatcher()
F=[]
for i,p in enumerate(files):
    if i%3: continue
    g=cv2.imread(p,0); s=cv2.Laplacian(g,cv2.CV_64F).var()
    if s<15: continue
    k,ds=sift.detectAndCompute(g,None)
    if ds is None or len(k)<50: continue
    F.append((i/10,np.float32([q.pt for q in k]),ds))
def bear(p):
    h=np.c_[p,np.ones(len(p))]@Ki.T; return h/np.linalg.norm(h,axis=1,keepdims=True)
rng=np.random.default_rng(0); res=[]
for a in range(len(F)):
    for b in range(a+1,len(F)):
        ta,pa,da=F[a]; tb,pb,db=F[b]
        if tb-ta<0.9: continue
        m=[x for x,y in bf.knnMatch(da,db,k=2) if x.distance<0.7*y.distance]
        if len(m)<25: continue
        A=bear(pa[[x.queryIdx for x in m]]); B=bear(pb[[x.trainIdx for x in m]])
        best=0
        for _ in range(200):
            s=rng.choice(len(A),3,replace=False); U,_,Vt=np.linalg.svd(B[s].T@A[s]); R=U@np.diag([1,1,np.linalg.det(U@Vt)])@Vt
            r=np.degrees(np.arccos(np.clip(np.sum((A@R.T)*B,1),-1,1)))*f*np.pi/180
            best=max(best,(r<2.5).sum())
        # homography/general inliers as reference for "same content"
        Hm,inl=cv2.findHomography(pa[[x.queryIdx for x in m]],pb[[x.trainIdx for x in m]],cv2.RANSAC,8.0)
        n=int(inl.sum()) if inl is not None else 0
        if n<20: continue
        res.append((ta,tb,n,best/n))
json.dump(res,open('pairs.json','w'))
print(len(F),'frames',len(res),'content pairs')
