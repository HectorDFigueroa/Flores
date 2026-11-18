// =====================================================
//  Regalos: taller para crearlos y sobre para abrirlos
// =====================================================
//
// No hay servidor: todo el regalo viaja dentro del enlace (?regalo=...),
// codificado en base64. Por eso el mensaje tiene un límite de caracteres.

// ---------- codificar / decodificar el enlace ----------

function aBase64Url(texto) {
  const bytes = new TextEncoder().encode(texto);
  let binario = "";
  bytes.forEach((b) => (binario += String.fromCharCode(b)));
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function desdeBase64Url(codigo) {
  const base64 = codigo.replace(/-/g, "+").replace(/_/g, "/");
  const binario = atob(base64 + "===".slice((base64.length + 3) % 4));
  const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function codificarRegalo(regalo) {
  const datos = {
    v: 1,
    p: regalo.para,
    d: regalo.de || undefined,
    f: regalo.flores.map((i) => i.toString(36)).join(""),   // cada flor = 1 carácter
    pa: regalo.papel,
    la: regalo.lazo,
    m: regalo.mensaje || undefined,
    a: regalo.fecha || undefined,
    s: regalo.semilla.toString(36),
  };
  return aBase64Url(JSON.stringify(datos));
}

// El enlace puede venir modificado por cualquiera: se valida todo
function decodificarRegalo(codigo) {
  try {
    const datos = JSON.parse(desdeBase64Url(codigo));
    const texto = (valor, max) => (typeof valor === "string" ? valor.trim().slice(0, max) : "");

    const para = texto(datos.p, 40);
    const indices = [...new Set(
      String(datos.f || "")
        .split("")
        .map((c) => parseInt(c, 36))
        .filter((i) => Number.isInteger(i) && i >= 0 && i < flores.length)
    )].slice(0, MAX_FLORES_REGALO);
    if (!para || indices.length === 0) return null;

    const fecha = /^\d{4}-\d{2}-\d{2}$/.test(datos.a) ? datos.a : "";
    const semilla = parseInt(datos.s, 36);

    return {
      para,
      de: texto(datos.d, 40),
      flores: indices,
      papel: Number.isInteger(datos.pa) && PAPELES[datos.pa] ? datos.pa : 0,
      lazo: Number.isInteger(datos.la) && LAZOS[datos.la] ? datos.la : 0,
      mensaje: texto(datos.m, MAX_MENSAJE),
      fecha,
      semilla: Number.isFinite(semilla) ? semilla >>> 0 : hashTexto(normalizarNombre(para)),
    };
  } catch {
    return null;
  }
}

function enlaceDelRegalo(regalo) {
  const url = new URL(window.location.href);
  url.search = `?regalo=${codificarRegalo(regalo)}`;
  url.hash = "";
  return url.toString();
}

function estiloDelRegalo(regalo) {
  return {
    composicion: "normal",
    efectos: true,
    destellos: false,
    papel: PAPELES[regalo.papel].papel,
    lazo: LAZOS[regalo.lazo],
  };
}

// "2026-12-24" -> medianoche de ese día en la hora local de quien abre el regalo
function fechaDeApertura(fecha) {
  if (!fecha) return null;
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

function fechaLegible(fecha) {
  return fechaDeApertura(fecha).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
}

function hoyComoTexto() {
  const hoy = new Date();
  const dos = (n) => String(n).padStart(2, "0");
  return `${hoy.getFullYear()}-${dos(hoy.getMonth() + 1)}-${dos(hoy.getDate())}`;
}


// =====================================================
//  Taller
// =====================================================

const taller = {
  flores: [18, 1, 8],   // Camelia, Lavanda y Jazmín para empezar
  papel: 1,
  lazo: 0,
  semilla: nuevaSemilla(),
};

function nuevaSemilla() {
  return Math.floor(Math.random() * 2 ** 32) >>> 0;
}

const campos = {
  form: document.getElementById("form-taller"),
  para: document.getElementById("t-para"),
  de: document.getElementById("t-de"),
  flores: document.getElementById("t-flores"),
  contador: document.getElementById("t-contador"),
  sugerir: document.getElementById("t-sugerir"),
  papel: document.getElementById("t-papel"),
  lazo: document.getElementById("t-lazo"),
  mensaje: document.getElementById("t-mensaje"),
  contadorMensaje: document.getElementById("t-contador-mensaje"),
  fecha: document.getElementById("t-fecha"),
  error: document.getElementById("t-error"),
  otra: document.getElementById("t-otra"),
};

function construirTaller() {
  // Fichas de flores
  flores.forEach((flor, indice) => {
    const ficha = document.createElement("button");
    ficha.type = "button";
    ficha.className = "ficha";
    ficha.dataset.indice = indice;
    ficha.style.setProperty("--color-flor", flor.color);
    ficha.innerHTML = '<span aria-hidden="true"></span> ';
    ficha.firstChild.textContent = flor.emoji;
    ficha.append(flor.nombre);
    ficha.addEventListener("click", () => alternarFlor(indice));
    campos.flores.append(ficha);
  });

  crearMuestras(campos.papel, "papel", PAPELES, taller.papel);
  crearMuestras(campos.lazo, "lazo", LAZOS, taller.lazo);

  campos.mensaje.maxLength = MAX_MENSAJE;
  campos.fecha.min = hoyComoTexto();

  campos.sugerir.addEventListener("click", sugerirFlores);
  campos.otra.addEventListener("click", () => {
    taller.semilla = nuevaSemilla();
    cambioEnElRamo();
  });
  campos.mensaje.addEventListener("input", actualizarContadorMensaje);
  [campos.para, campos.de, campos.mensaje, campos.fecha].forEach((campo) =>
    campo.addEventListener("input", () => {
      campos.error.textContent = "";
      descartarRegaloListo();
    })
  );
  campos.form.addEventListener("submit", (e) => {
    e.preventDefault();
    crearRegalo();
  });

  actualizarFichas();
  actualizarContadorMensaje();
}

function crearMuestras(contenedor, nombreGrupo, opciones, seleccionada) {
  opciones.forEach((opcion, indice) => {
    const etiqueta = document.createElement("label");
    etiqueta.className = "muestra";
    etiqueta.title = opcion.nombre;

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = nombreGrupo;
    radio.value = indice;
    radio.className = "solo-lectores";
    radio.checked = indice === seleccionada;
    radio.addEventListener("change", () => {
      taller[nombreGrupo] = indice;
      cambioEnElRamo();
    });

    const color = document.createElement("span");
    color.className = "muestra-color";
    color.style.setProperty("--muestra", opcion.muestra);
    if (opcion.muestra === "transparent") color.classList.add("muestra-vacia");

    const texto = document.createElement("span");
    texto.className = "solo-lectores";
    texto.textContent = opcion.nombre;

    etiqueta.append(radio, color, texto);
    contenedor.append(etiqueta);
  });
}

function alternarFlor(indice) {
  const posicion = taller.flores.indexOf(indice);
  if (posicion >= 0) taller.flores.splice(posicion, 1);
  else if (taller.flores.length < MAX_FLORES_REGALO) taller.flores.push(indice);
  cambioEnElRamo();
}

function sugerirFlores() {
  const para = campos.para.value.trim();
  if (!para) {
    campos.error.textContent = "Escribe primero para quién es el ramo ✿";
    campos.para.focus();
    return;
  }
  taller.flores = elegirFlores(hashTexto(normalizarNombre(para))).map((f) => flores.indexOf(f));
  cambioEnElRamo();
}

function actualizarFichas() {
  const lleno = taller.flores.length >= MAX_FLORES_REGALO;
  campos.flores.querySelectorAll(".ficha").forEach((ficha) => {
    const elegida = taller.flores.includes(Number(ficha.dataset.indice));
    ficha.setAttribute("aria-pressed", String(elegida));
    ficha.disabled = !elegida && lleno;
  });
  campos.contador.textContent = `${taller.flores.length}/${MAX_FLORES_REGALO}`;
}

function actualizarContadorMensaje() {
  campos.contadorMensaje.textContent = `${campos.mensaje.value.length}/${MAX_MENSAJE}`;
}

let esperaVistaPrevia = null;

function cambioEnElRamo() {
  campos.error.textContent = "";
  actualizarFichas();
  descartarRegaloListo();
  clearTimeout(esperaVistaPrevia);
  esperaVistaPrevia = setTimeout(actualizarVistaPrevia, 150);
}

function actualizarVistaPrevia() {
  if (taller.flores.length === 0) {
    borrarRamoDibujado();
    return;
  }
  const regalo = leerTaller();
  dibujarRamo(
    regalo.flores.map((i) => flores[i]),
    regalo.semilla,
    regalo.para || "alguien especial",
    estiloDelRegalo(regalo),
    { instantaneo: true }
  );
}

function leerTaller() {
  return {
    para: campos.para.value.trim().replace(/\s+/g, " "),
    de: campos.de.value.trim().replace(/\s+/g, " "),
    flores: [...taller.flores],
    papel: taller.papel,
    lazo: taller.lazo,
    mensaje: campos.mensaje.value.trim().slice(0, MAX_MENSAJE),
    fecha: campos.fecha.value,
    semilla: taller.semilla,
  };
}

function descartarRegaloListo() {
  const listo = document.querySelector(".regalo-listo-seccion");
  if (listo) listo.remove();
}

function crearRegalo() {
  const regalo = leerTaller();
  if (!regalo.para) {
    campos.error.textContent = "¿Para quién es el ramo? Escribe su nombre ✿";
    campos.para.focus();
    return;
  }
  if (regalo.flores.length === 0) {
    campos.error.textContent = "Elige al menos una flor ✿";
    return;
  }
  mostrarRegaloListo(regalo, enlaceDelRegalo(regalo));
}

function mostrarRegaloListo(regalo, url) {
  const seccion = document.createElement("div");
  seccion.className = "regalo-listo-seccion";

  const titulo = document.createElement("h2");
  titulo.textContent = `✉ Tu regalo para ${regalo.para} está listo`;

  const explicacion = document.createElement("p");
  explicacion.className = "dedicatoria";
  explicacion.textContent = regalo.fecha && fechaDeApertura(regalo.fecha) > new Date()
    ? `Quedará sellado hasta el ${fechaLegible(regalo.fecha)}. Envíale el enlace o el código QR.`
    : "Envíale el enlace o el código QR para que lo abra.";

  const panel = document.createElement("div");
  panel.className = "regalo-listo";

  const qr = document.createElement("canvas");
  qr.className = "qr";
  qr.setAttribute("role", "img");
  qr.setAttribute("aria-label", "Código QR del regalo");
  if (dibujarQR(qr, url, 190)) panel.append(qr);

  const lado = document.createElement("div");
  lado.className = "regalo-listo-acciones";

  const campoEnlace = document.createElement("input");
  campoEnlace.className = "campo-enlace";
  campoEnlace.readOnly = true;
  campoEnlace.value = url;
  campoEnlace.setAttribute("aria-label", "Enlace del regalo");
  campoEnlace.addEventListener("focus", () => campoEnlace.select());

  const botones = document.createElement("div");
  botones.className = "fila-botones";

  const aviso = document.createElement("p");
  aviso.className = "aviso-compartir";
  aviso.setAttribute("role", "status");

  const copiar = crearBoton("Copiar enlace", async () => {
    try {
      await navigator.clipboard.writeText(url);
      aviso.textContent = "¡Enlace copiado! 🌸";
    } catch {
      campoEnlace.focus();
      aviso.textContent = "Selecciona el enlace y cópialo";
    }
  });
  copiar.classList.remove("boton-secundario");   // el botón principal

  botones.append(copiar);

  if (navigator.share) {
    botones.append(crearBoton("Compartir", async () => {
      try {
        await navigator.share({
          title: "Tu Ramo Mágico",
          text: regalo.de
            ? `${regalo.de} te envió un ramo mágico ✉🌸`
            : `Alguien te envió un ramo mágico ✉🌸`,
          url,
        });
      } catch { /* la persona cerró el menú */ }
    }));
  }

  const ver = document.createElement("a");
  ver.className = "boton-secundario boton-enlace";
  ver.href = url;
  ver.target = "_blank";
  ver.rel = "noopener";
  ver.textContent = "Ver cómo lo verá ↗";
  botones.append(ver);

  botones.append(crearBotonImagen(() => infoImagenRegalo(regalo), regalo.para, aviso));

  lado.append(campoEnlace, botones, aviso);
  panel.append(lado);
  seccion.append(titulo, explicacion, panel);

  const resultado = document.getElementById("resultado");
  resultado.replaceChildren(seccion);
  seccion.scrollIntoView({ behavior: reducirMovimiento ? "auto" : "smooth", block: "start" });
}

function infoImagenRegalo(regalo) {
  return {
    titulo: `Un ramo para ${regalo.para}`,
    flores: regalo.flores.map((i) => flores[i].nombre),
    mensaje: regalo.mensaje,
    firma: regalo.de,
  };
}


// =====================================================
//  Vista de quien recibe el regalo
// =====================================================

let intervaloCuenta = null;

function abrirVistaRegalo(regalo) {
  document.getElementById("tarjeta-principal").hidden = true;
  const vista = document.getElementById("vista-regalo");
  vista.hidden = false;
  document.title = `Un ramo para ${regalo.para} · Tu Ramo Mágico`;

  document.getElementById("sobre-para").textContent = regalo.para;
  document.getElementById("sobre-de").textContent = regalo.de ? `de ${regalo.de}` : "";
  document.getElementById("regalo-titulo").textContent = regalo.de
    ? `${regalo.de} te envió un ramo`
    : "Alguien te envió un ramo";

  const sello = document.getElementById("sello");
  sello.addEventListener("click", () => abrirSobre(regalo), { once: true });

  const apertura = fechaDeApertura(regalo.fecha);
  if (apertura && apertura > new Date()) {
    sellarHasta(apertura, regalo.fecha);
  } else {
    habilitarSello();
  }
}

function habilitarSello() {
  clearInterval(intervaloCuenta);
  document.getElementById("cuenta").hidden = true;
  const sello = document.getElementById("sello");
  sello.disabled = false;
  sello.classList.add("listo");
  document.getElementById("sobre-instruccion").textContent = "Toca el sello para abrir tu regalo";
}

function sellarHasta(apertura, fecha) {
  const sello = document.getElementById("sello");
  sello.disabled = true;
  document.getElementById("sobre-instruccion").textContent =
    `Este regalo está sellado hasta el ${fechaLegible(fecha)} 🔒`;

  const cuenta = document.getElementById("cuenta");
  const numeros = document.getElementById("cuenta-numeros");
  cuenta.hidden = false;

  const unidades = [
    ["días", 86400000],
    ["horas", 3600000],
    ["minutos", 60000],
    ["segundos", 1000],
  ];
  const cajas = unidades.map(([nombre]) => {
    const caja = document.createElement("div");
    caja.className = "cuenta-caja";
    const valor = document.createElement("strong");
    const etiqueta = document.createElement("span");
    etiqueta.textContent = nombre;
    caja.append(valor, etiqueta);
    numeros.append(caja);
    return valor;
  });

  function actualizar() {
    let resta = apertura - new Date();
    if (resta <= 0) {
      habilitarSello();
      return;
    }
    unidades.forEach(([, ms], i) => {
      cajas[i].textContent = String(Math.floor(resta / ms)).padStart(2, "0");
      resta %= ms;
    });
  }
  actualizar();
  intervaloCuenta = setInterval(actualizar, 1000);
}

function abrirSobre(regalo) {
  const sobre = document.getElementById("sobre");
  sobre.classList.add("abierto");
  const espera = reducirMovimiento ? 0 : 1100;

  setTimeout(() => {
    document.getElementById("vista-regalo").hidden = true;
    dibujarRamo(regalo.flores.map((i) => flores[i]), regalo.semilla, regalo.para, estiloDelRegalo(regalo));
    mostrarContenidoRegalo(regalo);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, espera);
}

function mostrarContenidoRegalo(regalo) {
  const partes = [];

  const titulo = document.createElement("h2");
  titulo.textContent = `✦ Un ramo para ${regalo.para} ✦`;
  partes.push(titulo);

  if (regalo.mensaje) {
    const carta = document.createElement("div");
    carta.className = "carta";
    const texto = document.createElement("p");
    texto.className = "carta-texto";
    texto.textContent = regalo.mensaje;
    carta.append(texto);
    if (regalo.de) {
      const firma = document.createElement("p");
      firma.className = "carta-firma";
      firma.textContent = `— ${regalo.de}`;
      carta.append(firma);
    }
    partes.push(carta);
  }

  const lista = document.createElement("div");
  lista.className = "flores-lista";
  regalo.flores.forEach((i, n) => lista.append(crearTarjetaFlor(flores[i], n)));
  partes.push(lista);

  const acciones = document.createElement("div");
  acciones.className = "compartir";
  const aviso = document.createElement("p");
  aviso.className = "aviso-compartir";
  aviso.setAttribute("role", "status");

  const fila = document.createElement("div");
  fila.className = "fila-botones";
  fila.append(crearBotonImagen(() => infoImagenRegalo(regalo), regalo.para, aviso));

  const crear = document.createElement("a");
  crear.className = "boton-secundario boton-enlace";
  crear.href = "?crear=1";
  crear.textContent = "Envía tu propio ramo ✉";
  fila.append(crear);

  const descubrir = document.createElement("a");
  descubrir.className = "boton-secundario boton-enlace";
  descubrir.href = "./";
  descubrir.textContent = "Descubre tu ramo ✿";
  fila.append(descubrir);

  acciones.append(fila, aviso);
  partes.push(acciones);

  document.getElementById("resultado").replaceChildren(...partes);
}
