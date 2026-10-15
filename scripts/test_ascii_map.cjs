function isLand(lat, lon) {
  while (lon > 180) lon -= 360;
  while (lon < -180) lon += 360;

  if (lat < -62) return 'ice';
  if (lat > 78) return 'ice';
  if (lat >= 60 && lat <= 83 && lon >= -55 && lon <= -18) return 'ice';

  // Australia
  if (lat >= -39 && lat <= -11 && lon >= 113 && lon <= 154) {
    if (lat < -32 && lon > 115 && lon < 132) return 'ocean';
    return 'land';
  }
  // New Zealand
  if (lat >= -47 && lat <= -34 && lon >= 165 && lon <= 179) return 'land';

  // Africa
  if (lat >= -35 && lat <= 37 && lon >= -18 && lon <= 52) {
    if (lat > 32 && lon < -5) return 'ocean';
    if (lat > 30 && lon > 10 && lon < 25 && lat < 34) return 'ocean';
    if (lat < 12 && lon > 48) return 'ocean';
    if (lat < -10 && lon < 11) return 'ocean';
    if (lat < -20 && lon < 14) return 'ocean';
    if (lat < -30 && lon > 33) return 'ocean';
    return (lat > 15 && lat < 30 && lon > -10 && lon < 35) ? 'desert' : 'land';
  }
  if (lat >= -26 && lat <= -12 && lon >= 43 && lon <= 51) return 'land'; // Madagascar

  // South America
  if (lat >= -56 && lat <= 13 && lon >= -82 && lon <= -34) {
    if (lat < -18 && lon > -55 && lon < -40 && lat < -40) return 'ocean';
    if (lat < -40 && lon > -60) return 'ocean';
    if (lat > 8 && lon < -78) return 'ocean';
    if (lat < -20 && lon < -72) return 'ocean';
    return 'land';
  }

  // North America
  if (lat >= 7 && lat <= 72 && lon >= -168 && lon <= -52) {
    if (lat >= 55 && lon < -130) return 'land';
    if (lat >= 24 && lat <= 70 && lon >= -130 && lon <= -65) {
      if (lat >= 20 && lat <= 30 && lon >= -97 && lon <= -82) return 'ocean';
      if (lat >= 52 && lat <= 65 && lon >= -95 && lon <= -78) return 'ocean';
      return 'land';
    }
    if (lat >= 8 && lat <= 32 && lon >= -116 && lon <= -76) {
      if (lat < 16 && (lon < -93 || lon > -82)) return 'ocean';
      return 'land';
    }
  }

  // Europe
  if (lat >= 35 && lat <= 71 && lon >= -10 && lon <= 45) {
    if (lat >= 50 && lat <= 60 && lon >= -11 && lon <= 2) return 'land';
    if (lat >= 55 && lat <= 71 && lon >= 4 && lon <= 32) return 'land';
    if (lat >= 34 && lat <= 43 && lon >= -2 && lon <= 26 && !(lat > 39 && lon > 8 && lon < 18)) return 'ocean';
    return 'land';
  }

  // India & South Asia
  if (lat >= 6 && lat <= 36 && lon >= 67 && lon <= 92) {
    if (lat < 22) {
      const centerLon = 78.5;
      const halfWidth = 4 + (lat - 6) * 0.55;
      if (Math.abs(lon - centerLon) > halfWidth) return 'ocean';
    }
    return 'land';
  }

  // Arabia
  if (lat >= 12 && lat <= 34 && lon >= 35 && lon <= 60) {
    if (lat >= 24 && lat <= 30 && lon >= 48 && lon <= 56) return 'ocean';
    return 'desert';
  }

  // Asia
  if (lat >= -10 && lat <= 78 && lon >= 45 && lon <= 180) {
    if (lat >= 30 && lat <= 46 && lon >= 128 && lon <= 146) return 'land';
    if (lat >= 50 && lat <= 78 && lon >= 45 && lon <= 180) return 'land';
    if (lat >= 20 && lat <= 50 && lon >= 75 && lon <= 125) {
      return (lat > 35 && lat < 45 && lon > 78 && lon < 95) ? 'desert' : 'land';
    }
    if (lat >= -10 && lat <= 22 && lon >= 95 && lon <= 142) {
      if (lat >= 8 && lat <= 22 && lon >= 98 && lon <= 110) return 'land';
      if (lat >= -8 && lat <= 6 && lon >= 95 && lon <= 120) return 'land';
      if (lat >= 5 && lat <= 19 && lon >= 118 && lon <= 126) return 'land';
      return 'ocean';
    }
  }

  return 'ocean';
}

// Generate ASCII preview 80x30
for (let y = 30; y >= -30; y -= 2) {
  const lat = (y / 30) * 80;
  let line = '';
  for (let x = -80; x <= 80; x += 2) {
    const lon = (x / 80) * 180;
    const t = isLand(lat, lon);
    if (t === 'ice') line += '#';
    else if (t === 'land') line += 'O';
    else if (t === 'desert') line += '=';
    else line += ' ';
  }
  console.log(line);
}
