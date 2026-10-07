import cv2, numpy as np, glob, sys, json
files = sorted(glob.glob(sys.argv[1] + '/f_*.jpg'))
W, H = 540, 960
f = (W/2)/np.tan(np.radians(70/2))   # rough guess, short-side HFOV ~70deg
K = np.array([[f,0,W/2],[0,f,H/2],[0,0,1.]]); Ki = np.linalg.inv(K)
sift = cv2.SIFT_create(1500)
bf = cv2.BFMatcher()
def feats(p):
    g = cv2.imread(p, 0)
    kp, d = sift.detectAndCompute(g, None)
    return g, kp, d
def bearings(pts):
    h = np.c_[pts, np.ones(len(pts))] @ Ki.T
    return h / np.linalg.norm(h, axis=1, keepdims=True)
def kabsch(a, b):  # R such that b ~ R a
    U, s, Vt = np.linalg.svd(b.T @ a)
    D = np.diag([1, 1, np.sign(np.linalg.det(U @ Vt))])
    return U @ D @ Vt
out = []
prev = feats(files[0])
Rabs = np.eye(3)
for i in range(1, len(files)):
    cur = feats(files[i])
    g0, k0, d0 = prev; g1, k1, d1 = cur
    sharp = cv2.Laplacian(g1, cv2.CV_64F).var()
    rec = dict(i=i, sharp=sharp, n=0)
    if d0 is not None and d1 is not None and len(k0) > 20 and len(k1) > 20:
        m = [a for a, b in bf.knnMatch(d0, d1, k=2) if a.distance < 0.75*b.distance]
        if len(m) >= 15:
            p0 = np.float32([k0[a.queryIdx].pt for a in m]); p1 = np.float32([k1[a.trainIdx].pt for a in m])
            Hm, inl = cv2.findHomography(p0, p1, cv2.RANSAC, 3.0)
            inl = inl.ravel().astype(bool)
            b0, b1 = bearings(p0[inl]), bearings(p1[inl])
            R = kabsch(b0, b1)
            res = np.degrees(np.arccos(np.clip(np.sum((b0 @ R.T) * b1, 1), -1, 1)))
            ang = np.degrees(np.arccos(np.clip((np.trace(R)-1)/2, -1, 1)))
            Rabs = R @ Rabs
            # camera forward (z) direction in world frame of frame 0
            fwd = Rabs.T @ np.array([0, 0, 1.]); up = Rabs.T @ np.array([0, -1, 0.])
            yaw = np.degrees(np.arctan2(fwd[0], fwd[2])); pitch = np.degrees(np.arcsin(-fwd[1]))
            rec.update(n=int(inl.sum()), ang=ang, res_med=float(np.median(res))*f*np.pi/180,
                       res90=float(np.percentile(res, 90))*f*np.pi/180, yaw=yaw, pitch=pitch)
    out.append(rec)
    prev = cur
json.dump(out, open(sys.argv[2], 'w'))
for r in out:
    if r['n']:
        print(f"{r['i']/10:5.1f}s n={r['n']:4d} step={r['ang']:5.2f}° yaw={r['yaw']:7.1f} pitch={r['pitch']:6.1f} resid_med={r['res_med']:.2f}px p90={r['res90']:.2f}px sharp={r['sharp']:.0f}")
    else:
        print(f"{r['i']/10:5.1f}s NO MATCH sharp={r['sharp']:.0f}")
