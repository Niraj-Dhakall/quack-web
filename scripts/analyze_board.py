import struct, zlib, sys

def read_png(path):
    with open(path, "rb") as f:
        data = f.read()
    assert data[:8] == b"\x89PNG\r\n\x1a\n", "not a png"
    pos = 8
    width = height = bitdepth = colortype = None
    idat = bytearray()
    while pos < len(data):
        (length,) = struct.unpack(">I", data[pos:pos+4])
        ctype = data[pos+4:pos+8]
        cdata = data[pos+8:pos+8+length]
        if ctype == b"IHDR":
            width, height, bitdepth, colortype, comp, filt, interlace = struct.unpack(">IIBBBBB", cdata)
            assert interlace == 0, "interlaced not supported"
        elif ctype == b"IDAT":
            idat += cdata
        elif ctype == b"IEND":
            break
        pos += 12 + length
    raw = zlib.decompress(bytes(idat))
    channels = {2: 3, 6: 4, 0: 1, 4: 2}[colortype]
    bpp = channels  # bitdepth 8 assumed
    assert bitdepth == 8, f"bitdepth {bitdepth} unsupported"
    stride = width * bpp
    out = bytearray(height * stride)
    def paeth(a, b, c):
        p = a + b - c
        pa, pb, pc = abs(p-a), abs(p-b), abs(p-c)
        if pa <= pb and pa <= pc: return a
        if pb <= pc: return b
        return c
    ri = 0
    for y in range(height):
        ft = raw[ri]; ri += 1
        for x in range(stride):
            val = raw[ri]; ri += 1
            a = out[y*stride + x - bpp] if x >= bpp else 0
            b = out[(y-1)*stride + x] if y > 0 else 0
            c = out[(y-1)*stride + x - bpp] if (y > 0 and x >= bpp) else 0
            if ft == 1: val = (val + a) & 255
            elif ft == 2: val = (val + b) & 255
            elif ft == 3: val = (val + ((a+b)>>1)) & 255
            elif ft == 4: val = (val + paeth(a,b,c)) & 255
            out[y*stride + x] = val
    return width, height, bpp, out

def classify(r, g, b):
    if r > 150 and g > 120 and b < 110: return "Y"   # yellow/gold line+text
    if r > 130 and g < 110 and b < 110: return "R"   # red cell
    if g > 110 and r < 120 and b < 140: return "G"   # green felt
    if r < 110 and g < 110 and b < 130: return "B"   # navy/black cell
    return "."

w, h, bpp, px = read_png("public/Capture.PNG")
print(f"size {w}x{h} bpp {bpp}", file=sys.stderr)

COLS, ROWS = 48, 96
for ry in range(ROWS):
    y = int((ry + 0.5) * h / ROWS)
    line = []
    for rx in range(COLS):
        x = int((rx + 0.5) * w / COLS)
        i = (y*w + x)*bpp
        r, g, b = px[i], px[i+1], px[i+2]
        line.append(classify(r, g, b))
    print(f"{ry:2d} " + "".join(line))
