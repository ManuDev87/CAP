"use client";

import { useCallback, useEffect, useRef } from "react";
import { formatScore } from "@/lib/scoring";
import type { ScoreRecord } from "@/lib/types";

interface StatsChartProps {
  records: ScoreRecord[];
  filterTestId: string;
}

interface ChartBar {
  x: number;
  y: number;
  w: number;
  h: number;
  record: ScoreRecord;
}

const PASS = 50;
const BRAND = "#0A8442";
const BRAND_SOFT = "#379e6d";
const DANGER = "#cc0000";
const DANGER_SOFT = "#e04545";
const INK = "#52616a";
const LINE = "#e2e8ea";

/**
 * Modern rounded bar chart — pass (green) / fail (red),
 * hover tooltips and a horizontally scrollable canvas.
 */
export default function StatsChart({ records, filterTestId }: StatsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<ChartBar[]>([]);

  const filtered =
    filterTestId === "all"
      ? records
      : records.filter((r) => r.testId === filterTestId);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (filtered.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = "none";
      barsRef.current = [];
      return;
    }
    canvas.style.display = "block";

    const wrapper = canvas.parentElement as HTMLElement;
    const containerW = wrapper.clientWidth - 20 || 600;
    const PAD_L = 48;
    const PAD_R = 20;
    const PAD_T = 28;
    const PAD_B = 56;
    const SLOT = 56;
    const minDataW = filtered.length * SLOT;
    const W = Math.max(containerW, minDataW + PAD_L + PAD_R);
    const H = 300;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cW = W - PAD_L - PAD_R;
    const cH = H - PAD_T - PAD_B;
    const yPos = (s: number) =>
      PAD_T + cH - Math.max(0, Math.min(1, s / 100)) * cH;
    const y50 = yPos(PASS);
    const slotW = cW / filtered.length;
    const barW = Math.min(36, Math.max(18, slotW * 0.55));

    ctx.clearRect(0, 0, W, H);

    // Soft zone backgrounds
    roundRect(ctx, PAD_L, PAD_T, cW, y50 - PAD_T, 10);
    ctx.fillStyle = "rgba(10,132,66,0.05)";
    ctx.fill();
    roundRect(ctx, PAD_L, y50, cW, H - PAD_B - y50, 10);
    ctx.fillStyle = "rgba(204,0,0,0.04)";
    ctx.fill();

    // Grid
    ctx.font = "600 11px Lexend, 'Source Sans 3', sans-serif";
    ctx.textAlign = "right";
    for (let y = 0; y <= 100; y += 25) {
      const yp = yPos(y);
      ctx.strokeStyle = y === PASS ? "transparent" : LINE;
      ctx.lineWidth = 1;
      ctx.setLineDash(y === 0 || y === 100 ? [] : [5, 5]);
      ctx.beginPath();
      ctx.moveTo(PAD_L, yp);
      ctx.lineTo(W - PAD_R, yp);
      ctx.stroke();
      ctx.setLineDash([]);
      if (y !== PASS) {
        ctx.fillStyle = "#aeb8bd";
        ctx.fillText(String(y), PAD_L - 10, yp + 4);
      }
    }

    // Pass threshold
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "#db8c34";
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    ctx.moveTo(PAD_L, y50);
    ctx.lineTo(W - PAD_R, y50);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#c47d2e";
    ctx.font = "700 11px Lexend, 'Source Sans 3', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("50", PAD_L - 10, y50 + 4);

    // Bars
    barsRef.current = filtered.map((r, i) => {
      const passed = r.score >= PASS;
      const cx = PAD_L + slotW * i + slotW / 2;
      const top = yPos(r.score);
      const bottom = H - PAD_B;
      const h = Math.max(4, bottom - top);
      const x = cx - barW / 2;
      const radius = Math.min(10, barW / 2);

      const grad = ctx.createLinearGradient(x, top, x, bottom);
      if (passed) {
        grad.addColorStop(0, BRAND_SOFT);
        grad.addColorStop(1, BRAND);
      } else {
        grad.addColorStop(0, DANGER_SOFT);
        grad.addColorStop(1, DANGER);
      }

      // Soft shadow
      ctx.save();
      ctx.shadowColor = passed
        ? "rgba(10,132,66,0.22)"
        : "rgba(204,0,0,0.18)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      roundRect(ctx, x, top, barW, h, radius);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      // Score label above bar
      ctx.fillStyle = passed ? BRAND : DANGER;
      ctx.font = "700 12px Lexend, 'Source Sans 3', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(formatScore(r.score), cx, top - 8);

      // X labels
      ctx.fillStyle = INK;
      ctx.font = "600 10px Lexend, 'Source Sans 3', sans-serif";
      const parts = r.testName ? r.testName.split(" ") : ["?", "?"];
      const abbr =
        (parts[0] || "").substring(0, 3) + " " + (parts[1] || "").slice(-2);
      ctx.fillText(abbr, cx, H - PAD_B + 16);
      ctx.fillStyle = "#aeb8bd";
      ctx.font = "500 10px Lexend, 'Source Sans 3', sans-serif";
      ctx.fillText(`#${i + 1}`, cx, H - PAD_B + 30);

      return { x, y: top, w: barW, h, record: r };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, filterTestId]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const tooltip = tooltipRef.current;
    if (!canvas || !tooltip) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const found =
      barsRef.current.find(
        (b) => mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h
      ) ?? null;

    if (found) {
      const passed = found.record.score >= PASS;
      tooltip.innerHTML = `<strong>${found.record.testName}</strong><br>
        <span style="color:${passed ? BRAND : DANGER}; font-weight:700;">${formatScore(found.record.score)} pts</span>
        &nbsp;${found.record.passed ? "✅ Aprobado" : "❌ Suspenso"}`;
      const W = rect.width;
      const tipX =
        found.x + found.w + 10 > W - 130 ? found.x - 130 : found.x + found.w + 8;
      tooltip.style.left = tipX + "px";
      tooltip.style.top = Math.max(8, found.y - 12) + "px";
      tooltip.classList.remove("hidden");
      canvas.style.cursor = "pointer";
    } else {
      tooltip.classList.add("hidden");
      canvas.style.cursor = "default";
    }
  }

  function handleMouseLeave() {
    tooltipRef.current?.classList.add("hidden");
  }

  return (
    <>
      <div className="chart-wrapper">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="block"
        />
        <div ref={tooltipRef} className="chart-tooltip hidden" />
      </div>
      {filtered.length === 0 && (
        <p className="px-5 py-15 text-center text-sm text-ink-300">
          Aún no hay datos. Completa algún examen y guarda el resultado.
        </p>
      )}
    </>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
