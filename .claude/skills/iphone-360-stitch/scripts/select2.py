import json, numpy as np
m=json.load(open('motion.json')); s=json.load(open('sharp.json'))
t=np.array([0]+[r['i']/10 for r in m if r['n']]); yaw=np.degrees(np.unwrap(np.radians([0]+[r['yaw'] for r in m if r['n']])))
fps=60000/1001
n=np.array([r['n'] for r in s]); sh=np.array([r['sharp'] for r in s]); ts=n/fps; y=np.interp(ts,t,yaw)
# sharpness relative to local median (content changes around the room)
rel=np.array([sh[i]/np.median(sh[max(0,i-8):i+9]) for i in range(len(sh))])
ok=ts<=11.3; idx=np.where(ok)[0]
best=None
for start in idx[y[idx]<=12]:
    # DP from start forward
    score={start:(np.log(rel[start]),[start])}
    order=[i for i in idx if y[i]>y[start]]
    for i in order:
        cands=[(score[j][0]+np.log(rel[i]),score[j][1]+[i]) for j in score if 12<=y[i]-y[j]<=21]
        if cands: score[i]=max(cands,key=lambda c:c[0])
    for i,(sc,path) in score.items():
        if 12<=y[start]+360-y[i]<=21 and (best is None or sc>best[0]): best=(sc,path)
path=best[1]
for a,b in zip(path,path[1:]+[path[0]]):
    print(f'frame {n[a]:4d} t={ts[a]:5.2f}s yaw={y[a]%360:6.1f} rel_sharp={rel[a]:.2f} -> next +{(y[b]-y[a])%360:4.1f}°')
print(len(path),'frames')
json.dump([int(n[i]) for i in path],open('selected.json','w'))
