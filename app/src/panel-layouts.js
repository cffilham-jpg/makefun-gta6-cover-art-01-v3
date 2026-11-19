const polygon = (...points) => points;
const box = (x, y, w, h) => polygon([x,y],[x+w,y],[x+w,y+h],[x,y+h]);

export function renderHeroLayout(wide) {
  return wide ? [
    polygon([.36,0],[.79,0],[.7,1],[.27,1]),
    polygon([0,0],[.36,0],[.32,.49],[0,.44]),
    polygon([0,.44],[.32,.49],[.27,1],[0,1]),
    polygon([.79,0],[1,0],[1,.54],[.75,.49]),
    polygon([.75,.49],[1,.54],[1,1],[.7,1])
  ] : [
    polygon([.22,0],[1,0],[1,.69],[.11,.77]),
    polygon([0,0],[.22,0],[.17,.43],[0,.48]),
    polygon([0,.48],[.17,.43],[.11,.77],[0,.78]),
    polygon([0,.78],[.52,.731],[.47,1],[0,1]),
    polygon([.52,.731],[1,.69],[1,1],[.47,1])
  ];
}
export function renderPosterGridLayout() {
  return [box(0,0,.58,.53),box(.58,0,.42,.53),box(0,.53,.42,.47),box(.42,.53,.58,.47)];
}
export function renderTriptychLayout(wide) {
  return wide ? [box(.23,0,.54,1),box(0,0,.23,1),box(.77,0,.23,1)]
    : [box(0,.25,1,.5),box(0,0,1,.25),box(0,.75,1,.25)];
}
export function renderQuadLayout() {
  return [box(0,0,.5,.5),box(.5,0,.5,.5),box(0,.5,.5,.5),box(.5,.5,.5,.5)];
}
export function renderStripLayout() {
  return [box(0,0,1,.48),box(0,.48,1,.28),box(0,.76,1,.24)];
}
export function renderDuoLayout(wide) {
  return wide ? [box(.41,0,.59,1),box(0,0,.41,1)] : [box(0,0,1,.62),box(0,.62,1,.38)];
}
export function renderDiagonalSplitLayout() {
  return [polygon([.48,0],[1,0],[1,1],[.18,1]),polygon([0,0],[.48,0],[.18,1],[0,1])];
}
export function renderFilmStripLayout() {
  return [box(0,0,1,.69), ...Array.from({length:4}, (_,i) => box(i/4,.69,.25,.31))];
}
export const layouts = {
  Hero: renderHeroLayout, 'Poster 2x2': renderPosterGridLayout, Triptych: renderTriptychLayout,
  Quad: renderQuadLayout, Strip: renderStripLayout, Duo: renderDuoLayout,
  'Diagonal Split': renderDiagonalSplitLayout, 'Film Strip': renderFilmStripLayout
};
