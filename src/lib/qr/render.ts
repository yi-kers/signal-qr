import { QrCodeDataType, type QrCodeGenerateResult } from "uqr";
import type { ModuleShape } from "./types";

export type RenderOptions = {
  fg: string;
  bg: string;
  modulePx: number;
  shape: ModuleShape;
};

export function markPixelSize(qr: QrCodeGenerateResult, modulePx: number): number {
  return qr.size * modulePx;
}

export function drawMark(
  canvas: HTMLCanvasElement,
  qr: QrCodeGenerateResult,
  opts: RenderOptions,
): void {
  const px = opts.modulePx;
  const dim = qr.size * px;
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  canvas.width = Math.round(dim * dpr);
  canvas.height = Math.round(dim * dpr);
  canvas.style.width = "100%";
  canvas.style.height = "auto";
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = opts.bg;
  ctx.fillRect(0, 0, dim, dim);
  ctx.fillStyle = opts.fg;
  const radius = opts.shape === "soft" ? Math.max(1, px * 0.28) : 0;

  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (!qr.data[y][x]) continue;
      const type = qr.types[y][x];
      const square =
        opts.shape === "square" ||
        type === QrCodeDataType.Position ||
        type === QrCodeDataType.Alignment;
      if (square || radius === 0) {
        ctx.fillRect(x * px, y * px, px, px);
      } else {
        roundRect(ctx, x * px, y * px, px, px, radius);
        ctx.fill();
      }
    }
  }
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderSvg(qr: QrCodeGenerateResult, opts: RenderOptions): string {
  const px = opts.modulePx;
  const dim = qr.size * px;
  const radius = opts.shape === "soft" ? Math.max(1, px * 0.28) : 0;

  const bg = escapeHtml(opts.bg);
  const fg = escapeHtml(opts.fg);

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" width="${dim}" height="${dim}" shape-rendering="crispEdges">`,
    `<rect width="${dim}" height="${dim}" fill="${bg}"/>`,
  ];
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (!qr.data[y][x]) continue;
      const type = qr.types[y][x];
      const square =
        opts.shape === "square" ||
        type === QrCodeDataType.Position ||
        type === QrCodeDataType.Alignment ||
        radius === 0;
      if (square) {
        parts.push(`<rect x="${x * px}" y="${y * px}" width="${px}" height="${px}" fill="${fg}"/>`);
      } else {
        parts.push(
          `<rect x="${x * px}" y="${y * px}" width="${px}" height="${px}" rx="${radius}" ry="${radius}" fill="${fg}"/>`,
        );
      }
    }
  }
  parts.push("</svg>");
  return parts.join("");
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("PNG encode failed"));
    }, "image/png");
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function slugFilename(title: string): string {
  const slug =
    title
      .toLowerCase()
      .replace(/https?:\/\//, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "mark";
  return `signal-${slug}`;
}
