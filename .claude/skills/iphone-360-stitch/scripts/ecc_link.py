import cv2,numpy as np,re,sys
src,dst=sys.argv[1],sys.argv[2]
L=open(src).read().split('\n'); names=[re.search(r' n"([^"]+)"',l).group(1) for l in L if l.startswith('i ')]
groups=eval(sys.argv[3])  # list of lists
gid={i:k for k,g in enumerate(groups) for i in g}
s=0.25
def prep(i):
    g=cv2.imread(names[i],0); g=cv2.resize(g,None,fx=s,fy=s,interpolation=cv2.INTER_AREA).astype(np.float32)
    g=cv2.GaussianBlur(g,(0,0),1.5)
    gx=cv2.Sobel(g,cv2.CV_32F,1,0); gy=cv2.Sobel(g,cv2.CV_32F,0,1); return cv2.magnitude(gx,gy)
new=[]; n=len(names)
for i in range(n-1):
    for j in (i+1,i+2):
        if j>=n or gid.get(i)==gid.get(j): continue
        a,b=prep(i),prep(j)
        best=None
        for tx in np.linspace(-0.5,0.5,9)*a.shape[1]:   # coarse search over horizontal offset
            W0=np.eye(3,dtype=np.float32); W0[0,2]=tx
            try:
                cc,Wm=cv2.findTransformECC(a,b,W0,cv2.MOTION_HOMOGRAPHY,(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,200,1e-5),None,5)
            except cv2.error: continue
            if best is None or cc>best[0]: best=(cc,Wm)
        if best is None: continue
        cc,Wm=best
        # Wm maps b-coords -> a-coords (template=a, input=b)
        h,w=a.shape; ys,xs=np.mgrid[0.15:0.86:0.14,0.15:0.86:0.1]
        pb=np.c_[xs.ravel()*w,ys.ravel()*h,np.ones(xs.size)]
        pa=(Wm@pb.T).T; pa=pa[:,:2]/pa[:,2:]
        ok=(pa[:,0]>0)&(pa[:,0]<w)&(pa[:,1]>0)&(pa[:,1]<h)
        print(f'pair {i}-{j} groups {gid.get(i)}-{gid.get(j)} ecc={cc:.3f} overlap_pts={ok.sum()}')
        if cc<0.6 or ok.sum()<10: continue
        for p,q in zip(pa[ok]/s,pb[ok,:2]/s):
            new.append(f'c n{i} N{j} x{p[0]:.2f} y{p[1]:.2f} X{q[0]:.2f} Y{q[1]:.2f} t0')
open(dst,'w').write('\n'.join(L+new)+'\n'); print(len(new),'cps added')
