"""Reproducible edits of the uploaded sprites/berry; no smoothing or new body redraw."""
from pathlib import Path
import json, math
from PIL import Image, ImageDraw, ImageOps
ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'src/assets/characters/pachirisu'
OUT=ASSETS/'followme'; OUT.mkdir(exist_ok=True)
RIGHT=ASSETS/'followme-right'; RIGHT.mkdir(exist_ok=True)
source=Image.open(ASSETS/'pachirisu-brace.png').convert('RGBA')
berry=Image.open(ASSETS/'sitrus-berry.webp').convert('RGBA').resize((18,18),Image.Resampling.NEAREST)
# Fixed canvas and bitten silhouettes: occupied area decreases without scaling.
berries=[]
for stage in range(4):
 b=berry.copy();d=ImageDraw.Draw(b)
 if stage>=1:
  for box in [(-4,-2,8,8),(3,-3,11,5)]:d.ellipse(box,fill=(0,0,0,0))
 if stage>=2:
  for box in [(7,-2,21,11),(6,5,22,17),(-3,3,5,11)]:d.ellipse(box,fill=(0,0,0,0))
 if stage==3:b=Image.new('RGBA',(18,18))
 b.save(OUT/f'berry-{stage}.png');berries.append(b)
frames=[]; records=[]
for i in range(44):
 ms=i*100;im=Image.new('RGBA',(180,150));d=ImageDraw.Draw(im)
 # Screen-space upper-right -> lower-left. Facing variants counter-mirror only
 # the rear layer, leaving the character/berry at their approved body anchor.
 heads=[]
 if 450<=ms<3500:
  for lane,(startx,offset,size) in enumerate([(151,0,1),(133,310,.75),(166,640,.5)]):
   elapsed=ms-450-offset
   if elapsed<0:continue
   age=elapsed%1050;progress=age/1050
   x=startx-round(progress*92);y=42+round(progress*90)
   length=round(30*size);r=max(3,int(7*size))
   alpha=round(255*min(1,progress/.12,(1-progress)/.14))
   layer=Image.new('RGBA',im.size);ld=ImageDraw.Draw(layer)
   tip=(x+round(length*.7),y-round(length*.7))
   ld.polygon([(x-r,y-2),tip,(x+round(length*.4),y-round(length*.22)),(x+r,y+2),(x+2,y+r)],fill='#e95830')
   ld.polygon([(x-r+2,y-1),(tip[0]-3,tip[1]+3),(x+r-1,y+2),(x,y+r-1)],fill='#ffb447')
   ld.ellipse((x-r,y-r,x+r,y+r),fill='#ffca57')
   ld.rectangle((x-r+2,y-r+2,x+r-2,y+r-2),fill='#fff6cb')
   for k in range(3):
    px=x+round(length*.35)+k*3;py=y-round(length*.35)-k*3
    ld.rectangle((px,py,px+1,py+1),fill=('#ffc76d' if k%2 else '#ed7540'))
   if progress>.8:
    for sign in [-1,1]:ld.rectangle((x+sign*12,y-8,x+sign*12+2,y-6),fill='#ffd387')
   layer.putalpha(layer.getchannel('A').point(lambda value:round(value*alpha/255)))
   im.alpha_composite(layer);heads.append([lane,x,y,alpha])
 rear=im.copy();im=Image.new('RGBA',(180,150));d=ImageDraw.Draw(im)
 # Original outline/palette retained; forepaws reach continuously from chest to berry.
 pose=source.copy();pd=ImageDraw.Draw(pose)
 eat=800<=ms<3200
 stage=0 if ms<1500 else 1 if ms<2200 else 2 if ms<2900 else 3
 lift=min(1,max(0,(ms-700)/300))
 chew=eat and stage<3 and (i%5 in [1,2])
 if eat:
  pd.line([(20,45),(16,44-int(lift*2)),(12,44-int(lift*2))],fill='#4b4659',width=4)
  pd.line([(20,44),(16,43-int(lift*2)),(12,43-int(lift*2))],fill='#f7f7f7',width=2)
  if chew:pd.rectangle((11,41,13,42),fill='#7f4331')
 body=pose.resize((87,91),Image.Resampling.NEAREST)
 dx=(i%3-1) if 3200<=ms<3500 else 0
 im.alpha_composite(body,(43+dx,27))
 if 700<=ms<3200 and stage<3:
  bx=47;by=102-round(lift*10)+(1 if chew else 0)
  im.alpha_composite(berries[stage],(bx,by))
 # Recovery sparkle is small and disappears before final restored pose.
 if 3500<=ms<4100:
  for sx,sy in [(50,80),(84,86)]:
   d.line((sx-2,sy,sx+2,sy),fill='#fff1a1',width=1);d.line((sx,sy-2,sx,sy+2),fill='#fff1a1',width=1)
 if ms>=4200:
  im=Image.new('RGBA',(180,150));im.alpha_composite(Image.open(ASSETS/'pachirisu-still.png').convert('RGBA').resize((87,91),Image.Resampling.NEAREST),(43,27))
 foreground=im
 im=rear.copy();im.alpha_composite(foreground)
 right=ImageOps.mirror(rear);right.alpha_composite(foreground)
 im.save(OUT/f'followme-{i:02}.png');right.save(RIGHT/f'followme-{i:02}.png');frames.append(im)
 records.append({'frame':i,'time':ms,'berryStage':stage if eat else None,'meteors':450<=ms<3500,'meteorHeads':heads})
(OUT/'timing.json').write_text(json.dumps({'frameMs':100,'duration':4400,'iconUntil':3500,'frames':records},indent=2)+'\n')
review=ROOT/'docs/pachirisu-followme';review.mkdir(exist_ok=True)
# Dedicated authored finger asset is displayed separately above the head.
(ASSETS/'followme-icon.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 34" role="img" aria-label="Follow Me pointing finger"><path d="M8 32V28H2V17H7V2H14V15H21V11H25V28H21V32Z" fill="white" stroke="#68c6d2" stroke-width="2" stroke-linejoin="miter"/><path d="M8 17V23M14 16V23M20 16V23" fill="none" stroke="#68c6d2" stroke-width="2"/></svg>')
# Transparent APNG for exact timeline; light/dark sheet for bite silhouette review.
frames[0].save(review/'followme-playback.png',save_all=True,append_images=frames[1:],duration=100,loop=0,disposal=0,blend=0)
board=Image.new('RGB',(1080,650),'#edf1f5');d=ImageDraw.Draw(board)
for row,bg in enumerate(['white','#24313e']):
 for col,idx in enumerate([0,8,15,22,29,38]):
  cell=Image.new('RGBA',(180,150),bg);cell.alpha_composite(frames[idx]);cell=cell.resize((180,300),Image.Resampling.NEAREST) if False else cell
  board.paste(cell.convert('RGB'),(col*180,row*170+20));d.text((col*180+6,row*170+3),str(idx*100)+' ms',fill='#39434e')
for stage,b in enumerate(berries):
 enlarged=b.resize((108,108),Image.Resampling.NEAREST);board.paste(enlarged,(stage*180+36,390),enlarged)
 d.text((stage*180+14,510),f'Berry bite stage {stage}',fill='#39434e')
d.text((12,565),'100 ms frames / 4400 ms one-shot; rear meteors, fixed-size bitten berry silhouettes',fill='#39434e')
board.save(review/'followme-sheet.png')
