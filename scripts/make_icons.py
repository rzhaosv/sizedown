#!/usr/bin/env python3
"""Size Down icon: near-black ground, a tall red candle that steps down into a short green one. No text."""
import os
from PIL import Image, ImageDraw, ImageFilter
ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets")
BG=(11,13,16); BG2=(20,24,30); RED=(232,74,74); GREEN=(46,204,113); GRID=(30,36,44)
def bg(size):
    img=Image.new("RGB",(size,size),BG); d=ImageDraw.Draw(img)
    for i in range(30,0,-1):
        t=i/30; r=size*0.75*t; c=tuple(int(BG[k]+(BG2[k]-BG[k])*(1-t)) for k in range(3)); d.ellipse([size*0.5-r,size*0.35-r,size*0.5+r,size*0.35+r],fill=c)
    for y in range(0,size,int(size/8)): d.line([(0,y),(size,y)],fill=GRID,width=max(1,size//512))
    return img
def marks(size, transparent, mono=False, scale=1.0):
    u=size/1024*scale; c=Image.new("RGBA",(size,size),(0,0,0,0)) if transparent else bg(size).convert("RGBA")
    layer=Image.new("RGBA",(size,size),(0,0,0,0)); d=ImageDraw.Draw(layer)
    red=(255,255,255) if mono else RED; green=(255,255,255) if mono else GREEN
    cx=size/2
    # big red candle (left), body from 300 to 700, wick 240-760
    d.line([(cx-150*u,240*u),(cx-150*u,780*u)],fill=red+(255,),width=int(22*u))
    d.rounded_rectangle([cx-230*u,300*u,cx-70*u,700*u],radius=28*u,fill=red+(255,))
    # small green candle (right), sized down: body 560-700
    d.line([(cx+150*u,500*u),(cx+150*u,760*u)],fill=green+(255,),width=int(22*u))
    d.rounded_rectangle([cx+80*u,560*u,cx+220*u,700*u],radius=24*u,fill=green+(255,))
    if not transparent:
        sh=layer.split()[3].filter(ImageFilter.GaussianBlur(30*u)); glow=Image.new("RGBA",(size,size),(0,0,0,0)); glow.putalpha(sh.point(lambda v:int(v*0.35)))
        tint=Image.new("RGBA",(size,size),(120,60,60,0)); c.alpha_composite(glow)
    c.alpha_composite(layer); return c
os.makedirs(ROOT,exist_ok=True)
marks(1024,False).convert("RGB").save(os.path.join(ROOT,"icon.png"))
marks(1024,True,scale=0.8).save(os.path.join(ROOT,"adaptive-icon.png"))
marks(1024,True,scale=0.9).save(os.path.join(ROOT,"splash-icon.png"))
marks(96,True,mono=True).save(os.path.join(ROOT,"notification-icon.png"))
marks(64,False).convert("RGB").save(os.path.join(ROOT,"favicon.png"))
print("icons written")
