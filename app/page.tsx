"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";

type PhaseKey = "kerr" | "storm" | "collapse" | "echo";

type Phase = {
  key: PhaseKey;
  accent: string;
  spread: number;
  spin: number;
  turbulence: number;
  compression: number;
};

type Controls = {
  pointerX: number;
  pointerY: number;
  zoomTarget: number;
};

const phases: Phase[] = [
  { key: "kerr", accent: "#03ffb3", spread: 1, spin: 0.78, turbulence: 0.18, compression: 0.02 },
  { key: "storm", accent: "#ffb34a", spread: 1.12, spin: 1.46, turbulence: 0.78, compression: 0.08 },
  { key: "collapse", accent: "#ff356a", spread: 0.84, spin: 1.16, turbulence: 0.52, compression: 0.38 },
  { key: "echo", accent: "#67dfff", spread: 1.03, spin: 0.5, turbulence: 0.22, compression: 0.06 },
];

function makeBlocks(count: number) {
  return Array.from({ length: count }, () => ({
    angle: Math.random() * Math.PI * 2,
    radius: 0.14 + Math.pow(Math.random(), 0.84) * 0.93,
    speed: 0.11 + Math.random() * 0.66,
    length: 1.4 + Math.random() * 5.2,
    height: 0.4 + Math.random() * 1.5,
    alpha: 0.16 + Math.random() * 0.78,
    offset: Math.random() * Math.PI * 2,
    lane: (Math.random() - 0.5) * 2,
    color: Math.floor(Math.random() * 11),
  }));
}

function BlockPodField({ phase, impulse, controls }: { phase: Phase; impulse: number; controls: MutableRefObject<Controls> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(phase);
  const impulseRef = useRef(impulse);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { impulseRef.current = impulse; }, [impulse]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const stars = Array.from({ length: 230 }, () => ({ x: Math.random(), y: Math.random(), r: 0.22 + Math.random() * 1.18, a: 0.07 + Math.random() * 0.45, phase: Math.random() * Math.PI * 2 }));
    const blocks = makeBlocks(1350);
    const distantBlocks = makeBlocks(150);
    const lensPackets = Array.from({ length: 164 }, () => ({
      lane: Math.floor(Math.random() * 6),
      side: Math.random() > 0.5 ? 1 : -1,
      offset: Math.random(),
      speed: 0.07 + Math.random() * 0.23,
      length: 1.8 + Math.random() * 4.8,
      height: 0.55 + Math.random() * 1.1,
      color: Math.floor(Math.random() * 8),
    }));
    const ejectionPackets = Array.from({ length: 190 }, () => ({
      angle: -Math.PI * 0.5 + (Math.random() - 0.5) * 2.55,
      offset: Math.random(),
      speed: 0.11 + Math.random() * 0.29,
      length: 1.4 + Math.random() * 4.2,
      height: 0.45 + Math.random() * 1.05,
      color: Math.floor(Math.random() * 8),
    }));
    let width = 0;
    let height = 0;
    let ratio = 1;
    let raf = 0;
    let cameraX = 0;
    let cameraY = 0;
    let cameraZoom = 1;
    const brandMark = new Image();
    const tintedMark = document.createElement("canvas");
    tintedMark.width = 260;
    tintedMark.height = 406;
    const tintedMarkContext = tintedMark.getContext("2d");
    let brandMarkReady = false;
    brandMark.onload = () => { brandMarkReady = true; };
    brandMark.src = "/blocpod-logo.svg";

    const drawLedgerCube = (x: number, y: number, size: number, lean: number, color: string, alpha: number) => {
      const depth = size * 0.34;
      context.save();
      context.translate(x, y);
      context.rotate(lean);
      context.globalCompositeOperation = "lighter";
      context.fillStyle = `rgba(${color}, ${alpha})`;
      context.fillRect(-size * 0.5, -size * 0.5, size, size);
      context.fillStyle = `rgba(${color}, ${alpha * 0.42})`;
      context.beginPath();
      context.moveTo(size * 0.5, -size * 0.5);
      context.lineTo(size * 0.5 + depth, -size * 0.5 - depth * 0.58);
      context.lineTo(size * 0.5 + depth, size * 0.5 - depth * 0.58);
      context.lineTo(size * 0.5, size * 0.5);
      context.closePath();
      context.fill();
      context.fillStyle = `rgba(235,255,245, ${alpha * 0.28})`;
      context.beginPath();
      context.moveTo(-size * 0.5, -size * 0.5);
      context.lineTo(-size * 0.5 + depth, -size * 0.5 - depth * 0.58);
      context.lineTo(size * 0.5 + depth, -size * 0.5 - depth * 0.58);
      context.lineTo(size * 0.5, -size * 0.5);
      context.closePath();
      context.fill();
      context.strokeStyle = `rgba(235,255,245, ${alpha * 0.65})`;
      context.lineWidth = Math.max(0.35, size * 0.045);
      context.strokeRect(-size * 0.5, -size * 0.5, size, size);
      context.restore();
    };

    const drawThreeDimensionalMark = (cx: number, cy: number, core: number, time: number, burst: number, lookX: number, lookY: number, tone: string) => {
      if (!brandMarkReady || !tintedMarkContext) return;
      tintedMarkContext.clearRect(0, 0, tintedMark.width, tintedMark.height);
      tintedMarkContext.globalCompositeOperation = "source-over";
      tintedMarkContext.drawImage(brandMark, 0, 0, tintedMark.width, tintedMark.height);
      tintedMarkContext.globalCompositeOperation = "source-atop";
      tintedMarkContext.fillStyle = `rgb(${tone})`;
      tintedMarkContext.fillRect(0, 0, tintedMark.width, tintedMark.height);
      tintedMarkContext.globalCompositeOperation = "source-over";
      const markHeight = core * 1.56;
      const markWidth = markHeight * (130 / 203);
      const yaw = lookX * 0.78 + Math.sin(time * 0.42) * 0.075;
      const pitch = lookY * 0.28 + Math.cos(time * 0.34) * 0.035;
      const extrusion = core * (0.21 + burst * 0.18);
      const slices = 14;

      context.save();
      context.translate(cx, cy + core * 0.015);
      context.transform(1, pitch * 0.12, yaw * 0.19, 1, 0, 0);
      for (let slice = slices; slice > 0; slice -= 1) {
        const depth = slice / slices;
        const offsetX = -yaw * extrusion * slice;
        const offsetY = pitch * extrusion * slice * 0.32;
        context.save();
        context.translate(offsetX, offsetY);
        context.globalAlpha = 0.08 + (1 - depth) * 0.12;
        context.filter = `brightness(${0.18 + (1 - depth) * 0.25}) saturate(1.35)`;
        context.drawImage(tintedMark, -markWidth * 0.5, -markHeight * 0.5, markWidth, markHeight);
        context.restore();
      }
      context.save();
      context.globalAlpha = 1;
      context.filter = `drop-shadow(0 0 9px rgba(${tone},.95)) drop-shadow(0 0 28px rgba(${tone},.55)) brightness(1.08)`;
      context.drawImage(tintedMark, -markWidth * 0.5, -markHeight * 0.5, markWidth, markHeight);
      context.globalAlpha = 0.21;
      context.filter = "brightness(2.1) saturate(.7)";
      context.drawImage(tintedMark, -markWidth * 0.5 - core * 0.012, -markHeight * 0.5 - core * 0.018, markWidth, markHeight);
      context.restore();
      context.restore();
    };

    const cubicPath = (t: number, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
      const inverse = 1 - t;
      const x = inverse ** 3 * x0 + 3 * inverse ** 2 * t * x1 + 3 * inverse * t ** 2 * x2 + t ** 3 * x3;
      const y = inverse ** 3 * y0 + 3 * inverse ** 2 * t * y1 + 3 * inverse * t ** 2 * y2 + t ** 3 * y3;
      const dx = 3 * inverse ** 2 * (x1 - x0) + 6 * inverse * t * (x2 - x1) + 3 * t ** 2 * (x3 - x2);
      const dy = 3 * inverse ** 2 * (y1 - y0) + 6 * inverse * t * (y2 - y1) + 3 * t ** 2 * (y3 - y2);
      return { x, y, dx, dy };
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.max(1, Math.floor(width * ratio));
      canvas.height = Math.max(1, Math.floor(height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (now: number) => {
      const active = phaseRef.current;
      const time = now * 0.001;
      const unit = Math.min(width, height);
      const palette = active.key === "storm"
        ? ["255,177,66", "255,243,190", "137,87,255"]
        : active.key === "collapse"
          ? ["255,52,104", "255,232,190", "255,133,38"]
          : active.key === "echo"
            ? ["80,214,255", "219,255,239", "3,255,179"]
            : ["3,255,179", "219,255,235", "71,176,255"];
      const intensity = active.key === "collapse" ? 1.32 : active.key === "storm" ? 1.18 : active.key === "echo" ? 0.72 : 0.96;
      const burstAge = now - impulseRef.current;
      const burst = burstAge >= 0 && burstAge < 1350 ? Math.pow(1 - burstAge / 1350, 1.65) : 0;

      cameraX += (controls.current.pointerX - cameraX) * 0.045;
      cameraY += (controls.current.pointerY - cameraY) * 0.045;
      cameraZoom += (controls.current.zoomTarget - cameraZoom) * 0.055;
      const cx = width * 0.5 + cameraX * unit * 0.052;
      const cy = height * 0.505 + cameraY * unit * 0.04;
      const disk = unit * 0.59 * active.spread * cameraZoom;
      const core = unit * 0.108 * cameraZoom;

      context.clearRect(0, 0, width, height);
      const voidGradient = context.createRadialGradient(cx, cy, core * 0.2, cx, cy, Math.max(width, height) * 0.83);
      voidGradient.addColorStop(0, "#06090d");
      voidGradient.addColorStop(0.42, "#02050a");
      voidGradient.addColorStop(1, "#010207");
      context.fillStyle = voidGradient;
      context.fillRect(0, 0, width, height);

      stars.forEach((star, index) => {
        const pulse = 0.45 + Math.sin(time * (0.35 + (index % 4) * 0.11) + star.phase) * 0.35;
        context.fillStyle = `rgba(198, 225, 255, ${star.a * pulse})`;
        context.beginPath();
        context.arc(star.x * width, star.y * height, star.r, 0, Math.PI * 2);
        context.fill();
      });

      const fieldGlow = context.createRadialGradient(cx, cy, core * 0.4, cx, cy, disk * 1.12);
      fieldGlow.addColorStop(0, `rgba(${palette[1]}, ${0.29 * intensity})`);
      fieldGlow.addColorStop(0.24, `rgba(${palette[0]}, ${0.15 * intensity})`);
      fieldGlow.addColorStop(0.64, `rgba(${palette[2]}, ${0.052 * intensity})`);
      fieldGlow.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = fieldGlow;
      // Paint through the viewport. Clipping this radial fade to a disk-sized
      // rectangle exposes its horizontal bounds when the camera is zoomed.
      context.fillRect(0, 0, width, height);

      // Information exits the orb, resolves into packets, then gravitates around
      // the upper lens before separating down either side of the NFT universe.
      context.save();
      context.globalCompositeOperation = "lighter";
      lensPackets.forEach((packet) => {
        const travel = (packet.offset + time * packet.speed * (0.72 + active.spin * 0.42)) % 1;
        const lane = packet.lane;
        const side = packet.side;
        const startX = cx + side * core * (0.04 + lane * 0.015);
        const startY = cy - core * (0.1 + lane * 0.035);
        const curve = cubicPath(
          travel,
          startX,
          startY,
          cx + side * core * (0.35 + lane * 0.08),
          cy - disk * (0.31 + lane * 0.028),
          cx + side * disk * (0.26 + lane * 0.075),
          cy - disk * (0.43 + lane * 0.02),
          cx + side * disk * (0.78 + lane * 0.032),
          cy - core * (0.06 + lane * 0.04),
        );
        const color = packet.color < 4 ? palette[1] : packet.color < 6 ? palette[0] : palette[2];
        const fade = Math.sin(travel * Math.PI);
        const packetLength = packet.length * (1.3 + active.spin * 1.6);
        context.save();
        context.translate(curve.x, curve.y);
        context.rotate(Math.atan2(curve.dy, curve.dx));
        context.fillStyle = `rgba(${color}, ${Math.min(0.98, fade * 0.86 * intensity)})`;
        context.fillRect(-packetLength * 0.5, -packet.height * 0.45, packetLength, packet.height);
        context.fillStyle = `rgba(237,255,246, ${fade * 0.58 * intensity})`;
        context.fillRect(packetLength * 0.14, -packet.height * 0.35, Math.max(0.7, packetLength * 0.18), packet.height * 0.7);
        context.restore();
      });
      context.restore();

      // These are the outbound block streams: discrete NFT/data packets emitted
      // from the core before they join the larger bent information currents.
      context.save();
      context.globalCompositeOperation = "lighter";
      ejectionPackets.forEach((packet) => {
        const travel = (packet.offset + time * packet.speed * (0.85 + active.spin * 0.38)) % 1;
        const angle = packet.angle + Math.sin(time * 0.45 + packet.offset * 11) * active.turbulence * 0.17;
        const distance = core * 0.28 + travel * disk * (0.5 + active.spread * 0.08);
        const x = cx + Math.cos(angle) * distance;
        const y = cy + Math.sin(angle) * distance * 0.66;
        const startX = cx + Math.cos(angle) * core * 0.22;
        const startY = cy + Math.sin(angle) * core * 0.15;
        const color = packet.color < 4 ? palette[1] : packet.color < 6 ? palette[0] : palette[2];
        const fade = Math.pow(Math.sin(travel * Math.PI), 0.72);
        context.strokeStyle = `rgba(${color}, ${fade * 0.13 * intensity})`;
        context.lineWidth = Math.max(0.35, packet.height * 0.45);
        context.beginPath();
        context.moveTo(startX, startY);
        context.quadraticCurveTo(cx + Math.cos(angle) * distance * 0.52, cy + Math.sin(angle) * distance * 0.28 - core * 0.16, x, y);
        context.stroke();
        const packetLength = packet.length * (1.9 + active.spin * 2.2);
        context.save();
        context.translate(x, y);
        context.rotate(angle + Math.PI * 0.5);
        context.fillStyle = `rgba(${color}, ${Math.min(0.95, fade * 0.78 * intensity)})`;
        context.fillRect(-packetLength * 0.5, -packet.height * 0.45, packetLength, packet.height);
        context.fillStyle = `rgba(248,255,246, ${fade * 0.5 * intensity})`;
        context.fillRect(-packetLength * 0.12, -packet.height * 0.31, Math.max(0.7, packetLength * 0.16), packet.height * 0.62);
        context.restore();
      });
      context.restore();

      context.save();
      context.globalCompositeOperation = "lighter";
      for (let band = 0; band < 7; band += 1) {
        const ratio = 0.34 + band * 0.108;
        context.filter = `blur(${Math.max(1.5, unit * (0.008 - band * 0.0007))}px)`;
        context.lineWidth = Math.max(2.3, unit * (0.014 - band * 0.0013));
        context.strokeStyle = `rgba(${band < 3 ? palette[1] : band % 2 ? palette[0] : palette[2]}, ${(0.12 - band * 0.009) * intensity})`;
        context.beginPath();
        context.ellipse(cx, cy, disk * ratio, disk * ratio * 0.25, -0.025, 0, Math.PI * 2);
        context.stroke();
      }
      context.filter = "none";

      blocks.forEach((block) => {
        const orbit = block.angle + time * block.speed * active.spin * (2 + 1.35 / block.radius) + Math.sin(time * 0.4 + block.offset) * active.turbulence * 0.16;
        const localCompression = active.compression * (1 - block.radius * 0.48) + burst * 0.78;
        const radial = disk * block.radius * Math.max(0.025, 1 - localCompression);
        const x = cx + Math.cos(orbit) * radial;
        const y = cy + Math.sin(orbit) * radial * (0.245 + block.lane * 0.014) + Math.cos(orbit * 2 + time) * active.turbulence * unit * 0.007;
        const front = (Math.sin(orbit) + 1) / 2;
        const proximity = 1 - Math.min(1, (block.radius - 0.14) / 0.86);
        const color = block.color < 5 ? palette[1] : block.color < 8 ? palette[0] : palette[2];
        const opacity = Math.min(0.94, block.alpha * (0.38 + front * 0.64) * (0.62 + proximity * 0.72) * intensity * (1 - burst * 0.26));
        const streak = block.length * (1.7 + active.spin * 3.1) * (block.radius < 0.52 ? 2.15 : 1);
        context.fillStyle = `rgba(${color}, ${opacity})`;
        context.fillRect(x - streak * 0.5, y - block.height * 0.45, streak, Math.max(0.6, block.height));
      });
      context.restore();

      context.save();
      context.globalCompositeOperation = "screen";
      distantBlocks.forEach((block, index) => {
        const flow = block.angle - time * block.speed * active.spin * 0.9;
        const radial = disk * (0.98 + block.radius * 0.7);
        const x = cx + Math.cos(flow) * radial;
        const y = cy + Math.sin(flow) * radial * 0.21;
        const color = index % 3 === 0 ? palette[1] : index % 2 ? palette[0] : palette[2];
        const cubeSize = Math.max(1.7, block.length * (0.85 + block.radius * 0.5));
        drawLedgerCube(x, y, cubeSize, flow * 0.45 + time * 0.18, color, (0.09 + block.alpha * 0.22) * intensity);
      });
      context.restore();

      // When a new state is chosen, ledger shards pull through converging geodesics
      // before the field opens again around the mark.
      if (burst > 0.015 || active.key === "collapse") {
        context.save();
        context.globalCompositeOperation = "lighter";
        context.filter = `blur(${Math.max(0.5, unit * 0.001)}px)`;
        for (let thread = 0; thread < 18; thread += 1) {
          const angle = (thread / 18) * Math.PI * 2 + time * (0.18 + active.spin * 0.04);
          const radius = disk * (0.58 + (thread % 5) * 0.08);
          const startX = cx + Math.cos(angle) * radius;
          const startY = cy + Math.sin(angle) * radius * 0.23;
          context.strokeStyle = `rgba(${thread % 3 === 0 ? palette[1] : palette[0]}, ${(0.055 + burst * 0.23) * intensity})`;
          context.lineWidth = Math.max(0.45, unit * 0.0011);
          context.beginPath();
          context.moveTo(startX, startY);
          context.bezierCurveTo(
            cx + Math.cos(angle + 0.82) * radius * 0.38,
            cy + Math.sin(angle + 0.82) * radius * 0.14,
            cx + Math.cos(angle - 0.42) * core * 1.8,
            cy + Math.sin(angle - 0.42) * core * 0.46,
            cx,
            cy,
          );
          context.stroke();
        }
        context.filter = "none";
        context.restore();
      }

      // The singularity is a refractive orb now, not an opaque cutout: its dark
      // interior still has gravity, while the field and the mark remain visible inside it.
      const orb = context.createRadialGradient(cx - core * 0.34, cy - core * 0.42, core * 0.04, cx, cy, core * 1.22);
      orb.addColorStop(0, `rgba(${palette[1]},0.25)`);
      orb.addColorStop(0.16, `rgba(${palette[0]},0.22)`);
      orb.addColorStop(0.48, `rgba(${palette[2]},0.16)`);
      orb.addColorStop(0.76, "rgba(0,4,10,0.64)");
      orb.addColorStop(1, "rgba(0,1,5,0.13)");
      context.fillStyle = orb;
      context.beginPath();
      context.ellipse(cx, cy, core * 1.08, core * 0.99, 0, 0, Math.PI * 2);
      context.fill();

      context.save();
      context.beginPath();
      context.ellipse(cx, cy, core * 1.055, core * 0.965, 0, 0, Math.PI * 2);
      context.clip();
      const interiorShade = context.createLinearGradient(cx - core, cy - core, cx + core, cy + core);
      interiorShade.addColorStop(0, `rgba(${palette[0]},0.14)`);
      interiorShade.addColorStop(0.42, `rgba(${palette[2]},0.1)`);
      interiorShade.addColorStop(1, "rgba(0,0,5,0.42)");
      context.fillStyle = interiorShade;
      context.fillRect(cx - core * 1.2, cy - core * 1.2, core * 2.4, core * 2.4);
      context.globalCompositeOperation = "screen";
      for (let meridian = -2; meridian <= 2; meridian += 1) {
        context.strokeStyle = `rgba(${palette[0]}, ${0.055 + (meridian === 0 ? 0.035 : 0)})`;
        context.lineWidth = Math.max(0.45, unit * 0.0007);
        context.beginPath();
        context.ellipse(cx + meridian * core * 0.19, cy + core * 0.02, core * (0.32 - Math.abs(meridian) * 0.028), core * 0.98, 0, Math.PI * 1.06, Math.PI * 1.94);
        context.stroke();
      }
      const specular = context.createRadialGradient(cx - core * 0.36, cy - core * 0.46, core * 0.025, cx - core * 0.2, cy - core * 0.22, core * 0.78);
      specular.addColorStop(0, `rgba(${palette[1]},0.38)`);
      specular.addColorStop(0.13, `rgba(${palette[0]},0.19)`);
      specular.addColorStop(0.56, `rgba(${palette[2]},0.055)`);
      specular.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = specular;
      context.fillRect(cx - core * 1.1, cy - core * 1.1, core * 2.2, core * 2.2);
      const iridescence = context.createLinearGradient(cx - core * 0.9, cy - core * 0.6, cx + core * 0.88, cy + core * 0.62);
      iridescence.addColorStop(0, `rgba(${palette[2]},0.13)`);
      iridescence.addColorStop(0.32, `rgba(${palette[0]},0.065)`);
      iridescence.addColorStop(0.58, `rgba(${palette[1]},0.085)`);
      iridescence.addColorStop(1, `rgba(${palette[0]},0.045)`);
      context.globalAlpha = 0.7 + Math.sin(time * 0.74 + cameraX * 4) * 0.16;
      context.fillStyle = iridescence;
      context.fillRect(cx - core * 1.08, cy - core * 0.72, core * 2.16, core * 1.44);
      context.restore();

      context.save();
      context.globalCompositeOperation = "screen";
      context.strokeStyle = `rgba(${palette[1]}, ${0.34 * intensity})`;
      context.lineWidth = Math.max(0.75, unit * 0.00125);
      context.beginPath();
      context.ellipse(cx, cy, core * 1.07, core * 0.98, 0, Math.PI * 1.09, Math.PI * 1.91);
      context.stroke();
      context.strokeStyle = `rgba(${palette[0]}, ${0.16 * intensity})`;
      context.lineWidth = Math.max(0.5, unit * 0.0008);
      context.beginPath();
      context.ellipse(cx, cy + core * 0.05, core * 0.86, core * 0.91, 0, Math.PI * 1.08, Math.PI * 1.92);
      context.stroke();
      context.filter = `blur(${Math.max(0.45, unit * 0.00065)}px)`;
      const rimGlints = [
        { color: palette[2], from: Math.PI * 1.05, to: Math.PI * 1.32 },
        { color: palette[0], from: Math.PI * 1.42, to: Math.PI * 1.64 },
        { color: palette[1], from: Math.PI * 0.03, to: Math.PI * 0.22 },
      ];
      rimGlints.forEach((glint) => {
        context.strokeStyle = `rgba(${glint.color}, ${0.32 + Math.sin(time * 0.9 + glint.from) * 0.08})`;
        context.lineWidth = Math.max(1, unit * 0.0022);
        context.beginPath();
        context.ellipse(cx, cy, core * 1.075, core * 0.985, 0, glint.from, glint.to);
        context.stroke();
      });
      context.filter = "none";
      context.restore();

      context.save();
      context.globalCompositeOperation = "lighter";
      blocks.forEach((block) => {
        const orbit = block.angle + time * block.speed * active.spin * (2 + 1.35 / block.radius) + Math.sin(time * 0.4 + block.offset) * active.turbulence * 0.16;
        const front = Math.sin(orbit);
        const radial = disk * block.radius * Math.max(0.025, 1 - (active.compression * (1 - block.radius * 0.48) + burst * 0.78));
        if (front < 0.06 || radial < core * 1.35) return;
        const x = cx + Math.cos(orbit) * radial;
        const y = cy + front * radial * (0.245 + block.lane * 0.014);
        const color = block.color < 5 ? palette[1] : block.color < 8 ? palette[0] : palette[2];
        context.fillStyle = `rgba(${color}, ${Math.min(0.9, block.alpha * 0.77 * intensity)})`;
        context.fillRect(x - block.length * 3.1, y - block.height * 0.4, block.length * 6.2, Math.max(0.6, block.height));
      });
      context.restore();

      const edge = context.createRadialGradient(cx, cy, core * 0.76, cx, cy, core * 1.13);
      edge.addColorStop(0, "rgba(0,0,0,0)");
      edge.addColorStop(0.72, "rgba(0,0,0,0)");
      edge.addColorStop(1, `rgba(${palette[0]}, 0.3)`);
      context.strokeStyle = edge;
      context.lineWidth = Math.max(0.7, unit * 0.0012);
      context.beginPath();
      context.ellipse(cx, cy, core * 1.06, core * 0.97, 0, Math.PI * 1.1, Math.PI * 1.92);
      context.stroke();

      const vignette = context.createRadialGradient(cx, cy, unit * 0.35, cx, cy, Math.max(width, height) * 0.77);
      vignette.addColorStop(0.54, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.74)");
      context.fillStyle = vignette;
      context.fillRect(0, 0, width, height);
      drawThreeDimensionalMark(cx, cy, core, time, burst, cameraX, cameraY, palette[0]);
      // A final glass sheen sits in front of the mark, making it feel suspended
      // within the orb instead of pasted on top of the simulation.
      context.save();
      context.globalCompositeOperation = "screen";
      context.beginPath();
      context.ellipse(cx, cy, core * 1.055, core * 0.965, 0, 0, Math.PI * 2);
      context.clip();
      const frontGlass = context.createLinearGradient(cx - core * 0.82, cy - core * 0.95, cx + core * 0.7, cy + core * 0.95);
      frontGlass.addColorStop(0, `rgba(${palette[1]},0.24)`);
      frontGlass.addColorStop(0.18, `rgba(${palette[0]},0.09)`);
      frontGlass.addColorStop(0.52, "rgba(0,0,0,0)");
      frontGlass.addColorStop(1, `rgba(${palette[2]},0.09)`);
      context.fillStyle = frontGlass;
      context.fillRect(cx - core * 1.2, cy - core * 1.2, core * 2.4, core * 2.4);
      const bubbleSweep = context.createLinearGradient(-core * 0.4, -core * 0.8, core * 0.4, core * 0.8);
      bubbleSweep.addColorStop(0, "rgba(0,0,0,0)");
      bubbleSweep.addColorStop(0.42, `rgba(${palette[2]},0.045)`);
      bubbleSweep.addColorStop(0.5, `rgba(${palette[1]},0.2)`);
      bubbleSweep.addColorStop(0.58, `rgba(${palette[0]},0.06)`);
      bubbleSweep.addColorStop(1, "rgba(0,0,0,0)");
      context.save();
      context.translate(cx - core * 0.09 + cameraX * core * 0.12, cy - core * 0.04 + cameraY * core * 0.08);
      context.rotate(-0.48 + cameraX * 0.14);
      context.globalAlpha = 0.7 + Math.sin(time * 0.62) * 0.14;
      context.fillStyle = bubbleSweep;
      context.fillRect(-core * 0.55, -core * 0.9, core * 1.1, core * 1.8);
      context.restore();
      context.restore();
      raf = requestAnimationFrame(draw);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); observer.disconnect(); };
  }, [controls]);

  return <canvas ref={canvasRef} className="space-canvas" aria-hidden="true" />;
}

export default function Home() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [impulse, setImpulse] = useState(0);
  const controls = useRef<Controls>({ pointerX: 0, pointerY: 0, zoomTarget: 1 });
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<number | null>(null);
  const phase = phases[phaseIndex];

  const setPointer = useCallback((clientX: number, clientY: number, target: HTMLElement) => {
    const bounds = target.getBoundingClientRect();
    controls.current.pointerX = (clientX - bounds.left) / bounds.width - 0.5;
    controls.current.pointerY = (clientY - bounds.top) / bounds.height - 0.5;
  }, []);

  const advance = useCallback(() => {
    setImpulse(performance.now());
    setPhaseIndex((current) => (current + 1) % phases.length);
  }, []);

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    setPointer(event.clientX, event.clientY, event.currentTarget);
    if (event.pointerType !== "touch") return;
    touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const values = [...touches.current.values()];
    if (values.length !== 2) return;
    const distance = Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
    if (pinch.current) controls.current.zoomTarget = Math.max(0.72, Math.min(1.54, controls.current.zoomTarget * (distance / pinch.current)));
    pinch.current = distance;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType !== "touch") return;
    touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (touches.current.size === 2) {
      const values = [...touches.current.values()];
      pinch.current = Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
    }
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLElement>) => {
    touches.current.delete(event.pointerId);
    if (touches.current.size < 2) pinch.current = null;
  };

  const handleWheel = (event: ReactWheelEvent<HTMLElement>) => {
    event.preventDefault();
    controls.current.zoomTarget = Math.max(0.72, Math.min(1.54, controls.current.zoomTarget - event.deltaY * 0.00075));
  };

  return (
    <main
      className="blocpod-world"
      style={{ "--signal": phase.accent } as React.CSSProperties}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onWheel={handleWheel}
    >
      <BlockPodField phase={phase} impulse={impulse} controls={controls} />
      <div className="noise" />
      <header className="wordmark" aria-label="BLOCPOD CREATIVE">
        <span>BLOCPOD CREATIVE</span>
      </header>

      <button type="button" className="core-button" onClick={advance} aria-label="Advance the BLOCPOD CREATIVE visual state" />
    </main>
  );
}
