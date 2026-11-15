// Interactive 3D body; source and generation provenance live in body-model.json.
// shaded as a blue medical visualization with localized status markers.
//
// It renders on demand, not in a loop: one frame per interaction. Regions are picked by
// ray-casting. Every region is also reachable by the buttons beside it, so nothing depends
// on the 3D view, and the flat pictogram takes over when WebGL is unavailable.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  BufferAttribute, BufferGeometry, Group, Mesh, PerspectiveCamera, Raycaster, Scene, ShaderMaterial,
  Vector2, Vector3, Vector4, WebGLRenderer,
} from 'three';
import model from '../data/body-model.json';
import type { RegionId } from '../domain/types';

const REGION_INDEX: Record<Exclude<RegionId, 'whole'>, number> = { head: 0, chest: 1, abdomen: 2, limbs: 3 };
const INDEX_REGION: RegionId[] = ['head', 'chest', 'abdomen', 'limbs'];

/** Region of a point on the normalized mesh (height 1, feet at y = 0). Boundaries read off the mesh profile. */
export function regionAt(x: number, y: number): number {
  if (y >= 0.865) return 0; // head and neck
  if (y < 0.52) return 3; // legs
  if (Math.abs(x) > 0.105) return 3; // arms and hands
  return y >= 0.7 ? 1 : 2; // chest, then abdomen
}

/** Where each leader line starts, on the body surface. */
const ANCHORS: Record<Exclude<RegionId, 'whole'>, [number, number, number]> = {
  head: [0.0, 0.945, 0.05],
  chest: [0.035, 0.775, 0.075],
  abdomen: [-0.02, 0.61, 0.075],
  limbs: [0.2, 0.675, 0.01],
};

function decode(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

function buildGeometry(): BufferGeometry {
  const q = new Int16Array(decode(model.positions));
  const pos = new Float32Array(q.length);
  for (let i = 0; i < q.length; i++) pos[i] = q[i] / model.quant;
  const region = new Float32Array(q.length / 3);
  for (let i = 0; i < region.length; i++) region[i] = regionAt(pos[i * 3], pos[i * 3 + 1]);
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setAttribute('region', new BufferAttribute(region, 1));
  g.setIndex(new BufferAttribute(new Uint16Array(decode(model.indices)), 1));
  g.computeVertexNormals();
  return g;
}

const VERT = /* glsl */ `
attribute float region;
varying vec3 vN; varying vec3 vV; varying float vRegion; varying vec3 vPos;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  vRegion = region;
  vPos = position;
  gl_Position = projectionMatrix * mv;
}`;

// Soft blue resin, a pale Fresnel edge and localized amber status lights.
const FRAG = /* glsl */ `
precision highp float;
uniform float uSel; uniform float uHover; uniform float uAll; uniform vec4 uFlag;
varying vec3 vN; varying vec3 vV; varying float vRegion; varying vec3 vPos;
float isRegion(float r) { return 1.0 - step(0.5, abs(vRegion - r)); }
void main() {
  vec3 n = normalize(vN);
  float ndv = abs(dot(n, normalize(vV)));
  float rim = pow(1.0 - ndv, 2.0);
  float light = smoothstep(-0.35, 0.9, dot(n, normalize(vec3(-0.65, 0.6, 0.75))));
  vec3 clay = mix(vec3(0.35, 0.52, 0.64), vec3(0.68, 0.81, 0.88), light);
  clay = mix(clay, vec3(0.81, 0.91, 0.97), rim * 0.35);
  float spec = pow(max(dot(reflect(-normalize(vec3(-0.6, 0.8, 1.0)), n), normalize(vV)), 0.0), 28.0);
  clay += spec * 0.14;
  vec3 amber = vec3(0.851, 0.467, 0.024);
  float spot = 0.0;
  spot = max(spot, uFlag.x * exp(-pow(length((vPos.xy - vec2(0.0, 0.94)) / vec2(0.026, 0.026)), 2.0)));
  spot = max(spot, uFlag.y * exp(-pow(length((vPos.xy - vec2(0.035, 0.775)) / vec2(0.03, 0.03)), 2.0)));
  spot = max(spot, uFlag.z * exp(-pow(length((vPos.xy - vec2(-0.02, 0.61)) / vec2(0.03, 0.03)), 2.0)));
  spot = max(spot, uFlag.w * exp(-pow(length((vPos.xy - vec2(0.04, 0.26)) / vec2(0.025, 0.025)), 2.0)));
  vec3 col = mix(clay, amber, spot * 0.85);
  col += vec3(1.0, 0.65, 0.2) * pow(spot, 5.0) * 0.6;
  col += 0.05 * isRegion(uHover);
  float sel = max(isRegion(uSel), uAll);
  vec3 active = mix(col, vec3(0.38, 0.74, 0.91), 0.28) + rim * 0.14;
  gl_FragColor = vec4(mix(col, active, sel), 1.0);
}`;

export interface BodyLabel { id: Exclude<RegionId, 'whole'>; title: string; lines: string[]; flagged: boolean }

export function Body3D(props: { selected: RegionId | null; flagged: RegionId[]; onPick: (r: RegionId) => void; labels?: BodyLabel[]; height?: number; fallback: ReactNode }) {
  const { selected, flagged, onPick, labels = [], height = 520, fallback } = props;
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const lines = useRef<SVGSVGElement>(null);
  const api = useRef<{ render: () => void; rotate: (d: number) => void; material: ShaderMaterial } | null>(null);
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new Scene();
    const camera = new PerspectiveCamera(26, 1, 0.1, 10);
    camera.position.set(0, 0.02, 2.55);
    const geometry = buildGeometry();
    const material = new ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG,
      uniforms: { uSel: { value: -1 }, uHover: { value: -1 }, uAll: { value: 0 }, uFlag: { value: new Vector4(0, 0, 0, 0) } },
    });
    const mesh = new Mesh(geometry, material);
    mesh.renderOrder = 0;
    mesh.position.y = -0.5;
    const group = new Group();
    group.add(mesh);
    group.rotation.y = -0.08;
    scene.add(group);

    const v = new Vector3();
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
    const render = () => { renderer.render(scene, camera); drawLeaders(); };
    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Keep the whole figure in frame on narrow panels.
      camera.position.z = w / h < 0.62 ? 2.55 * (0.62 / (w / h)) : 2.55;
      camera.updateProjectionMatrix();
      render();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

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

    api.current = { render, material, rotate: (d) => { group.rotation.y += d; render(); } };
    return () => {
      ro.disconnect();
      cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move);
      cv.removeEventListener('pointerup', up); cv.removeEventListener('pointerleave', leave);
      cv.removeEventListener('pointercancel', up);
      geometry.dispose(); material.dispose(); renderer.dispose();
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
    a.render();
  }, [selected, flagged, labels, failed]);

  if (failed) return <>{fallback}</>;
  return (
    <div className="body3d" ref={wrap} style={{ height }}>
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
      <div className="turn">
        <button type="button" className="btn small" aria-label="Rotate the figure left" onClick={() => api.current?.rotate(-0.5)}>⟲</button>
        <button type="button" className="btn small" aria-label="Rotate the figure right" onClick={() => api.current?.rotate(0.5)}>⟳</button>
      </div>
    </div>
  );
}
