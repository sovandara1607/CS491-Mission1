'use client';

import React, { useMemo } from 'react';
import { ShieldCheck, Smartphone, Copy, Check } from 'lucide-react';

interface KhqrCardProps {
  amountUsd: number;
  orderRef?: string;
}

// Deterministic decorative QR matrix seeded by amount + ref for visual preview
function generateQrMatrix(seedStr: string): boolean[][] {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[r0 + r][c0 + c] = isBorder || isCenter;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTL = r < 8 && c < 8;
      const inTR = r < 8 && c >= size - 8;
      const inBL = r >= size - 8 && c < 8;
      const inCenterBadge = r >= 8 && r <= 12 && c >= 8 && c <= 12;
      if (inTL || inTR || inBL || inCenterBadge) continue;
      hash = Math.imul(hash ^ (r * 31 + c * 17), 16777619);
      grid[r][c] = ((hash >>> 0) % 100) < 48;
    }
  }
  return grid;
}

export default function KhqrCard({ amountUsd, orderRef = 'NOVAMART' }: KhqrCardProps) {
  const [copied, setCopied] = React.useState(false);
  const amountKhr = Math.round(amountUsd * 4100);
  const matrix = useMemo(() => generateQrMatrix(`${orderRef}:${amountUsd.toFixed(2)}`), [orderRef, amountUsd]);

  const handleCopyAccount = () => {
    try {
      navigator.clipboard.writeText('003 482 910');
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <div className="border border-[var(--line-strong)] bg-[#0c0d12] overflow-hidden font-mono">
      {/* KHQR Header Bar */}
      <div className="bg-[#E1232E] px-3.5 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <span className="font-extrabold tracking-widest text-xs">KHQR</span>
          <span className="text-[10px] opacity-85 border-l border-white/30 pl-2">ABA / BAKONG</span>
        </div>
        <span className="text-[10px] font-bold bg-black/25 px-1.5 py-0.5">USD</span>
      </div>

      {/* Merchant & Amount */}
      <div className="p-3.5 border-b border-dashed border-[var(--line-strong)] flex items-center justify-between gap-2 bg-[#12141b]">
        <div>
          <span className="text-[10px] text-[var(--subtle)] block uppercase">Merchant</span>
          <span className="text-xs font-bold text-white">NovaMart Hardware KH</span>
        </div>
        <div className="text-right">
          <span className="text-base font-bold text-white block">${amountUsd.toFixed(2)}</span>
          <span className="text-[10px] text-[var(--subtle)]">≈ {amountKhr.toLocaleString()} KHR</span>
        </div>
      </div>

      {/* QR Code & Account Details */}
      <div className="p-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="bg-white p-2 flex-shrink-0 relative">
          <svg width="112" height="112" viewBox="0 0 21 21" shapeRendering="crispEdges" aria-label="ABA KHQR Payment Code">
            <rect width="21" height="21" fill="#ffffff" />
            {matrix.map((row, r) =>
              row.map((cell, c) =>
                cell ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#0c0d12" /> : null
              )
            )}
            <rect x="8.2" y="8.2" width="4.6" height="4.6" fill="#0c0d12" />
            <text x="10.5" y="11.6" textAnchor="middle" fill="#ffffff" fontSize="3.2" fontWeight="bold">$</text>
          </svg>
        </div>

        <div className="flex-1 space-y-2 text-[11px] w-full">
          <p className="text-[var(--muted)] leading-relaxed font-sans text-xs">
            Scan with <strong className="text-white">ABA Mobile</strong>, ACLEDA, Wing, or any Bakong app — or scan directly with our courier upon delivery.
          </p>

          <div className="flex items-center justify-between p-2 border border-[var(--line)] bg-[var(--input-bg)]">
            <div>
              <span className="text-[9px] text-[var(--subtle)] block">ABA ACCOUNT (USD)</span>
              <span className="text-xs text-white font-bold">003 482 910</span>
            </div>
            <button
              type="button"
              onClick={handleCopyAccount}
              className="px-2 py-1 border border-[var(--line)] hover:border-white text-[10px] text-[var(--muted)] hover:text-white transition flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3 text-[var(--accent-green)]" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-[var(--accent-green)]">
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Zero fee • Instant confirmation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
