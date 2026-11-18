// =====================================================
//  Temporadas: Navidad, San Valentín, Día de la Madre...
// =====================================================
//
// Según la fecha, el cielo cambia (nieve, corazones) y aparece una cinta que
// invita a enviar un ramo de temporada, con el taller ya preparado.
// Para probar una temporada cualquier día: ?temporada=navidad

const TEMPORADAS = [
  {
    id: "navidad",
    nombre: "Navidad",
    emoji: "🎄",
    desde: [12, 1],
    hasta: [1, 6],
    particula: "nieve",
    invitacion: "Edición de Navidad: envía un ramo navideño",
    ramo: { flores: [20, 6, 24], papel: 5, lazo: 0 },   // Flor de Pascua, Magnolia, Margarita
  },
  {
    id: "san-valentin",
    nombre: "San Valentín",
    emoji: "💘",
    desde: [2, 1],
    hasta: [2, 15],
    particula: "corazon",
    invitacion: "San Valentín: envía un ramo de amor",
    ramo: { flores: [18, 7, 21, 13], papel: 2, lazo: 2 },   // Camelia, Amapola, Tulipán, Azalea
  },
  {
    id: "madres",
    nombre: "Día de la Madre",
    emoji: "💐",
    desde: [5, 1],
    hasta: [5, 31],
    particula: null,
    invitacion: "Día de la Madre: envíale un ramo a mamá",
    ramo: { flores: [10, 23, 24, 2], papel: 3, lazo: 1, para: "Mamá" },   // Gardenia, Hortensia, Margarita, Cerezo
  },
  {
    id: "amor-amistad",
    nombre: "Amor y Amistad",
    emoji: "💛",
    desde: [9, 1],
    hasta: [9, 30],
    particula: "corazon",
    invitacion: "Amor y Amistad: envía un ramo a quien quieras",
    ramo: { flores: [16, 3, 24], papel: 3, lazo: 0 },   // Acacia, Girasol, Margarita
  },
];

// ¿La fecha está entre [mes, día] desde y hasta? (Navidad cruza el año nuevo)
function enRango(fecha, [mesDesde, diaDesde], [mesHasta, diaHasta]) {
  const valor = (fecha.getMonth() + 1) * 100 + fecha.getDate();
  const desde = mesDesde * 100 + diaDesde;
  const hasta = mesHasta * 100 + diaHasta;
  return desde <= hasta ? valor >= desde && valor <= hasta : valor >= desde || valor <= hasta;
}

function temporadaActual(fecha = new Date()) {
  const forzada = new URLSearchParams(window.location.search).get("temporada");
  if (forzada) return TEMPORADAS.find((t) => t.id === forzada) || null;
  return TEMPORADAS.find((t) => enRango(fecha, t.desde, t.hasta)) || null;
}

const temporada = temporadaActual();

function mostrarCintaTemporada() {
  const cinta = document.getElementById("cinta-temporada");
  if (!temporada) return;
  cinta.textContent = `${temporada.emoji} ${temporada.invitacion} →`;
  cinta.href = `?crear=1&temporada=${temporada.id}`;
  cinta.hidden = false;
}
