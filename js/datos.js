// =====================================================
//  Datos: flores, ramo de Eva, papeles y lazos
// =====================================================

// Base de datos de flores (20 flores)
// color/centro/forma/petalos se usan para dibujar cada flor en el lienzo.
// ¡Ojo! El orden importa: los enlaces de regalo guardan la posición de cada flor.
// Las flores nuevas se agregan al final.
const flores = [
  { nombre: "Rosa Negra",  emoji: "🖤", color: "#6b1f3d", centro: "#2a0c18", forma: "rosa",    significado: "Misterio y elegancia que pocos comprenden" },
  { nombre: "Lavanda",     emoji: "💜", color: "#a68ad8", centro: "#6e55a8", forma: "racimo",  significado: "Calma y espíritu soñador que sana todo" },
  { nombre: "Cerezo",      emoji: "🌸", color: "#f6bccd", centro: "#c95f80", forma: "redonda", significado: "Belleza efímera que florece en silencio" },
  { nombre: "Girasol",     emoji: "🌻", color: "#f2c230", centro: "#6b4318", forma: "girasol", significado: "Luz propia que ilumina a quienes te rodean" },
  { nombre: "Loto Azul",   emoji: "🪷", color: "#7aa3e6", centro: "#f2d36b", forma: "loto",    significado: "Pureza que nace incluso de las profundidades" },
  { nombre: "Orquídea",    emoji: "🌺", color: "#d77bd0", centro: "#8a2f86", forma: "orquidea", significado: "Rareza y gracia que no se encuentra en cualquier lugar" },
  { nombre: "Magnolia",    emoji: "🤍", color: "#f3ebe0", centro: "#d9b8c4", forma: "tulipan", significado: "Nobleza silenciosa y corazón verdaderamente puro" },
  { nombre: "Amapola",     emoji: "❤️", color: "#e0413a", centro: "#1e1414", forma: "redonda", petalos: 4, significado: "Pasión ardiente y recuerdos que duran eternamente" },
  { nombre: "Jazmín",      emoji: "🌼", color: "#fff4d6", centro: "#f1c95c", forma: "punta",   petalos: 6, significado: "Dulzura sutil que permanece en la memoria" },
  { nombre: "Violeta",     emoji: "💙", color: "#7a62d6", centro: "#f2d36b", forma: "redonda", significado: "Humildad profunda y lealtad inquebrantable" },
  { nombre: "Gardenia",    emoji: "💮", color: "#f7f1e6", centro: "#e6d6b8", forma: "rosa",    significado: "Secretos guardados con amor y ternura infinita" },
  { nombre: "Dalia",       emoji: "🌷", color: "#e4607a", centro: "#f4c3cd", forma: "pompon",  significado: "Elegancia sin esfuerzo, belleza que no necesita demostrar nada" },
  { nombre: "Crisantemo",  emoji: "🏵️", color: "#e8a33d", centro: "#f8dca0", forma: "pompon",  significado: "Longevidad del alma y fortaleza ante cualquier tormenta" },
  { nombre: "Azalea",      emoji: "🩷", color: "#f08cb4", centro: "#b8406f", forma: "redonda", significado: "Fragilidad aparente que esconde una fuerza inmensa" },
  { nombre: "Flor de Lis", emoji: "⚜️", color: "#d9b85c", centro: "#8a6a24", forma: "tulipan", significado: "Realeza interior y dignidad que llevas en la sangre" },
  { nombre: "Pasionaria",  emoji: "🫧", color: "#9fb4ee", centro: "#5b3f8f", forma: "girasol", petalos: 22, significado: "Intensidad de emociones que muy pocos se atreven a sentir" },
  { nombre: "Acacia",      emoji: "💛", color: "#f5d547", centro: "#c9a227", forma: "racimo",  significado: "Amistad verdadera y amor que no pide nada a cambio" },
  { nombre: "Begonia",     emoji: "🧡", color: "#f08a4b", centro: "#f7d06b", forma: "redonda", significado: "Imaginación desbordante y mente siempre en movimiento" },
  { nombre: "Camelia",     emoji: "🌹", color: "#e8586e", centro: "#f6c7cf", forma: "rosa",    significado: "Admiración callada, belleza que no necesita aplausos" },
  { nombre: "Nomeolvides", emoji: "🩵", color: "#86c9f0", centro: "#f6e27a", forma: "redonda", significado: "Memorias eternas grabadas en el corazón para siempre" },

  // ---- Flores nuevas: solo en el taller de regalos y las temporadas ----
  // (el ramo de cada nombre usa solo las 20 clásicas, para que no cambie)
  { nombre: "Flor de Pascua", emoji: "🎄", color: "#d42a3c", centro: "#f2c94c", forma: "punta",   petalos: 7, significado: "Alegría que ilumina las noches más frías del año" },
  { nombre: "Tulipán",        emoji: "🌷", color: "#ff6f91", centro: "#b8405e", forma: "tulipan", significado: "Amor declarado sin miedo y con el corazón abierto" },
  { nombre: "Lirio",          emoji: "🤍", color: "#fbe7f0", centro: "#e07aa0", forma: "orquidea", significado: "Un alma noble que embellece todo lo que toca" },
  { nombre: "Hortensia",      emoji: "💠", color: "#8fa8f0", centro: "#c9d6ff", forma: "pompon",  significado: "Gratitud sincera por existir y por estar" },
  { nombre: "Margarita",      emoji: "🌼", color: "#ffffff", centro: "#f4c430", forma: "girasol", petalos: 20, significado: "Inocencia alegre que hace sonreír a cualquiera" },
];

// Las 20 flores originales (las únicas que salen al descubrir un ramo por nombre)
const FLORES_CLASICAS = 20;

// Ramo especial de Eva: flores únicas que no existen en ningún otro ramo
const ramoEva = [
  { nombre: "Rosa Eterna",    emoji: "🌹", color: "#c8102e", centro: "#4a0414", aura: "#ffcf7a", bordeOro: true, forma: "rosa",     significado: "Un amor que existe más allá del tiempo y el espacio" },
  { nombre: "Loto Dorado",    emoji: "✨", color: "#e9c25a", centro: "#fff1b8", forma: "loto",     significado: "Alma única e irrepetible entre millones de almas" },
  { nombre: "Orquídea Lunar", emoji: "🌙", color: "#d6d0f7", centro: "#7b63c4", aura: "#cfc8ff", forma: "orquidea", significado: "Gracia misteriosa que ilumina incluso la noche más oscura" },
  { nombre: "Flor de Cerezo", emoji: "🌸", color: "#f7b8cc", centro: "#c94f76", forma: "cerezo",   significado: "Belleza tan pura que detiene el tiempo al verla" },
];

// Dónde va cada flor de Eva (mismo orden que ramoEva). Ángulos en radianes desde la vertical.
const DISPOSICION_EVA = [
  { angulo: 0.02,  largo: 0.5,  radio: 0.13, capa: 1 },    // Rosa Eterna, al frente y al centro
  { angulo: -0.32, largo: 0.5,  radio: 0.11, capa: 0.5 },  // Loto Dorado
  { angulo: 0.34,  largo: 0.52, radio: 0.11, capa: 0.5 },  // Orquídea Lunar
  { angulo: -0.62, largo: 0.4,  radio: 0.1,  capa: 0.2 },  // Flor de Cerezo
];

// Flores que acompañan al ramo de Eva (detrás, más pequeñas)
const ACOMPANANTES_EVA = [
  { nombre: "Nomeolvides", angulo: -0.88, largo: 0.32 },
  { nombre: "Jazmín",      angulo: -0.5,  largo: 0.38 },
  { nombre: "Lavanda",     angulo: -0.14, largo: 0.55 },
  { nombre: "Lavanda",     angulo: 0.16,  largo: 0.53 },
  { nombre: "Jazmín",      angulo: 0.5,   largo: 0.38 },
  { nombre: "Violeta",     angulo: 0.86,  largo: 0.32 },
];

// Ramos secretos de familia: aparecen al escribir uno de estos nombres.
// Como el de Eva, sus flores no existen en ningún otro ramo.
// claves: primeras palabras que lo activan (sin tildes y en minúscula)
const RAMOS_SECRETOS = [
  {
    id: "mama",
    claves: ["mama", "mami", "mamita", "madre", "mom"],
    adorno: "💐",
    dedicatoria: "Para quien sembró todas las flores de mi vida",
    papel: 3,   // Crema
    lazo: 0,    // Dorado
    flores: [
      { nombre: "Gardenia del Hogar", emoji: "🏡", color: "#f7f1e6", centro: "#e6d6b8", aura: "#ffe6b0", forma: "rosa",     significado: "El primer hogar que conocí fue tu abrazo" },
      { nombre: "Clavel del Cariño",  emoji: "🌸", color: "#f49ac1", centro: "#c2557f", forma: "pompon",   significado: "Un amor que nunca pidió nada a cambio" },
      { nombre: "Lirio de la Calma",  emoji: "🤍", color: "#fbeef4", centro: "#d77ba3", forma: "orquidea", significado: "La paz que llega con solo escuchar tu voz" },
      { nombre: "Girasol del Abrazo", emoji: "🌻", color: "#f6c945", centro: "#6b4318", forma: "girasol",  significado: "Tu luz me enseñó a florecer" },
    ],
  },
  {
    id: "papa",
    claves: ["papa", "papi", "papito", "padre", "dad"],
    adorno: "🌳",
    dedicatoria: "Para quien me enseñó a crecer derecho hacia la luz",
    papel: 4,   // Azul noche
    lazo: 3,    // Plata
    flores: [
      { nombre: "Crisantemo del Valor", emoji: "🏵️", color: "#e8a33d", centro: "#f8dca0", forma: "pompon",  significado: "Fortaleza que me sostuvo sin que yo lo notara" },
      { nombre: "Lavanda Serena",       emoji: "💜", color: "#9c86d6", centro: "#6e55a8", forma: "racimo",  significado: "Calma en medio de cualquier tormenta" },
      { nombre: "Lis del Camino",       emoji: "⚜️", color: "#d9b85c", centro: "#8a6a24", forma: "tulipan", significado: "El camino que me enseñaste a caminar" },
      { nombre: "Loto del Ejemplo",     emoji: "🪷", color: "#7aa3e6", centro: "#f2d36b", forma: "loto",    significado: "Lo que enseñaste con hechos, no con palabras" },
    ],
  },
  {
    id: "abuela",
    claves: ["abuela", "abuelita", "nona", "yaya", "abue"],
    adorno: "🧶",
    dedicatoria: "Para quien guarda las historias más bonitas de la familia",
    papel: 2,   // Rosa
    lazo: 1,    // Morado
    flores: [
      { nombre: "Nomeolvides de las Historias", emoji: "🩵", color: "#86c9f0", centro: "#f6e27a", forma: "redonda", significado: "Cada recuerdo tuyo es un tesoro de la familia" },
      { nombre: "Jazmín de la Cocina",          emoji: "🌼", color: "#fff4d6", centro: "#f1c95c", forma: "punta", petalos: 6, significado: "El aroma de las tardes en tu casa" },
      { nombre: "Camelia de la Ternura",        emoji: "🌹", color: "#e8728a", centro: "#f6c7cf", forma: "rosa",    significado: "Una ternura que no se gasta con los años" },
      { nombre: "Cerezo de los Domingos",       emoji: "🌸", color: "#f7b8cc", centro: "#c94f76", forma: "cerezo",  significado: "Los días más felices siempre empezaban contigo" },
    ],
  },
  {
    id: "abuelo",
    claves: ["abuelo", "abuelito", "nono", "tata", "yayo"],
    adorno: "🎩",
    dedicatoria: "Para quien plantó las raíces de toda la familia",
    papel: 3,   // Crema
    lazo: 4,    // Verde
    flores: [
      { nombre: "Roble Florido",            emoji: "🌳", color: "#c98b4a", centro: "#5c3b1a", forma: "girasol", petalos: 14, significado: "Raíces profundas que nos sostienen a todos" },
      { nombre: "Violeta de la Sabiduría",  emoji: "💙", color: "#7a62d6", centro: "#f2d36b", forma: "redonda", significado: "Consejos que florecen cuando más se necesitan" },
      { nombre: "Margarita de la Mañana",   emoji: "🌼", color: "#ffffff", centro: "#f4c430", forma: "girasol", petalos: 20, significado: "La alegría sencilla de cada amanecer contigo" },
      { nombre: "Acacia del Trabajo",       emoji: "💛", color: "#f5d547", centro: "#c9a227", forma: "racimo",  significado: "Todo lo que construiste con tus manos y tu esfuerzo" },
    ],
  },
];

function buscarRamoSecreto(primeraPalabra) {
  return RAMOS_SECRETOS.find((s) => s.claves.includes(primeraPalabra)) || null;
}

function estiloDeSecreto(secreto) {
  return {
    composicion: "normal",
    efectos: true,
    destellos: true,
    papel: PAPELES[secreto.papel].papel,
    lazo: LAZOS[secreto.lazo],
  };
}

// Papeles de regalo. Colores en [r, g, b].
// claro/oscuro: degradado del papel de adelante · fondo: papel de atrás · borde: hilos dorados
const PAPELES = [
  { nombre: "Sin papel",  muestra: "transparent", papel: null },
  { nombre: "Morado real", muestra: "#684288", papel: { claro: [104, 66, 136], oscuro: [34, 18, 52],  fondo: [52, 30, 76],   borde: [226, 190, 104] } },
  { nombre: "Rosa",       muestra: "#e49ab5", papel: { claro: [228, 154, 181], oscuro: [120, 52, 84], fondo: [160, 82, 116], borde: [255, 232, 196] } },
  { nombre: "Crema",      muestra: "#efe2c8", papel: { claro: [239, 226, 200], oscuro: [150, 124, 88], fondo: [196, 174, 136], borde: [190, 150, 70] } },
  { nombre: "Azul noche", muestra: "#3a5296", papel: { claro: [58, 82, 150],  oscuro: [14, 20, 48],  fondo: [28, 40, 86],   borde: [200, 212, 255] } },
  // (agregar siempre al final: los enlaces guardan la posición)
  { nombre: "Rojo Navidad", muestra: "#b3202f", papel: { claro: [190, 40, 56], oscuro: [70, 10, 20], fondo: [120, 24, 36], borde: [240, 210, 130] } },
];

// Lazos. color: la cinta · borde: el ribete (null = sin ribete)
const LAZOS = [
  { nombre: "Dorado", muestra: "#c9a84c", color: [201, 168, 76], borde: null },
  { nombre: "Morado", muestra: "#9652c8", color: [150, 82, 200], borde: [232, 196, 110] },
  { nombre: "Rojo",   muestra: "#c41e3a", color: [196, 30, 58],  borde: [232, 196, 110] },
  { nombre: "Plata",  muestra: "#c8ccdc", color: [200, 204, 220], borde: [255, 255, 255] },
  { nombre: "Verde",  muestra: "#2f7a4a", color: [47, 122, 74],   borde: [232, 196, 110] },
];

// Estilos de dibujo del ramo
const ESTILO_NORMAL = {
  composicion: "normal",
  efectos: false,     // halo, destellos de fondo y pétalos cayendo
  destellos: false,   // chispas que giran alrededor de cada flor
  papel: null,
  lazo: LAZOS[0],
};

const ESTILO_EVA = {
  composicion: "eva",
  efectos: true,
  destellos: true,
  papel: PAPELES[1].papel,
  lazo: LAZOS[1],
};

const FLORES_POR_RAMO = 4;
const MAX_FLORES_REGALO = 6;
const MAX_MENSAJE = 240;
