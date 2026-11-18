// =====================================================
//  Pradera: "Mi jardín" dibujado como un jardín de verdad
// =====================================================
//
// Cada ramo guardado se planta como una mata con sus flores.
// Las más nuevas quedan adelante; las más viejas, atrás y más pequeñas.
// Al tocar una planta, se muestra su tarjeta debajo del jardín.

let praderaActual = null;

function dibujarPradera(contenedor, items, alElegir) {
  borrarPradera();
  praderaActual = new p5((p) => sketchPradera(p, contenedor, items, alElegir), contenedor);
}

function borrarPradera() {
  if (praderaActual) {
    praderaActual.remove();
    praderaActual = null;
  }
}

// Las flores de cada planta del jardín
function floresDePlanta(item) {
  if (item.especial) return ramoEva;
  const lista = (item.flores || []).map((i) => flores[i]).filter(Boolean);
  return lista.length ? lista : [flores[hashTexto(item.id) % flores.length]];
}

function sketchPradera(p, contenedor, items, alElegir) {
  const { FORMAS, oscurecer } = crearPincel(p);
  let W = 0;
  let H = 0;
  let inicio = 0;
  let plantas = [];       // en el orden del jardín (la más nueva primero)
  let porDibujar = [];    // las mismas, de atrás hacia adelante
  let pasto = [];
  let luciernagas = [];
  let elegida = null;
  let encima = null;   // planta bajo el mouse
  let lienzo = null;

  const progreso = (t, retraso, duracion) => p.constrain((t - retraso) / duracion, 0, 1);
  const suavizar = (x) => 1 - Math.pow(1 - x, 3);
  const rebote = (x) => {
    if (x <= 0) return 0;
    const c1 = 1.70158;
    return 1 + (c1 + 1) * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  };

  // ---------- armar el jardín ----------
  function crearPlanta(item, i) {
    const azar = crearAleatorio(hashTexto(item.id));
    const floresPlanta = floresDePlanta(item);
    const cantidad = floresPlanta.length;
    return {
      item,
      retraso: 0.15 + i * 0.07,
      desvio: azar() - 0.5,
      tallos: floresPlanta.map((flor, k) => ({
        flor,
        angulo: cantidad === 1 ? (azar() - 0.5) * 0.2 : -0.38 + (0.76 * k) / (cantidad - 1) + (azar() - 0.5) * 0.12,
        largo: 0.72 + azar() * 0.28,
        curva: (azar() - 0.5) * 0.4,
        giro: azar() * Math.PI * 2,
        fase: azar() * Math.PI * 2,
        racimo: Array.from({ length: 12 }, (_, n) => ({ t: n / 11, dx: azar() * 2 - 1, r: 0.75 + azar() * 0.35 })),
      })),
      hojas: [azar() * 0.6 + 0.7, -(azar() * 0.6 + 0.7)],
    };
  }

  function porFila() {
    return Math.max(3, Math.floor(W / 92));
  }

  function medir() {
    W = contenedor.clientWidth || 340;
    const filas = Math.max(1, Math.ceil(items.length / porFila()));
    H = Math.round(Math.min(560, Math.max(250, 175 + filas * 58)));
  }

  // Fila 0 = adelante (abajo). Cada fila hacia atrás sube y se encoge un poco.
  function ubicar() {
    const n = porFila();
    plantas.forEach((planta, i) => {
      const fila = Math.floor(i / n);
      const col = i % n;
      const enFila = Math.min(n, plantas.length - fila * n);
      const paso = W / n;
      const margen = (W - enFila * paso) / 2;
      planta.fila = fila;
      planta.escala = Math.pow(0.86, fila) * Math.min(1, W / 420 + 0.35);
      planta.x = margen + (col + 0.5) * paso + planta.desvio * paso * 0.35 + (fila % 2 ? paso * 0.25 : 0);
      planta.y = H - 34 - fila * 52;
      planta.alto = 112 * planta.escala;
    });
    porDibujar = [...plantas].sort((a, b) => a.y - b.y);
  }

  function crearPasto() {
    const azar = crearAleatorio(99);
    const horizonte = plantas.length ? Math.min(...plantas.map((pl) => pl.y)) - 40 : H - 90;
    pasto = Array.from({ length: Math.round(W / 6) }, () => {
      const y = horizonte + azar() * (H - horizonte);
      return { x: azar() * W, y, alto: 6 + azar() * 14 * (0.5 + (y - horizonte) / (H - horizonte)), fase: azar() * 6 };
    }).sort((a, b) => a.y - b.y);
    return horizonte;
  }

  let horizonte = 0;

  // ---------- geometría ----------
  function puntaDelTallo(planta, tallo, t, g) {
    const s = planta.escala;
    const viento = reducirMovimiento ? 0 : Math.sin(t * 1.2 + planta.x * 0.02 + tallo.fase) * 0.05
      + (p.noise(planta.x * 0.01, t * 0.3) - 0.5) * 0.08;
    const a = tallo.angulo + viento;
    const L = planta.alto * tallo.largo * g;
    return {
      a,
      x: planta.x + Math.sin(a) * L,
      y: planta.y - Math.cos(a) * L,
      cx: planta.x + Math.sin(a) * L * 0.5 + Math.cos(a) * tallo.curva * 20 * s,
      cy: planta.y - Math.cos(a) * L * 0.5,
    };
  }

  function centroDePlanta(planta) {
    return { x: planta.x, y: planta.y - planta.alto * 0.75 };
  }

  // ---------- dibujo ----------
  function dibujarSuelo(t) {
    const ctx = p.drawingContext;
    const degradado = ctx.createLinearGradient(0, horizonte - 20, 0, H);
    degradado.addColorStop(0, "rgba(28,34,52,0.0)");
    degradado.addColorStop(0.15, "rgba(28,34,52,0.85)");
    degradado.addColorStop(1, "rgba(12,14,26,0.98)");
    ctx.fillStyle = degradado;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) {
      ctx.lineTo(x, horizonte + Math.sin(x * 0.012) * 10 + p.noise(x * 0.01) * 14);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();

    p.noFill();
    pasto.forEach((brizna) => {
      const viento = reducirMovimiento ? 0 : Math.sin(t * 1.5 + brizna.fase + brizna.x * 0.03) * 3;
      p.stroke(70, 110, 85, 150);
      p.strokeWeight(1.2);
      p.line(brizna.x, brizna.y, brizna.x + viento, brizna.y - brizna.alto);
    });
  }

  function dibujarPlanta(planta, t) {
    const g = suavizar(progreso(t, planta.retraso, 0.9));
    if (g <= 0) return;
    const s = planta.escala;
    const destacada = planta === elegida || planta === encima;

    // hojas en la base
    p.noStroke();
    p.fill(COLOR_HOJA);
    planta.hojas.forEach((lado) => {
      p.push();
      p.translate(planta.x, planta.y);
      p.rotate(lado * 0.9 - Math.PI / 2 * Math.sign(lado) * 0.1);
      p.ellipse(lado * 9 * s * g, -6 * s * g, 22 * s * g, 8 * s * g);
      p.pop();
    });

    // tallos
    planta.tallos.forEach((tallo) => {
      const punta = puntaDelTallo(planta, tallo, t, g);
      p.noFill();
      p.stroke(COLOR_TALLO);
      p.strokeWeight(Math.max(1, 2.2 * s));
      p.beginShape();
      p.vertex(planta.x, planta.y);
      p.quadraticVertex(punta.cx, punta.cy, punta.x, punta.y);
      p.endShape();
    });

    // flores
    const e = rebote(progreso(t, planta.retraso + 0.6, 0.6));
    if (e <= 0) return;
    planta.tallos.forEach((tallo) => {
      const punta = puntaDelTallo(planta, tallo, t, g);
      const r = 18 * s * e * (planta.item.especial ? 1.15 : 1);
      if (destacada) {
        const c = p.color(tallo.flor.aura || tallo.flor.color);
        const ctx = p.drawingContext;
        const halo = ctx.createRadialGradient(punta.x, punta.y, 0, punta.x, punta.y, r * 2.4);
        halo.addColorStop(0, `rgba(${p.red(c)},${p.green(c)},${p.blue(c)},0.45)`);
        halo.addColorStop(1, `rgba(${p.red(c)},${p.green(c)},${p.blue(c)},0)`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(punta.x, punta.y, r * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      p.push();
      p.translate(punta.x, punta.y);
      if (FORMAS_ORIENTADAS.includes(tallo.flor.forma)) p.rotate(punta.a);
      else if (FORMAS_ERGUIDAS.includes(tallo.flor.forma)) p.rotate(punta.a * 0.6);
      else p.rotate(tallo.giro);
      p.noStroke();
      FORMAS[tallo.flor.forma](r, tallo.flor, tallo);
      p.pop();
    });
  }

  function dibujarEtiqueta(planta) {
    const texto = TIPOS_PLANTA[planta.item.tipo]
      ? TIPOS_PLANTA[planta.item.tipo].titulo(planta.item)
      : planta.item.nombre;
    p.textFont("Cormorant Garamond");
    p.textStyle(p.BOLD);
    p.textSize(15);
    const ancho = p.textWidth(texto) + 18;
    const x = p.constrain(planta.x, ancho / 2 + 4, W - ancho / 2 - 4);
    const y = planta.y + 16;
    p.noStroke();
    p.fill(11, 8, 32, 220);
    p.rect(x - ancho / 2, y - 12, ancho, 24, 12);
    p.fill(244, 236, 223);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(texto, x, y);
  }

  function dibujarBrote(t) {
    // jardín vacío: un brotecito esperando
    const x = W / 2;
    const y = H - 50;
    const vaiven = reducirMovimiento ? 0 : Math.sin(t * 1.4) * 0.08;
    p.stroke(COLOR_TALLO);
    p.strokeWeight(2.5);
    p.noFill();
    p.line(x, y, x + Math.sin(vaiven) * 26, y - 26);
    p.noStroke();
    p.fill(COLOR_HOJA);
    p.push();
    p.translate(x + Math.sin(vaiven) * 26, y - 26);
    p.rotate(vaiven);
    p.ellipse(-9, -4, 18, 8);
    p.ellipse(9, -4, 18, 8);
    p.pop();
  }

  function dibujarLuciernagas(t) {
    p.noStroke();
    luciernagas.forEach((l, i) => {
      if (!reducirMovimiento) {
        l.x += (p.noise(i * 7, t * 0.25) - 0.5) * 0.8;
        l.y += (p.noise(i * 7 + 100, t * 0.25) - 0.5) * 0.6;
        if (l.x < 0) l.x = W;
        if (l.x > W) l.x = 0;
        l.y = p.constrain(l.y, 10, H - 20);
      }
      const brillo = 0.5 + 0.5 * Math.sin(t * 2 + l.fase);
      p.fill(233, 205, 120, 40 * brillo);
      p.circle(l.x, l.y, 10);
      p.fill(233, 205, 120, 210 * brillo);
      p.circle(l.x, l.y, 2.5);
    });
  }

  // ---------- interacción ----------
  function plantaEn(x, y) {
    let mejor = null;
    let menor = Infinity;
    plantas.forEach((planta) => {
      const c = centroDePlanta(planta);
      const d = Math.hypot(x - c.x, (y - c.y) * 0.8);
      if (d < 56 * planta.escala && d < menor + 6) {
        // a igual distancia gana la de adelante
        if (d < menor || planta.y > (mejor ? mejor.y : -1)) {
          mejor = planta;
          menor = d;
        }
      }
    });
    return mejor;
  }

  const dentro = () => p.mouseX >= 0 && p.mouseX <= W && p.mouseY >= 0 && p.mouseY <= H;

  p.mousePressed = function () {
    if (!dentro()) return;
    const planta = plantaEn(p.mouseX, p.mouseY);
    if (!planta) return;
    elegida = planta;
    sonido.plantar();
    alElegir(planta.item);
    if (reducirMovimiento) p.redraw();
  };

  p.mouseMoved = function () {
    const antes = encima;
    encima = dentro() ? plantaEn(p.mouseX, p.mouseY) : null;
    if (lienzo) lienzo.elt.style.cursor = encima ? "pointer" : "default";
    if (reducirMovimiento && antes !== encima) p.redraw();
  };

  // ---------- ciclo de p5 ----------
  p.setup = function () {
    plantas = items.map(crearPlanta);
    medir();
    lienzo = p.createCanvas(W, H);
    lienzo.elt.setAttribute("role", "img");
    lienzo.elt.setAttribute(
      "aria-label",
      items.length
        ? `Tu jardín con ${items.length} ${items.length === 1 ? "planta" : "plantas"}. Toca una planta para verla, o usa la vista de lista.`
        : "Tu jardín está vacío: un brotecito espera la primera flor."
    );
    p.frameRate(30);
    p.noiseSeed(7);
    ubicar();
    horizonte = crearPasto();
    const azar = crearAleatorio(5);
    luciernagas = Array.from({ length: Math.round(W / 22) }, () => ({
      x: azar() * W,
      y: azar() * H * 0.85,
      fase: azar() * 6,
    }));
    inicio = p.millis();
    if (reducirMovimiento) p.noLoop();
  };

  p.draw = function () {
    const t = reducirMovimiento ? 100 : (p.millis() - inicio) / 1000;
    p.clear();
    dibujarSuelo(t);
    if (plantas.length === 0) dibujarBrote(t);
    porDibujar.forEach((planta) => dibujarPlanta(planta, t));
    dibujarLuciernagas(t);
    const conEtiqueta = encima || elegida;
    if (conEtiqueta && t > conEtiqueta.retraso + 1) dibujarEtiqueta(conEtiqueta);
  };

  p.windowResized = function () {
    const antes = W;
    medir();
    if (W !== antes) {
      p.resizeCanvas(W, H);
      ubicar();
      horizonte = crearPasto();
      if (reducirMovimiento) p.redraw();
    }
  };
}
