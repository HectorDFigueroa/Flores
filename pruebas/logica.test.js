// =====================================================
//  Pruebas de la lógica (sin navegador)
// =====================================================
//
// Ejecutar con:  npm test      (o:  node --test pruebas/)
//
// Los scripts de la página son "clásicos" (no módulos), así que aquí se cargan
// dentro de un entorno parecido al navegador con vm, con lo mínimo de
// window y document para que no fallen.

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function cargarPagina() {
  const elementoFalso = { addEventListener() {}, append() {}, style: { setProperty() {} } };
  const contexto = vm.createContext({
    console,
    Math,
    Date,
    URL,
    URLSearchParams,
    TextEncoder,
    TextDecoder,
    btoa,
    atob,
    window: {
      matchMedia: () => ({ matches: false }),
      location: { search: "", href: "https://ejemplo.github.io/Flores/" },
      addEventListener() {},
    },
    document: { getElementById: () => elementoFalso, querySelector: () => null },
    navigator: {},
  });
  for (const archivo of ["datos.js", "temporadas.js", "ramo.js", "regalo.js", "pareja.js"]) {
    const codigo = fs.readFileSync(path.join(__dirname, "..", "js", archivo), "utf8");
    vm.runInContext(codigo, contexto, { filename: archivo });
  }
  // Las constantes y funciones de la página se leen desde el contexto
  return (expresion) => vm.runInContext(expresion, contexto);
}

const pagina = cargarPagina();
const flores = pagina("flores");
// Array.from crea el arreglo "de este lado" (los del vm son de otro mundo de JavaScript)
const nombresDe = (lista) => Array.from(lista, (f) => f.nombre);

test("normalizarNombre ignora mayúsculas, tildes y espacios de más", () => {
  assert.equal(pagina(`normalizarNombre("  HÉCTOR   Figueroa ")`), "hector figueroa");
});

test("hashTexto es estable y el orden de las letras importa", () => {
  assert.equal(pagina(`hashTexto("ana")`), pagina(`hashTexto("ana")`));
  assert.notEqual(pagina(`hashTexto("roma")`), pagina(`hashTexto("amor")`));
});

test("el ramo de un nombre nunca cambia (regresión)", () => {
  // Si esta prueba falla, ¡los ramos que la gente ya conoce cambiaron!
  const ana = pagina(`elegirFlores(hashTexto(normalizarNombre("Ana")))`);
  assert.deepEqual(nombresDe(ana), ["Gardenia", "Cerezo", "Violeta", "Crisantemo"]);
});

test("elegirFlores da 4 flores distintas y solo de las 20 clásicas", () => {
  for (const nombre of ["ana", "leo", "sofia", "hector", "x", "maria jose"]) {
    const ramo = pagina(`elegirFlores(hashTexto(${JSON.stringify(nombre)}))`);
    assert.equal(ramo.length, 4);
    assert.equal(new Set(nombresDe(ramo)).size, 4, `flores repetidas para ${nombre}`);
    for (const flor of ramo) {
      assert.ok(flores.indexOf(flor) < pagina("FLORES_CLASICAS"), `${flor.nombre} no es clásica`);
    }
  }
});

test("un regalo se codifica y decodifica igual (con emojis y tildes)", () => {
  const regalo = {
    para: "Sofía",
    de: "Héctor",
    flores: [18, 1, 20, 24],
    papel: 5,
    lazo: 4,
    mensaje: "Feliz Navidad 🎄\n¡Te quiero!",
    fecha: "2026-12-24",
    semilla: 123456789,
  };
  const codigo = pagina(`codificarRegalo(${JSON.stringify(regalo)})`);
  assert.match(codigo, /^[A-Za-z0-9_-]+$/, "el código debe ser seguro para una URL");
  const vuelta = pagina(`decodificarRegalo(${JSON.stringify(codigo)})`);
  // JSON: los objetos que vienen del vm son de "otro mundo" de JavaScript
  assert.deepEqual(JSON.parse(JSON.stringify(vuelta)), regalo);
});

test("un enlace de regalo dañado o manipulado se rechaza o se limpia", () => {
  assert.equal(pagina(`decodificarRegalo("esto-no-sirve")`), null);
  // flores fuera de rango, repetidas y mensaje gigante
  const malo = pagina(`aBase64Url(JSON.stringify({ p: "Ana", f: "zz0011", pa: 99, la: -1, m: "x".repeat(5000), s: "1" }))`);
  const limpio = pagina(`decodificarRegalo(${JSON.stringify(malo)})`);
  assert.deepEqual([...limpio.flores], [0, 1]);
  assert.equal(limpio.papel, 0);
  assert.equal(limpio.lazo, 0);
  assert.equal(limpio.mensaje.length, pagina("MAX_MENSAJE"));
  // sin "para" no hay regalo
  const sinPara = pagina(`aBase64Url(JSON.stringify({ f: "01" }))`);
  assert.equal(pagina(`decodificarRegalo(${JSON.stringify(sinPara)})`), null);
});

test("el ramo de dos nombres no depende del orden", () => {
  const a = pagina(`ramoDePareja("Hector", "Eva")`);
  const b = pagina(`ramoDePareja("eva", "HÉCTOR")`);
  assert.deepEqual(nombresDe(a.ramo), nombresDe(b.ramo));
  assert.equal(a.afinidad, b.afinidad);
  assert.equal(new Set(nombresDe(a.ramo)).size, 4);
  assert.ok(a.afinidad >= 62 && a.afinidad <= 100);
  assert.equal(pagina(`ramoDePareja("Ana", "ana")`).afinidad, 100);
});

test("las temporadas se activan en las fechas correctas", () => {
  const en = (mes, dia) => pagina(`(temporadaActual(new Date(2026, ${mes - 1}, ${dia})) || {}).id || null`);
  assert.equal(en(12, 1), "navidad");
  assert.equal(en(12, 25), "navidad");
  assert.equal(en(1, 3), "navidad");   // cruza el año nuevo
  assert.equal(en(1, 7), null);
  assert.equal(en(2, 14), "san-valentin");
  assert.equal(en(5, 10), "madres");
  assert.equal(en(9, 20), "amor-amistad");
  assert.equal(en(11, 17), null);
});

test("los ramos secretos se activan solo con sus nombres", () => {
  assert.equal(pagina(`buscarRamoSecreto("mami").id`), "mama");
  assert.equal(pagina(`buscarRamoSecreto("abuelito").id`), "abuelo");
  assert.equal(pagina(`buscarRamoSecreto("mariana")`), null);
  assert.equal(pagina(`buscarRamoSecreto("pablo")`), null);
});

test("los datos son coherentes: formas, papeles, lazos e índices", () => {
  const FORMAS = ["redonda", "punta", "girasol", "rosa", "pompon", "tulipan", "racimo", "loto", "orquidea", "cerezo"];
  const PAPELES = pagina("PAPELES");
  const LAZOS = pagina("LAZOS");
  const todas = [...flores, ...pagina("ramoEva"), ...pagina("RAMOS_SECRETOS").flatMap((s) => s.flores)];
  for (const flor of todas) {
    assert.ok(FORMAS.includes(flor.forma), `${flor.nombre}: forma "${flor.forma}" no existe`);
    assert.match(flor.color, /^#[0-9a-f]{6}$/i, `${flor.nombre}: color inválido`);
    assert.ok(flor.significado.length > 10, `${flor.nombre}: falta el significado`);
  }
  assert.ok(flores.length <= 36, "los enlaces guardan cada flor en 1 carácter base36: máximo 36 flores");
  for (const secreto of pagina("RAMOS_SECRETOS")) {
    assert.ok(PAPELES[secreto.papel] && LAZOS[secreto.lazo], `secreto ${secreto.id}: papel o lazo inexistente`);
  }
  for (const temporada of pagina("TEMPORADAS")) {
    assert.ok(temporada.ramo.flores.every((i) => flores[i]), `temporada ${temporada.id}: flor inexistente`);
    assert.ok(PAPELES[temporada.ramo.papel] && LAZOS[temporada.ramo.lazo], `temporada ${temporada.id}: papel o lazo inexistente`);
  }
});
