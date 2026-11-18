// =====================================================
//  Service worker: app instalable y funcionamiento sin internet
// =====================================================
//
// Estrategia:
// - Archivos de la página (html, css, js, imágenes): primero internet, para
//   tener siempre la versión nueva; si no hay conexión, la copia guardada.
// - Librerías de CDN (p5, Firebase, QR) y fuentes: primero la copia guardada,
//   porque sus direcciones llevan la versión y nunca cambian.
// - Firebase (base de datos e inicio de sesión): nunca se guarda, siempre en vivo.
//
// Al cambiar esta versión, se borran las copias viejas.
const VERSION = "v13";
const CACHE = `tu-ramo-magico-${VERSION}`;
const ESENCIALES = ["./", "index.html", "styles.css", "manifest.json", "img/icono-192.png"];

const SIEMPRE_EN_VIVO = [
  "firestore.googleapis.com",
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "accounts.google.com",
  "firebaseapp.com",
  "apis.google.com",
];

const CDN = ["cdnjs.cloudflare.com", "www.gstatic.com", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ESENCIALES))
      .catch(() => {})   // si algo falla, la app igual funciona en línea
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nombres) => Promise.all(nombres.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

async function primeroInternet(peticion) {
  const cache = await caches.open(CACHE);
  try {
    const respuesta = await fetch(peticion);
    if (respuesta.ok) cache.put(peticion, respuesta.clone());
    return respuesta;
  } catch (error) {
    const guardada = await cache.match(peticion, { ignoreSearch: true });
    if (guardada) return guardada;
    if (peticion.mode === "navigate") {
      const portada = await cache.match("./");
      if (portada) return portada;
    }
    throw error;
  }
}

async function primeroGuardado(peticion) {
  const cache = await caches.open(CACHE);
  const guardada = await cache.match(peticion);
  if (guardada) return guardada;
  const respuesta = await fetch(peticion);
  if (respuesta.ok || respuesta.type === "opaque") cache.put(peticion, respuesta.clone());
  return respuesta;
}

self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;
  if (peticion.method !== "GET") return;
  const url = new URL(peticion.url);

  if (SIEMPRE_EN_VIVO.some((dominio) => url.hostname.endsWith(dominio))) return;
  // El SDK de Firebase sí se puede guardar (está en gstatic con versión fija)
  if (CDN.includes(url.hostname)) {
    evento.respondWith(primeroGuardado(peticion));
    return;
  }
  if (url.origin === self.location.origin) {
    evento.respondWith(primeroInternet(peticion));
  }
});
