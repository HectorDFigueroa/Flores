// Base de datos de flores (20 flores)
const flores = [
  { nombre: "Rosa Negra",        emoji: "🖤", significado: "Misterio y elegancia que pocos comprenden" },
  { nombre: "Lavanda",           emoji: "💜", significado: "Calma y espíritu soñador que sana todo" },
  { nombre: "Cerezo",            emoji: "🌸", significado: "Belleza efímera que florece en silencio" },
  { nombre: "Girasol",           emoji: "🌻", significado: "Luz propia que ilumina a quienes te rodean" },
  { nombre: "Loto Azul",         emoji: "🪷", significado: "Pureza que nace incluso de las profundidades" },
  { nombre: "Orquídea",          emoji: "🌺", significado: "Rareza y gracia que no se encuentra en cualquier lugar" },
  { nombre: "Magnolia",          emoji: "🤍", significado: "Nobleza silenciosa y corazón verdaderamente puro" },
  { nombre: "Amapola",           emoji: "❤️", significado: "Pasión ardiente y recuerdos que duran eternamente" },
  { nombre: "Jazmín",            emoji: "🌼", significado: "Dulzura sutil que permanece en la memoria" },
  { nombre: "Violeta",           emoji: "💙", significado: "Humildad profunda y lealtad inquebrantable" },
  { nombre: "Gardenia",          emoji: "🌿", significado: "Secretos guardados con amor y ternura infinita" },
  { nombre: "Dalia",             emoji: "🌷", significado: "Elegancia sin esfuerzo, belleza que no necesita demostrar nada" },
  { nombre: "Crisantemo",        emoji: "🌾", significado: "Longevidad del alma y fortaleza ante cualquier tormenta" },
  { nombre: "Azalea",            emoji: "🩷", significado: "Fragilidad aparente que esconde una fuerza inmensa" },
  { nombre: "Flor de Lis",       emoji: "⚜️", significado: "Realeza interior y dignidad que llevas en la sangre" },
  { nombre: "Pasionaria",        emoji: "🫧", significado: "Intensidad de emociones que muy pocos se atreven a sentir" },
  { nombre: "Acacia",            emoji: "💛", significado: "Amistad verdadera y amor que no pide nada a cambio" },
  { nombre: "Begonia",           emoji: "🧡", significado: "Imaginación desbordante y mente siempre en movimiento" },
  { nombre: "Camélia",           emoji: "🌹", significado: "Admiración callada, belleza que no necesita aplausos" },
  { nombre: "Nomeolvides",       emoji: "🩵", significado: "Memorias eternas grabadas en el corazón para siempre" },
];

// Ramo especial de Eva
const ramoEva = [
  { nombre: "Rosa Eterna",     emoji: "🌹", significado: "Un amor que existe más allá del tiempo y el espacio" },
  { nombre: "Loto Dorado",     emoji: "✨", significado: "Alma única e irrepetible entre millones de almas" },
  { nombre: "Orquídea Lunar",  emoji: "🌙", significado: "Gracia misteriosa que ilumina incluso la noche más oscura" },
  { nombre: "Flor de Cerezo",  emoji: "🌸", significado: "Belleza tan pura que detiene el tiempo al verla" },
];

// Función para elegir flores según el nombre
function elegirFlores(nombre) {
  let ramo = [];
  let indiceBase = 0;

  for (let i = 0; i < nombre.length; i++) {
    indiceBase += nombre.charCodeAt(i);
  }

  for (let i = 0; i < 4; i++) {
    let indice = (indiceBase + i * 3) % flores.length;
    ramo.push(flores[indice]);
  }

  return ramo;
}

// Función para mostrar el ramo
function mostrarRamo(nombre, ramo) {
  const resultado = document.getElementById("resultado");
  const esEva = nombre.toLowerCase() === "eva";

  let html = `<h2>${esEva ? "👑" : "✦"} El Ramo de ${nombre} ${esEva ? "👑" : "✦"}</h2>`;

  if (esEva) {
    let significadosHtml = '';
    ramoEva.forEach(flor => {
      significadosHtml += `
        <div class="flor">
          <span class="emoji">${flor.emoji}</span>
          <div>
            <p class="nombre-flor">${flor.nombre}</p>
            <p class="significado">${flor.significado}</p>
          </div>
        </div>
      `;
    });

    html += `
      <div class="ramo-eva-contenedor">
        <img src="img/ramo-eva.png" alt="El ramo de Eva" class="ramo-imagen" />
        <div class="ramo-eva-significados">
          ${significadosHtml}
        </div>
      </div>
    `;

    resultado.innerHTML = html;
    return;
  }

  // Ramo normal para los demás
  ramo.forEach(flor => {
    html += `
      <div class="flor">
        <span class="emoji">${flor.emoji}</span>
        <div>
          <p class="nombre-flor">${flor.nombre}</p>
          <p class="significado">${flor.significado}</p>
        </div>
      </div>
    `;
  });

  resultado.innerHTML = html;
}

// Evento del botón
document.getElementById("boton").addEventListener("click", function() {
  const nombre = document.getElementById("nombreInput").value.trim();

  if (nombre === "") {
    alert("¡Escribe tu nombre primero!");
    return;
  }

  const ramo = elegirFlores(nombre);
  mostrarRamo(nombre, ramo);
});

// Enter para generar
document.getElementById("nombreInput").addEventListener("keydown", function(e) {
  if (e.key === "Enter") document.getElementById("boton").click();
});