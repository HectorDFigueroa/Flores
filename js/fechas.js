// =====================================================
//  Fechas especiales: cumpleaños, aniversarios y recordatorios
// =====================================================
//
// Cada fecha guarda solo día y mes (el año no importa: se repite cada año).
// Si falta una semana o menos, aparece una cinta que abre el taller con el
// ramo listo y sellado hasta ese día.

const CLAVE_FECHAS = "ramo-magico:fechas:v1";
const DIAS_DE_AVISO = 7;

const TIPOS_FECHA = {
  cumpleanos:  { emoji: "🎂", nombre: "Cumpleaños",     frase: (n) => `el cumpleaños de ${n}` },
  aniversario: { emoji: "💞", nombre: "Aniversario",    frase: (n) => `tu aniversario con ${n}` },
  otro:        { emoji: "✨", nombre: "Fecha especial", frase: (n) => `la fecha especial de ${n}` },
};


// ---------- Lógica (sin pantalla; tiene pruebas en pruebas/) ----------

// Medianoche de hoy (para comparar días completos, sin horas)
function soloElDia(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

// La próxima vez que cae esa fecha, contando hoy.
// El 29 de febrero, en años no bisiestos, se celebra el 28.
function proximaOcurrencia(mes, dia, hoy = new Date()) {
  const inicio = soloElDia(hoy);
  for (const anio of [inicio.getFullYear(), inicio.getFullYear() + 1]) {
    const ultimoDiaDelMes = new Date(anio, mes, 0).getDate();
    const fecha = new Date(anio, mes - 1, Math.min(dia, ultimoDiaDelMes));
    if (fecha >= inicio) return fecha;
  }
  return null;
}

function diasHasta(fecha, hoy = new Date()) {
  return Math.round((soloElDia(fecha) - soloElDia(hoy)) / 86400000);
}

function textoDeDias(dias) {
  if (dias === 0) return "hoy";
  if (dias === 1) return "mañana";
  return `en ${dias} días`;
}

// "2026-11-20"
function fechaComoTexto(fecha) {
  const dos = (n) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

// Las fechas ordenadas por cuál viene primero
function fechasOrdenadas(lista, hoy = new Date()) {
  return lista
    .map((f) => {
      const proxima = proximaOcurrencia(f.mes, f.dia, hoy);
      return { ...f, proxima, dias: diasHasta(proxima, hoy) };
    })
    .sort((a, b) => a.dias - b.dias);
}

// Enlace al taller con el ramo listo: para esa persona y sellado hasta su día
function enlaceRamoParaFecha(fecha) {
  const parametros = new URLSearchParams({ crear: "1", para: fecha.nombre });
  if (fecha.dias > 0) parametros.set("abrir", fechaComoTexto(fecha.proxima));
  return `?${parametros.toString()}`;
}


// ---------- Almacén (cuenta o navegador, igual que el jardín) ----------

const almacenFechasLocal = {
  listar() {
    try {
      const datos = JSON.parse(localStorage.getItem(CLAVE_FECHAS));
      return Array.isArray(datos) ? datos : [];
    } catch {
      return [];
    }
  },
  guardarTodo(lista) {
    try {
      localStorage.setItem(CLAVE_FECHAS, JSON.stringify(lista));
      return true;
    } catch {
      return false;
    }
  },
  vaciar() {
    try {
      localStorage.removeItem(CLAVE_FECHAS);
    } catch { /* nada que borrar */ }
  },
};

const almacenFechas = {
  async listar() {
    await nubeLista;
    if (hayCuenta()) return nube.listarFechas();
    return almacenFechasLocal.listar();
  },
  async guardar(fecha) {
    await nubeLista;
    if (hayCuenta()) {
      await nube.guardarFecha(fecha);
      return true;
    }
    const resto = almacenFechasLocal.listar().filter((f) => f.id !== fecha.id);
    return almacenFechasLocal.guardarTodo([...resto, fecha]);
  },
  async quitar(id) {
    await nubeLista;
    if (hayCuenta()) {
      await nube.borrarFecha(id);
      return true;
    }
    return almacenFechasLocal.guardarTodo(almacenFechasLocal.listar().filter((f) => f.id !== id));
  },
};

async function moverFechasLocalesALaNube() {
  const locales = almacenFechasLocal.listar();
  if (locales.length === 0) return 0;
  for (const fecha of locales) await nube.guardarFecha(fecha);
  almacenFechasLocal.vaciar();
  return locales.length;
}


// ---------- Pantalla ----------

// Cinta de recordatorio arriba de la tarjeta (la fecha más próxima, si falta una semana o menos)
async function actualizarRecordatorio() {
  const cinta = document.getElementById("cinta-fecha");
  let lista = [];
  try {
    lista = await almacenFechas.listar();
  } catch {
    cinta.hidden = true;
    return;
  }
  const proxima = fechasOrdenadas(lista).find((f) => f.dias <= DIAS_DE_AVISO);
  if (!proxima) {
    cinta.hidden = true;
    return;
  }
  const tipo = TIPOS_FECHA[proxima.tipo] || TIPOS_FECHA.otro;
  const cuando = mayuscula(textoDeDias(proxima.dias));
  cinta.textContent = proxima.dias === 0
    ? `${tipo.emoji} ¡Hoy es ${tipo.frase(proxima.nombre)}! Envíale un ramo →`
    : `${tipo.emoji} ${cuando} es ${tipo.frase(proxima.nombre)}: prepárale un ramo →`;
  cinta.href = enlaceRamoParaFecha(proxima);
  cinta.hidden = false;
}

async function mostrarFechas() {
  const contenedor = document.getElementById("fechas-lista");
  let lista;
  try {
    lista = fechasOrdenadas(await almacenFechas.listar());
  } catch (error) {
    console.error("No se pudieron leer las fechas", error);
    const aviso = document.createElement("p");
    aviso.className = "fechas-vacio";
    aviso.textContent = error.code === "permission-denied"
      ? "Para guardar fechas en tu cuenta, publica las reglas nuevas de firestore.rules 🙏"
      : "No pudimos traer tus fechas. Revisa tu conexión 😔";
    contenedor.replaceChildren(aviso);
    return;
  }

  if (lista.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "fechas-vacio";
    vacio.textContent = "Agrega cumpleaños y aniversarios y te recordaremos enviar un ramo a tiempo 🎂";
    contenedor.replaceChildren(vacio);
    return;
  }
  contenedor.replaceChildren(...lista.map(crearFilaFecha));
}

function crearFilaFecha(fecha) {
  const tipo = TIPOS_FECHA[fecha.tipo] || TIPOS_FECHA.otro;
  const fila = document.createElement("li");
  fila.className = "fecha";
  if (fecha.dias <= DIAS_DE_AVISO) fila.classList.add("fecha--cerca");

  const emoji = document.createElement("span");
  emoji.className = "fecha-emoji";
  emoji.setAttribute("aria-hidden", "true");
  emoji.textContent = tipo.emoji;

  const texto = document.createElement("div");
  texto.className = "fecha-texto";
  const nombre = document.createElement("p");
  nombre.className = "fecha-nombre";
  nombre.textContent = fecha.nombre;
  const detalle = document.createElement("p");
  detalle.className = "fecha-detalle";
  const diaYMes = fecha.proxima.toLocaleDateString("es", { day: "numeric", month: "long" });
  detalle.textContent = `${tipo.nombre} · ${diaYMes} · ${textoDeDias(fecha.dias)}`;
  texto.append(nombre, detalle);

  const preparar = document.createElement("a");
  preparar.className = "boton-secundario boton-enlace fecha-ramo";
  preparar.href = enlaceRamoParaFecha(fecha);
  preparar.textContent = "💐 Ramo";
  preparar.title = `Preparar un ramo para ${fecha.nombre}`;

  const quitar = document.createElement("button");
  quitar.type = "button";
  quitar.className = "planta-boton";
  quitar.textContent = "\u{1F5D1}\u{FE0F}";
  quitar.setAttribute("aria-label", `Quitar la fecha de ${fecha.nombre}`);
  quitar.addEventListener("click", async () => {
    if (!confirm(`¿Quitar ${tipo.nombre.toLowerCase()} de ${fecha.nombre}?`)) return;
    try {
      await almacenFechas.quitar(fecha.id);
    } catch (error) {
      console.error("No se pudo quitar la fecha", error);
    }
    mostrarFechas();
    actualizarRecordatorio();
  });

  fila.append(emoji, texto, preparar, quitar);
  return fila;
}

function prepararFechas() {
  const formulario = document.getElementById("form-fecha");
  const abrir = document.getElementById("boton-agregar-fecha");
  const error = document.getElementById("fecha-error");

  abrir.addEventListener("click", () => {
    formulario.hidden = !formulario.hidden;
    abrir.setAttribute("aria-expanded", String(!formulario.hidden));
    if (!formulario.hidden) document.getElementById("fecha-nombre").focus();
  });

  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = document.getElementById("fecha-nombre").value.trim().replace(/\s+/g, " ");
    const tipo = document.getElementById("fecha-tipo").value;
    const dia = document.getElementById("fecha-dia").value;   // "2026-11-20" (el año se ignora)
    if (!nombre || !/^\d{4}-\d{2}-\d{2}$/.test(dia)) {
      error.textContent = "Escribe el nombre y elige el día ✿";
      return;
    }
    const [, mes, numeroDia] = dia.split("-").map(Number);
    const fecha = {
      id: `f-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      nombre: nombre.slice(0, 40),
      tipo: TIPOS_FECHA[tipo] ? tipo : "otro",
      mes,
      dia: numeroDia,
      creado: Date.now(),
    };
    try {
      await almacenFechas.guardar(fecha);
    } catch (e2) {
      console.error("No se pudo guardar la fecha", e2);
      error.textContent = e2.code === "permission-denied"
        ? "Para guardar fechas en tu cuenta, publica las reglas nuevas de firestore.rules 🙏"
        : "No se pudo guardar. Revisa tu conexión 😔";
      return;
    }
    error.textContent = "";
    formulario.reset();
    formulario.hidden = true;
    abrir.setAttribute("aria-expanded", "false");
    sonido.plantar();
    mostrarFechas();
    actualizarRecordatorio();
  });
}
