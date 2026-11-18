// =====================================================
//  Avisos: "💌 Eva abrió tu regalo"
// =====================================================
//
// Con la sesión iniciada, la app revisa los regalos que enviaste desde tu
// cuenta (enlaces cortos ?r=...). Si alguno se abrió desde la última vez,
// muestra un aviso y un puntito en la pestaña "Mi jardín".
// Funciona mientras la app está abierta; no necesita servidor.

const CLAVE_AVISADOS = "ramo-magico:avisados:v1";
const CADA_CUANTO_REVISAR = 2 * 60 * 1000;   // 2 minutos

let revisandoAvisos = false;
let intervaloAvisos = null;

function leerAvisados() {
  try {
    return new Set(JSON.parse(localStorage.getItem(CLAVE_AVISADOS)) || []);
  } catch {
    return new Set();
  }
}

function guardarAvisados(avisados) {
  try {
    localStorage.setItem(CLAVE_AVISADOS, JSON.stringify([...avisados]));
  } catch { /* sin almacenamiento: puede repetirse algún aviso */ }
}

// Devuelve los regalos enviados que se abrieron y todavía no se avisaron
async function buscarRegalosRecienAbiertos() {
  if (!hayCuenta()) return [];
  const lista = await almacenJardin.listar();
  const avisados = leerAvisados();
  const pendientes = lista
    .map((item) => ({ item, id: idServidorDe(item) }))
    .filter(({ id }) => id && !avisados.has(id));

  const abiertos = [];
  await Promise.all(pendientes.map(async ({ item, id }) => {
    try {
      const abiertoMs = await nube.leerVisto(id);
      if (abiertoMs) abiertos.push({ item, id, abiertoMs });
    } catch { /* regalo borrado o reglas sin publicar: se ignora */ }
  }));

  if (abiertos.length) {
    abiertos.forEach(({ id }) => avisados.add(id));
    guardarAvisados(avisados);
  }
  return abiertos.sort((a, b) => b.abiertoMs - a.abiertoMs);
}

async function revisarAvisos() {
  if (revisandoAvisos || !hayCuenta()) return;
  revisandoAvisos = true;
  try {
    const abiertos = await buscarRegalosRecienAbiertos();
    abiertos.forEach(mostrarAviso);
    if (abiertos.length) marcarNovedadesEnJardin(abiertos.length);
  } catch (error) {
    console.warn("No se pudieron revisar los avisos", error);
  } finally {
    revisandoAvisos = false;
  }
}

function mostrarAviso({ item, abiertoMs }) {
  const zona = document.getElementById("avisos");
  const aviso = document.createElement("div");
  aviso.className = "aviso";

  const texto = document.createElement("p");
  const hora = new Date(abiertoMs).toLocaleString("es", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  texto.textContent = `💌 ${item.nombre} abrió tu regalo`;
  const detalle = document.createElement("span");
  detalle.className = "aviso-hora";
  detalle.textContent = hora;
  texto.append(detalle);

  const ver = document.createElement("a");
  ver.className = "aviso-ver";
  ver.href = "?jardin=1";
  ver.textContent = "Ver";
  ver.addEventListener("click", (e) => {
    e.preventDefault();
    cerrar();
    cambiarPestana("jardin");
    document.getElementById("tarjeta-principal").scrollIntoView({ behavior: "smooth" });
  });

  const cerrarBoton = document.createElement("button");
  cerrarBoton.type = "button";
  cerrarBoton.className = "aviso-cerrar";
  cerrarBoton.setAttribute("aria-label", "Cerrar aviso");
  cerrarBoton.textContent = "✕";

  function cerrar() {
    aviso.classList.add("saliendo");
    setTimeout(() => aviso.remove(), 300);
  }
  cerrarBoton.addEventListener("click", cerrar);
  setTimeout(cerrar, 12000);

  aviso.append(texto, ver, cerrarBoton);
  zona.append(aviso);
  sonido.plantar();
}

// Puntito con el número de novedades en la pestaña "Mi jardín"
function marcarNovedadesEnJardin(cantidad) {
  const pestana = document.getElementById("tab-jardin");
  const anteriores = Number(pestana.dataset.novedades || 0);
  pestana.dataset.novedades = String(anteriores + cantidad);
  pestana.setAttribute("aria-label", `Mi jardín, ${anteriores + cantidad} novedades`);
}

function limpiarNovedadesDelJardin() {
  const pestana = document.getElementById("tab-jardin");
  delete pestana.dataset.novedades;
  pestana.removeAttribute("aria-label");
}

// Se llama al iniciar o cerrar sesión
function iniciarAvisos(conSesion) {
  clearInterval(intervaloAvisos);
  if (!conSesion) return;
  revisarAvisos();
  intervaloAvisos = setInterval(revisarAvisos, CADA_CUANTO_REVISAR);
}

// Al volver a la pestaña del navegador, se revisa de una vez
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") revisarAvisos();
});
