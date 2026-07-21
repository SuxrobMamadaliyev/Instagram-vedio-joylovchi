function parseIntervalToMs(code) {
  const map = {
    '1h': 60 * 60 * 1000,
    '3h': 3 * 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000
  };
  return map[code] || null;
}

function intervalLabel(code) {
  const map = {
    '1h': '1 soat',
    '3h': '3 soat',
    '6h': '6 soat',
    '12h': '12 soat',
    '24h': 'Kunlik (24 soat)'
  };
  return map[code] || code;
}

module.exports = { parseIntervalToMs, intervalLabel };
