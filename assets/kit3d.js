/* ==========================================================================
   ALCE AMERICAN — kit de tereré em 3D para o banner da home
   --------------------------------------------------------------------------
   Modelo procedural (não é um scan do produto): copo em inox com o logo
   gravado a laser e a bomba V4 Square em preto fosco. Gira sozinho e pode
   ser girado com o mouse/dedo.

   Se algo falhar (WebGL desligado, GPU antiga), a função joga o erro e o site
   simplesmente continua mostrando a foto do kit por baixo.
   ========================================================================== */
import * as THREE from './vendor/three.module.min.js';

const url = a => new URL(a, import.meta.url).href;

/* ---------- ambiente de estúdio, gerado em canvas (sem arquivo HDR) ------- */
function texturaAmbiente(){
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const x = c.getContext('2d');

  // Metal é espelho: só parece metal se tiver contraste forte para refletir.
  // Faixas bem separadas (claro/escuro) é o que cria os riscos verticais
  // brilhantes que a gente reconhece como inox.
  // A parede do copo é vertical, então ela reflete quase só a faixa da linha
  // do horizonte (v ≈ 0,5). É essa faixa que precisa ser clara — senão o inox
  // vira um espelho de sala escura e o copo aparece preto.
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0.00, '#ffffff');
  g.addColorStop(0.26, '#fbfaf8');
  g.addColorStop(0.31, '#8e8880');   // sanca escura: dá o corte alto no reflexo
  g.addColorStop(0.37, '#efece7');
  g.addColorStop(0.60, '#e2ded8');   // faixa clara = corpo do copo
  g.addColorStop(0.66, '#2b2520');   // corte seco embaixo, como em foto de estúdio
  g.addColorStop(1.00, '#100e0c');
  x.fillStyle = g; x.fillRect(0, 0, 1024, 512);

  // softboxes verticais: viram os brilhos alongados na parede do copo
  const softbox = (cx, cy, w, h, i) => {
    const r = x.createRadialGradient(cx, cy, 0, cx, cy, w);
    r.addColorStop(0.0, `rgba(255,255,255,${i})`);
    r.addColorStop(0.6, `rgba(255,255,255,${i * 0.35})`);
    r.addColorStop(1.0, 'rgba(255,255,255,0)');
    x.save();
    x.translate(cx, cy); x.scale(1, h / w); x.translate(-cx, -cy);
    x.fillStyle = r; x.fillRect(cx - w, cy - w, w * 2, w * 2);
    x.restore();
  };
  softbox(200, 250, 105, 300, 1.0);   // key, à esquerda
  softbox(660, 255, 70,  250, 0.9);   // kicker, à direita
  softbox(430, 110, 190, 120, 0.5);   // luz alta

  // duas colunas escuras: sem elas o reflexo fica liso e o metal perde a leitura
  const coluna = (cx, w, a) => {
    const r = x.createLinearGradient(cx - w, 0, cx + w, 0);
    r.addColorStop(0.0, 'rgba(10,9,8,0)');
    r.addColorStop(0.5, `rgba(10,9,8,${a})`);
    r.addColorStop(1.0, 'rgba(10,9,8,0)');
    x.fillStyle = r; x.fillRect(cx - w, 150, w * 2, 190);
  };
  coluna(420, 55, 0.75);
  coluna(880, 70, 0.6);

  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- texturas do copo: cor + rugosidade (gravação e escovado) ------ */
function texturasCopo(logo){
  const W = 2048, H = 819;               // proporção da lateral desenrolada
  const lw = 560, lh = Math.round(lw * (logo.naturalHeight / logo.naturalWidth));
  const lx = (W - lw) / 2, ly = Math.round(H * 0.56) - lh / 2;

  // --- mapa de cor: inox médio, gravação a laser quase branca (fosqueada) ---
  const c1 = document.createElement('canvas'); c1.width = W; c1.height = H;
  const a = c1.getContext('2d');
  a.fillStyle = '#b9b9b6'; a.fillRect(0, 0, W, H);
  a.drawImage(logo, lx, ly, lw, lh);

  // --- mapa de rugosidade: base polida + escovado horizontal + gravação fosca ---
  const c2 = document.createElement('canvas'); c2.width = W; c2.height = H;
  const b = c2.getContext('2d');
  b.fillStyle = '#1e1e1e'; b.fillRect(0, 0, W, H);         // ~0.12 = bem polido
  b.strokeStyle = '#ffffff'; b.lineWidth = 1;
  for(let i = 0; i < 900; i++){                            // escovado
    const y = Math.random() * H;
    b.globalAlpha = 0.03 + Math.random() * 0.05;
    b.beginPath(); b.moveTo(0, y); b.lineTo(W, y); b.stroke();
  }
  b.globalAlpha = 0.85; b.drawImage(logo, lx, ly, lw, lh); // gravação = fosca
  b.globalAlpha = 1;

  const fazer = (cv, srgb) => {
    const t = new THREE.CanvasTexture(cv);
    if(srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    return t;
  };
  return { cor: fazer(c1, true), rug: fazer(c2, false) };
}

/* ---------- sombra de contato (mancha suave no chão) ---------------------- */
function texturaSombra(){
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0.00, 'rgba(0,0,0,0.55)');
  g.addColorStop(0.45, 'rgba(0,0,0,0.24)');
  g.addColorStop(1.00, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

/* ---------- perfil quadrado com cantos arredondados (bomba V4 Square) ----- */
function quadradoArredondado(w, h, r){
  const s = new THREE.Shape();
  s.moveTo(-w/2 + r, -h/2);
  s.lineTo( w/2 - r, -h/2); s.quadraticCurveTo( w/2, -h/2,  w/2, -h/2 + r);
  s.lineTo( w/2,  h/2 - r); s.quadraticCurveTo( w/2,  h/2,  w/2 - r,  h/2);
  s.lineTo(-w/2 + r,  h/2); s.quadraticCurveTo(-w/2,  h/2, -w/2,  h/2 - r);
  s.lineTo(-w/2, -h/2 + r); s.quadraticCurveTo(-w/2, -h/2, -w/2 + r, -h/2);
  return s;
}

/* ========================================================================== */
export async function montarKit3D(canvas){
  const logo = new Image();
  logo.src = url('./logo-alce-claro.png');
  await (logo.decode ? logo.decode() : new Promise(r => { logo.onload = r; logo.onerror = r; }));

  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true, powerPreference:'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const ALVO = new THREE.Vector3(0, 1.34, 0);   // meio do conjunto copo + bomba
  camera.position.set(0, 1.95, 7.1);
  camera.lookAt(ALVO);

  /* ambiente */
  const pmrem = new THREE.PMREMGenerator(renderer);
  const eqt = texturaAmbiente();
  const env = pmrem.fromEquirectangular(eqt).texture;
  cena.environment = env;
  eqt.dispose(); pmrem.dispose();

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(2.4, 4.2, 3.2);
  cena.add(key);
  const rim = new THREE.DirectionalLight(0xffe9d0, 0.9);
  rim.position.set(-3, 1.6, -2.4);
  cena.add(rim);

  /* ---------------- copo em inox ---------------- */
  const kit = new THREE.Group();
  const { cor, rug } = texturasCopo(logo);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  cor.anisotropy = rug.anisotropy = maxAniso;
  // No CylinderGeometry o u=0 cai na frente do copo, e o logo foi desenhado no
  // meio do canvas (u=0,5). Sem esse deslocamento ele nasce virado para trás.
  cor.offset.x = rug.offset.x = 0.5;

  const R_TOPO = 0.60, R_BASE = 0.545, ALT = 1.50;

  const inox = new THREE.MeshStandardMaterial({
    map: cor, roughnessMap: rug, metalness: 1.0, roughness: 1.0, envMapIntensity: 1.6
  });
  const parede = new THREE.Mesh(
    new THREE.CylinderGeometry(R_TOPO, R_BASE, ALT, 128, 1, true), inox);
  parede.position.y = ALT / 2;
  kit.add(parede);

  // parede interna (mais escura, para dar profundidade na boca do copo)
  const interno = new THREE.MeshStandardMaterial({
    color: 0x8f8f8d, metalness: 1.0, roughness: 0.42, side: THREE.BackSide, envMapIntensity: 0.7
  });
  const dentro = new THREE.Mesh(
    new THREE.CylinderGeometry(R_TOPO - 0.012, R_BASE - 0.012, ALT, 96, 1, true), interno);
  dentro.position.y = ALT / 2;
  kit.add(dentro);

  // borda arredondada
  const borda = new THREE.Mesh(
    new THREE.TorusGeometry(R_TOPO - 0.006, 0.012, 12, 128),
    new THREE.MeshStandardMaterial({ color: 0xe6e6e4, metalness: 1.0, roughness: 0.14 }));
  borda.rotation.x = Math.PI / 2;
  borda.position.y = ALT;
  kit.add(borda);

  // fundo do copo
  const fundo = new THREE.Mesh(
    new THREE.CircleGeometry(R_BASE - 0.012, 96),
    new THREE.MeshStandardMaterial({ color: 0xa9a9a7, metalness: 1.0, roughness: 0.5 }));
  fundo.rotation.x = -Math.PI / 2;
  fundo.position.y = 0.055;
  kit.add(fundo);

  // base externa
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(R_BASE, R_BASE - 0.02, 0.05, 96),
    new THREE.MeshStandardMaterial({ color: 0xcfcfcd, metalness: 1.0, roughness: 0.3 }));
  base.position.y = 0.025;
  kit.add(base);

  /* ---------------- bomba V4 Square ---------------- */
  const curva = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,     0,    0),
    new THREE.Vector3(0.015, 0.75, 0),
    new THREE.Vector3(0.075, 1.45, 0),
    new THREE.Vector3(0.195, 2.15, 0),
    new THREE.Vector3(0.375, 2.80, 0)
  ]);
  // preto fosco, mas com metalness alto o bastante para pegar a luz de contorno
  // — preto chapado some contra o fundo escuro do banner
  const preto = new THREE.MeshStandardMaterial({
    color: 0x232323, metalness: 0.82, roughness: 0.48, envMapIntensity: 1.1 });

  const haste = new THREE.Mesh(
    new THREE.ExtrudeGeometry(quadradoArredondado(0.118, 0.090, 0.026),
      { extrudePath: curva, steps: 90, bevelEnabled: false }), preto);

  const bomba = new THREE.Group();
  bomba.add(haste);

  // filtro perfurado na ponta de baixo
  const filtro = new THREE.Mesh(
    new THREE.BoxGeometry(0.104, 0.42, 0.078),
    new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.8 }));
  filtro.position.set(0, 0.20, 0);
  bomba.add(filtro);

  // bocal achatado no topo, alinhado com a tangente da curva — se ficar só com
  // uma rotação fixa, ele "descola" da haste e vira um bloco solto
  const bocal = new THREE.Mesh(
    new THREE.BoxGeometry(0.142, 0.24, 0.070),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.85, roughness: 0.34 }));
  const tang = curva.getTangent(1).normalize();
  bocal.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tang);
  bocal.position.copy(curva.getPoint(1)).addScaledVector(tang, 0.055);
  bomba.add(bocal);

  bomba.position.set(-0.17, 0.07, 0.13);
  bomba.rotation.z = -0.055;
  kit.add(bomba);

  kit.position.y = -0.02;
  cena.add(kit);

  /* sombra de contato */
  const sombra = new THREE.Mesh(
    new THREE.PlaneGeometry(3.1, 3.1),
    new THREE.MeshBasicMaterial({ map: texturaSombra(), transparent:true, depthWrite:false, opacity:0.75 }));
  sombra.rotation.x = -Math.PI / 2;
  sombra.position.y = 0.004;
  sombra.scale.set(1, 0.72, 1);
  cena.add(sombra);

  /* ---------------- tamanho ---------------- */
  function medir(){
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // afasta quando o palco é estreito, para o kit nunca encostar nas bordas
    camera.position.z = w < 320 ? 8.2 : (w < 400 ? 7.6 : 7.1);
    camera.lookAt(ALVO);
    camera.updateProjectionMatrix();
  }
  medir();
  const ro = new ResizeObserver(medir);
  ro.observe(canvas);

  /* ---------------- girar com o mouse / dedo ---------------- */
  let girando = false, ultimoX = 0, velocidade = 0;
  const AUTO = 0.0055;                       // volta completa em ~19 s

  const pegar = e => { girando = true; ultimoX = e.clientX; velocidade = 0; canvas.setPointerCapture(e.pointerId); };
  const mover = e => {
    if(!girando) return;
    const d = (e.clientX - ultimoX) * 0.008;
    kit.rotation.y += d; velocidade = d; ultimoX = e.clientX;
  };
  const soltar = () => { girando = false; };
  canvas.addEventListener('pointerdown', pegar);
  canvas.addEventListener('pointermove', mover);
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);

  /* ---------------- laço de animação ---------------- */
  let ativo = true, visivel = true, quadro = 0, t0 = performance.now();

  const io = new IntersectionObserver(es => { visivel = es[0].isIntersecting; }, { threshold: 0.01 });
  io.observe(canvas);

  function laco(t){
    if(!ativo) return;
    quadro = requestAnimationFrame(laco);
    // fora da tela ou aba em segundo plano: não gasta GPU.
    // t0 é reposto para o movimento não dar um salto ao voltar.
    if(!visivel || document.hidden){ t0 = t; return; }

    const dt = Math.min((t - t0) / 16.67, 3); t0 = t;

    if(!girando){
      velocidade *= 0.94;                                  // inércia depois do arrasto
      kit.rotation.y += (AUTO + velocidade) * dt;
    }
    kit.position.y = -0.02 + Math.sin(t / 1400) * 0.012;   // respiro sutil
    renderer.render(cena, camera);
  }
  quadro = requestAnimationFrame(laco);

  /* ---------------- limpeza ---------------- */
  return {
    destruir(){
      ativo = false;
      cancelAnimationFrame(quadro);
      ro.disconnect(); io.disconnect();
      canvas.removeEventListener('pointerdown', pegar);
      canvas.removeEventListener('pointermove', mover);
      canvas.removeEventListener('pointerup', soltar);
      canvas.removeEventListener('pointercancel', soltar);
      cena.traverse(o => {
        if(o.geometry) o.geometry.dispose();
        if(o.material){
          for(const k of ['map','roughnessMap']) if(o.material[k]) o.material[k].dispose();
          o.material.dispose();
        }
      });
      env.dispose();
      renderer.dispose();
    }
  };
}
