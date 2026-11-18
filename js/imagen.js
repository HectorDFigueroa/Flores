// =====================================================
//  Imagen para guardar/compartir y código QR
// =====================================================

const IMAGEN_ANCHO = 1080;
const IMAGEN_ALTO = 1350;   // formato 4:5, ideal para Instagram y WhatsApp

// Parte un texto en líneas que quepan en "ancho" (máximo "maxLineas")
function partirEnLineas(ctx, texto, ancho, maxLineas = Infinity) {
  const lineas = [];
  for (const parrafo of texto.split("\n")) {
    let linea = "";
    for (const palabra of parrafo.split(" ")) {
      const prueba = linea ? `${linea} ${palabra}` : palabra;
      if (ctx.measureText(prueba).width > ancho && linea) {
        lineas.push(linea);
        linea = palabra;
      } else {
        linea = prueba;
      }
    }
    lineas.push(linea);
  }
  if (lineas.length > maxLineas) {
    const recortadas = lineas.slice(0, maxLineas);
    recortadas[maxLineas - 1] = recortadas[maxLineas - 1].replace(/\s*\S*$/, "") + "…";
    return recortadas;
  }
  return lineas;
}

// info: { titulo, flores: [nombres], mensaje?, firma? }
async function generarImagenRamo(info) {
  const lienzoRamo = obtenerLienzoRamo();
  const A = IMAGEN_ANCHO;
  const B = IMAGEN_ALTO;
  const lienzo = document.createElement("canvas");
  lienzo.width = A;
  lienzo.height = B;
  const ctx = lienzo.getContext("2d");

  // Las fuentes web deben estar cargadas antes de escribir en el lienzo
  await Promise.all([
    document.fonts.load('700 60px "Cinzel Decorative"'),
    document.fonts.load('italic 400 36px "Cormorant Garamond"'),
    document.fonts.load('600 30px "Cormorant Garamond"'),
  ]).catch(() => {});

  // ---- fondo de cielo nocturno ----
  const cielo = ctx.createLinearGradient(0, 0, 0, B);
  cielo.addColorStop(0, "#0b0820");
  cielo.addColorStop(0.55, "#140d2c");
  cielo.addColorStop(1, "#2a1a4a");
  ctx.fillStyle = cielo;
  ctx.fillRect(0, 0, A, B);

  const aura = ctx.createRadialGradient(A / 2, 460, 0, A / 2, 460, 560);
  aura.addColorStop(0, "rgba(120,90,200,0.28)");
  aura.addColorStop(1, "rgba(120,90,200,0)");
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, A, B);

  const azar = crearAleatorio(20261117);
  for (let i = 0; i < 140; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.2 + azar() * 0.6})`;
    ctx.beginPath();
    ctx.arc(azar() * A, azar() * B * 0.85, azar() * 1.6 + 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- medir los textos para repartir el espacio ----
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const margen = 90;
  const anchoTexto = A - margen * 2;

  let tamTitulo = 64;
  ctx.font = `700 ${tamTitulo}px "Cinzel Decorative", serif`;
  while (ctx.measureText(info.titulo).width > anchoTexto && tamTitulo > 40) {
    tamTitulo -= 2;
    ctx.font = `700 ${tamTitulo}px "Cinzel Decorative", serif`;
  }
  const lineasTitulo = partirEnLineas(ctx, info.titulo, anchoTexto, 2);

  ctx.font = '600 30px "Cormorant Garamond", serif';
  const lineasFlores = partirEnLineas(ctx, info.flores.join("  ·  "), anchoTexto, 2);

  let lineasMensaje = [];
  if (info.mensaje) {
    ctx.font = 'italic 400 36px "Cormorant Garamond", serif';
    lineasMensaje = partirEnLineas(ctx, info.mensaje, anchoTexto - 80, 5);
  }

  const altoTitulo = lineasTitulo.length * tamTitulo * 1.2;
  const altoFlores = lineasFlores.length * 40;
  const altoMensaje = lineasMensaje.length
    ? 50 + lineasMensaje.length * 48 + (info.firma ? 52 : 0) + 30
    : 0;
  const altoPie = 70;
  const bloqueTexto = altoTitulo + 24 + altoFlores + (altoMensaje ? 36 + altoMensaje : 0);

  // ---- el ramo ----
  const arribaRamo = 40;
  const altoDisponible = B - arribaRamo - bloqueTexto - altoPie - 30;
  let finRamo = arribaRamo;
  if (lienzoRamo) {
    const escala = Math.min(900 / lienzoRamo.width, altoDisponible / lienzoRamo.height);
    const w = lienzoRamo.width * escala;
    const h = lienzoRamo.height * escala;
    ctx.drawImage(lienzoRamo, (A - w) / 2, arribaRamo, w, h);
    finRamo = arribaRamo + h;
  }

  // ---- título dorado ----
  let y = finRamo + 10 + tamTitulo;
  ctx.font = `700 ${tamTitulo}px "Cinzel Decorative", serif`;
  const oro = ctx.createLinearGradient(margen, 0, A - margen, 0);
  oro.addColorStop(0, "#c9a84c");
  oro.addColorStop(0.5, "#f8e6b0");
  oro.addColorStop(1, "#c9a84c");
  ctx.fillStyle = oro;
  ctx.shadowColor = "rgba(226,194,122,0.45)";
  ctx.shadowBlur = 24;
  lineasTitulo.forEach((linea, i) => ctx.fillText(linea, A / 2, y + i * tamTitulo * 1.2));
  ctx.shadowBlur = 0;
  y += (lineasTitulo.length - 1) * tamTitulo * 1.2 + 24 + 34;

  // ---- nombres de las flores ----
  ctx.font = '600 30px "Cormorant Garamond", serif';
  ctx.fillStyle = "#b3a7cc";
  lineasFlores.forEach((linea, i) => ctx.fillText(linea, A / 2, y + i * 40));
  y += (lineasFlores.length - 1) * 40;

  // ---- mensaje en una tarjeta ----
  if (lineasMensaje.length) {
    const arribaCarta = y + 36;
    const x0 = margen;
    ctx.fillStyle = "rgba(244,232,210,0.08)";
    ctx.strokeStyle = "rgba(226,194,122,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x0, arribaCarta, anchoTexto, altoMensaje, 28);
    else ctx.rect(x0, arribaCarta, anchoTexto, altoMensaje);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'italic 400 36px "Cormorant Garamond", serif';
    ctx.fillStyle = "#f4ecdf";
    let ym = arribaCarta + 50 + 10;
    lineasMensaje.forEach((linea, i) => ctx.fillText(linea, A / 2, ym + i * 48));
    if (info.firma) {
      ym += (lineasMensaje.length - 1) * 48 + 52;
      ctx.font = '600 32px "Cormorant Garamond", serif';
      ctx.fillStyle = "#e2c27a";
      ctx.fillText(`— ${info.firma}`, A / 2, ym);
    }
  }

  // ---- pie ----
  ctx.font = 'italic 400 28px "Cormorant Garamond", serif';
  ctx.fillStyle = "rgba(185,166,232,0.85)";
  ctx.fillText("✿  Tu Ramo Mágico  ✿", A / 2, B - 40);

  return new Promise((resolve, reject) => {
    lienzo.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No se pudo crear la imagen"))), "image/png");
  });
}

// Descarga la imagen; en el celular abre el menú de compartir para mandarla directo.
// Devuelve "compartida", "descargada" o "cancelada".
async function guardarImagen(info, nombreArchivo) {
  return entregarArchivo(await generarImagenRamo(info), nombreArchivo);
}

// Entrega un archivo: en el celular abre el menú de compartir, en el computador lo descarga
async function entregarArchivo(blob, nombreArchivo) {
  const archivo = new File([blob], nombreArchivo, { type: blob.type });

  const esTactil = window.matchMedia("(pointer: coarse)").matches;
  if (esTactil && navigator.canShare && navigator.canShare({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], title: "Tu Ramo Mágico" });
      return "compartida";
    } catch (error) {
      if (error.name === "AbortError") return "cancelada";
    }
  }

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return "descargada";
}

function nombreDeArchivo(nombre, extension = "png") {
  const limpio = normalizarNombre(nombre).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `ramo-${limpio || "magico"}.${extension}`;
}

// Dibuja un código QR en un <canvas>. Devuelve false si la librería no cargó.
function dibujarQR(lienzo, texto, tamanoCss = 200) {
  if (typeof qrcode !== "function") return false;
  const qr = qrcode(0, "L");   // 0 = tamaño automático · L = cabe más texto
  qr.addData(texto);
  qr.make();

  const modulos = qr.getModuleCount();
  const margen = 3;
  const celda = Math.max(2, Math.floor((tamanoCss * 2) / (modulos + margen * 2)));
  const lado = celda * (modulos + margen * 2);
  lienzo.width = lado;
  lienzo.height = lado;
  lienzo.style.width = `${lado / 2}px`;
  lienzo.style.height = `${lado / 2}px`;

  const ctx = lienzo.getContext("2d");
  ctx.fillStyle = "#f8f1e3";
  ctx.fillRect(0, 0, lado, lado);
  ctx.fillStyle = "#1b1238";
  for (let fila = 0; fila < modulos; fila++) {
    for (let col = 0; col < modulos; col++) {
      if (qr.isDark(fila, col)) {
        ctx.fillRect((col + margen) * celda, (fila + margen) * celda, celda, celda);
      }
    }
  }
  return true;
}
