export function gradeSunsetFilm() { return ['contrast(1.19) saturate(1.45) sepia(.14)', '#ffb15c', '#632777']; }
export function gradeElectricFilm() { return ['brightness(1.15) contrast(1.24) saturate(1.65)', '#77dfff', '#b728a1']; }
export function gradeGoldFilm() { return ['contrast(1.15) sepia(.55) saturate(1.45)', '#ffcb6b', '#8c5528']; }
export function gradeViceFilm() { return ['contrast(1.22) saturate(1.55) hue-rotate(-12deg)', '#ff9b9a', '#472590']; }
export function gradeNoirFilm() { return ['grayscale(1) contrast(1.28) brightness(.91)', '#cbd5e7', '#24314c']; }
export function gradeHeatFilm() { return ['sepia(.28) contrast(1.34) saturate(1.7)', '#ff8546', '#a52438']; }
export function gradeMiamiPinkFilm() { return ['contrast(1.1) saturate(1.38) hue-rotate(-23deg)', '#ff97da', '#a02a83']; }
export function gradeTealNightFilm() { return ['brightness(.85) contrast(1.23) saturate(1.35) hue-rotate(15deg)', '#75ffe4', '#16596c']; }

export const grades = {
  Sunset: gradeSunsetFilm, Electric: gradeElectricFilm, Gold: gradeGoldFilm, Vice: gradeViceFilm,
  Noir: gradeNoirFilm, Heat: gradeHeatFilm, 'Miami Pink': gradeMiamiPinkFilm, 'Teal Night': gradeTealNightFilm
};
