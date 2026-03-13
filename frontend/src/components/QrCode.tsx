import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Printer, Download, QrCode as QrCodeIcon } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

/* ──────────────────────────────────────────────────────────────────────────
 * Minimal QR code encoder (alphanumeric Mode 2, version 2, ECC-L).
 * Encodes up to ~47 alphanumeric chars into a 25x25 module matrix.
 * For longer URLs we gracefully fall back to the qrserver.com API image.
 * ────────────────────────────────────────────────────────────────────────── */

const ALPHANUMERIC_TABLE = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

function canEncodeAlphanumeric(text: string): boolean {
  return text.split('').every((ch) => ALPHANUMERIC_TABLE.includes(ch.toUpperCase()));
}

// ── Reed-Solomon GF(256) helpers ────────────────────────────────────────
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(nsym: number): Uint8Array {
  let g = new Uint8Array([1]);
  for (let i = 0; i < nsym; i++) {
    const ng = new Uint8Array(g.length + 1);
    for (let j = g.length - 1; j >= 0; j--) {
      ng[j + 1] ^= g[j];
      ng[j] ^= gfMul(g[j], GF_EXP[i]);
    }
    g = ng;
  }
  return g;
}

function rsEncode(data: Uint8Array, nsym: number): Uint8Array {
  const gen = rsGeneratorPoly(nsym);
  const out = new Uint8Array(data.length + nsym);
  out.set(data);
  for (let i = 0; i < data.length; i++) {
    const coef = out[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        out[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return out.slice(data.length);
}

// ── Bit buffer ──────────────────────────────────────────────────────────
class BitBuffer {
  buffer: number[] = [];
  length = 0;
  put(num: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      this.buffer.push((num >>> i) & 1);
      this.length++;
    }
  }
}

// ── QR matrix generation (Version 2, 25x25, ECC-L) ─────────────────────
function generateQrMatrix(text: string): number[][] | null {
  const upper = text.toUpperCase();
  if (!canEncodeAlphanumeric(upper) || upper.length > 47) return null;

  // Encode alphanumeric data
  const buf = new BitBuffer();
  buf.put(0b0010, 4); // mode: alphanumeric
  buf.put(upper.length, 9); // char count (9 bits for version 2)

  for (let i = 0; i < upper.length; i += 2) {
    if (i + 1 < upper.length) {
      const v = ALPHANUMERIC_TABLE.indexOf(upper[i]) * 45 + ALPHANUMERIC_TABLE.indexOf(upper[i + 1]);
      buf.put(v, 11);
    } else {
      buf.put(ALPHANUMERIC_TABLE.indexOf(upper[i]), 6);
    }
  }
  buf.put(0, 4); // terminator

  // Version 2, ECC-L: 34 total codewords, 7 EC codewords
  const totalCodewords = 34;
  const ecCodewords = 7;
  const dataCodewords = totalCodewords - ecCodewords;

  // Pad to byte boundary
  while (buf.length % 8 !== 0) buf.put(0, 1);

  // Convert to bytes
  const dataBytes = new Uint8Array(dataCodewords);
  for (let i = 0; i < dataCodewords; i++) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      const idx = i * 8 + j;
      byte = (byte << 1) | (idx < buf.length ? buf.buffer[idx] : 0);
    }
    dataBytes[i] = byte;
  }

  // Pad codewords
  let padIdx = Math.ceil(buf.length / 8);
  let padToggle = false;
  while (padIdx < dataCodewords) {
    dataBytes[padIdx++] = padToggle ? 17 : 236;
    padToggle = !padToggle;
  }

  // RS error correction
  const ecBytes = rsEncode(dataBytes, ecCodewords);
  const codewords = new Uint8Array(totalCodewords);
  codewords.set(dataBytes);
  codewords.set(ecBytes, dataCodewords);

  // Build 25x25 matrix
  const size = 25;
  const matrix: number[][] = Array.from({ length: size }, () => Array(size).fill(-1));
  const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Finder patterns
  function placeFinderPattern(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const mr = row + r;
        const mc = col + c;
        if (mr < 0 || mr >= size || mc < 0 || mc >= size) continue;
        if ((r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
            (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          matrix[mr][mc] = 1;
        } else {
          matrix[mr][mc] = 0;
        }
        reserved[mr][mc] = true;
      }
    }
  }

  placeFinderPattern(0, 0);
  placeFinderPattern(0, size - 7);
  placeFinderPattern(size - 7, 0);

  // Alignment pattern (Version 2: at [18,18])
  const aRow = 18, aCol = 18;
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const mr = aRow + r;
      const mc = aCol + c;
      if (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) {
        matrix[mr][mc] = 1;
      } else {
        matrix[mr][mc] = 0;
      }
      reserved[mr][mc] = true;
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0 ? 1 : 0;
    reserved[6][i] = true;
    matrix[i][6] = i % 2 === 0 ? 1 : 0;
    reserved[i][6] = true;
  }

  // Dark module
  matrix[size - 8][8] = 1;
  reserved[size - 8][8] = true;

  // Reserve format info areas
  for (let i = 0; i < 8; i++) {
    reserved[8][i] = true;
    reserved[8][size - 1 - i] = true;
    reserved[i][8] = true;
    reserved[size - 1 - i][8] = true;
  }
  reserved[8][8] = true;

  // Place data bits
  const dataBits: number[] = [];
  for (const byte of codewords) {
    for (let b = 7; b >= 0; b--) dataBits.push((byte >>> b) & 1);
  }

  let bitIdx = 0;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // skip timing column
    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);
    for (const row of rows) {
      for (const col of [right, right - 1]) {
        if (!reserved[row][col]) {
          matrix[row][col] = bitIdx < dataBits.length ? dataBits[bitIdx++] : 0;
        }
      }
    }
    upward = !upward;
  }

  // Apply mask 0 (checkerboard: (row + col) % 2 === 0)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c]) {
        if ((r + c) % 2 === 0) matrix[r][c] ^= 1;
      }
    }
  }

  // Format info for mask 0, ECC-L: pre-computed = 0x77C4
  const formatBits = 0x77C4;
  // Horizontal (row 8)
  const hPos = [0, 1, 2, 3, 4, 5, 7, 8, size - 8, size - 7, size - 6, size - 5, size - 4, size - 3, size - 2];
  for (let i = 0; i < 15; i++) {
    matrix[8][hPos[i]] = (formatBits >>> (14 - i)) & 1;
  }
  // Vertical (col 8)
  const vPos = [size - 1, size - 2, size - 3, size - 4, size - 5, size - 6, size - 7, size - 8, 7, 5, 4, 3, 2, 1, 0];
  for (let i = 0; i < 15; i++) {
    matrix[vPos[i]][8] = (formatBits >>> (14 - i)) & 1;
  }

  return matrix;
}

// ── Draw QR on canvas ───────────────────────────────────────────────────
function drawQrOnCanvas(canvas: HTMLCanvasElement, matrix: number[][], moduleSize: number, margin: number) {
  const size = matrix.length;
  const canvasSize = size * moduleSize + margin * 2;
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  ctx.fillStyle = '#000000';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1) {
        ctx.fillRect(margin + c * moduleSize, margin + r * moduleSize, moduleSize, moduleSize);
      }
    }
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * QrCodeModal — shows QR code in a modal with print / download buttons
 * ────────────────────────────────────────────────────────────────────────── */

interface QrCodeModalProps {
  open: boolean;
  onClose: () => void;
  /** URL to encode */
  url: string;
  /** Label shown below the code (e.g. equipment name) */
  label: string;
  /** Secondary label (e.g. serial number / code) */
  sublabel?: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ open, onClose, url, label, sublabel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    if (!open) return;
    const matrix = generateQrMatrix(url);
    if (matrix && canvasRef.current) {
      drawQrOnCanvas(canvasRef.current, matrix, 8, 16);
      setUseFallback(false);
    } else {
      setUseFallback(true);
    }
  }, [open, url]);

  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let imgHtml: string;
    if (!useFallback && canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      imgHtml = `<img src="${dataUrl}" width="240" height="240" />`;
    } else {
      const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`;
      imgHtml = `<img src="${apiUrl}" width="240" height="240" />`;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>QR — ${label}</title>
      <style>
        body { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; margin:0; font-family:system-ui,sans-serif; }
        .label { font-size:18px; font-weight:600; margin-top:16px; }
        .sub { font-size:14px; color:#666; margin-top:4px; }
      </style></head>
      <body>
        ${imgHtml}
        <div class="label">${label}</div>
        ${sublabel ? `<div class="sub">${sublabel}</div>` : ''}
        <script>window.onload=function(){window.print();}</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }, [url, label, sublabel, useFallback]);

  const handleDownload = useCallback(() => {
    if (!useFallback && canvasRef.current) {
      const link = document.createElement('a');
      link.download = `qr-${sublabel ?? 'code'}.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    } else {
      const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&data=${encodeURIComponent(url)}`;
      const link = document.createElement('a');
      link.download = `qr-${sublabel ?? 'code'}.png`;
      link.href = apiUrl;
      link.target = '_blank';
      link.click();
    }
  }, [url, sublabel, useFallback]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className={cn(
          'relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4',
          'animate-fade-in',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          {t('fleet.qr.title')}
        </h3>

        {/* QR Code */}
        <div className="flex flex-col items-center gap-3 mb-6">
          {useFallback ? (
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`}
              alt="QR Code"
              width={200}
              height={200}
              className="rounded-lg border border-neutral-200 dark:border-neutral-700"
            />
          ) : (
            <canvas
              ref={canvasRef}
              className="rounded-lg border border-neutral-200 dark:border-neutral-700"
              style={{ width: 200, height: 200 }}
            />
          )}
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 text-center">{label}</p>
          {sublabel && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">{sublabel}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth iconLeft={<Printer size={16} />} onClick={handlePrint}>
            {t('fleet.qr.print')}
          </Button>
          <Button variant="secondary" fullWidth iconLeft={<Download size={16} />} onClick={handleDownload}>
            {t('fleet.qr.download')}
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────────────
 * QrCodeButton — a convenience wrapper to place in page headers
 * ────────────────────────────────────────────────────────────────────────── */

interface QrCodeButtonProps {
  url: string;
  label: string;
  sublabel?: string;
}

export const QrCodeButton: React.FC<QrCodeButtonProps> = ({ url, label, sublabel }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" size="sm" iconLeft={<QrCodeIcon size={16} />} onClick={() => setOpen(true)}>
        QR
      </Button>
      <QrCodeModal open={open} onClose={() => setOpen(false)} url={url} label={label} sublabel={sublabel} />
    </>
  );
};
