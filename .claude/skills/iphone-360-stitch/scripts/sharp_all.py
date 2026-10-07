import subprocess, numpy as np, cv2, json, sys
W,H=1080,1920
tm=open(sys.argv[1]).read().strip()
p=subprocess.Popen(['ffmpeg','-v','error','-i',sys.argv[2],'-vf',tm.replace('format=rgb24','format=gray'),'-fps_mode','passthrough','-f','rawvideo','-pix_fmt','gray','-'],stdout=subprocess.PIPE)
out=[];k=0
while True:
    b=p.stdout.read(W*H)
    if len(b)<W*H: break
    g=np.frombuffer(b,np.uint8).reshape(H,W); out.append(float(cv2.Laplacian(g,cv2.CV_64F).var())); k+=1
json.dump(out,open(sys.argv[3],'w')); print(k)
