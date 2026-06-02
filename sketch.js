// ── ESTADO ──────────────────────────────────────────
let escribiendo  = false;
let progreso     = 0;
let ultimoTiempo = 0;
let activacion   = 0;
let colorActual  = 0;
let ultimoCambioColor = 0;
let buffer       = "";
let fraseActual  = "";
let indice       = 0;

const baseW    = 90;
const baseH    = 32;
const velocidad = 0.02;
const tamBase  = 16;
const tamMax   = 80.0;

// ── DICCIONARIO SEMÁNTICO ────────────────────────────
const categorias = [
  {
    color: "#E20613",
    terminos: [
      "prohibido","prohibida","prohibidos","prohibidas","prohibe","prohibir",
      "restringir","restriccion","restringido","restringida","eliminar","eliminacion",
      "bloquear","bloqueado","suspender","suspension","cancelar","cancelacion",
      "vedado","impedido","denegado","inapropiado","inapropiada","incumplan",
      "incumplimiento","ofensivo","ofensiva","violacion","ilegal","ilegales",
      "no","nunca","jamas","sin","limite","limitado","limitada","limitados",
      "responsable","responsabilidad","obligacion","obligado","obligada",
      "debera","deberan","debe","deben","asumir","asume","asumira","cargo",
      "riesgo","riesgos","consecuencias"
    ]
  },
  {
    color: "#E5007E",
    terminos: [
      "reservamos","podemos","podra","podran","derecho","derechos",
      "modificar","modificacion","actualizar","actualizacion","cambiar","cambios",
      "unilateral","unilateralmente","exclusivo","exclusivos","exclusiva",
      "autorizacion","autorizado","autorizada","propiedad","propietario",
      "control","gestion","administrar","administracion","decidir","decision",
      "determinar","establecer","nos","nuestra","nuestro","nuestros","nuestras",
      "datos","informacion","privacidad","personal","personales",
      "recopilar","recopilacion","almacenar","almacenamiento","tratar","tratamiento",
      "compartir","cookies","seguimiento","perfil","perfiles","historial",
      "terceros","publicidad","comercial","monetizar","monetizacion",
      "eximiendo","exime","exencion","garantia","danos",
      "perjuicios","renuncia","renunciar","declina","declinar"
    ]
  }
];

let bancoFragmentos  = [];
let palabrasPeligrosas = [];
let btnAceptar, btnRechazar, btnVolver, textoElemento, tituloEl;

// ── UTILS ─────────────────────────────────────────────
function normalizar(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}
function getCat(palabra) {
  let norm = normalizar(palabra);
  for (let cat of categorias) {
    if (cat.terminos.includes(norm)) return cat;
  }
  return null;
}
function wrapPalabra(palabra, cat, tam, blend) {
  let blendStyle = blend ? 'mix-blend-mode:difference;' : '';
  return `<span style="color:${cat.color};font-size:${tam}px;font-weight:bold;line-height:24px;display:inline;vertical-align:baseline;${blendStyle}">${palabra}</span>`;
}
function marcarTexto(texto) {
  let tam = Math.min(windowWidth * 0.045, 22);
  let tokens = texto.match(/[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]+|[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]+/g) || [];
  return tokens.map(t => { let c = getCat(t); return c ? wrapPalabra(t, c, tam, false) : t; }).join('');
}
function marcarFrase(texto) {
  let tokens = texto.match(/[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]+|[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]+/g) || [];
  let tam = tamBase * Math.pow(tamMax, progreso);
  let pctActual = btnAceptar ? parseFloat(btnAceptar.style.width) / windowWidth : 0;
  let blend = pctActual >= 0.45;
  return tokens.map(t => { let c = getCat(t); return c ? wrapPalabra(t, c, tam, blend) : t; }).join('');
}
function extraerPalabrasPeligrosas(texto) {
  let set = new Set();
  (texto.match(/[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]+/g) || []).forEach(p => { if (getCat(p)) set.add(p); });
  return Array.from(set);
}
function extraerFragmentos(texto) {
  let frases = texto
    .split(/[.,;]+/)
    .map(f => f.trim())
    .filter(f => f.length > 20 && f.length < 120);
  for (let i = frases.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [frases[i], frases[j]] = [frases[j], frases[i]];
  }
  return frases;
}

// ── GENERACIÓN ───────────────────────────────────────
function generarFrase() {
  let frase = "";
  if (bancoFragmentos.length >= 2) {
    let n = Math.floor(lerp(1, 3, activacion));
    for (let i = 0; i < n; i++) {
      frase += bancoFragmentos[Math.floor(Math.random() * bancoFragmentos.length)] + ". ";
    }
  } else {
    frase = "Los presentes términos y condiciones regulan el uso del servicio. ";
  }
  let inyecciones = floor(lerp(0, 8, pow(activacion, 0.5)));
  for (let j = 0; j < inyecciones; j++) {
    if (palabrasPeligrosas.length > 0) frase += random(palabrasPeligrosas) + " ";
  }
  return marcarFrase(frase);
}

// ── ANÁLISIS ─────────────────────────────────────────
function iniciarAnalisis() {
  let ta = document.getElementById('texto-entrada');
  let textoRaw = ta ? ta.value.trim() : '';
  if (!textoRaw) { alert('Pega primero un texto.'); return; }

  bancoFragmentos    = extraerFragmentos(textoRaw);
  palabrasPeligrosas = extraerPalabrasPeligrosas(textoRaw);
  buffer = marcarTexto(textoRaw);
  fraseActual = ""; indice = 0;

  document.getElementById('pantalla-entrada').style.display = 'none';
  document.getElementById('pantalla-principal').style.display = 'block';
  btnAceptar.style.display  = 'block';
  btnRechazar.style.display = 'block';
  btnVolver.style.display   = 'block';

  textoElemento.html(buffer);
  tituloEl.html('Términos y condiciones');
}

function volverPantallaEntrada() {
  document.getElementById('pantalla-principal').style.display = 'none';
  document.getElementById('pantalla-entrada').style.display = 'block';
  btnAceptar.style.display  = 'none';
  btnRechazar.style.display = 'none';
  btnVolver.style.display   = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── SETUP ────────────────────────────────────────────
function setup() {
  noCanvas();

  btnAceptar  = document.getElementById('btn-aceptar');
  btnRechazar = document.getElementById('btn-rechazar');

  document.getElementById('btn-analizar').addEventListener('click', iniciarAnalisis);
  btnVolver = document.getElementById('btn-volver');
  btnVolver.addEventListener('click', volverPantallaEntrada);

  let principal = select('#pantalla-principal');

  tituloEl = createElement('h1', '');
  tituloEl.style('mix-blend-mode', 'difference');
  tituloEl.style('color', 'white');
  tituloEl.style('position', 'fixed');
  tituloEl.style('top', '8px');
  tituloEl.style('left', '8px');
  tituloEl.style('z-index', '10');
  tituloEl.parent(principal);

  textoElemento = createP('');
  textoElemento.style('margin-top', '120px');
  textoElemento.style('overflow-x', 'hidden');
  textoElemento.style('word-break', 'break-word');
  textoElemento.style('overflow-wrap', 'break-word');
  textoElemento.style('max-width', 'calc(100vw - 16px)');
  textoElemento.style('width', '100%');
  textoElemento.style('color', 'black');
  textoElemento.parent(principal);
  actualizarTextoResponsive();

  btnAceptar.addEventListener('mouseover', () => {
    escribiendo  = true;
    ultimoTiempo = millis();
    // Desactivar hover de rechazar mientras aceptar está activo
    document.body.classList.add('aceptar-activo');
  });
  btnAceptar.addEventListener('mouseout', () => {
    escribiendo = false;
    progreso    = 0;
    activacion  = 0;
    // Reactivar hover de rechazar
    document.body.classList.remove('aceptar-activo');
    resetUI();
  });

  setInterval(() => {
    if (!escribiendo) return;
    let ahora = millis();
    let delta = (ahora - ultimoTiempo) / 1000;
    ultimoTiempo = ahora;
    progreso = min(1, progreso + delta * velocidad);
    aplicarEfectos();
    generarTextoTick();
  }, 16);
}

function actualizarTextoResponsive() {
  if (!textoElemento) return;
  let size;
  if (windowWidth <= 480) {
    size = constrain(windowWidth * 0.08, 20, 28);
  } else if (windowWidth <= 768) {
    size = constrain(windowWidth * 0.07, 22, 30);
  } else {
    size = constrain(windowWidth * 0.045, 22, 34);
  }
  textoElemento.style('font-size', size + 'px');
  textoElemento.style('line-height', '40px');
  textoElemento.style('padding', '0 12px');
}

function windowResized() {
  actualizarTextoResponsive();
}

// ── TICK ─────────────────────────────────────────────
function generarTextoTick() {
  let vel = floor(lerp(1, 12, activacion));
  for (let i = 0; i < vel; i++) {
    if (indice >= fraseActual.length) { fraseActual = generarFrase(); indice = 0; }
    buffer += fraseActual.charAt(indice++);
  }
  textoElemento.html(buffer);
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

// ── EFECTOS ──────────────────────────────────────────
function aplicarEfectos() {
  let maxW = windowWidth - 16;
  let w = lerp(baseW, maxW, progreso);
  let h = lerp(baseH, windowHeight * 1.5, progreso);
  btnAceptar.style.width  = w + 'px';
  btnAceptar.style.height = h + 'px';

  activacion = pow(map(w / maxW, 0.2, 1, 0, 1, true), 0.35);

  let pct = w / windowWidth;
  let bg;

  if (pct < 0.4) {
    let t = Math.min(1, pct / 0.4);
    let rbv = Math.round(255 * (1 - t));
    bg = 'rgb(' + rbv + ',255,' + rbv + ')';

  } else if (pct < 0.8) {
    let osc = (Math.sin(millis() * 0.003) + 1) / 2;
    bg = 'rgb(0,255,' + Math.round(255 * osc) + ')';

  } else {
    let flashVel = map(pct, 0.8, 1.0, 2, 40);
    let flash = Math.sin(millis() * 0.001 * flashVel * Math.PI);
    bg = flash > 0 ? 'rgb(255,255,255)' : 'rgb(0,0,0)';

    const rave = [[0,255,0],[0,255,255],[255,255,0],[255,0,0]];
    let rt = (millis() * 0.003) % rave.length;
    let ri = Math.floor(rt), rf = rt - ri;
    let ca = rave[ri % 4], cb = rave[(ri+1) % 4];
    let rStr = 'rgb(' +
      Math.round(ca[0]+(cb[0]-ca[0])*rf) + ',' +
      Math.round(ca[1]+(cb[1]-ca[1])*rf) + ',' +
      Math.round(ca[2]+(cb[2]-ca[2])*rf) + ')';
    tituloEl.style('color', rStr);
    btnAceptar.style.borderColor  = rStr;
    btnRechazar.style.borderColor = rStr;
  }

  if (pct < 0.8) tituloEl.style('color', 'white');

  document.body.style.background = bg;
  document.documentElement.style.background = bg;

  btnAceptar.style.filter = `blur(${activacion * progreso * 100}px)`;

  // Corrupción
  let corrupted = ""; let inTag = false;
  for (let i = 0; i < buffer.length; i++) {
    let ch = buffer[i];
    if (ch === '<') { inTag = true;  corrupted += ch; continue; }
    if (ch === '>') { inTag = false; corrupted += ch; continue; }
    if (!inTag && random() < activacion * progreso * 0.001)
      ch = random(['#','%','&','§','@','!','?']);
    corrupted += ch;
  }
  textoElemento.html(corrupted);
}

// ── RESET ─────────────────────────────────────────────
function resetUI() {
  btnAceptar.style.width       = baseW + 'px';
  btnAceptar.style.height      = baseH + 'px';
  btnAceptar.style.filter      = 'none';
  btnAceptar.style.background  = 'white';
  btnAceptar.style.borderColor = 'black';
  btnRechazar.style.background  = 'white';
  btnRechazar.style.borderColor = 'white';
  btnRechazar.style.opacity     = '1';
  document.body.style.background = 'white';
  document.documentElement.style.background = 'white';
  tituloEl.style('color', 'white');
  if (textoElemento) textoElemento.html(buffer);
}
