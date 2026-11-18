// =====================================================
//  App: pestañas, "Descubre tu ramo" y arranque
// =====================================================

// ---------- piezas reutilizables ----------

// Tarjeta de una flor. Se construye con textContent para que nada se interprete como HTML.
function crearTarjetaFlor(flor, indice) {
  const tarjeta = document.createElement("div");
  tarjeta.className = "flor";
  tarjeta.style.setProperty("--i", indice);
  tarjeta.style.setProperty("--color-flor", flor.color);

  const emoji = document.createElement("span");
  emoji.className = "emoji";
  emoji.setAttribute("aria-hidden", "true");
  emoji.textContent = flor.emoji;

  const texto = document.createElement("div");
  const nombre = document.createElement("p");
  nombre.className = "nombre-flor";
  nombre.textContent = flor.nombre;
  const significado = document.createElement("p");
  significado.className = "significado";
  significado.textContent = flor.significado;
  texto.append(nombre, significado);

  tarjeta.append(emoji, texto);
  return tarjeta;
}

function crearBoton(texto, alHacerClic) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "boton-secundario";
  boton.textContent = texto;
  boton.addEventListener("click", alHacerClic);
  return boton;
}

// Botón "Guardar imagen". obtenerInfo se llama al hacer clic, así la imagen sale del ramo actual.
function crearBotonImagen(obtenerInfo, nombre, aviso) {
  const boton = crearBoton("Guardar imagen 📷", async () => {
    boton.disabled = true;
    aviso.textContent = "Preparando tu imagen…";
    try {
      const resultado = await guardarImagen(obtenerInfo(), nombreDeArchivo(nombre));
      aviso.textContent = resultado === "descargada" ? "¡Imagen guardada! 🌸" : "";
    } catch {
      aviso.textContent = "No se pudo crear la imagen 😔";
    } finally {
      boton.disabled = false;
    }
  });
  return boton;
}


// ---------- Descubre tu ramo ----------

const formulario = document.getElementById("formulario");
const input = document.getElementById("nombreInput");
const mensaje = document.getElementById("mensaje");

function mostrarMensaje(texto) {
  mensaje.textContent = texto;
  input.setAttribute("aria-invalid", "true");
}

function limpiarMensaje() {
  mensaje.textContent = "";
  input.removeAttribute("aria-invalid");
}

function enlaceDelRamo(nombre) {
  const url = new URL(window.location.href);
  url.search = new URLSearchParams({ nombre }).toString();
  url.hash = "";
  return url.toString();
}

function mostrarRamo(nombre, ramo, especial) {
  const adorno = especial ? "👑" : "✦";
  const titulo = document.createElement("h2");
  titulo.textContent = `${adorno} El Ramo de ${nombre} ${adorno}`;

  const lista = document.createElement("div");
  lista.className = especial ? "flores-lista flores-lista--eva" : "flores-lista";
  ramo.forEach((flor, i) => lista.append(crearTarjetaFlor(flor, i)));

  const partes = [titulo];
  if (especial) {
    const dedicatoria = document.createElement("p");
    dedicatoria.className = "dedicatoria";
    dedicatoria.textContent = "Un ramo que no florece para nadie más en el mundo";
    partes.push(dedicatoria);
  }
  partes.push(lista, crearAccionesRamo(nombre, ramo, especial));

  document.getElementById("resultado").replaceChildren(...partes);
}

function crearAccionesRamo(nombre, ramo, especial) {
  const zona = document.createElement("div");
  zona.className = "compartir";

  const aviso = document.createElement("p");
  aviso.className = "aviso-compartir";
  aviso.setAttribute("role", "status");

  const compartir = crearBoton("Compartir enlace 🔗", async () => {
    const url = enlaceDelRamo(nombre);
    const texto = especial
      ? `Un ramo mágico que florece solo para ${nombre} 👑🌹`
      : `Mira el ramo mágico de ${nombre} 🌸`;

    // En el celular abre el menú nativo (WhatsApp, Instagram...)
    if (navigator.share) {
      try {
        await navigator.share({ title: "Tu Ramo Mágico", text: texto, url });
        return;
      } catch (error) {
        if (error.name === "AbortError") return;   // la persona cerró el menú
      }
    }
    // En el computador copia el enlace
    try {
      await navigator.clipboard.writeText(url);
      aviso.textContent = "¡Enlace copiado! Pégalo donde quieras 🌸";
    } catch {
      aviso.textContent = `Copia este enlace: ${url}`;
    }
  });

  const imagen = crearBotonImagen(
    () => ({ titulo: `El Ramo de ${nombre}`, flores: ramo.map((f) => f.nombre) }),
    nombre,
    aviso
  );

  const fila = document.createElement("div");
  fila.className = "fila-botones";
  fila.append(compartir, imagen);
  zona.append(fila, aviso);
  return zona;
}

function revelar({ desplazar = true } = {}) {
  const nombre = input.value.trim().replace(/\s+/g, " ");

  if (nombre === "") {
    mostrarMensaje("¡Escribe tu nombre primero!");
    input.focus();
    return;
  }
  limpiarMensaje();

  const clave = normalizarNombre(nombre);
  const esEva = clave.split(" ")[0] === "eva";

  if (esEva) {
    dibujarRamo(ramoEva, hashTexto("eva"), nombre, ESTILO_EVA);
    mostrarRamo(nombre, ramoEva, true);
  } else {
    const semilla = hashTexto(clave);
    const ramo = elegirFlores(semilla);
    dibujarRamo(ramo, semilla, nombre, ESTILO_NORMAL);
    mostrarRamo(nombre, ramo, false);
  }

  // La barra de direcciones queda con el enlace de este ramo
  history.replaceState(null, "", enlaceDelRamo(nombre));

  if (desplazar) {
    document.getElementById("canvas-contenedor").scrollIntoView({
      behavior: reducirMovimiento ? "auto" : "smooth",
      block: "start",
    });
  }
}

formulario.addEventListener("submit", (e) => {
  e.preventDefault();
  revelar();
});

input.addEventListener("input", limpiarMensaje);


// ---------- Pestañas ----------

const pestanas = [...document.querySelectorAll('[role="tab"]')];
let tallerConstruido = false;

function cambiarPestana(nombre, { enfocar = false } = {}) {
  pestanas.forEach((pestana) => {
    const activa = pestana.dataset.panel === nombre;
    pestana.setAttribute("aria-selected", String(activa));
    pestana.tabIndex = activa ? 0 : -1;
    document.getElementById(pestana.getAttribute("aria-controls")).hidden = !activa;
    if (activa && enfocar) pestana.focus();
  });

  borrarRamoDibujado();
  document.getElementById("resultado").replaceChildren();

  const base = window.location.pathname;
  if (nombre === "taller") {
    if (!tallerConstruido) {
      construirTaller();
      tallerConstruido = true;
    }
    actualizarVistaPrevia();
    history.replaceState(null, "", `${base}?crear=1`);
  } else {
    history.replaceState(null, "", base);
  }
}

pestanas.forEach((pestana, i) => {
  pestana.addEventListener("click", () => cambiarPestana(pestana.dataset.panel));
  // Flechas izquierda/derecha para moverse entre pestañas con el teclado
  pestana.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const siguiente = pestanas[(i + (e.key === "ArrowRight" ? 1 : -1) + pestanas.length) % pestanas.length];
    cambiarPestana(siguiente.dataset.panel, { enfocar: true });
  });
});


// ---------- Cielo de fondo: estrellas, pétalos y jardín ----------

function crearCielo() {
  const estrellas = document.getElementById("estrellas");
  for (let i = 0; i < 90; i++) {
    const s = document.createElement("span");
    s.className = "estrella";
    s.style.cssText =
      `--x:${(Math.random() * 100).toFixed(2)}%;` +
      `--y:${(Math.random() * 75).toFixed(2)}%;` +
      `--s:${(Math.random() * 1.8 + 0.6).toFixed(2)}px;` +
      `--o:${(Math.random() * 0.6 + 0.25).toFixed(2)};` +
      `--d:${(Math.random() * 3 + 2).toFixed(2)}s;` +
      `--delay:${(-Math.random() * 5).toFixed(2)}s`;
    estrellas.append(s);
  }

  const petalos = document.getElementById("petalos");
  const cantidad = window.innerWidth < 600 ? 9 : 16;
  for (let i = 0; i < cantidad; i++) {
    const s = document.createElement("span");
    s.className = "petalo";
    s.style.cssText =
      `--x:${(Math.random() * 100).toFixed(2)}%;` +
      `--s:${(Math.random() * 8 + 9).toFixed(1)}px;` +
      `--d:${(Math.random() * 10 + 14).toFixed(1)}s;` +
      `--delay:${(-Math.random() * 24).toFixed(1)}s;` +
      `--deriva:${(Math.random() * 30 - 15).toFixed(1)}vw;` +
      `--giro:${Math.round(Math.random() * 720 - 360)}deg`;
    petalos.append(s);
  }

  // Siluetas de flores y pasto en el horizonte
  const jardin = document.getElementById("jardin");
  const svg = "http://www.w3.org/2000/svg";
  for (let i = 0; i < 46; i++) {
    const x = (i / 45) * 1440 + (Math.random() * 30 - 15);
    const alto = 30 + Math.random() * 70;
    const curva = Math.random() * 30 - 15;
    const tallo = document.createElementNS(svg, "path");
    tallo.setAttribute("d", `M${x.toFixed(1)} 140 Q${(x + curva).toFixed(1)} ${140 - alto / 2} ${(x + curva / 2).toFixed(1)} ${140 - alto}`);
    tallo.setAttribute("class", "jardin-tallo");
    jardin.append(tallo);
    if (Math.random() < 0.55) {
      const cabeza = document.createElementNS(svg, "circle");
      cabeza.setAttribute("cx", (x + curva / 2).toFixed(1));
      cabeza.setAttribute("cy", (140 - alto).toFixed(1));
      cabeza.setAttribute("r", (3 + Math.random() * 5).toFixed(1));
      cabeza.setAttribute("class", "jardin-flor");
      jardin.append(cabeza);
    }
  }
}


// ---------- Arranque: ¿qué muestra el enlace? ----------
//  ?regalo=...  -> sobre con un regalo
//  ?crear=1     -> taller de regalos
//  ?nombre=Ana  -> ramo de Ana

function iniciar() {
  crearCielo();
  const parametros = new URLSearchParams(window.location.search);

  if (parametros.has("regalo")) {
    const regalo = decodificarRegalo(parametros.get("regalo"));
    if (regalo) {
      abrirVistaRegalo(regalo);
      return;
    }
    mostrarMensaje("Este enlace de regalo está incompleto o dañado 😔");
    return;
  }

  if (parametros.has("crear")) {
    cambiarPestana("taller");
    return;
  }

  const nombre = parametros.get("nombre");
  if (nombre && nombre.trim()) {
    input.value = nombre.trim().slice(0, 40);
    revelar({ desplazar: false });
  }
}

iniciar();
