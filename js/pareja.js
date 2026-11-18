// =====================================================
//  Ramo de dos nombres 💞
// =====================================================

// La esencia de cada flor, para armar la frase del ramo
const ESENCIAS = {
  "Rosa Negra": "el misterio",
  "Lavanda": "la calma",
  "Cerezo": "la belleza serena",
  "Girasol": "la luz propia",
  "Loto Azul": "la pureza",
  "Orquídea": "lo extraordinario",
  "Magnolia": "la nobleza",
  "Amapola": "la pasión",
  "Jazmín": "la dulzura",
  "Violeta": "la lealtad",
  "Gardenia": "la ternura",
  "Dalia": "la elegancia",
  "Crisantemo": "la fortaleza",
  "Azalea": "la fuerza escondida",
  "Flor de Lis": "la dignidad",
  "Pasionaria": "la intensidad",
  "Acacia": "la amistad verdadera",
  "Begonia": "la imaginación",
  "Camelia": "la admiración",
  "Nomeolvides": "la memoria",
};

const FRASES_PAREJA = [
  (a, b) => `Un jardín donde ${a} y ${b} crecen juntas`,
  (a, b) => `Cuando ${a} se encuentra con ${b}, algo mágico florece`,
  (a, b) => `${mayuscula(a)} da raíces; ${b} da alas`,
  (a, b) => `En este ramo, ${a} cuida de ${b}, y ${b} ilumina ${a}`,
  (a, b) => `Dos flores distintas, un mismo jardín: ${a} y ${b}`,
];

const ESTILO_PAREJA = {
  composicion: "normal",
  efectos: true,
  destellos: false,
  papel: PAPELES[2].papel,   // rosa
  lazo: LAZOS[2],            // rojo
};

function mayuscula(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Calcula el ramo combinado. El orden de los nombres no cambia el resultado.
function ramoDePareja(nombreA, nombreB) {
  const claveA = normalizarNombre(nombreA);
  const claveB = normalizarNombre(nombreB);
  const [primero, segundo] = [claveA, claveB].sort();
  const semilla = hashTexto(`${primero}&${segundo}`);

  const floresA = elegirFlores(hashTexto(claveA));
  const floresB = elegirFlores(hashTexto(claveB));

  // Primero las flores que comparten; luego se alternan las de cada uno
  const origen = new Map();
  floresA.filter((f) => floresB.includes(f)).forEach((f) => origen.set(f, "ambos"));
  for (let i = 0; i < FLORES_POR_RAMO && origen.size < FLORES_POR_RAMO; i++) {
    for (const [flor, quien] of [[floresA[i], "a"], [floresB[i], "b"]]) {
      if (origen.size < FLORES_POR_RAMO && !origen.has(flor)) origen.set(flor, quien);
    }
  }
  const ramo = [...origen.keys()];
  const comunes = ramo.filter((f) => origen.get(f) === "ambos");

  // Afinidad floral: entre 62 % y 99 %, más alta si comparten flores
  const mismoNombre = claveA === claveB;
  const afinidad = mismoNombre ? 100 : Math.min(99, 62 + (semilla % 28) + comunes.length * 8);

  // La frase usa la primera flor propia de cada uno
  const propiaA = ramo.find((f) => origen.get(f) === "a") || ramo[0];
  const propiaB = ramo.find((f) => origen.get(f) === "b") || ramo[ramo.length - 1];
  let frase = FRASES_PAREJA[semilla % FRASES_PAREJA.length](ESENCIAS[propiaA.nombre], ESENCIAS[propiaB.nombre]);
  if (comunes.length) frase += `. Y los dos comparten ${ESENCIAS[comunes[0].nombre]}`;
  if (mismoNombre) frase = "¡Mismo nombre, mismo jardín! Este ramo es un espejo";

  return { ramo, origen, semilla, afinidad, frase: `${frase}.`, comunes };
}

function enlaceDePareja(nombreA, nombreB) {
  const url = new URL(window.location.href);
  url.search = new URLSearchParams({ nombre: nombreA, y: nombreB }).toString();
  url.hash = "";
  return url.toString();
}

function mostrarRamoPareja(nombreA, nombreB, datos) {
  const titulo = document.createElement("h2");
  titulo.textContent = `💞 ${nombreA} y ${nombreB} 💞`;

  // Medidor de afinidad
  const afinidad = document.createElement("div");
  afinidad.className = "afinidad";
  afinidad.style.setProperty("--afinidad", `${datos.afinidad}%`);
  const etiqueta = document.createElement("p");
  etiqueta.className = "afinidad-texto";
  etiqueta.textContent = `Afinidad floral: ${datos.afinidad}%`;
  const barra = document.createElement("div");
  barra.className = "afinidad-barra";
  barra.setAttribute("role", "meter");
  barra.setAttribute("aria-valuemin", "0");
  barra.setAttribute("aria-valuemax", "100");
  barra.setAttribute("aria-valuenow", String(datos.afinidad));
  barra.setAttribute("aria-label", "Afinidad floral");
  barra.append(document.createElement("span"));
  afinidad.append(etiqueta, barra);

  const frase = document.createElement("p");
  frase.className = "carta carta-texto frase-pareja";
  frase.textContent = datos.frase;

  const nombres = { a: nombreA, b: nombreB, ambos: "los dos" };
  const lista = document.createElement("div");
  lista.className = "flores-lista";
  datos.ramo.forEach((flor, i) => {
    lista.append(crearTarjetaFlor(flor, i, `de ${nombres[datos.origen.get(flor)]}`));
  });

  const nombreRamo = `${nombreA} y ${nombreB}`;
  const acciones = crearAccionesRamo(nombreRamo, datos.ramo, false, datos.semilla, {
    enlace: enlaceDePareja(nombreA, nombreB),
    textoCompartir: `Mira el ramo mágico de ${nombreRamo} 💞`,
    idJardin: `descubierto:pareja:${[normalizarNombre(nombreA), normalizarNombre(nombreB)].sort().join("&")}`,
    estilo: ESTILO_PAREJA,
    info: () => ({
      titulo: `El Ramo de ${nombreRamo}`,
      flores: datos.ramo.map((f) => f.nombre),
      mensaje: `${datos.frase} Afinidad floral: ${datos.afinidad}%`,
    }),
  });

  document.getElementById("resultado").replaceChildren(titulo, afinidad, frase, lista, acciones);
}

function revelarPareja(nombreA, nombreB) {
  const datos = ramoDePareja(nombreA, nombreB);
  dibujarRamo(datos.ramo, datos.semilla, `${nombreA} y ${nombreB}`, ESTILO_PAREJA);
  mostrarRamoPareja(nombreA, nombreB, datos);
  history.replaceState(null, "", enlaceDePareja(nombreA, nombreB));
}
