import subprocess, numpy as np, cv2, json, sys
W,H=2160,3840
tm=open(sys.argv[1]).read().strip()
cmd=['ffmpeg','-v','error','-i',sys.argv[2],'-t','11.4','-vf',tm.replace('format=rgb24','format=gray')+",select='not(mod(n\\,2))'",'-fps_mode','passthrough','-f','rawvideo','-pix_fmt','gray','-']
p=subprocess.Popen(cmd,stdout=subprocess.PIPE)
out=[];k=0
while True:
    b=p.stdout.read(W*H)
    if len(b)<W*H: break
    g=np.frombuffer(b,np.uint8).reshape(H,W)
    g2=cv2.resize(g,(W//2,H//2),interpolation=cv2.INTER_AREA)
    out.append(dict(n=2*k,sharp=float(cv2.Laplacian(g2,cv2.CV_64F).var())))
    k+=1
json.dump(out,open(sys.argv[3],'w')); print(len(out))
