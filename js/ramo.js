// =====================================================
//  Lógica del ramo y dibujo con p5.js
// =====================================================

const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// "  HÉCTOR   figueroa " -> "hector figueroa"
// Así mayúsculas, tildes y espacios extra no cambian el ramo.
function normalizarNombre(nombre) {
  return nombre
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Hash FNV-1a: convierte el texto en un número.
// A diferencia de sumar letras, el orden importa ("roma" ≠ "amor").
function hashTexto(texto) {
  let h = 2166136261;
  for (const letra of texto) {
    h ^= letra.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Generador de números aleatorios con semilla (mulberry32):
// la misma semilla siempre produce la misma secuencia.
function crearAleatorio(semilla) {
  let a = semilla;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Elige flores distintas mezclando la lista con la semilla del nombre
function elegirFlores(semilla, cantidad = FLORES_POR_RAMO) {
  const aleatorio = crearAleatorio(semilla);
  const mezcla = [...flores];
  for (let i = mezcla.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [mezcla[i], mezcla[j]] = [mezcla[j], mezcla[i]];
  }
  return mezcla.slice(0, cantidad);
}


// ---------- control del lienzo ----------

const COLOR_TALLO = "#4f7a4a";
const COLOR_HOJA = "#5d8c55";
const DURACION_TALLO = 1.4;   // segundos que tarda en crecer un tallo

let sketchActual = null;

// opciones.instantaneo: dibuja el ramo ya florecido (para la vista previa del taller)
function dibujarRamo(ramo, semilla, nombre, estilo = ESTILO_NORMAL, opciones = {}) {
  const contenedor = document.getElementById("canvas-contenedor");
  borrarRamoDibujado();
  contenedor.hidden = false;
  sketchActual = new p5(
    (p) => sketchRamo(p, contenedor, ramo, semilla, nombre, estilo, opciones),
    contenedor
  );
}

function borrarRamoDibujado() {
  if (sketchActual) {
    sketchActual.remove();
    sketchActual = null;
  }
  const contenedor = document.getElementById("canvas-contenedor");
  contenedor.replaceChildren();
  contenedor.hidden = true;
}

function obtenerLienzoRamo() {
  return document.querySelector("#canvas-contenedor canvas");
}

// Dibuja el ramo ya florecido fuera de pantalla y devuelve una miniatura JPG (para "Mi jardín")
function generarMiniatura(ramo, semilla, estilo, ancho = 240) {
  return new Promise((resolve) => {
    const caja = document.createElement("div");
    caja.style.cssText = `position:fixed;left:-10000px;top:0;width:${ancho}px;`;
    caja.setAttribute("aria-hidden", "true");
    document.body.append(caja);

    let instancia = null;
    let listo = false;

    function alDibujar(lienzo) {
      if (listo) return;
      listo = true;
      const alto = Math.round((ancho * lienzo.height) / lienzo.width);
      const miniatura = document.createElement("canvas");
      miniatura.width = ancho;
      miniatura.height = alto;
      const ctx = miniatura.getContext("2d");
      // fondo de cielo, porque el JPG no admite transparencia
      const cielo = ctx.createLinearGradient(0, 0, 0, alto);
      cielo.addColorStop(0, "#140d2c");
      cielo.addColorStop(1, "#2a1a4a");
      ctx.fillStyle = cielo;
      ctx.fillRect(0, 0, ancho, alto);
      ctx.drawImage(lienzo, 0, 0, ancho, alto);
      resolve(miniatura.toDataURL("image/jpeg", 0.82));
      setTimeout(() => {
        if (instancia) instancia.remove();
        caja.remove();
      }, 0);
    }

    instancia = new p5(
      (p) => sketchRamo(p, caja, ramo, semilla, "", estilo, { ancho, unaVez: true, densidad: 1, alDibujar }),
      caja
    );
  });
}


// ---------- el sketch ----------

function sketchRamo(p, contenedor, ramo, semilla, nombre, estilo, opciones) {
  let W = 0;
  let H = 0;
  let inicio = 0;
  let tallos = [];        // tallos con flor (principales y acompañantes)
  let ordenDibujo = [];   // de atrás hacia adelante
  let relleno = [];       // ramitas, hojas y florecitas de acompañamiento
  let particulas = [];    // luciérnagas
  let estrellas = [];     // destellos de fondo
  let petalos = [];       // pétalos que caen
  let motas = [];         // puntitos del papel

  const conPapel = Boolean(estilo.papel);
  const grande = estilo.efectos || conPapel;
  const NUDO = { x: 0.5, y: conPapel ? 0.78 : 0.8 };   // donde se juntan los tallos
  const PROPORCION = grande ? 1.2 : 1.1;
  const ANCHO_MAX = grande ? 520 : 480;
  const ADELANTO = opciones.instantaneo ? 8 : 0;      // segundos que se "adelanta" la animación

  // ---------- utilidades ----------
  const progreso = (t, retraso, duracion) => p.constrain((t - retraso) / duracion, 0, 1);
  const suavizar = (x) => 1 - Math.pow(1 - x, 3);
  const rebote = (x) => {
    if (x <= 0) return 0;
    const c1 = 1.70158;
    return 1 + (c1 + 1) * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  };
  const oscurecer = (c, k) => p.lerpColor(p.color(c), p.color(0), k);
  const aclarar = (c, k) => p.lerpColor(p.color(c), p.color(255), k);
  const rgba = ([r, g, b], a) => `rgba(${r},${g},${b},${a})`;

  function medir() {
    W = opciones.ancho || Math.min(contenedor.clientWidth || 360, ANCHO_MAX);
    H = Math.round(W * PROPORCION);
  }

  // ---------- composición (se genera una vez con la semilla) ----------
  function crearTallo(flor, { angulo, largo, radio, retraso, capa, principal }) {
    return {
      flor, angulo, largo, radio, retraso, capa, principal,
      curva: p.random(-0.06, 0.06),
      abajo: p.random(-0.03, 0.03),
      giro: p.random(p.TWO_PI),
      fase: p.random(p.TWO_PI),
      hoja: {
        pos: conPapel ? p.random(0.5, 0.68) : p.random(0.3, 0.5),
        lado: p.random() < 0.5 ? -1 : 1,
        tam: p.random(0.8, 1.2),
      },
      racimo: Array.from({ length: 16 }, (_, k) => ({
        t: k / 15,
        dx: p.random(-1, 1),
        r: p.random(0.75, 1.1),
      })),
    };
  }

  function composicionEva() {
    ACOMPANANTES_EVA.forEach((a, i) => {
      tallos.push(crearTallo(flores.find((f) => f.nombre === a.nombre), {
        angulo: a.angulo + p.random(-0.04, 0.04),
        largo: a.largo + p.random(-0.02, 0.02),
        radio: p.random(0.058, 0.07),
        retraso: 0.3 + i * 0.12,
        capa: 0,
        principal: false,
      }));
    });
    ramo.forEach((flor, i) => {
      tallos.push(crearTallo(flor, {
        ...DISPOSICION_EVA[i],
        capa: 1 + DISPOSICION_EVA[i].capa,
        retraso: 0.9 + i * 0.3,
        principal: true,
      }));
    });
  }

  // De 1 a 6 flores repartidas en abanico
  function composicionNormal() {
    const n = ramo.length;
    const abertura = n <= 1 ? 0 : n <= 4 ? (0.5 * (n - 1)) / 3 : 0.62;
    ramo.forEach((flor, i) => {
      const posicion = n === 1 ? 0.5 : i / (n - 1);
      const cercaniaCentro = 1 - Math.abs(posicion - 0.5) * 2;
      // con muchas flores, se alternan alturas para que no se tapen
      const escalon = n > 4 ? (i % 2 ? -0.06 : 0.03) : 0;
      tallos.push(crearTallo(flor, {
        angulo: p.lerp(-abertura, abertura, posicion) + p.random(-0.08, 0.08),
        largo: 0.42 + cercaniaCentro * 0.12 + escalon + p.random(-0.03, 0.03),
        radio: (n > 4 ? 0.088 : 0.1) + p.random(-0.008, 0.012),
        retraso: 0.3 + i * 0.25,
        capa: cercaniaCentro + (escalon < 0 ? 1 : 0),
        principal: true,
      }));
    });
  }

  function generarComposicion() {
    tallos = [];
    if (estilo.composicion === "eva") composicionEva();
    else composicionNormal();
    ordenDibujo = [...tallos].sort((a, b) => a.capa - b.capa);

    const cantidadRelleno = grande ? 12 : 7 + Math.floor(p.random(3));
    const abertura = grande ? 1.0 : 0.8;
    relleno = Array.from({ length: cantidadRelleno }, () => {
      const angulo = p.random(-abertura, abertura);
      return {
        tipo: p.random() < 0.4 ? "hoja" : "nube",
        angulo,
        largo: p.random(0.28, 0.48 - Math.abs(angulo) * 0.12),
        curva: p.random(-0.08, 0.08),
        abajo: p.random(-0.03, 0.03),
        retraso: p.random(0.1, 0.9),
        fase: p.random(p.TWO_PI),
        puntos: Array.from({ length: 6 + Math.floor(p.random(5)) }, () => ({
          dx: p.random(-1, 1),
          dy: p.random(-1, 1),
          r: p.random(0.4, 1),
        })),
      };
    });

    particulas = Array.from({ length: estilo.efectos ? 50 : 36 }, () => nuevaParticula(true));

    if (estilo.efectos) {
      estrellas = Array.from({ length: 18 }, () => ({
        x: p.random(0.04, 0.96),
        y: p.random(0.02, 0.55),
        tam: p.random(0.007, 0.016),
        fase: p.random(p.TWO_PI),
        vel: p.random(1.5, 3),
      }));
      petalos = Array.from({ length: 16 }, () => nuevoPetalo(true));
    }
    if (conPapel) {
      motas = Array.from({ length: 34 }, () => {
        const y = p.random(0.67, 0.95);
        const mitadAncho = p.lerp(0.24, 0.05, (y - 0.63) / 0.35);
        return { x: 0.5 + p.random(-1, 1) * mitadAncho * 0.85, y, r: p.random(0.6, 1.4) };
      });
    }
  }

  function nuevaParticula(cualquierAltura) {
    return {
      x: p.random(),
      y: cualquierAltura ? p.random() : 1.02,
      vel: p.random(0.0006, 0.0018),
      tam: p.random(1.5, 3.5),
      fase: p.random(p.TWO_PI),
      rosa: estilo.efectos && p.random() < 0.35,
    };
  }

  function nuevoPetalo(cualquierAltura) {
    return {
      x: p.random(0.05, 0.95),
      y: cualquierAltura ? p.random(-0.1, 1) : -0.05,
      vel: p.random(0.0008, 0.0016),
      giro: p.random(p.TWO_PI),
      vgiro: p.random(-0.03, 0.03),
      tam: p.random(0.014, 0.022),
      fase: p.random(p.TWO_PI),
    };
  }

  // ---------- geometría de un tallo en el instante t ----------
  function geometria(item, t) {
    const bx = NUDO.x * W;
    const by = NUDO.y * H;
    const balanceo = reducirMovimiento ? 0 : Math.sin(t * 1.1 + item.fase) * 0.025;
    const a = item.angulo + balanceo;
    const L = item.largo * H;

    // punta del tallo (donde va la flor)
    const fx = bx + Math.sin(a) * L;
    const fy = by - Math.cos(a) * L;
    // punto de control de la curva
    const cx = (bx + fx) / 2 + Math.cos(a) * item.curva * H;
    const cy = (by + fy) / 2 + Math.sin(a) * item.curva * H;
    // extremo inferior: los tallos se cruzan en el nudo y se abren abajo
    const ix = bx - Math.sin(item.angulo) * 0.14 * H + item.abajo * W;
    const iy = by + Math.cos(item.angulo) * 0.14 * H;

    return { a, bx, by, cx, cy, fx, fy, ix, iy };
  }

  function puntoEnTallo(geo, g) {
    const u = 1 - g;
    return [
      u * u * geo.bx + 2 * u * g * geo.cx + g * g * geo.fx,
      u * u * geo.by + 2 * u * g * geo.cy + g * g * geo.fy,
    ];
  }

  // ---------- piezas de dibujo ----------
  // Halo de luz suave
  function brillo(x, y, radio, colorHex, alfa = 0.35) {
    if (radio <= 0 || alfa <= 0) return;
    const c = p.color(colorHex);
    const rgb = [p.red(c), p.green(c), p.blue(c)];
    const ctx = p.drawingContext;
    const degradado = ctx.createRadialGradient(x, y, 0, x, y, radio);
    degradado.addColorStop(0, rgba(rgb, alfa));
    degradado.addColorStop(1, rgba(rgb, 0));
    ctx.fillStyle = degradado;
    ctx.beginPath();
    ctx.arc(x, y, radio, 0, Math.PI * 2);
    ctx.fill();
  }

  // Destello de cuatro puntas
  function estrella4(x, y, s) {
    p.beginShape();
    for (let k = 0; k < 8; k++) {
      const ang = (k * p.PI) / 4 - p.HALF_PI;
      const d = k % 2 === 0 ? s : s * 0.22;
      p.vertex(x + Math.cos(ang) * d, y + Math.sin(ang) * d);
    }
    p.endShape(p.CLOSE);
  }

  // Pétalo puntiagudo que nace en (0,0) y apunta hacia arriba
  function petaloPunta(largo, ancho) {
    p.beginShape();
    p.vertex(0, 0);
    p.bezierVertex(ancho, -largo * 0.25, ancho * 0.7, -largo * 0.8, 0, -largo);
    p.bezierVertex(-ancho * 0.7, -largo * 0.8, -ancho, -largo * 0.25, 0, 0);
    p.endShape(p.CLOSE);
  }

  function dibujarTallo(item, t, duracion, grosor) {
    const geo = geometria(item, t);
    const g = suavizar(progreso(t, item.retraso, duracion));

    p.noFill();
    p.strokeWeight(Math.max(1, W * grosor));

    // la parte de abajo del tallo (si hay papel, queda tapada)
    if (!conPapel) {
      const colorAbajo = p.color(COLOR_TALLO);
      colorAbajo.setAlpha(255 * progreso(t, 0, 0.5));
      p.stroke(colorAbajo);
      p.line(geo.bx, geo.by, geo.ix, geo.iy);
    }

    if (g <= 0) return;
    p.stroke(COLOR_TALLO);
    p.beginShape();
    const pasos = 24;
    for (let k = 0; k <= pasos; k++) {
      const [x, y] = puntoEnTallo(geo, (g * k) / pasos);
      p.vertex(x, y);
    }
    p.endShape();
  }

  function formaHoja(x, y, direccion, tam) {
    if (tam <= 0) return;
    p.push();
    p.translate(x, y);
    p.rotate(direccion);
    p.noStroke();
    p.fill(COLOR_HOJA);
    p.beginShape();
    p.vertex(0, 0);
    p.bezierVertex(tam * 0.3, -tam * 0.35, tam * 0.8, -tam * 0.3, tam, 0);
    p.bezierVertex(tam * 0.8, tam * 0.3, tam * 0.3, tam * 0.35, 0, 0);
    p.endShape(p.CLOSE);
    p.stroke(oscurecer(COLOR_HOJA, 0.3));
    p.strokeWeight(1);
    p.line(0, 0, tam * 0.85, 0);
    p.pop();
  }

  function dibujarHoja(m, t) {
    const g = suavizar(progreso(t, m.retraso, DURACION_TALLO));
    if (g < m.hoja.pos) return;
    const crecimiento = p.constrain((g - m.hoja.pos) / 0.25, 0, 1);
    const geo = geometria(m, t);
    const [x, y] = puntoEnTallo(geo, m.hoja.pos);
    const [x2, y2] = puntoEnTallo(geo, m.hoja.pos + 0.02);
    const direccion = Math.atan2(y2 - y, x2 - x) + m.hoja.lado * 0.7;
    formaHoja(x, y, direccion, W * 0.07 * m.hoja.tam * crecimiento);
  }

  function dibujarCabezaRelleno(r, t) {
    const e = rebote(progreso(t, r.retraso + 0.9, 0.7));
    if (e <= 0) return;
    const geo = geometria(r, t);

    if (r.tipo === "hoja") {
      formaHoja(geo.fx, geo.fy, geo.a - Math.PI / 2, W * 0.08 * e);
      return;
    }
    // "nube": florecitas blancas tipo gypsophila
    const radio = W * 0.035;
    p.noStroke();
    p.fill(255, 248, 235, 220);
    r.puntos.forEach((pt) => {
      p.circle(geo.fx + pt.dx * radio, geo.fy + pt.dy * radio, W * 0.014 * pt.r * e);
    });
  }

  function dibujarLazo(t) {
    const a = progreso(t, conPapel ? 2.0 : 1.6, 0.6);
    if (a <= 0) return;
    const lazo = estilo.lazo;
    const s = W * (conPapel ? 0.055 : 0.05) * suavizar(a);
    const [cr, cg, cb] = lazo.color;
    const cola = conPapel ? 2.8 : 2.0;

    p.push();
    p.translate(NUDO.x * W, NUDO.y * H);
    p.noStroke();
    p.fill(cr, cg, cb, 255 * a);
    p.triangle(0, 0, -s * 0.9, s * cola, -s * 0.3, s * (cola + 0.1));
    p.triangle(0, 0, s * 0.9, s * cola, s * 0.3, s * (cola + 0.1));
    p.ellipse(-s * 0.8, -s * 0.1, s * 1.6, s * 0.9);
    p.ellipse(s * 0.8, -s * 0.1, s * 1.6, s * 0.9);
    if (lazo.borde) {
      p.noFill();
      p.stroke(...lazo.borde, 220 * a);
      p.strokeWeight(Math.max(1, s * 0.07));
      p.ellipse(-s * 0.8, -s * 0.1, s * 1.6, s * 0.9);
      p.ellipse(s * 0.8, -s * 0.1, s * 1.6, s * 0.9);
      p.noStroke();
    }
    p.fill(cr * 0.55, cg * 0.55, cb * 0.55, 255 * a);
    p.ellipse(-s * 0.8, -s * 0.1, s * 0.8, s * 0.35);
    p.ellipse(s * 0.8, -s * 0.1, s * 0.8, s * 0.35);
    const centro = lazo.borde || [cr * 0.87, cg * 0.87, cb * 0.87];
    p.fill(...centro, 255 * a);
    p.circle(0, 0, s * 0.7);
    p.pop();
  }

  // Papel de regalo: una capa detrás de los tallos y otra delante
  function dibujarPapel(t, capa) {
    const e = suavizar(progreso(t, capa === "atras" ? 1.0 : 1.3, 0.9));
    if (e <= 0) return;
    const papel = estilo.papel;
    const desplazamiento = (1 - e) * 0.05 * H;
    const P = (x, y) => [x * W, y * H + desplazamiento];
    p.noStroke();

    if (capa === "atras") {
      p.fill(...papel.fondo, 235 * e);
      for (let k = 0; k <= 14; k++) {
        const [x, y] = P(p.lerp(0.18, 0.82, k / 14), 0.555);
        p.circle(x, y, W * 0.05);
      }
      p.quad(...P(0.18, 0.555), ...P(0.82, 0.555), ...P(0.57, 0.97), ...P(0.43, 0.97));
      return;
    }

    // Capa delantera: festón de encaje + papel con degradado
    const [ax, ay] = P(0.26, 0.63);
    const [bx, by] = P(0.74, 0.63);
    const [cx, cy] = P(0.54, 0.985);
    const [dx, dy] = P(0.46, 0.985);

    p.fill(...papel.claro, 245 * e);
    for (let k = 0; k <= 12; k++) {
      p.circle(p.lerp(ax, bx, k / 12), ay, W * 0.04);
    }

    const ctx = p.drawingContext;
    const degradado = ctx.createLinearGradient(0, ay, 0, cy);
    degradado.addColorStop(0, rgba(papel.claro, 0.97 * e));
    degradado.addColorStop(1, rgba(papel.oscuro, 0.99 * e));
    ctx.fillStyle = degradado;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.lineTo(cx, cy);
    ctx.lineTo(dx, dy);
    ctx.closePath();
    ctx.fill();

    // pliegue central y bordes
    p.stroke(255, 255, 255, 28 * e);
    p.strokeWeight(Math.max(1, W * 0.004));
    p.line((ax + bx) / 2 - W * 0.04, ay, (cx + dx) / 2, cy);
    p.stroke(...papel.borde, 210 * e);
    p.strokeWeight(Math.max(1, W * 0.003));
    p.line(ax, ay, dx, dy);
    p.line(bx, by, cx, cy);
    p.line(ax, ay, bx, by);
    p.noStroke();

    p.fill(...papel.borde, 130 * e);
    motas.forEach((m) => {
      const [x, y] = P(m.x, m.y);
      p.circle(x, y, W * 0.006 * m.r);
    });
  }

  function dibujarFondoEspecial(t) {
    // aura dorada y rosada detrás del ramo (radios menores que la distancia al borde)
    const a = progreso(t, 0.6, 2);
    brillo(0.5 * W, 0.4 * H, 0.46 * W, "#f3c97a", 0.16 * a);
    brillo(0.5 * W, 0.34 * H, 0.32 * W, "#f7b8cc", 0.12 * a);

    const aparicion = progreso(t, 0.5, 1.5);
    p.noStroke();
    estrellas.forEach((s) => {
      const titila = reducirMovimiento ? 0.8 : 0.55 + 0.45 * Math.sin(t * s.vel + s.fase);
      p.fill(255, 236, 190, 230 * titila * aparicion);
      estrella4(s.x * W, s.y * H, s.tam * W * (0.6 + 0.4 * titila));
    });
  }

  function dibujarPetalosCayendo(t) {
    const a = progreso(t, 2.6, 1.5);
    if (a <= 0) return;
    p.noStroke();
    petalos.forEach((q) => {
      if (!reducirMovimiento) {
        q.y += q.vel;
        q.giro += q.vgiro;
        if (q.y > 1.05) Object.assign(q, nuevoPetalo(false));
      }
      const x = (q.x + Math.sin(t * 0.8 + q.fase) * 0.03) * W;
      const s = q.tam * W;
      p.push();
      p.translate(x, q.y * H);
      p.rotate(q.giro);
      p.scale(Math.max(0.2, Math.abs(Math.cos(t * 1.5 + q.fase))), 1);
      p.fill(247, 184, 204, 210 * a);
      p.ellipse(0, 0, s, s * 0.7);
      p.fill(255, 226, 236, 160 * a);
      p.ellipse(-s * 0.12, -s * 0.08, s * 0.45, s * 0.3);
      p.pop();
    });
  }

  // Cada forma dibuja una flor centrada en (0,0) con radio r
  const FORMAS = {
    redonda(r, flor) {
      const n = flor.petalos || 5;
      p.fill(flor.color);
      for (let i = 0; i < n; i++) {
        const ang = (i * p.TWO_PI) / n;
        p.circle(Math.cos(ang) * r * 0.5, Math.sin(ang) * r * 0.5, r);
      }
      p.fill(aclarar(flor.color, 0.25));
      for (let i = 0; i < n; i++) {
        const ang = (i * p.TWO_PI) / n;
        p.circle(Math.cos(ang) * r * 0.4, Math.sin(ang) * r * 0.4, r * 0.55);
      }
      p.fill(flor.centro);
      p.circle(0, 0, r * 0.4);
    },

    punta(r, flor) {
      const n = flor.petalos || 8;
      p.fill(oscurecer(flor.color, 0.25));
      for (let i = 0; i < n; i++) {
        p.push();
        p.rotate((i * p.TWO_PI) / n + p.PI / n);
        p.ellipse(0, -r * 0.5, r * 0.38, r);
        p.pop();
      }
      p.fill(flor.color);
      for (let i = 0; i < n; i++) {
        p.push();
        p.rotate((i * p.TWO_PI) / n);
        p.ellipse(0, -r * 0.42, r * 0.34, r * 0.85);
        p.pop();
      }
      p.fill(flor.centro);
      p.circle(0, 0, r * 0.3);
    },

    girasol(r, flor) {
      const n = flor.petalos || 18;
      p.fill(flor.color);
      for (let i = 0; i < n; i++) {
        p.push();
        p.rotate((i * p.TWO_PI) / n);
        p.ellipse(0, -r * 0.62, r * 0.22, r * 0.7);
        p.pop();
      }
      p.fill(flor.centro);
      p.circle(0, 0, r * 0.75);
      p.fill(oscurecer(flor.centro, 0.35));
      for (let k = 0; k < 24; k++) {
        const ang = k * 2.39996;   // ángulo áureo, como las semillas reales
        const d = Math.sqrt(k / 24) * r * 0.32;
        p.circle(Math.cos(ang) * d, Math.sin(ang) * d, r * 0.06);
      }
    },

    rosa(r, flor) {
      // sépalos verdes asomando por detrás
      p.fill(COLOR_HOJA);
      for (let i = 0; i < 5; i++) {
        p.push();
        p.rotate((i * p.TWO_PI) / 5 + 0.3);
        petaloPunta(r * 0.98, r * 0.18);
        p.pop();
      }
      const capas = 5;
      for (let k = 0; k < capas; k++) {
        const rr = r * (1 - k * 0.17);
        p.fill(p.lerpColor(oscurecer(flor.color, 0.3), aclarar(flor.color, 0.25), k / (capas - 1)));
        for (let i = 0; i < 5; i++) {
          const ang = (i * p.TWO_PI) / 5 + k * 0.6;
          p.circle(Math.cos(ang) * rr * 0.35, Math.sin(ang) * rr * 0.35, rr * 0.9);
        }
      }
      p.noFill();
      p.stroke(oscurecer(flor.color, 0.45));
      p.strokeWeight(Math.max(1, r * 0.04));
      p.beginShape();
      for (let ang = 0; ang < p.TWO_PI * 2.2; ang += 0.2) {
        const d = r * 0.04 + ang * r * 0.022;
        p.vertex(Math.cos(ang) * d, Math.sin(ang) * d);
      }
      p.endShape();
      p.noStroke();
    },

    pompon(r, flor) {
      const capas = 4;
      for (let k = 0; k < capas; k++) {
        const n = 16 - k * 3;
        const largo = r * (1 - k * 0.22);
        p.fill(p.lerpColor(oscurecer(flor.color, 0.25), aclarar(flor.color, 0.3), k / (capas - 1)));
        for (let i = 0; i < n; i++) {
          p.push();
          p.rotate((i * p.TWO_PI) / n + k * 0.3);
          p.ellipse(0, -largo * 0.5, largo * 0.3, largo * 0.85);
          p.pop();
        }
      }
      p.fill(flor.centro);
      p.circle(0, 0, r * 0.2);
    },

    // Orientada en la dirección del tallo
    tulipan(r, flor) {
      p.fill(oscurecer(flor.color, 0.2));
      for (const lado of [-1, 1]) {
        p.push();
        p.rotate(lado * 0.35);
        p.ellipse(lado * r * 0.2, -r * 0.35, r * 0.6, r * 1.2);
        p.pop();
      }
      p.fill(flor.color);
      p.ellipse(0, -r * 0.4, r * 0.65, r * 1.25);
      p.fill(aclarar(flor.color, 0.35));
      p.ellipse(-r * 0.08, -r * 0.55, r * 0.15, r * 0.6);
    },

    // Espiga de florecitas, orientada en la dirección del tallo
    racimo(r, flor, m) {
      m.racimo.forEach((b) => {
        const ancho = r * 0.35 * (1 - b.t * 0.6);
        p.fill(p.lerpColor(oscurecer(flor.color, 0.2), aclarar(flor.color, 0.25), b.t));
        p.circle(b.dx * ancho, -b.t * r * 2, r * 0.28 * b.r * (1 - b.t * 0.4));
      });
    },

    // Loto visto de frente: tres capas de pétalos abiertos en abanico
    loto(r, flor) {
      const capas = [
        { n: 7, abertura: 1.35, largo: 1.0,  ancho: 0.32, k: 0 },
        { n: 5, abertura: 0.85, largo: 1.05, ancho: 0.34, k: 0.5 },
        { n: 3, abertura: 0.38, largo: 0.95, ancho: 0.32, k: 1 },
      ];
      p.stroke(aclarar(flor.color, 0.55));
      p.strokeWeight(Math.max(0.6, r * 0.02));
      capas.forEach((c) => {
        p.fill(p.lerpColor(oscurecer(flor.color, 0.25), aclarar(flor.color, 0.3), c.k));
        for (let i = 0; i < c.n; i++) {
          p.push();
          p.translate(0, r * 0.25);
          p.rotate(p.lerp(-c.abertura, c.abertura, i / (c.n - 1)));
          petaloPunta(r * c.largo, r * c.ancho);
          p.pop();
        }
      });
      p.noStroke();
    },

    // Orquídea: tres sépalos, dos pétalos anchos y el labelo
    orquidea(r, flor) {
      p.stroke(aclarar(flor.color, 0.5));
      p.strokeWeight(Math.max(0.6, r * 0.02));
      p.fill(oscurecer(flor.color, 0.12));
      for (const ang of [0, 2.1, -2.1]) {
        p.push();
        p.rotate(ang);
        petaloPunta(r * 0.95, r * 0.3);
        p.pop();
      }
      p.fill(flor.color);
      for (const ang of [1.05, -1.05]) {
        p.push();
        p.rotate(ang);
        petaloPunta(r * 0.85, r * 0.55);
        p.pop();
      }
      p.noStroke();
      p.fill(flor.centro);
      p.ellipse(0, r * 0.36, r * 0.5, r * 0.55);
      p.fill(aclarar(flor.centro, 0.4));
      p.ellipse(0, r * 0.3, r * 0.22, r * 0.25);
      p.fill(255, 250, 235);
      p.ellipse(0, -r * 0.02, r * 0.14, r * 0.22);
      p.fill(oscurecer(flor.centro, 0.3));
      for (const [x, y] of [[-0.08, 0.3], [0.09, 0.33], [0, 0.42], [-0.04, 0.22]]) {
        p.circle(x * r, y * r, r * 0.04);
      }
    },

    // Ramita de cerezo con varias flores pequeñas, orientada en la dirección del tallo
    cerezo(r, flor) {
      const capullos = [
        [0, 0, 1], [-0.75, -0.55, 0.72], [0.72, -0.4, 0.78],
        [-0.25, -1.1, 0.62], [0.45, -1.15, 0.55],
      ];
      p.stroke("#6b4a3a");
      p.strokeWeight(Math.max(1, r * 0.05));
      capullos.forEach(([x, y]) => p.line(0, r * 0.3, x * r, y * r));
      p.noStroke();
      capullos.forEach(([x, y, s]) => {
        const rr = r * 0.5 * s;
        p.push();
        p.translate(x * r, y * r);
        p.rotate(x * 3 + y);
        for (let i = 0; i < 5; i++) {
          p.push();
          p.rotate((i * p.TWO_PI) / 5);
          p.fill(flor.color);
          p.ellipse(0, -rr * 0.55, rr * 0.8, rr * 0.95);
          p.fill(aclarar(flor.color, 0.4));
          p.ellipse(0, -rr * 0.5, rr * 0.35, rr * 0.5);
          p.pop();
        }
        p.fill(flor.centro);
        p.circle(0, 0, rr * 0.35);
        p.stroke(flor.centro);
        p.strokeWeight(Math.max(0.5, rr * 0.04));
        for (let i = 0; i < 6; i++) {
          const a = (i * p.TWO_PI) / 6;
          p.line(0, 0, Math.cos(a) * rr * 0.34, Math.sin(a) * rr * 0.34);
        }
        p.noStroke();
        p.pop();
      });
    },
  };

  const FORMAS_ORIENTADAS = ["tulipan", "racimo", "loto", "cerezo"];
  const FORMAS_ERGUIDAS = ["orquidea"];

  function dibujarFlor(m, t) {
    const e = rebote(progreso(t, m.retraso + DURACION_TALLO * 0.75, 0.8));
    if (e <= 0) return;
    const geo = geometria(m, t);
    const r = m.radio * W * e;
    const pulso = reducirMovimiento ? 1 : 1 + 0.08 * Math.sin(t * 2 + m.fase);
    const destacada = estilo.destellos && m.principal;

    brillo(geo.fx, geo.fy, r * 1.8 * pulso, m.flor.aura || m.flor.color, destacada ? 0.5 : 0.35);

    p.push();
    p.translate(geo.fx, geo.fy);
    if (FORMAS_ORIENTADAS.includes(m.flor.forma)) p.rotate(geo.a);
    else if (FORMAS_ERGUIDAS.includes(m.flor.forma)) p.rotate(geo.a * 0.6);
    else p.rotate(m.giro + (geo.a - m.angulo) * 2);
    p.noStroke();
    FORMAS[m.flor.forma](r, m.flor, m);
    p.pop();

    const alfa = Math.min(e, 1);
    if (m.flor.bordeOro) {
      p.noFill();
      p.stroke(255, 210, 122, 150 * alfa);
      p.strokeWeight(Math.max(1, W * 0.003));
      p.circle(geo.fx, geo.fy, r * 2 * pulso);
      p.noStroke();
    }
    if (destacada) {
      // destellos que giran alrededor de la flor
      p.noStroke();
      p.fill(255, 232, 170, 230 * alfa);
      for (let k = 0; k < 3; k++) {
        const ang = (reducirMovimiento ? 0 : t * 0.6) + (k * p.TWO_PI) / 3 + m.fase;
        const tam = W * 0.012 * (0.7 + 0.3 * Math.sin(t * 3 + k));
        estrella4(geo.fx + Math.cos(ang) * r * 1.2, geo.fy + Math.sin(ang) * r * 1.1, tam);
      }
    }
  }

  function dibujarParticulas(t) {
    const aparicion = progreso(t, 0.2, 1.5);
    p.noStroke();
    particulas.forEach((q, i) => {
      if (!reducirMovimiento) {
        q.y -= q.vel;
        q.x += (p.noise(i * 10, t * 0.3) - 0.5) * 0.002;
        if (q.y < -0.02) Object.assign(q, nuevaParticula(false));
      }
      const titila = 0.5 + 0.5 * Math.sin(t * 2 + q.fase);
      const [cr, cg, cb] = q.rosa ? [247, 184, 204] : [233, 205, 120];
      p.fill(cr, cg, cb, 40 * titila * aparicion);
      p.circle(q.x * W, q.y * H, q.tam * 4);
      p.fill(cr, cg, cb, 200 * titila * aparicion);
      p.circle(q.x * W, q.y * H, q.tam);
    });
  }

  // ---------- ciclo de p5 ----------
  // unaVez: dibuja un solo cuadro ya florecido (para miniaturas)
  const quieto = reducirMovimiento || opciones.unaVez;
  let lienzo = null;

  p.setup = function () {
    medir();
    p.pixelDensity(opciones.densidad || Math.min(window.devicePixelRatio || 1, 2));
    lienzo = p.createCanvas(W, H);
    lienzo.elt.setAttribute("role", "img");
    lienzo.elt.setAttribute(
      "aria-label",
      `Ramo de ${nombre}: ${ramo.map((f) => f.nombre).join(", ")}`
    );
    p.randomSeed(semilla);
    p.noiseSeed(semilla);
    generarComposicion();
    inicio = p.millis();
    if (quieto) p.noLoop();   // se dibuja una sola vez, ya florecido
  };

  p.draw = function () {
    const t = quieto ? 100 : (p.millis() - inicio) / 1000 + ADELANTO;
    p.clear();
    if (estilo.efectos) dibujarFondoEspecial(t);
    if (conPapel) dibujarPapel(t, "atras");
    relleno.forEach((r) => dibujarTallo(r, t, 1.2, 0.004));
    tallos.forEach((m) => dibujarTallo(m, t, DURACION_TALLO, m.principal ? 0.006 : 0.0045));
    tallos.forEach((m) => m.principal && dibujarHoja(m, t));
    if (conPapel) dibujarPapel(t, "frente");
    dibujarLazo(t);
    relleno.forEach((r) => dibujarCabezaRelleno(r, t));
    ordenDibujo.forEach((m) => dibujarFlor(m, t));
    dibujarParticulas(t);
    if (estilo.efectos) dibujarPetalosCayendo(t);
    if (opciones.alDibujar) opciones.alDibujar(lienzo.elt);
  };

  p.windowResized = function () {
    const anterior = W;
    medir();
    if (W !== anterior) {
      p.resizeCanvas(W, H);
      if (reducirMovimiento) p.redraw();
    }
  };
}
