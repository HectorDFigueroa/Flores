// =====================================================
//  Sonido: campanitas hechas con la Web Audio API
// =====================================================
//
// No hay archivos de audio: cada campanita se "sintetiza" sumando ondas
// (una nota base y dos armónicos agudos que se apagan rápido, como una campana).
// Los navegadores solo permiten sonar después de que la persona toca algo,
// por eso el audio se prepara en el primer clic.

const sonido = (() => {
  const CLAVE = "ramo-magico:sonido";
  // Escala pentatónica: cualquier combinación de estas notas suena bonita
  const NOTAS = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66];

  let activo = leerPreferencia();
  let ctx = null;
  let salida = null;

  function leerPreferencia() {
    try {
      return localStorage.getItem(CLAVE) !== "no";
    } catch {
      return true;
    }
  }

  function preparar() {
    if (!activo) return null;
    const Contexto = window.AudioContext || window.webkitAudioContext;
    if (!Contexto) return null;

    if (!ctx) {
      ctx = new Contexto();
      salida = ctx.createGain();
      salida.gain.value = 0.22;

      // Eco suave para que suene "mágico"
      const eco = ctx.createDelay();
      eco.delayTime.value = 0.28;
      const retorno = ctx.createGain();
      retorno.gain.value = 0.3;
      const filtro = ctx.createBiquadFilter();
      filtro.type = "lowpass";
      filtro.frequency.value = 2400;

      salida.connect(ctx.destination);
      salida.connect(eco);
      eco.connect(filtro);
      filtro.connect(retorno);
      retorno.connect(eco);
      filtro.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }

  // Una campanita: frecuencia (Hz), cuándo (segundos desde ahora), volumen y duración
  function campana(frecuencia, cuando = 0, volumen = 0.7, duracion = 2.2) {
    const c = preparar();
    if (!c) return;
    const inicio = c.currentTime + cuando;
    const armonicos = [
      [1, 1],        // la nota
      [2.76, 0.22],  // brillo de campana
      [5.4, 0.07],
    ];
    armonicos.forEach(([multiplicador, peso]) => {
      const oscilador = c.createOscillator();
      oscilador.type = "sine";
      oscilador.frequency.value = frecuencia * multiplicador;
      const ganancia = c.createGain();
      const fin = inicio + duracion / Math.sqrt(multiplicador);
      ganancia.gain.setValueAtTime(0.0001, inicio);
      ganancia.gain.exponentialRampToValueAtTime(volumen * peso, inicio + 0.01);
      ganancia.gain.exponentialRampToValueAtTime(0.0001, fin);
      oscilador.connect(ganancia);
      ganancia.connect(salida);
      oscilador.start(inicio);
      oscilador.stop(fin + 0.05);
    });
  }

  return {
    get activo() {
      return activo;
    },

    alternar() {
      activo = !activo;
      try {
        localStorage.setItem(CLAVE, activo ? "si" : "no");
      } catch { /* sin almacenamiento: solo dura esta visita */ }
      if (activo) campana(NOTAS[3], 0, 0.5, 1.2);
      return activo;
    },

    // Una nota por flor, en el momento en que se abre (segundos)
    ramo(tiempos) {
      tiempos.forEach((t, i) => campana(NOTAS[i % NOTAS.length], t, 0.65));
    },

    // Arpegio brillante al romper el sello del sobre
    sello() {
      [1046.5, 1318.5, 1568.0, 2093.0].forEach((f, i) => campana(f, i * 0.07, 0.3, 1.3));
    },

    // "Tin" al plantar en el jardín
    plantar() {
      campana(1568.0, 0, 0.35, 1);
      campana(2093.0, 0.09, 0.25, 1);
    },
  };
})();

function prepararBotonSonido() {
  const boton = document.getElementById("boton-sonido");
  const pintar = () => {
    boton.textContent = sonido.activo ? "🔔" : "🔕";
    boton.setAttribute("aria-pressed", String(sonido.activo));
    boton.setAttribute("aria-label", sonido.activo ? "Sonido activado. Tocar para silenciar" : "Sonido silenciado. Tocar para activar");
    boton.title = sonido.activo ? "Silenciar" : "Activar sonido";
  };
  boton.addEventListener("click", () => {
    sonido.alternar();
    pintar();
  });
  pintar();
}
