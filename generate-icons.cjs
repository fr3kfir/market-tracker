const zlib = require('zlib');
const fs = require('fs');

function uint32BE(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n, 0);
  return b;
}

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const byte of buf) {
    c ^= byte;
    for (let i = 0; i < 8; i++) c = (c & 1) ? (c >>> 1) ^ 0xEDB88320 : c >>> 1;
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.concat([t, data]);
  return Buffer.concat([uint32BE(data.length), t, data, uint32BE(crc32(crcBuf))]);
}

function makePNG(size) {
  // Background: #0d1117 (dark) with a centered blue square as logo
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);

  const ihdr = chunk('IHDR', Buffer.concat([
    uint32BE(size), uint32BE(size),
    Buffer.from([8, 2, 0, 0, 0])  // 8-bit RGB
  ]));

  // Draw each pixel
  const pad = Math.floor(size * 0.2);
  const lines = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3);
    row[0] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      let r, g, b;
      const inLogo = x >= pad && x < size - pad && y >= pad && y < size - pad;
      if (inLogo) {
        // Blue inner square (#1d4ed8)
        const cx = size / 2, cy = size / 2;
        const inner = Math.floor(size * 0.18);
        const inInner = Math.abs(x - cx) < inner && Math.abs(y - cy) < inner;
        if (inInner) {
          r = 59; g = 130; b = 246; // #3b82f6
        } else {
          r = 29; g = 78; b = 216;  // #1d4ed8
        }
      } else {
        r = 13; g = 17; b = 23;    // #0d1117 background
      }
      row[1 + x * 3] = r;
      row[2 + x * 3] = g;
      row[3 + x * 3] = b;
    }
    lines.push(row);
  }

  const raw = Buffer.concat(lines);
  const compressed = zlib.deflateSync(raw, { level: 9 });
  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

fs.writeFileSync('public/icon-192.png', makePNG(192));
fs.writeFileSync('public/icon-512.png', makePNG(512));
console.log('✓ icon-192.png and icon-512.png generated');
