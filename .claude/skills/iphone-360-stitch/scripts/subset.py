import re,sys,collections,random
src,dst=sys.argv[1],sys.argv[2]; drop=set(int(x) for x in sys.argv[3].split(',')) if sys.argv[3] else set()
keep_pairs=set(tuple(map(int,p.split('-'))) for p in sys.argv[4].split(',')) if len(sys.argv)>4 else None
maxper=25
L=open(src).read().split('\n'); imgs=[l for l in L if l.startswith('i ')]
mp={}; k=0
for i in range(len(imgs)):
    if i not in drop: mp[i]=k; k+=1
out=[];cps=collections.defaultdict(list)
for l in L:
    if l.startswith('i '): continue
    if l.startswith('c '):
        n=int(re.search(r' n(\d+)',l).group(1)); N=int(re.search(r' N(\d+)',l).group(1))
        if n in mp and N in mp: cps[(n,N)].append(l)
        continue
    if l.startswith('v ') or l.startswith('#') : continue
    out.append(l)
random.seed(0)
lines=[]
for i,l in enumerate(imgs):
    if i in mp: lines.append(l)
cl=[]
for (n,N),ls in cps.items():
    ecc=len(ls)>0 and abs(n-N)<=2 and (n,N) in (keep_pairs or set())
    sel=random.sample(ls,min(maxper,len(ls)))
    for l in sel:
        l=re.sub(r' n\d+',f' n{mp[n]}',l,1); l=re.sub(r' N\d+',f' N{mp[N]}',l,1); cl.append(l)
p=[l for l in out if l.startswith('p ')]; m=[l for l in out if l.startswith('m ')]
open(dst,'w').write('\n'.join(p+m+lines+cl+['v'])+'\n')
print('images',len(lines),'cps',len(cl))
