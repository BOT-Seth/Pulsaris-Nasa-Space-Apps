// Interactive 3D body; source and generation provenance live in body-model.json.
// Corrected model B, shaded with the calibrated chalk lighting fitted to the approved viewer
// (chalk-lighting.glsl). Flags are callouts beside the figure, joined to their region by a leader
// line; selection is a neutral highlight.
//
// It renders on demand, not in a loop: one frame per interaction. Regions are picked by
// ray-casting. Every region is also reachable by the list beside it, so nothing depends
// on the 3D view, and the flat pictogram takes over when WebGL or the shader is unavailable.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  BufferAttribute, BufferGeometry, Group, Mesh, PerspectiveCamera, Raycaster, Scene, ShaderMaterial,
  Vector2, Vector3, Vector4, WebGLRenderer,
} from 'three';
import model from '../data/body-model.json';
import chalkLighting from './chalk-lighting.glsl?raw';
import type { RegionId } from '../domain/types';
import { Icon } from './primitives';

const REGION_INDEX: Record<Exclude<RegionId, 'whole'>, number> = { head: 0, chest: 1, abdomen: 2, limbs: 3 };
const INDEX_REGION: RegionId[] = ['head', 'chest', 'abdomen', 'limbs'];

/**
 * Region of a point on the normalized mesh (height 1, Y up, feet at y = 0, front toward +Z).
 * Boundaries read off model B's profile: the neck narrows at y ≈ 0.85, the arms separate from
 * the torso at |x| ≈ 0.09–0.10, and the legs split below y ≈ 0.42.
 */
export function regionAt(x: number, y: number): number {
  if (y >= 0.845) return 0; // head and neck
  if (y < 0.42) return 3; // legs (and hands at the hips)
  if (Math.abs(x) > 0.097) return 3; // arms
  return y >= 0.66 ? 1 : 2; // chest, then abdomen and pelvis
}

/** Where each leader line starts, on the body surface (model B; half-width 0.157). */
const ANCHORS: Record<Exclude<RegionId, 'whole'>, [number, number, number]> = {
  head: [0.0, 0.955, 0.06],
  chest: [0.035, 0.76, 0.07],
  abdomen: [-0.02, 0.57, 0.07],
  limbs: [0.125, 0.6, 0.0],
};

function decode(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

interface BodyModel { quant: number; indexType?: string; positions: string; normals?: string; indices: string }

function buildGeometry(m: BodyModel): BufferGeometry {
  const q = new Int16Array(decode(m.positions));
  const pos = new Float32Array(q.length);
  for (let i = 0; i < q.length; i++) pos[i] = q[i] / m.quant;
  const region = new Float32Array(q.length / 3);
  for (let i = 0; i < region.length; i++) region[i] = regionAt(pos[i * 3], pos[i * 3 + 1]);
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setAttribute('region', new BufferAttribute(region, 1));
  // Model B has 90 002 vertices, so its indices are Uint32; a Uint16 read corrupts the mesh.
  const raw = decode(m.indices);
  g.setIndex(new BufferAttribute(m.indexType === 'uint32' ? new Uint32Array(raw) : new Uint16Array(raw), 1));
  if (m.normals) {
    // Keep the corrected reference normals; quantized like the positions.
    const nq = new Int16Array(decode(m.normals));
    const nrm = new Float32Array(nq.length);
    for (let i = 0; i < nq.length; i += 3) {
      const x = nq[i] / m.quant, y = nq[i + 1] / m.quant, z = nq[i + 2] / m.quant;
      const l = Math.hypot(x, y, z) || 1;
      nrm[i] = x / l; nrm[i + 1] = y / l; nrm[i + 2] = z / l;
    }
    g.setAttribute('normal', new BufferAttribute(nrm, 3));
  } else {
    g.computeVertexNormals();
  }
  return g;
}

const VERT = /* glsl */ `
attribute float region;
varying vec3 vN; varying float vRegion; varying vec3 vPos;
void main() {
  vN = normalize(normalMatrix * normal);
  vRegion = region;
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// Calibrated chalk lighting (display RGB, no extra gamma), a neutral selection tone and
// Opaque; no Fresnel, specular or blue tint. Watch/Act status is drawn as screen-space callouts
// beside the figure; a leader goes dashed when the body itself occludes its anchor.
const FRAG = /* glsl */ `
precision highp float;
uniform float uSel; uniform float uHover; uniform float uAll; uniform vec4 uFlag; uniform vec4 uAct;
varying vec3 vN; varying float vRegion; varying vec3 vPos;
${chalkLighting}
float isRegion(float r) { return 1.0 - step(0.5, abs(vRegion - r)); }
void main() {
  vec3 clay = chalkColor(vN, vPos);
  vec3 col = clay;
  float sel = max(isRegion(uSel), uAll);
  col = mix(col, col * vec3(0.70, 0.71, 0.73), sel * 0.55);
  col *= 1.0 - 0.06 * isRegion(uHover) * (1.0 - sel);
  gl_FragColor = vec4(col, 1.0);
}`;

export interface BodyLabel { id: Exclude<RegionId, 'whole'>; title: string; lines: string[]; flagged: boolean }

/** One flagged region: a callout beside the figure that opens an explanation of what is flagged. */
export interface Callout {
  id: Exclude<RegionId, 'whole'>;
  tone: 'watch' | 'act';
  region: string;
  /** Second line of the callout, e.g. the flagged measurement's name. */
  short: string;
  items: { key: string; name: string; value: string; summary: string; rule: string; action: string }[];
}
type Region4 = Callout['id'];
/** Which side of the figure each region's callout sits on: neighbours alternate so lines never cross. */
const SIDE: Record<Region4, 'left' | 'right'> = { head: 'right', chest: 'left', abdomen: 'right', limbs: 'left' };

const START_ROTATION = 0;

export function Body3D(props: { selected: RegionId | null; flagged: RegionId[]; act?: RegionId[]; onPick: (r: RegionId) => void; labels?: BodyLabel[]; callouts?: Callout[]; onItem?: (key: string) => void; height?: number | string; fallback: ReactNode; onFallback?: (failed: boolean) => void }) {
  const { selected, flagged, act = [], onPick, labels = [], callouts = [], onItem, height = 520, fallback, onFallback } = props;
  const layer = useRef<HTMLDivElement>(null);
  const calloutLines = useRef<SVGSVGElement>(null);
  const [open, setOpen] = useState<Region4 | null>(null);
  const openCallout = callouts.find((c) => c.id === open) ?? null;
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const lines = useRef<SVGSVGElement>(null);
  const api = useRef<{ render: () => void; rotate: (d: number) => void; reset: () => void; material: ShaderMaterial } | null>(null);
  const pick = useRef(onPick);
  pick.current = onPick;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = wrap.current, cv = canvas.current;
    if (!el || !cv) return;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      setFailed(true);
      return;
    }
    // A shader that fails to compile or link hands over to the flat figure instead of an empty slot.
    let broken = false;
    renderer.debug.onShaderError = () => { broken = true; };
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new Scene();
    const camera = new PerspectiveCamera(26, 1, 0.1, 10);
    camera.position.set(0, 0, 2.55);
    const geometry = buildGeometry(model as BodyModel);
    const material = new ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG,
      uniforms: { uSel: { value: -1 }, uHover: { value: -1 }, uAll: { value: 0 }, uFlag: { value: new Vector4(0, 0, 0, 0) }, uAct: { value: new Vector4(0, 0, 0, 0) } },
    });
    const mesh = new Mesh(geometry, material);
    mesh.position.y = -0.5;
    const group = new Group();
    group.add(mesh);
    group.rotation.y = START_ROTATION;
    scene.add(group);

    const v = new Vector3();
    group.updateMatrixWorld();
    const probe = new Raycaster();
    const BADGE: Record<string, [number, number]> = { head: [0.0, 0.955], chest: [0.035, 0.76], abdomen: [-0.02, 0.57], limbs: [0.055, 0.25] };
    const anchor: Record<string, Vector3> = {};
    for (const [id, [x, y]] of Object.entries(BADGE)) {
      probe.set(new Vector3(x, y - 0.5, 5), new Vector3(0, 0, -1));
      const hit = probe.intersectObject(mesh, false)[0];
      anchor[id] = mesh.worldToLocal(hit ? hit.point.clone() : new Vector3(x, y - 0.5, 0.06));
    }
    const occl = new Raycaster();
    const w = new Vector3();
    // Callouts sit in the gutters beside the figure, in anchor order, never overlapping.
    // Each leader runs from its callout to a dot on the region's surface.
    const placeCallouts = () => {
      const host = layer.current, svg = calloutLines.current;
      if (!host || !svg) return;
      const W = el.clientWidth, H = el.clientHeight;
      mesh.updateMatrixWorld();
      const placed: { id: Region4; b: HTMLElement; x: number; y: number; visible: boolean }[] = [];
      host.querySelectorAll<HTMLElement>('[data-callout]').forEach((b) => {
        const id = b.dataset.callout as Region4;
        w.copy(anchor[id]).applyMatrix4(mesh.matrixWorld);
        const dir = w.clone().sub(camera.position);
        const dist = dir.length();
        occl.set(camera.position, dir.normalize());
        const first = occl.intersectObject(mesh, false)[0];
        v.copy(w).project(camera);
        placed.push({ id, b, x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, visible: !first || first.distance > dist - 0.012 });
      });
      const tops: Partial<Record<Region4, number>> = {};
      for (const side of ['left', 'right'] as const) {
        let floor = 4;
        for (const p of placed.filter((q) => SIDE[q.id] === side).sort((a, b) => a.y - b.y)) {
          const h = p.b.offsetHeight;
          const top = Math.max(floor, Math.min(p.y - h / 2, H - h - 4));
          p.b.style.top = `${top}px`;
          tops[p.id] = top;
          floor = top + h + 8;
        }
      }
      for (const p of placed) {
        const line = svg.querySelector<SVGPolylineElement>(`polyline[data-callout="${p.id}"]`);
        const dot = svg.querySelector<SVGCircleElement>(`circle[data-callout="${p.id}"]`);
        const left = SIDE[p.id] === 'left';
        const sx = left ? p.b.offsetLeft + p.b.offsetWidth : p.b.offsetLeft;
        const sy = tops[p.id]! + p.b.offsetHeight / 2;
        const ex = left ? Math.min(sx + 14, p.x) : Math.max(sx - 14, p.x);
        line?.setAttribute('points', `${sx},${sy} ${ex},${sy} ${p.x},${p.y}`);
        line?.classList.toggle('hidden', !p.visible);
        dot?.setAttribute('cx', String(p.x)); dot?.setAttribute('cy', String(p.y));
        dot?.style.setProperty('visibility', p.visible ? 'visible' : 'hidden');
      }
      // The explanation opens under its callout, or above it when there is no room below.
      const pop = host.querySelector<HTMLElement>('[data-pop]');
      const owner = pop && placed.find((p) => p.id === pop.dataset.pop);
      if (pop && owner) {
        const bt = tops[owner.id]!, bh = owner.b.offsetHeight, ph = pop.offsetHeight;
        let top = bt + bh + 8;
        if (top + ph > H && bt - ph - 8 >= 0) top = bt - ph - 8;
        pop.style.top = `${Math.max(0, Math.min(top, Math.max(0, H - ph)))}px`;
      }
    };
    const drawLeaders = () => {
      const svg = lines.current;
      if (!svg) return;
      const box = el.getBoundingClientRect();
      group.updateMatrixWorld();
      svg.querySelectorAll<SVGPolylineElement>('polyline').forEach((line) => {
        const id = line.dataset.region as keyof typeof ANCHORS;
        const label = el.querySelector<HTMLElement>(`[data-label="${id}"]`);
        if (!label || label.offsetParent === null) { line.setAttribute('points', ''); return; }
        const a = ANCHORS[id];
        v.set(a[0], a[1] - 0.5, a[2]).applyMatrix4(group.matrixWorld).project(camera);
        const ax = (v.x * 0.5 + 0.5) * box.width, ay = (-v.y * 0.5 + 0.5) * box.height;
        const r = label.getBoundingClientRect();
        const left = r.left - box.left < box.width / 2;
        const lx = left ? r.right - box.left + 6 : r.left - box.left - 6;
        const ly = r.top - box.top + 14;
        const elbow = left ? Math.min(ax - 10, lx + 26) : Math.max(ax + 10, lx - 26);
        line.setAttribute('points', `${lx},${ly} ${elbow},${ly} ${ax},${ay}`);
        const dot = svg.querySelector<SVGCircleElement>(`circle[data-region="${id}"]`);
        dot?.setAttribute('cx', String(ax)); dot?.setAttribute('cy', String(ay));
      });
    };
    const render = () => {
      if (broken) return;
      renderer.render(scene, camera);
      if (broken) { setFailed(true); return; }
      drawLeaders();
      placeCallouts();
    };
    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Fit the whole figure, uniformly scaled: 1.0 tall plus a margin, and the arms' width
      // when the figure is turned sideways is far smaller than its height.
      const tan = Math.tan((camera.fov / 2) * Math.PI / 180);
      const needH = 1.12 / 2, needW = 0.36 / 2;
      camera.position.z = Math.max(needH / tan, needW / (tan * camera.aspect)) + 0.08;
      camera.updateProjectionMatrix();
      render();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    const lost = (e: Event) => { e.preventDefault(); setFailed(true); };
    cv.addEventListener('webglcontextlost', lost);

    const ray = new Raycaster();
    const ndc = new Vector2();
    const regionUnder = (e: PointerEvent): number => {
      const b = cv.getBoundingClientRect();
      ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObject(mesh, false)[0];
      if (!hit || !hit.face) return -1;
      return (geometry.getAttribute('region') as BufferAttribute).getX(hit.face.a);
    };
    // Drag turns the figure; a tap (under 6 px of travel) selects. They never compete.
    let downX = 0, moved = 0, dragging = false;
    const down = (e: PointerEvent) => { dragging = true; downX = e.clientX; moved = 0; cv.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => {
      if (dragging) {
        const dx = e.clientX - downX;
        downX = e.clientX; moved += Math.abs(dx);
        group.rotation.y += dx * 0.012;
        render();
        return;
      }
      const r = regionUnder(e);
      if (material.uniforms.uHover.value !== r) { material.uniforms.uHover.value = r; cv.style.cursor = r >= 0 ? 'pointer' : 'grab'; render(); }
    };
    const up = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (moved < 6) { const r = regionUnder(e); if (r >= 0) pick.current(INDEX_REGION[r]); }
    };
    const leave = () => { if (material.uniforms.uHover.value !== -1) { material.uniforms.uHover.value = -1; render(); } };
    cv.addEventListener('pointerdown', down);
    cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('pointerleave', leave);

    api.current = {
      render, material,
      rotate: (d) => { group.rotation.y += d; render(); },
      reset: () => { group.rotation.y = START_ROTATION; render(); },
    };
    return () => {
      ro.disconnect();
      cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move);
      cv.removeEventListener('pointerup', up); cv.removeEventListener('pointerleave', leave);
      cv.removeEventListener('pointercancel', up); cv.removeEventListener('webglcontextlost', lost);
      geometry.dispose(); material.dispose(); renderer.dispose();
      // Release the GL context once the canvas has really left the page (not on a StrictMode re-run).
      window.setTimeout(() => { if (!cv.isConnected) renderer.forceContextLoss(); }, 0);
      api.current = null;
    };
  }, []);

  // Selection and flags are uniforms: changing them costs one frame, not a rebuild.
  useEffect(() => {
    const a = api.current;
    if (!a) return;
    const u = a.material.uniforms;
    u.uSel.value = selected && selected !== 'whole' ? REGION_INDEX[selected] : -1;
    u.uAll.value = selected === 'whole' ? 1 : 0;
    (u.uFlag.value as Vector4).set(...(['head', 'chest', 'abdomen', 'limbs'] as const).map((r) => (flagged.includes(r) ? 1 : 0)) as [number, number, number, number]);
    (u.uAct.value as Vector4).set(...(['head', 'chest', 'abdomen', 'limbs'] as const).map((r) => (act.includes(r) ? 1 : 0)) as [number, number, number, number]);
    a.render();
  }, [selected, flagged, act, labels, failed]);

  useEffect(() => { onFallback?.(failed); }, [failed, onFallback]);
  // Callouts are re-placed after React renders them or opens an explanation.
  useEffect(() => { api.current?.render(); }, [flagged, act, callouts, open]);
  // An explanation whose region is no longer flagged closes.
  useEffect(() => { if (open && !openCallout) setOpen(null); }, [open, openCallout]);
  // Escape or a tap outside closes the explanation; focus returns to its callout.
  useEffect(() => {
    if (!open) return;
    const close = (refocus: boolean) => {
      setOpen(null);
      if (refocus) layer.current?.querySelector<HTMLElement>(`[data-callout="${open}"]`)?.focus();
    };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(true); };
    const down = (e: PointerEvent) => {
      const t = e.target as Element;
      if (!t.closest('[data-pop]') && !t.closest('[data-callout]')) close(false);
    };
    document.addEventListener('keydown', key);
    document.addEventListener('pointerdown', down);
    layer.current?.querySelector<HTMLElement>('[data-pop] h3')?.focus();
    return () => { document.removeEventListener('keydown', key); document.removeEventListener('pointerdown', down); };
  }, [open]);

  if (failed) return <>{fallback}</>;
  return (
    <div className="body3d" ref={wrap} style={{ height }} data-state="3d">
      <canvas ref={canvas} aria-hidden="true" />
      <svg ref={lines} className="leaders" aria-hidden="true">
        {labels.map((l) => <polyline key={l.id} data-region={l.id} className={selected === l.id ? 'on' : ''} />)}
        {labels.map((l) => <circle key={l.id} data-region={l.id} r="3.5" className={l.flagged ? 'flag' : ''} />)}
      </svg>
      {labels.map((l) => (
        <button key={l.id} type="button" data-label={l.id} className={`bodylabel ${l.id}${selected === l.id ? ' on' : ''}`} aria-pressed={selected === l.id} onClick={() => onPick(l.id)}>
          <b>{l.title}{l.flagged && <span className="flagmark"> · flagged</span>}</b>
          {l.lines.map((t) => <span key={t}>{t}</span>)}
        </button>
      ))}
      <svg ref={calloutLines} className="callout-lines" aria-hidden="true">
        {callouts.map((c) => <polyline key={c.id} data-callout={c.id} className={c.tone} />)}
        {callouts.map((c) => <circle key={c.id} data-callout={c.id} r="4" className={c.tone} />)}
      </svg>
      <div ref={layer} className="callouts">
        {callouts.map((c) => {
          const word = c.tone === 'act' ? 'Act' : 'Watch';
          return (
            <button key={c.id} type="button" data-callout={c.id} className={`callout ${c.tone} ${SIDE[c.id]}${open === c.id ? ' open' : ''}`}
              aria-expanded={open === c.id} aria-controls={`pop-${c.id}`} aria-label={`${word} · ${c.region}: ${c.short}. What is flagged`}
              onClick={() => { setOpen(open === c.id ? null : c.id); if (open !== c.id) onPick(c.id); }}>
              <span className="cw">{c.tone === 'act' ? Icon.act : Icon.watch}{word}</span>
              <span className="cs">{c.short}</span>
            </button>
          );
        })}
        {openCallout && (
          <section id={`pop-${openCallout.id}`} data-pop={openCallout.id} className={`callout-pop ${openCallout.tone} ${SIDE[openCallout.id]}`} aria-labelledby={`pop-h-${openCallout.id}`}>
            <div className="cp-head">
              <h3 id={`pop-h-${openCallout.id}`} tabIndex={-1}>{openCallout.tone === 'act' ? Icon.act : Icon.watch}{openCallout.tone === 'act' ? 'Act' : 'Watch'} · {openCallout.region}</h3>
              <button type="button" className="cp-close" aria-label="Close explanation" onClick={() => { setOpen(null); layer.current?.querySelector<HTMLElement>(`[data-callout="${openCallout.id}"]`)?.focus(); }}>×</button>
            </div>
            {openCallout.items.map((it) => (
              <div key={it.key} className="cp-item">
                <p className="cp-name"><b>{it.name}</b><span>{it.value}</span></p>
                <p className="cp-sum">{it.summary}</p>
                <p className="cp-rule">{it.rule}</p>
                {onItem && <button type="button" className="linkish cp-go" onClick={() => onItem(it.key)}>{it.action} →</button>}
              </div>
            ))}
          </section>
        )}
      </div>
      <div className="turn">
        <button type="button" className="btn small" aria-label="Rotate the figure left" onClick={() => api.current?.rotate(-0.5)}>⟲</button>
        <button type="button" className="btn small" aria-label="Rotate the figure right" onClick={() => api.current?.rotate(0.5)}>⟳</button>
        <button type="button" className="btn small reset" onClick={() => api.current?.reset()}>Reset view</button>
      </div>
    </div>
  );
}
