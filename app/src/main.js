import {layouts} from './panel-layouts.js';
import {grades} from './film-grades.js';
import {presets,samplePhotos} from './studio-presets.js';
import {clamp,detectPhotoSubject} from './subject-framing.js';
import {getCoverPanels,getPanelBounds,tracePanel,renderCover} from './cover-compositor.js';

const byId = id => document.getElementById(id);
const canvas = byId('cover');
const library = new Map();
const formats = {
  Wide: [1920,1080,'16:9'],
  Portrait: [1080,1350,'4:5'],
  Square: [1080,1080,'1:1']
};
const state = {format:'Wide',location:'LEONIDA - VICE CITY',selected:0,panels:[]};
const framing = photo => ({photo,zoom:1,x:0,y:0});
let pendingFrame, statusTimer, dragging;

function makeButton(label, callback, className = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.className = className;
  button.addEventListener('click',callback);
  return button;
}

function openPhoto(url) {
  return new Promise((resolve,reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function setStatus(message) {
  clearTimeout(statusTimer);
  byId('status').textContent = message;
  statusTimer = setTimeout(() => { byId('status').textContent = ''; },3400);
}

function panelGeometry() {
  const [w,h] = formats[state.format];
  return getCoverPanels(w,h,state.layout);
}

function schedulePreview() {
  cancelAnimationFrame(pendingFrame);
  pendingFrame = requestAnimationFrame(() => {
    const [w,h,ratio] = formats[state.format];
    const stage = byId('stage');
    const scale = Math.min((stage.clientWidth-36)/w,(stage.clientHeight-36)/h);
    if (scale <= 0) return;
    const cssWidth = Math.round(w*scale), cssHeight = Math.round(h*scale);
    const resolution = Math.min(2,devicePixelRatio);
    canvas.width = Math.round(cssWidth*resolution);
    canvas.height = Math.round(cssHeight*resolution);
    canvas.style.width = cssWidth+'px';
    canvas.style.height = cssHeight+'px';
    renderCover(canvas,state,library);
    byId('spec').textContent = w+' × '+h+'  /  '+ratio+'  /  '+state.grade.toUpperCase();
  });
}

function refreshFraming() {
  const crop = state.panels[state.selected];
  const panels = panelGeometry();
  byId('panel-picker').replaceChildren(...panels.map((_,i) => {
    const button = makeButton(String(i+1),() => selectPanel(i));
    button.setAttribute('aria-label','Panel '+(i+1));
    button.setAttribute('aria-pressed',String(i===state.selected));
    return button;
  }));
  byId('zoom').value = crop.zoom;
  byId('pan-x').value = crop.x;
  byId('pan-y').value = crop.y;
  for (const button of document.querySelectorAll('[data-photo]')) {
    button.setAttribute('aria-pressed',String(button.dataset.photo===crop.photo));
  }
}

function selectPanel(index) {
  state.selected = index;
  refreshFraming();
}

function refreshOptions() {
  for (const [field,value] of Object.entries({layout:state.layout,grade:state.grade,format:state.format,preset:state.preset})) {
    document.querySelectorAll('[data-'+field+']').forEach(button => {
      button.setAttribute('aria-pressed',String(button.dataset[field]===value));
    });
  }
  refreshFraming();
  schedulePreview();
}

function applyMoodPreset(name) {
  const preset = presets[name];
  Object.assign(state,{
    preset:name,layout:preset.layout,grade:preset.grade,title:[...preset.title,''],
    subtitle:preset.subtitle,tagline:preset.tagline,issue:preset.issue,sticker:preset.sticker,
    styles:[...preset.colors,'#fff3d8'].map((color,i) => ({font:i===2 ? 'Archivo Black' : 'Anton',color})),
    tracking:0,gradient:true,outline:true,shadow:true,uppercase:true,selected:0,
    panels:Array.from({length:5},(_,i) => framing(preset.photos[i%preset.photos.length]))
  });
  buildLetteringControls();
  refreshOptions();
}

function photoButton(id,name,action,showLabel = true) {
  const button = makeButton('',action,'thumb');
  button.title = name;
  button.setAttribute('aria-label',name);
  const thumbnail = document.createElement('img');
  thumbnail.src = library.get(id).image.src;
  thumbnail.alt = '';
  const focus = library.get(id).focus;
  thumbnail.style.objectPosition = (focus.x*100)+'% '+(focus.face ? Math.max(4,focus.y*100-18) : focus.y*100)+'%';
  button.append(thumbnail);
  if (showLabel) {
    const label = document.createElement('span');
    label.textContent = name;
    button.append(label);
  }
  return button;
}

function populatePhotoLibrary() {
  for (const id of ['library','tray']) {
    byId(id).replaceChildren(...[...library].reverse().map(([key,photo]) => {
      const button = photoButton(key,photo.name,() => {
        state.panels[state.selected] = framing(key);
        refreshFraming();
        schedulePreview();
      },id==='library');
      button.dataset.photo = key;
      return button;
    }));
  }
}

async function loadLocalPhotos(files) {
  const results = await Promise.allSettled([...files].map(async file => {
    const url = URL.createObjectURL(file);
    try {
      const image = await openPhoto(url);
      return {id:url,image,name:file.name,focus:await detectPhotoSubject(image)};
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    }
  }));
  const loaded = results.flatMap(result => result.status==='fulfilled' ? [result.value] : []);
  if (!loaded.length) {
    setStatus('Could not read that image.');
    return;
  }
  loaded.forEach((photo,i) => {
    library.set(photo.id,photo);
    if (i < panelGeometry().length) {
      state.panels[(state.selected+i)%panelGeometry().length] = framing(photo.id);
    }
  });
  populatePhotoLibrary();
  refreshFraming();
  schedulePreview();
  setStatus(loaded.length+' photo'+(loaded.length===1?'':'s')+' loaded');
}

function buildLetteringControls() {
  const target = byId('type-fields');
  target.replaceChildren();
  function field(label,kind,value,update,maxLength) {
    const wrapper = document.createElement('label');
    wrapper.textContent = label;
    const input = document.createElement('input');
    input.type = kind;
    if (maxLength) input.maxLength = maxLength;
    if (kind==='checkbox') input.checked = value;
    else input.value = value;
    input.addEventListener('input',() => {
      update(kind==='checkbox' ? input.checked : input.value);
      schedulePreview();
    });
    wrapper.append(input);
    return wrapper;
  }
  state.title.forEach((line,i) => {
    const row = document.createElement('div');
    row.className = 'type-line';
    row.append(
      field('Line '+(i+1),'text',line,value => {state.title[i]=value;},32),
      field('Ink','color',state.styles[i].color,value => {state.styles[i].color=value;})
    );
    const font = document.createElement('select');
    font.setAttribute('aria-label','Line '+(i+1)+' font');
    for (const family of ['Anton','Archivo Black']) font.add(new Option(family,family));
    font.value = state.styles[i].font;
    font.onchange = () => {state.styles[i].font=font.value; schedulePreview();};
    row.append(font);
    target.append(row);
  });
  for (const [key,label,max] of [['subtitle','Subtitle',44],['tagline','Tagline',54],['location','Location',36],['issue','Issue number',5],['sticker','Sticker',20]]) {
    target.append(field(label,'text',state[key],value => {state[key]=value;},max));
  }
  const tracking = field('Tracking','range',state.tracking,value => {state.tracking=Number(value);});
  const slider = tracking.querySelector('input');
  slider.min = -5;
  slider.max = 14;
  slider.value = state.tracking;
  target.append(tracking);
  const flags = document.createElement('div');
  flags.className = 'type-flags';
  for (const key of ['gradient','outline','shadow','uppercase']) {
    flags.append(field(key,'checkbox',state[key],value => {state[key]=value;}));
  }
  target.append(flags);
}

function buildEditorControls() {
  for (const [name,preset] of Object.entries(presets)) {
    const moodThumbnail = { 'Neon Nights':'neon', 'Beach Noir':'pier', 'Neon Getaway':'city', 'Coastal Cruise':'beach' };
    const button = photoButton(moodThumbnail[name] ?? preset.photos[0],name,() => applyMoodPreset(name));
    const [filter] = grades[preset.grade]();
    button.querySelector('img').style.filter = filter;
    button.dataset.preset = name;
    byId('presets').append(button);
  }
  for (const [name,layout] of Object.entries(layouts)) {
    const button = makeButton(name,() => {
      state.layout = name;
      state.selected = 0;
      refreshOptions();
    },'layout');
    button.dataset.layout = name;
    const ns = 'http://www.w3.org/2000/svg';
    const icon = document.createElementNS(ns,'svg');
    icon.setAttribute('viewBox','0 0 1 1');
    icon.setAttribute('preserveAspectRatio','none');
    icon.setAttribute('aria-hidden','true');
    for (const panel of layout(true)) {
      const polygon = document.createElementNS(ns,'polygon');
      polygon.setAttribute('points',panel.map(point => point.join(',')).join(' '));
      icon.append(polygon);
    }
    button.prepend(icon);
    byId('layouts').append(button);
  }
  for (const [name,grade] of Object.entries(grades)) {
    const button = makeButton(name,() => {state.grade=name; refreshOptions();},'grade');
    button.dataset.grade = name;
    const [filter,light,dark] = grade();
    const swatch = document.createElement('i');
    swatch.style.background = 'linear-gradient(110deg,'+light+','+dark+')';
    swatch.style.filter = filter;
    button.prepend(swatch);
    byId('grades').append(button);
  }
  for (const [format,[w,h,ratio]] of Object.entries(formats)) {
    for (const [target,label] of [['formats',ratio],['sizes',format+' · '+w+' × '+h]]) {
      const button = makeButton(label,() => {
        state.format = format;
        refreshOptions();
      });
      button.dataset.format = format;
      button.setAttribute('aria-label',format+' '+ratio);
      byId(target).append(button);
    }
  }
  byId('steps').addEventListener('click',event => {
    const button = event.target.closest('[data-step]');
    if (!button) return;
    document.querySelector('[aria-current="step"]').removeAttribute('aria-current');
    button.setAttribute('aria-current','step');
    document.querySelectorAll('[data-page]').forEach(page => {page.hidden=page.dataset.page!==button.dataset.step;});
  });
  byId('quick-add').onclick = () => byId('upload').click();
  byId('upload').onchange = event => {
    loadLocalPhotos(event.target.files);
    event.target.value = '';
  };
  byId('fill').onclick = () => {
    state.panels = state.panels.map(() => framing(state.panels[state.selected].photo));
    schedulePreview();
  };
  byId('reset').onclick = () => {
    state.panels[state.selected] = framing(state.panels[state.selected].photo);
    refreshFraming();
    schedulePreview();
  };
  for (const [id,key] of [['zoom','zoom'],['pan-x','x'],['pan-y','y']]) {
    byId(id).oninput = event => {
      state.panels[state.selected][key] = Number(event.target.value);
      schedulePreview();
    };
  }
}

function registerPreviewDrag() {
  canvas.onpointerdown = event => {
    const rect = canvas.getBoundingClientRect();
    const [w,h] = formats[state.format];
    const ctx = canvas.getContext('2d');
    const panels = panelGeometry();
    const index = panels.findIndex(points => {
      tracePanel(ctx,points);
      return ctx.isPointInPath((event.clientX-rect.x)*w/rect.width,(event.clientY-rect.y)*h/rect.height);
    });
    if (index<0) return;
    selectPanel(index);
    const bounds = getPanelBounds(panels[index]);
    dragging = {id:event.pointerId,x:event.clientX,y:event.clientY,crop:{...state.panels[index]},
      width:bounds.w/w*rect.width,height:bounds.h/h*rect.height};
    canvas.setPointerCapture(event.pointerId);
  };
  canvas.onpointermove = event => {
    if (!dragging || dragging.id!==event.pointerId) return;
    const crop = state.panels[state.selected];
    crop.x = clamp(dragging.crop.x-(event.clientX-dragging.x)/dragging.width*2,-1,1);
    crop.y = clamp(dragging.crop.y-(event.clientY-dragging.y)/dragging.height*2,-1,1);
    byId('pan-x').value = crop.x;
    byId('pan-y').value = crop.y;
    schedulePreview();
  };
  canvas.onlostpointercapture = () => {dragging = null;};
}

async function exportCoverPng() {
  const button = byId('export');
  button.disabled = true;
  try {
    const output = document.createElement('canvas');
    [output.width,output.height] = formats[state.format];
    const slug = state.title.join(' ').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    renderCover(output,state,library);
    const blob = await new Promise(resolve => output.toBlob(resolve,'image/png'));
    if (!blob) throw new Error('PNG encoding failed');
    const url = URL.createObjectURL(blob);
    const download = document.createElement('a');
    download.href = url;
    download.download = (slug || 'vice-line')+'-'+output.width+'x'+output.height+'.png';
    download.click();
    setTimeout(() => URL.revokeObjectURL(url),12000);
    setStatus('PNG exported · '+output.width+' × '+output.height);
  } catch {
    setStatus('Could not export the cover.');
  } finally {
    button.disabled = false;
  }
}

async function initializeStudio() {
  try {
    const assets = await Promise.all(samplePhotos.map(async ([id,name,url,x,y,face]) =>
      [id,{name,image:await openPhoto(url),focus:{x,y,face}}]));
    assets.forEach(([id,photo]) => library.set(id,photo));
    await Promise.all([document.fonts.load('20px Anton'),document.fonts.load('20px "Archivo Black"')]);
    buildEditorControls();
    populatePhotoLibrary();
    applyMoodPreset('Sunset Heist');
    registerPreviewDrag();
    new ResizeObserver(schedulePreview).observe(byId('stage'));
    byId('export').onclick = exportCoverPng;
    byId('export').disabled = false;
  } catch {
    setStatus('Could not load the studio assets.');
  }
}

initializeStudio();
