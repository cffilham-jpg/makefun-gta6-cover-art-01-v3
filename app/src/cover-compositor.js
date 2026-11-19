import {layouts} from './panel-layouts.js';
import {grades} from './film-grades.js';
import {framePhotoInPanel} from './subject-framing.js';

export function getCoverPanels(width,height,layout) {
  return layouts[layout](width/height > 1.2).map(points => points.map(([x,y]) => [x*width,y*height]));
}

export function tracePanel(ctx,points) {
  ctx.beginPath();
  points.forEach(([x,y],index) => index ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
  ctx.closePath();
}

export function getPanelBounds(points) {
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  const x = Math.min(...xs), y = Math.min(...ys);
  return {x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y};
}

function paintGradedPanel(ctx,points,photo,crop,grade,unit,index) {
  const {x,y,w,h} = getPanelBounds(points);
  const [filter,light,dark] = grade;
  ctx.save();
  tracePanel(ctx,points);
  ctx.clip();
  ctx.filter = filter;
  ctx.drawImage(photo.image,...framePhotoInPanel(photo,crop,{x,y,w,h}));
  ctx.filter = 'none';
  const wash = ctx.createLinearGradient(x,y,x+w*.45,y+h);
  wash.addColorStop(0,light);
  wash.addColorStop(1,dark);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = .56;
  ctx.fillStyle = wash;
  ctx.fillRect(x,y,w,h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.lineWidth = 2.4*unit;
  ctx.strokeStyle = index ? '#f5c0a890' : '#ffe1b5a0';
  ctx.stroke();
  ctx.restore();
  tracePanel(ctx,points);
  ctx.lineWidth = 6*unit;
  ctx.strokeStyle = '#171019';
  ctx.stroke();
}

function drawTrackedText(ctx,text,x,y,tracking) {
  ctx.letterSpacing = tracking+'px';
  ctx.fillText(text,x,y);
  ctx.letterSpacing = '0px';
}

function paintCoverLettering(ctx,w,h,state,unit) {
  const wide = w/h > 1.2;
  const hero = state.layout === 'Hero';
  const left = w*(wide ? .051 : .067);
  const filmStrip = state.layout === 'Film Strip';
  const baseline = h*(wide ? .652 : filmStrip ? .59 : hero ? .703 : .768);
  const lineGap = h*(wide || filmStrip ? .154 : .161);
  const allLines = state.title.filter(line => line.trim());
  const lockup = ctx.createLinearGradient(0,h*.32,0,h*.91);
  lockup.addColorStop(0,'#10091800');
  lockup.addColorStop(.77,'#11091863');
  lockup.addColorStop(1,'#10091808');
  ctx.fillStyle = lockup;
  ctx.fillRect(0,h*.32,w,h*.59);
  let y = baseline - (allLines.length-1)*lineGap;
  state.title.forEach((raw,i) => {
    if (!raw.trim()) return;
    const line = state.uppercase ? raw.toUpperCase() : raw;
    const style = state.styles[i];
    const size = h*(wide ? .96 : 1)*(style.font === 'Archivo Black' ? .205 : .214);
    ctx.save();
    ctx.translate(left,y);
    ctx.transform(1,0,-.13,1,0,0);
    ctx.font = size+'px "'+style.font+'"';
    ctx.letterSpacing = state.tracking*unit+'px';
    const available = w*(wide ? .52 : .86);
    const measured = ctx.measureText(line).width;
    ctx.scale(Math.min(1,available/Math.max(1,measured)),1);
    ctx.lineJoin = 'round';
    if (state.shadow) {
      ctx.fillStyle = '#221024';
      ctx.strokeStyle = '#221024';
      ctx.lineWidth = 8*unit;
      ctx.strokeText(line,5*unit,8*unit);
      ctx.fillText(line,5*unit,8*unit);
    }
    if (state.outline) {
      ctx.strokeStyle = '#1c1121';
      ctx.lineWidth = 7.5*unit;
      ctx.strokeText(line,0,0);
    }
    const ink = ctx.createLinearGradient(0,-size*.75,0,size*.05);
    ink.addColorStop(0,i ? '#fff3bf' : '#fffaf0');
    ink.addColorStop(.63,style.color);
    ink.addColorStop(1,i ? style.color : '#ffbd91');
    ctx.fillStyle = state.gradient ? ink : style.color;
    ctx.fillText(line,0,0);
    ctx.restore();
    y += lineGap;
  });
  if (state.subtitle.trim()) {
    const top = baseline+h*.032;
    const text = state.subtitle.toUpperCase();
    ctx.font = 13*unit+'px "Archivo Black"';
    ctx.letterSpacing = 2*unit+'px';
    const bandWidth = Math.min(ctx.measureText(text).width+29*unit,w*.82);
    ctx.letterSpacing = '0px';
    ctx.fillStyle = state.styles[1].color;
    ctx.beginPath();
    ctx.moveTo(left,top);
    ctx.lineTo(left+bandWidth,top);
    ctx.lineTo(left+bandWidth-6*unit,top+24*unit);
    ctx.lineTo(left-5*unit,top+24*unit);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.rect(left,top,bandWidth-9*unit,24*unit);
    ctx.clip();
    ctx.fillStyle = '#211223';
    drawTrackedText(ctx,text,left+9*unit,top+17*unit,2*unit);
    ctx.restore();
  }
}

function paintIssueTrimmings(ctx,w,h,state,unit) {
  const edge = 21*unit;
  const footer = 32*unit;
  ctx.fillStyle = '#171019';
  ctx.fillRect(0,0,w,edge*1.62);
  ctx.fillRect(0,h-footer,w,footer);
  ctx.fillRect(0,0,edge*.53,h);
  ctx.fillRect(w-edge*.53,0,edge*.53,h);
  ctx.strokeStyle = '#f3b7a3';
  ctx.lineWidth = unit;
  ctx.strokeRect(edge*.53,edge*1.62,w-edge*1.06,h-edge*1.62-footer);
  ctx.font = 10*unit+'px "Archivo Black"';
  ctx.fillStyle = '#ffe9d8';
  drawTrackedText(ctx,'◈  '+state.location.toUpperCase().slice(0,36),edge,edge*1.07,1.7*unit);
  ctx.textAlign = 'right';
  ctx.fillStyle = state.styles[1].color;
  drawTrackedText(ctx,'VICE LINE  /  ISSUE '+state.issue.slice(0,5),w-edge,edge*1.07,1.45*unit);
  ctx.fillStyle = '#ffe9d8';
  drawTrackedText(ctx,'25° 46′ N   /   80° 12′ W',w-edge,h-11.5*unit,.8*unit);
  ctx.textAlign = 'left';
  drawTrackedText(ctx,state.tagline.toUpperCase().slice(0,w/h > 1.2 ? 54 : 29),edge,h-11.5*unit,.9*unit);
  if (!state.sticker.trim()) return;
  const radius = 39*unit;
  ctx.save();
  ctx.translate(w-radius-edge*1.7,h*(state.layout === 'Film Strip' ? .26 : w/h > 1.2 ? .77 : .91));
  ctx.rotate(-.16);
  ctx.beginPath();
  for (let i=0;i<40;i++) {
    const angle = i*Math.PI/20, r = radius*(i%2 ? .91 : 1);
    ctx.lineTo(Math.cos(angle)*r,Math.sin(angle)*r);
  }
  ctx.closePath();
  ctx.lineWidth = 3*unit;
  ctx.strokeStyle = '#211223';
  ctx.fillStyle = '#ffdd94';
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#513448';
  ctx.lineWidth = .8*unit;
  ctx.beginPath();
  ctx.arc(0,0,radius*.75,0,Math.PI*2);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#211223';
  ctx.font = 12*unit+'px Anton';
  ctx.fillText(state.sticker.toUpperCase().slice(0,20),0,-3*unit,radius*1.44);
  ctx.font = 18*unit+'px Anton';
  ctx.fillText('/ '+state.issue.slice(0,5)+' /',0,16*unit,radius*1.44);
  ctx.restore();
}

function applyPrintGrain(ctx,w,h) {
  let seed = 171;
  const random = () => ((seed = (Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  ctx.save();
  ctx.globalAlpha = .13;
  const size = Math.max(.75,h/880);
  for (let i=0;i<9500;i++) {
    ctx.fillStyle = i%2 ? '#fff0c1' : '#120b29';
    ctx.fillRect(random()*w,random()*h,size*(1+random()),size);
  }
  ctx.restore();
}

export function renderCover(canvas,state,photoLibrary) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height, unit = Math.min(w,h)/620;
  const panels = getCoverPanels(w,h,state.layout);
  const grade = grades[state.grade]();
  ctx.fillStyle = '#171019';
  ctx.fillRect(0,0,w,h);
  panels.forEach((points,i) => {
    const crop = state.panels[i];
    const photo = photoLibrary.get(crop.photo);
    if (photo) paintGradedPanel(ctx,points,photo,crop,grade,unit,i);
  });
  applyPrintGrain(ctx,w,h);
  paintCoverLettering(ctx,w,h,state,unit);
  paintIssueTrimmings(ctx,w,h,state,unit);
}
