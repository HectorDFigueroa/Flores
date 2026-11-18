// =====================================================
//  Video: graba el ramo creciendo (con las campanitas)
// =====================================================
//
// Cómo funciona:
// 1. Se vuelve a empezar la animación del ramo.
// 2. Un lienzo "de grabación" copia en cada cuadro el fondo, el ramo y los textos.
// 3. MediaRecorder graba ese lienzo (y el audio de las campanitas) durante unos segundos.

const VIDEO_ANCHO = 720;
const VIDEO_ALTO = 960;            // vertical 3:4, se ve bien en historias y chats
const VIDEO_SEGUNDOS = 7;

// El primer formato que el navegador sepa grabar (Safari y Chrome nuevos: MP4; los demás: WebM)
function formatoDeVideo() {
  if (!window.MediaRecorder) return null;
  const formatos = ["video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  return formatos.find((f) => MediaRecorder.isTypeSupported(f)) || null;
}

function puedeGrabarVideo() {
  return Boolean(formatoDeVideo() && HTMLCanvasElement.prototype.captureStream);
}

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function crearFondoVideo() {
  const fondo = document.createElement("canvas");
  fondo.width = VIDEO_ANCHO;
  fondo.height = VIDEO_ALTO;
  const ctx = fondo.getContext("2d");
  const cielo = ctx.createLinearGradient(0, 0, 0, VIDEO_ALTO);
  cielo.addColorStop(0, "#0b0820");
  cielo.addColorStop(0.55, "#140d2c");
  cielo.addColorStop(1, "#2a1a4a");
  ctx.fillStyle = cielo;
  ctx.fillRect(0, 0, VIDEO_ANCHO, VIDEO_ALTO);
  const azar = crearAleatorio(1717);
  for (let i = 0; i < 110; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.2 + azar() * 0.6})`;
    ctx.beginPath();
    ctx.arc(azar() * VIDEO_ANCHO, azar() * VIDEO_ALTO * 0.85, azar() * 1.4 + 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  return fondo;
}

// Textos de abajo (título, flores, mensaje) dibujados una sola vez
function crearTextosVideo(info) {
  const capa = document.createElement("canvas");
  capa.width = VIDEO_ANCHO;
  const ctx = capa.getContext("2d");
  const ancho = VIDEO_ANCHO - 100;

  const medir = (fuente, texto, max) => {
    ctx.font = fuente;
    return partirEnLineas(ctx, texto, ancho, max);
  };
  const fuenteTitulo = '700 44px "Cinzel Decorative", serif';
  const fuenteFlores = '600 22px "Cormorant Garamond", serif';
  const fuenteMensaje = 'italic 400 26px "Cormorant Garamond", serif';
  const lineasTitulo = medir(fuenteTitulo, info.titulo, 2);
  const lineasFlores = medir(fuenteFlores, info.flores.join("  ·  "), 2);
  const lineasMensaje = info.mensaje ? medir(fuenteMensaje, info.mensaje, 3) : [];

  const alto = 30 + lineasTitulo.length * 52 + 10 + lineasFlores.length * 30
    + (lineasMensaje.length ? 20 + lineasMensaje.length * 34 + (info.firma ? 34 : 0) : 0) + 60;
  capa.height = alto;

  ctx.textAlign = "center";
  let y = 30 + 44;
  ctx.font = fuenteTitulo;
  const oro = ctx.createLinearGradient(50, 0, VIDEO_ANCHO - 50, 0);
  oro.addColorStop(0, "#c9a84c");
  oro.addColorStop(0.5, "#f8e6b0");
  oro.addColorStop(1, "#c9a84c");
  ctx.fillStyle = oro;
  lineasTitulo.forEach((linea, i) => ctx.fillText(linea, VIDEO_ANCHO / 2, y + i * 52));
  y += (lineasTitulo.length - 1) * 52 + 40;

  ctx.font = fuenteFlores;
  ctx.fillStyle = "#b3a7cc";
  lineasFlores.forEach((linea, i) => ctx.fillText(linea, VIDEO_ANCHO / 2, y + i * 30));
  y += (lineasFlores.length - 1) * 30;

  if (lineasMensaje.length) {
    y += 44;
    ctx.font = fuenteMensaje;
    ctx.fillStyle = "#f4ecdf";
    lineasMensaje.forEach((linea, i) => ctx.fillText(linea, VIDEO_ANCHO / 2, y + i * 34));
    y += (lineasMensaje.length - 1) * 34;
    if (info.firma) {
      y += 34;
      ctx.font = '600 24px "Cormorant Garamond", serif';
      ctx.fillStyle = "#e2c27a";
      ctx.fillText(`— ${info.firma}`, VIDEO_ANCHO / 2, y);
    }
  }

  ctx.font = 'italic 400 20px "Cormorant Garamond", serif';
  ctx.fillStyle = "rgba(185,166,232,0.85)";
  ctx.fillText("✿  Tu Ramo Mágico  ✿", VIDEO_ANCHO / 2, alto - 22);
  return capa;
}

// info: { titulo, flores, mensaje?, firma? } · alAvanzar(segundosQueFaltan)
async function grabarVideoRamo(info, alAvanzar = () => {}) {
  const formato = formatoDeVideo();
  if (!formato) throw new Error("Este navegador no puede grabar video");

  await Promise.all([
    document.fonts.load('700 44px "Cinzel Decorative"'),
    document.fonts.load('italic 400 26px "Cormorant Garamond"'),
    document.fonts.load('600 22px "Cormorant Garamond"'),
  ]).catch(() => {});

  const lienzo = document.createElement("canvas");
  lienzo.width = VIDEO_ANCHO;
  lienzo.height = VIDEO_ALTO;
  const ctx = lienzo.getContext("2d");
  const fondo = crearFondoVideo();
  const textos = crearTextosVideo(info);

  // Video del lienzo + audio de las campanitas (si el sonido está activado)
  const flujo = lienzo.captureStream(30);
  const pistaAudio = sonido.pistaParaGrabar();
  if (pistaAudio) flujo.addTrack(pistaAudio);

  const trozos = [];
  const grabadora = new MediaRecorder(flujo, { mimeType: formato, videoBitsPerSecond: 4000000 });
  grabadora.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) trozos.push(e.data);
  };

  // Mientras se graba, el ramo se anima aunque no esté en pantalla
  animacionForzada = true;
  reiniciarRamo();   // la animación empieza desde cero (y suenan las campanitas)

  let grabando = true;
  const altoRamo = VIDEO_ALTO - textos.height - 20;
  function cuadro() {
    if (!grabando) return;
    ctx.drawImage(fondo, 0, 0);
    const ramo = obtenerLienzoRamo();
    if (ramo && ramo.width) {
      const escala = Math.min((VIDEO_ANCHO - 40) / ramo.width, altoRamo / ramo.height);
      const w = ramo.width * escala;
      const h = ramo.height * escala;
      ctx.drawImage(ramo, (VIDEO_ANCHO - w) / 2, 20 + (altoRamo - h) / 2, w, h);
    }
    ctx.drawImage(textos, 0, VIDEO_ALTO - textos.height);
    requestAnimationFrame(cuadro);
  }
  cuadro();
  grabadora.start(250);

  for (let falta = VIDEO_SEGUNDOS; falta > 0; falta--) {
    alAvanzar(falta);
    await esperar(1000);
  }

  grabando = false;
  animacionForzada = false;
  await new Promise((resolve) => {
    grabadora.onstop = resolve;
    grabadora.stop();
  });
  flujo.getVideoTracks().forEach((pista) => pista.stop());

  const tipo = formato.split(";")[0];
  return { blob: new Blob(trozos, { type: tipo }), extension: tipo === "video/mp4" ? "mp4" : "webm" };
}
