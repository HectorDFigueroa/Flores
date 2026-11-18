// =====================================================
//  Nube (Firebase): sesión con Google, jardín y regalos
// =====================================================
//
// Este es el único archivo que habla con Firebase. Es un "módulo" (type="module"),
// así que se carga después de los demás scripts. Cuando está listo, deja
// disponible el objeto global window.nube y avisa con el evento "sesion-cambio".
//
// La configuración de abajo NO es secreta: Firebase está hecho para que vaya en
// el código de la página. Lo que protege los datos son las reglas de seguridad
// (archivo firestore.rules).

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  initializeFirestore,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAajE01UlI11veZFUJcs0k08bwLVhcKWbs",
  authDomain: "flores-cbe69.firebaseapp.com",
  projectId: "flores-cbe69",
  storageBucket: "flores-cbe69.firebasestorage.app",
  messagingSenderId: "995152207541",
  appId: "1:995152207541:web:9af74f6097808d217328fc",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = "es";
// ignoreUndefinedProperties: los campos vacíos (por ejemplo "de") simplemente no se guardan
const db = initializeFirestore(app, { ignoreUndefinedProperties: true });

let usuario = null;

// Los ids de documento no pueden tener "/"
const idSeguro = (id) => id.replace(/\//g, "_");

// Id corto y aleatorio para los enlaces de regalo: ?r=Xb7kQ2pA
function idCorto(largo = 8) {
  const letras = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";   // sin 0/O ni 1/l/I
  const azar = crypto.getRandomValues(new Uint32Array(largo));
  return Array.from(azar, (n) => letras[n % letras.length]).join("");
}

const nube = {
  get usuario() {
    return usuario;
  },

  // ---------- sesión ----------
  async iniciarSesion() {
    const proveedor = new GoogleAuthProvider();
    proveedor.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithPopup(auth, proveedor);
    } catch (error) {
      // Si el navegador bloquea la ventana emergente, se usa redirección
      if (error.code === "auth/popup-blocked" || error.code === "auth/operation-not-supported-in-this-environment") {
        await signInWithRedirect(auth, proveedor);
      } else if (error.code !== "auth/popup-closed-by-user" && error.code !== "auth/cancelled-popup-request") {
        throw error;
      }
    }
  },

  cerrarSesion() {
    return signOut(auth);
  },

  // ---------- jardín: usuarios/{uid}/jardin/{planta} ----------
  async listarJardin() {
    const consulta = query(
      collection(db, "usuarios", usuario.uid, "jardin"),
      orderBy("creado", "desc"),
      limit(80)
    );
    const resultado = await getDocs(consulta);
    return resultado.docs.map((d) => d.data());
  },

  guardarPlanta(item) {
    return setDoc(doc(db, "usuarios", usuario.uid, "jardin", idSeguro(item.id)), item);
  },

  borrarPlanta(id) {
    return deleteDoc(doc(db, "usuarios", usuario.uid, "jardin", idSeguro(id)));
  },

  // ---------- regalos ----------
  // regalos/{id}                     -> el sobre: para, de y fecha (lo ve cualquiera con el enlace)
  // regalos/{id}/privado/contenido   -> flores y mensaje (solo desde la fecha de apertura)
  async crearRegalo(regalo, aperturaMs) {
    for (let intento = 0; intento < 3; intento++) {
      const id = idCorto();
      const lote = writeBatch(db);
      lote.set(doc(db, "regalos", id), {
        para: regalo.para,
        de: regalo.de || "",
        fecha: regalo.fecha || "",
        apertura: Timestamp.fromMillis(aperturaMs),
        autor: usuario.uid,
        creado: serverTimestamp(),
      });
      lote.set(doc(db, "regalos", id, "privado", "contenido"), {
        flores: regalo.flores,
        papel: regalo.papel,
        lazo: regalo.lazo,
        semilla: regalo.semilla,
        mensaje: regalo.mensaje || "",
      });
      try {
        await lote.commit();
        return id;
      } catch (error) {
        // Si el id ya existía (casi imposible), las reglas lo rechazan: se prueba otro
        if (error.code !== "permission-denied" || intento === 2) throw error;
      }
    }
  },

  async leerSobre(id) {
    const sobre = await getDoc(doc(db, "regalos", id));
    if (!sobre.exists()) return null;
    const datos = sobre.data();
    return {
      para: datos.para,
      de: datos.de,
      fecha: datos.fecha,
      aperturaMs: datos.apertura.toMillis(),
    };
  },

  // Antes de la fecha, Firebase responde "permission-denied": el sello es real
  async leerContenido(id) {
    const contenido = await getDoc(doc(db, "regalos", id, "privado", "contenido"));
    return contenido.exists() ? contenido.data() : null;
  },
};

window.nube = nube;

onAuthStateChanged(auth, (u) => {
  usuario = u;
  window.dispatchEvent(new CustomEvent("sesion-cambio", { detail: u }));
});
