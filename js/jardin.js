// =====================================================
//  Mi jardín: los ramos que descubres, envías y recibes
// =====================================================


// ---------- Almacén ----------
// Con sesión iniciada: en tu cuenta (Firebase, archivo nube.js).
// Sin sesión: en este navegador (localStorage).
// El resto del código no sabe cuál se usa: solo llama listar / guardar / quitar.

const CLAVE_JARDIN = "ramo-magico:jardin:v1";
const MAX_JARDIN = 80;

// Espera a que Firebase diga si hay sesión (máximo 5 s, por si no hay internet)
const nubeLista = new Promise((resolve) => {
  window.addEventListener("sesion-cambio", () => resolve(), { once: true });
  setTimeout(resolve, 5000);
});

const hayCuenta = () => Boolean(window.nube && window.nube.usuario);

const almacenLocal = {
  listar() {
    try {
      const datos = JSON.parse(localStorage.getItem(CLAVE_JARDIN));
      return Array.isArray(datos) ? datos : [];
    } catch {
      return [];
    }
  },
  guardarTodo(lista) {
    try {
      localStorage.setItem(CLAVE_JARDIN, JSON.stringify(lista));
      return true;
    } catch {
      return false;   // navegador en modo privado o sin espacio
    }
  },
  vaciar() {
    try {
      localStorage.removeItem(CLAVE_JARDIN);
    } catch { /* nada que borrar */ }
  },
};

const almacenJardin = {
  async listar() {
    await nubeLista;
    if (hayCuenta()) return nube.listarJardin();
    return almacenLocal.listar();
  },

  async guardar(item) {
    await nubeLista;
    if (hayCuenta()) {
      await nube.guardarPlanta(item);
      return true;
    }
    const resto = almacenLocal.listar().filter((x) => x.id !== item.id);
    return almacenLocal.guardarTodo([item, ...resto].slice(0, MAX_JARDIN));
  },

  async quitar(id) {
    await nubeLista;
    if (hayCuenta()) {
      await nube.borrarPlanta(id);
      return true;
    }
    return almacenLocal.guardarTodo(almacenLocal.listar().filter((x) => x.id !== id));
  },
};

async function plantarEnJardin(item) {
  try {
    const lista = await almacenJardin.listar();
    const anterior = lista.find((x) => x.id === item.id);
    return await almacenJardin.guardar({ ...item, creado: anterior ? anterior.creado : Date.now() });
  } catch (error) {
    console.error("No se pudo plantar en el jardín", error);
    return false;
  }
}

async function quitarDelJardin(id) {
  try {
    return await almacenJardin.quitar(id);
  } catch (error) {
    console.error("No se pudo quitar del jardín", error);
    return false;
  }
}

async function estaEnJardin(id) {
  try {
    const lista = await almacenJardin.listar();
    return lista.some((x) => x.id === id);
  } catch {
    return false;
  }
}

// Al iniciar sesión, los ramos guardados en este navegador pasan a la cuenta
async function moverJardinLocalALaNube() {
  const locales = almacenLocal.listar();
  if (locales.length === 0) return 0;
  for (const item of locales) await nube.guardarPlanta(item);
  almacenLocal.vaciar();
  return locales.length;
}


// ---------- Crear las "plantas" ----------

// Identifica un regalo: por su id del servidor (?r=...) o por el contenido del enlace largo
function claveDeRegalo(regalo, idServidor) {
  return idServidor ? `r-${idServidor}` : hashTexto(codificarRegalo(regalo)).toString(36);
}

// extra (opcional): { id, enlace, estilo } para ramos como el de dos nombres
async function plantarRamoDescubierto(nombre, ramo, semilla, especial, extra = {}) {
  const estilo = extra.estilo || (especial ? ESTILO_EVA : ESTILO_NORMAL);
  return plantarEnJardin({
    id: extra.id || `descubierto:${normalizarNombre(nombre)}`,
    tipo: "descubierto",
    nombre,
    especial,
    flores: especial ? [] : ramo.map((f) => flores.indexOf(f)),
    enlace: extra.enlace || enlaceDelRamo(nombre),
    miniatura: await generarMiniatura(ramo, semilla, estilo),
  });
}

// tipo: "enviado" o "recibido" · clave: ver claveDeRegalo()
async function plantarRegalo(tipo, regalo, enlace, clave) {
  // Si abres tu propio regalo ("Ver cómo lo verá"), no se duplica como recibido
  if (tipo === "recibido" && (await estaEnJardin(`enviado:${clave}`))) return true;

  return plantarEnJardin({
    id: `${tipo}:${clave}`,
    tipo,
    nombre: regalo.para,
    de: regalo.de,
    flores: regalo.flores,
    fecha: regalo.fecha,
    enlace,
    miniatura: await generarMiniatura(
      regalo.flores.map((i) => flores[i]),
      regalo.semilla,
      estiloDelRegalo(regalo)
    ),
  });
}


// ---------- Flor del día ----------

function florDelDia() {
  return flores[hashTexto(`flor-del-dia:${hoyComoTexto()}`) % flores.length];
}

function mostrarFlorDelDia() {
  const flor = florDelDia();
  const caja = document.getElementById("flor-del-dia");
  caja.style.setProperty("--color-flor", flor.color);
  caja.querySelector(".flor-dia-emoji").textContent = flor.emoji;
  caja.querySelector(".flor-dia-nombre").textContent = flor.nombre;
  caja.querySelector(".flor-dia-significado").textContent = flor.significado;
}


// ---------- Vista del jardín ----------

const TIPOS_PLANTA = {
  descubierto: { etiqueta: "🌱 Tu ramo",  titulo: (x) => `Ramo de ${x.nombre}` },
  enviado:     { etiqueta: "✉ Enviado",   titulo: (x) => `Para ${x.nombre}` },
  recibido:    { etiqueta: "💌 Recibido", titulo: (x) => (x.de ? `De ${x.de}` : `Para ${x.nombre}`) },
};

let filtroJardin = "todos";

function actualizarNotaJardin() {
  const nota = document.getElementById("nota-jardin");
  const usuario = window.nube && window.nube.usuario;
  nota.textContent = usuario
    ? `🌙 Tu jardín está guardado en tu cuenta (${usuario.email}) y lo ves en todos tus dispositivos.`
    : "Tu jardín se guarda en este navegador. Inicia sesión para guardarlo en tu cuenta y verlo en todos tus dispositivos.";
}

async function mostrarJardin() {
  mostrarFlorDelDia();
  actualizarNotaJardin();
  const contenedor = document.getElementById("jardin-lista");

  let lista;
  try {
    lista = await almacenJardin.listar();
  } catch (error) {
    console.error("No se pudo leer el jardín", error);
    const aviso = document.createElement("p");
    aviso.className = "jardin-vacio";
    aviso.textContent = "No pudimos traer tu jardín. Revisa tu conexión e inténtalo de nuevo 😔";
    contenedor.replaceChildren(aviso);
    return;
  }
  actualizarNotaJardin();
  const visibles = filtroJardin === "todos" ? lista : lista.filter((x) => x.tipo === filtroJardin);

  document.querySelectorAll("#jardin-filtros button").forEach((boton) => {
    boton.setAttribute("aria-pressed", String(boton.dataset.filtro === filtroJardin));
  });
  document.getElementById("jardin-contador").textContent =
    lista.length === 1 ? "1 ramo plantado" : `${lista.length} ramos plantados`;

  if (visibles.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "jardin-vacio";
    vacio.textContent = lista.length === 0
      ? "Tu jardín está vacío. Descubre tu ramo o envía un regalo para plantar la primera flor 🌱"
      : "No hay ramos de este tipo todavía.";
    contenedor.replaceChildren(vacio);
    return;
  }

  contenedor.replaceChildren(...visibles.map(crearTarjetaPlanta));
}

// "enviado:r-Xb7kQ2pA" -> "Xb7kQ2pA" (solo regalos guardados en el servidor)
function idServidorDe(item) {
  const coincidencia = /^enviado:r-([A-Za-z0-9]+)$/.exec(item.id);
  return coincidencia ? coincidencia[1] : null;
}

function crearTarjetaPlanta(item) {
  const tipo = TIPOS_PLANTA[item.tipo] || TIPOS_PLANTA.descubierto;

  const tarjeta = document.createElement("article");
  tarjeta.className = "planta";

  const enlace = document.createElement("a");
  enlace.className = "planta-enlace";
  enlace.href = item.enlace;

  if (item.miniatura) {
    const imagen = document.createElement("img");
    imagen.src = item.miniatura;
    imagen.alt = "";
    imagen.loading = "lazy";
    enlace.append(imagen);
  }

  const etiqueta = document.createElement("span");
  etiqueta.className = "planta-tipo";
  etiqueta.textContent = tipo.etiqueta;

  const titulo = document.createElement("h3");
  titulo.className = "planta-titulo";
  titulo.textContent = tipo.titulo(item);

  const detalle = document.createElement("p");
  detalle.className = "planta-fecha";
  const apertura = fechaDeApertura(item.fecha);
  detalle.textContent = apertura && apertura > new Date()
    ? `🔒 Se abre el ${fechaLegible(item.fecha)}`
    : new Date(item.creado).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });

  enlace.append(etiqueta, titulo, detalle);

  // Regalos enviados desde tu cuenta: ¿ya lo abrieron?
  const idServidor = idServidorDe(item);
  if (idServidor && hayCuenta()) {
    const estado = document.createElement("p");
    estado.className = "planta-estado";
    estado.textContent = "…";
    enlace.append(estado);
    nube.leerVisto(idServidor)
      .then((abiertoMs) => {
        estado.textContent = abiertoMs
          ? `💌 Lo abrió el ${new Date(abiertoMs).toLocaleDateString("es", { day: "numeric", month: "short" })}`
          : "✉ Aún sin abrir";
        estado.classList.toggle("abierto", Boolean(abiertoMs));
      })
      .catch(() => estado.remove());   // las reglas nuevas aún no están publicadas
  }

  const acciones = document.createElement("div");
  acciones.className = "planta-acciones";

  if (item.tipo === "enviado") {
    const copiar = document.createElement("button");
    copiar.type = "button";
    copiar.className = "planta-boton";
    copiar.textContent = "🔗";
    copiar.title = "Copiar enlace del regalo";
    copiar.setAttribute("aria-label", `Copiar enlace del regalo ${tipo.titulo(item)}`);
    copiar.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(item.enlace);
        copiar.textContent = "✓";
        setTimeout(() => (copiar.textContent = "🔗"), 1500);
      } catch { /* sin permiso para copiar */ }
    });
    acciones.append(copiar);
  }

  const quitar = document.createElement("button");
  quitar.type = "button";
  quitar.className = "planta-boton";
  quitar.textContent = "\u{1F5D1}\u{FE0F}";   // 🗑️ (el ️ fuerza la versión emoji)
  quitar.title = "Quitar del jardín";
  quitar.setAttribute("aria-label", `Quitar ${tipo.titulo(item)} del jardín`);
  quitar.addEventListener("click", async () => {
    if (!confirm(`¿Quitar "${tipo.titulo(item)}" de tu jardín?`)) return;

    // Un regalo propio guardado en el servidor también se puede borrar de allá
    if (idServidor && hayCuenta() && confirm(
      "¿También quieres borrar el regalo? El enlace dejará de funcionar para quien lo tenga.\n\n" +
      "Aceptar: borrarlo · Cancelar: solo quitarlo de tu jardín"
    )) {
      try {
        await nube.borrarRegalo(idServidor);
      } catch (error) {
        console.error("No se pudo borrar el regalo", error);
        alert("No pudimos borrar el regalo del servidor. Lo quitamos solo de tu jardín.");
      }
    }

    await quitarDelJardin(item.id);
    mostrarJardin();
  });
  acciones.append(quitar);

  tarjeta.append(enlace, acciones);
  return tarjeta;
}

function prepararJardin() {
  document.querySelectorAll("#jardin-filtros button").forEach((boton) => {
    boton.addEventListener("click", () => {
      filtroJardin = boton.dataset.filtro;
      mostrarJardin();
    });
  });
}
