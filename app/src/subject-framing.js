export const clamp = (v,min,max) => Math.max(min, Math.min(max,v));

export async function detectPhotoSubject(image) {
  if ('FaceDetector' in globalThis) {
    try {
      const faces = await new FaceDetector({maxDetectedFaces: 4, fastMode: true}).detect(image);
      if (faces.length) {
        const face = faces.sort((a,b) => b.boundingBox.width-a.boundingBox.width)[0].boundingBox;
        return {x:(face.x+face.width/2)/image.width,y:(face.y+face.height/2)/image.height,face:true};
      }
    } catch { /* Use the local contrast map when native face detection is unavailable. */ }
  }
  const sample = document.createElement('canvas');
  sample.width = sample.height = 48;
  const ctx = sample.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(image,0,0,48,48);
  const {data} = ctx.getImageData(0,0,48,48);
  let sum = 0, sx = 0, sy = 0;
  const luminance = i => .2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
  for (let y=4;y<44;y++) {
    for (let x=4;x<44;x++) {
      const i = (y*48+x)*4;
      const edges = Math.abs(luminance(i+4)-luminance(i-4))+Math.abs(luminance(i+192)-luminance(i-192));
      const weight = (edges+3)**1.25 * Math.exp(-((x-24)**2+(y-22)**2)/420);
      sum += weight;
      sx += weight*x;
      sy += weight*y;
    }
  }
  return {x:sx/sum/48,y:sy/sum/48,face:false};
}

export function framePhotoInPanel(photo, crop, bounds) {
  const {image,focus} = photo;
  const {x,y,w,h} = bounds;
  const scale = Math.max(w/image.width,h/image.height)*crop.zoom;
  const width = image.width*scale, height = image.height*scale;
  const targetX = focus.face ? .5 : (focus.x < .46 ? .39 : focus.x > .54 ? .61 : .5);
  const targetY = focus.face ? .31 : (focus.y < .46 ? .39 : focus.y > .54 ? .61 : .5);
  const left = clamp(w*targetX-width*focus.x,-(width-w),0);
  const top = clamp(h*targetY-height*focus.y,-(height-h),0);
  const adjust = (base,range,offset) => offset < 0 ? base*(1+offset) : base-(range+base)*offset;
  return [x+adjust(left,width-w,crop.x), y+adjust(top,height-h,crop.y),width,height];
}
