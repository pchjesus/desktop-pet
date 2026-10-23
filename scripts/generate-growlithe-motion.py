#!/usr/bin/env python3
"""Deterministic, nearest-pixel edits of the verified HG/SS Growlithe source.
No inferred AI redraw or smoothed scaling. Run from any working directory.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import hashlib, json, math
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'src/assets/characters/growlithe-motion'
DOC = ROOT / 'docs/growlithe-motion'
SOURCE = ROOT / 'src/assets/characters/growlithe-hgss.png'
source = Image.open(SOURCE).convert('RGBA')
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == 'ed58999248f69a686aed6048a57900a751ec8a8b9df9c161ecabfa592d135c96'
OUT.mkdir(parents=True, exist_ok=True); DOC.mkdir(parents=True, exist_ok=True)
ink = source.getpixel((27,32)); cream = source.getpixel((23,37)); orange = source.getpixel((32,29))
# Explicit source-pixel palette values, rather than approximate new coat colors.
colors = source.getcolors(6400)
opaque = sorted([(n,c) for n,c in colors if c[3]], reverse=True)
# Dark source outline used for closed eyes and open mouth.
ink = min((c for _,c in opaque), key=lambda c:sum(c[:3]))
cream = max((c for _,c in opaque), key=lambda c:sum(c[:3]))
frames = {}
def save(name, im):
    im.save(OUT / (name+'.png')); frames[name] = im.copy(); return name+'.png'
def patch(im, box, xy, shift=(0,0)):
    im.alpha_composite(source.crop(box), (xy[0]+shift[0],xy[1]+shift[1]))
def clear(im,box): im.paste((0,0,0,0),box)
# A local ruff expansion gives breathing without moving the silhouette as a unit.
idle = source.copy(); clear(idle,(22,40,38,53)); patch(idle,(22,40,38,53),(22,39))
save('idle-breathe',idle)
# Brief independent ear and tail articulation; the full paws/body never translate.
ear=source.copy(); ImageDraw.Draw(ear).rectangle((37,27,41,33),fill=orange)
patch(ear,(37,27,42,33),(37,26)); save('idle-ear',ear)
tail=source.copy(); clear(tail,(45,35,64,53)); patch(tail,(45,35,64,53),(46,34)); save('idle-tail',tail)
# Sitting lowers the haunch and folds the rear paw; head, eyes and crest remain source exact.
sit=source.copy(); clear(sit,(36,47,54,65)); patch(sit,(36,43,54,59),(36,47)); patch(sit,(41,54,47,60),(39,56)); patch(sit,(43,59,51,63),(38,61))
save('sit-0',sit)
sit2=sit.copy(); patch(sit2,(24,42,36,50),(24,43)); save('sit-1',sit2)
# Drag frames articulate the paws independently, without rotating/scaling the pet.
for n,dy in enumerate([0,2]):
    drag=source.copy(); clear(drag,(22,55,39,65)); patch(drag,(22,55,29,62),(21,56+dy)); patch(drag,(29,56,39,65),(30,55+(2-dy)))
    save(f'drag-{n}',drag)
# Curled side-lying pose: original striped haunch is laid horizontally, tail wraps
# over its back; lowered original head rests on paired source forepaws.
sleep=Image.new('RGBA',(80,80))
body=source.crop((36,39,52,60)).transpose(Image.Transpose.ROTATE_90)
sleep.alpha_composite(body,(34,47))
patch(sleep,(44,36,63,53),(43,40))   # curled cream tail, source pixels intact
patch(sleep,(25,40,37,55),(32,47))   # source cream mane draped beside the cheek
patch(sleep,(29,56,39,65),(29,55))   # extended near forepaw
patch(sleep,(22,55,29,62),(22,56))   # far forepaw
patch(sleep,(17,25,42,43),(17,41))   # cheek and muzzle lowered onto paws
patch(sleep,(22,16,40,28),(25,34))   # original crest follows lowered head
# Close the source eye with coat pixels, then add a short descending eyelid.
d=ImageDraw.Draw(sleep)
d.rectangle((25,46,32,51),fill=orange)
d.line([(25,49),(27,50),(30,50),(32,49)],fill=ink,width=1)
# Keep original cream muzzle/paw boundary legible below the closed eye.
save('sleep-0',sleep)
breath=sleep.copy(); clear(breath,(35,45,54,50)); breath.alpha_composite(sleep.crop((35,46,54,51)),(35,45)); save('sleep-1',breath)
wake=sleep.copy(); d=ImageDraw.Draw(wake); d.point((28,49),fill=cream); d.line((28,50,30,50),fill=ink); save('wake',wake)
# Unfold in connected stages: lift the head while the rump stays curled, then
# straighten the body with the head still four pixels below its standing height.
headrise=sleep.copy(); clear(headrise,(17,33,43,60))
patch(headrise,(29,56,39,65),(29,55)); patch(headrise,(22,55,29,62),(22,56))
patch(headrise,(25,40,39,55),(29,47)); patch(headrise,(17,16,43,46),(17,24)); save('wake-head',headrise)
bodyrise=source.copy(); clear(bodyrise,(17,16,43,43)); patch(bodyrise,(17,16,43,43),(17,20)); save('wake-body',bodyrise)
# One-shot flame uses full170x150 frames with the untouched source80x80 at(45,31).
# Mouth remains at canvas(64,70), so the stream is attached, including ignition.
def special(n):
    im=Image.new('RGBA',(170,150)); pet=source.copy(); pd=ImageDraw.Draw(pet)
    if n>=2 and n<26:
        pd.line((19,39,24,39),fill=ink,width=2)
        pd.line((19,40,22,40),fill=(255,145,64,255),width=1)
    if n in [1,2]: # brace: forepaws spread, head held steady
        clear(pet,(29,59,39,65)); pet.alpha_composite(source.crop((29,59,39,65)),(30,59))
    im.alpha_composite(pet,(45,31))
    if 3<=n<=25:
        # 3 ignition frames -> sustained flicker -> four shrinking tail-off frames.
        reach = [9,19,33][n-3] if n<6 else (61 if n<22 else [45,29,16,6][n-22])
        phase=n%4; mouthx,mouthy=69,70
        flame=Image.new('RGBA',im.size); draw=ImageDraw.Draw(flame)
        edge=[(mouthx,mouthy-1)]
        for step in range(0,reach+1,2):
            spread=1+int(step*.15)
            wave=((step//4+phase)%3)-1
            edge.append((mouthx-step,mouthy-spread-wave))
        edge += [(mouthx-reach-2,mouthy)]
        for step in range(reach,-1,-2):
            spread=1+int(step*.15); wave=((step//4+phase+1)%3)-1
            edge.append((mouthx-step,mouthy+spread+wave))
        draw.polygon(edge,fill=(202,59,31,255))
        draw.polygon([(69,69),(69-reach,70-max(2,reach//10)),(67-reach,70),(69-reach,72+reach//10),(69,71)],fill=(255,133,38,255))
        draw.polygon([(69,70),(69-reach,69-reach//18),(68-reach,70),(69-reach,71+reach//18)],fill=(255,232,115,255))
        draw.line((69,70,69-min(reach,12),70),fill=(255,255,209,255),width=1)
        # Embers stay detached from the connected central flame.
        if reach>20:
            for j in range(3):
                x=69-reach+4+j*13+(phase%2); y=70-(reach//9)-3-((j+phase)%3)
                draw.rectangle((x,y,x+1,y+1),fill=(255,161+phase*10,42,255))
        im.alpha_composite(flame,(-5,0))
    return im
for n in range(29):save(f'flamethrower-{n:02}',special(n))
manifest={'source':'growlithe-hgss.png','sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'baseSize':[80,80],'specialSize':[170,150],'sourceOffset':[45,31],'mouth':[64,70],'frameMs':100,'specialFrames':29,'specialDurationMs':2900,'states':{'idle':['../growlithe-hgss.png','idle-breathe.png','idle-ear.png','idle-tail.png'],'sit':['sit-0.png','sit-1.png'],'sleep':['sleep-0.png','sleep-1.png'],'drag':['drag-0.png','drag-1.png'],'wake':['wake.png','wake-head.png','wake-body.png','../growlithe-hgss.png']}}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
# Native-size light/dark evidence and enlarged nearest-neighbor review panels.
before=Image.open(ROOT/'src/assets/characters/growlithe-sleep.png').convert('RGBA')
review=Image.new('RGB',(640,400),'#eee7da'); d=ImageDraw.Draw(review)
for row,bg in enumerate(['#eee7da','#202734']):
    d.rectangle((0,row*200,640,row*200+199),fill=bg)
    for col,(label,im) in enumerate([('BEFORE',before),('CURLED',sleep),('BREATH',breath),('WAKE',wake)]):
        review.paste(im.resize((160,160),Image.Resampling.NEAREST),(col*160,row*200+25),im.resize((160,160),Image.Resampling.NEAREST));d.text((col*160+8,row*200+8),label,fill='#9b9284')
review.save(DOC/'sleep-before-after.png')
preview=[]
for n in range(29):
    bg=Image.new('RGBA',(170,150),'#202734');bg.alpha_composite(frames[f'flamethrower-{n:02}']);preview.append(bg.convert('RGB').resize((510,450),Image.Resampling.NEAREST))
preview[0].save(DOC/'flamethrower.gif',save_all=True,append_images=preview[1:],duration=100,loop=0,disposal=2)

progress=Image.new('RGBA',(640,200),'#202734'); pd=ImageDraw.Draw(progress)
for col,(label,im) in enumerate([('0 ms: eyes open',wake),('120 ms: head rises',headrise),('240 ms: body rises',bodyrise),('360 ms: standing',source)]):
    progress.alpha_composite(im.resize((160,160),Image.Resampling.NEAREST),(col*160,30));pd.text((col*160+5,10),label,fill='#dedbd4')
progress.save(DOC/'wake-progression.png')
