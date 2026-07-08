import struct, zlib

def read_png(path):
    with open(path, "rb") as f:
        data = f.read()
    pos = 8
    idat = bytearray()
    while pos < len(data):
        (length,) = struct.unpack(">I", data[pos:pos+4])
        ctype = data[pos+4:pos+8]
        cdata = data[pos+8:pos+8+length]
        if ctype == b"IHDR":
            width, height, bitdepth, colortype = struct.unpack(">IIBB", cdata[:10])
        elif ctype == b"IDAT":
            idat += cdata
        elif ctype == b"IEND":
            break
        pos += 12 + length
    raw = zlib.decompress(bytes(idat))
    bpp = {2:3,6:4}[colortype]
    stride = width*bpp
    out = bytearray(height*stride)
    def paeth(a,b,c):
        p=a+b-c; pa,pb,pc=abs(p-a),abs(p-b),abs(p-c)
        return a if (pa<=pb and pa<=pc) else (b if pb<=pc else c)
    ri=0
    for y in range(height):
        ft=raw[ri]; ri+=1
        for x in range(stride):
            val=raw[ri]; ri+=1
            a=out[y*stride+x-bpp] if x>=bpp else 0
            b=out[(y-1)*stride+x] if y>0 else 0
            c=out[(y-1)*stride+x-bpp] if (y>0 and x>=bpp) else 0
            if ft==1: val=(val+a)&255
            elif ft==2: val=(val+b)&255
            elif ft==3: val=(val+((a+b)>>1))&255
            elif ft==4: val=(val+paeth(a,b,c))&255
            out[y*stride+x]=val
    return width,height,bpp,out

def write_png(path,w,h,bpp,px):
    def chunk(t,d):
        return struct.pack(">I",len(d))+t+d+struct.pack(">I",zlib.crc32(t+d)&0xffffffff)
    ct = 2 if bpp==3 else 6
    ihdr=struct.pack(">IIBBBBB",w,h,8,ct,0,0,0)
    stride=w*bpp
    raw=bytearray()
    for y in range(h):
        raw.append(0)
        raw+=px[y*stride:(y+1)*stride]
    out=b"\x89PNG\r\n\x1a\n"+chunk(b"IHDR",ihdr)+chunk(b"IDAT",zlib.compress(bytes(raw),6))+chunk(b"IEND",b"")
    with open(path,"wb") as f: f.write(out)

# --- replicate betZones.ts geometry (percentages) ---
COL=[35.42,51.04,66.67,81.25]
ROW_TOP=19.79; ROW_H=6.076
rowEdge=lambda i: ROW_TOP+i*ROW_H
zones=[]
for n in range(1,37):
    idx=n-1; r=idx//3; c=idx%3
    zones.append((COL[c],rowEdge(r),COL[c+1]-COL[c],ROW_H))
half=(COL[3]-COL[0])/2; zt=11.46
zones.append((COL[0],zt,half,ROW_TOP-zt))
zones.append((COL[0]+half,zt,half,ROW_TOP-zt))
dozL=20.83; dozW=COL[0]-dozL
for i in range(3):
    zones.append((dozL,rowEdge(i*4),dozW,rowEdge(i*4+4)-rowEdge(i*4)))
outL=8.33; outW=dozL-outL
for i in range(6):
    zones.append((outL,rowEdge(i*2),outW,ROW_H*2))
botTop=rowEdge(12); botH=6.5
for c in range(3):
    zones.append((COL[c],botTop,COL[c+1]-COL[c],botH))

w,h,bpp,px=read_png("public/Capture.PNG")
def setpx(x,y,rgb):
    if 0<=x<w and 0<=y<h:
        i=(y*w+x)*bpp; px[i],px[i+1],px[i+2]=rgb
for (l,t,ww,hh) in zones:
    x0=int(l/100*w); y0=int(t/100*h); x1=int((l+ww)/100*w); y1=int((t+hh)/100*h)
    for th in range(3):
        for x in range(x0,x1):
            setpx(x,y0+th,(255,0,255)); setpx(x,y1-1-th,(255,0,255))
        for y in range(y0,y1):
            setpx(x0+th,y,(255,0,255)); setpx(x1-1-th,y,(255,0,255))
write_png("public/_zones_overlay.png",w,h,bpp,px)
print("wrote public/_zones_overlay.png", len(zones), "zones")
