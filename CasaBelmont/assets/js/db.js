/* =========================================================
   CASA BELMONT - CAPA DE DATOS (db.js)
   Reemplaza a MySQL + config/conexion.php.
   Todo se guarda en el navegador con localStorage.
   ========================================================= */

const CLAVES = {
    productos: "cb_productos",
    categorias: "cb_categorias",
    usuarios: "cb_usuarios",
    administradores: "cb_administradores",
    pedidos: "cb_pedidos",
    mensajes: "cb_mensajes",
    carrito: "cb_carrito",
    sesion: "cb_sesion",            // cliente (equivale a $_SESSION["usuario_id"])
    sesionAdmin: "cb_sesion_admin"  // administrador (equivale a $_SESSION["admin_id"])
};

/* ---------- Utilidades básicas ---------- */

function leer(clave, porDefecto) {
    try {
        const valor = localStorage.getItem(clave);
        return valor === null ? porDefecto : JSON.parse(valor);
    } catch (e) {
        return porDefecto;
    }
}

function guardar(clave, valor) {
    try {
        localStorage.setItem(clave, JSON.stringify(valor));
        return true;
    } catch (e) {
        alert("No hay espacio suficiente en el navegador para guardar los datos. Prueba con una imagen más liviana.");
        return false;
    }
}

function siguienteId(lista) {
    return lista.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

/* Equivale a number_format($precio, 0, ",", ".") */
function formatoPrecio(numero) {
    const entero = Math.round(Number(numero) || 0).toString();
    return "$" + entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/* Evita que textos escritos por usuarios se ejecuten como HTML */
function escapar(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/* Quita tildes y mayúsculas para comparar textos (búsquedas) */
function normalizar(texto) {
    return String(texto ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/* Lee un parámetro de la URL: equivale a $_GET['nombre'] */
function parametro(nombre) {
    return new URLSearchParams(window.location.search).get(nombre);
}

/* Fecha legible: 15/10/2026 14:30 */
function formatoFecha(iso) {
    const f = new Date(iso);
    if (isNaN(f)) return "";
    const dos = (n) => String(n).padStart(2, "0");
    return `${dos(f.getDate())}/${dos(f.getMonth() + 1)}/${f.getFullYear()} ${dos(f.getHours())}:${dos(f.getMinutes())}`;
}

/* Hash sencillo para no guardar contraseñas en texto plano.
   OJO: en un sitio sin servidor esto NO es seguridad real,
   solo evita que la contraseña se lea a simple vista. */
function hashTexto(texto) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < texto.length; i++) {
        const c = texto.charCodeAt(i);
        h1 = Math.imul(h1 ^ c, 2654435761);
        h2 = Math.imul(h2 ^ c, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}

/* Ruta base: "" en la raíz y "../" dentro de /admin */
function base() {
    return document.body.dataset.base || "";
}

/* Las imágenes de ejemplo son nombres de archivo; las que sube el
   administrador se guardan como texto (data URL). */
function rutaImagen(producto) {
    const img = producto.imagen || "";
    if (img.startsWith("data:")) return img;
    return base() + "assets/img/productos/" + img;
}

/* ---------- Datos iniciales (equivale al .sql de la base de datos) ---------- */

const DATOS_INICIALES = {
    categorias: [
        { id: 1, nombre: "Sala" },
        { id: 2, nombre: "Comedor" },
        { id: 3, nombre: "Habitación" },
        { id: 4, nombre: "Oficina" }
    ],
    productos: [
        {
            id: 1, nombre: "Sofá Chesterfield en cuero", categoria: "Sala", precio: 3200000,
            descripcion: "Sofá de tres puestos tapizado en cuero sintético negro con capitoneado clásico, brazos enrollados y patas de madera torneada.",
            imagen: "sofa-chesterfield.jpg", destacado: 1, oferta: 1, fecha: "2026-09-20T10:00:00"
        },
        {
            id: 2, nombre: "Comedor rústico de seis puestos", categoria: "Comedor", precio: 2450000,
            descripcion: "Mesa en madera maciza con acabado natural y seis sillas blancas de espaldar tallado. Ideal para reuniones familiares.",
            imagen: "comedor-rustico.jpg", destacado: 1, oferta: 0, fecha: "2026-09-19T10:00:00"
        },
        {
            id: 3, nombre: "Cama doble en madera", categoria: "Habitación", precio: 1890000,
            descripcion: "Cama doble con cabecero y piecero en madera oscura, estructura reforzada y acabado mate resistente.",
            imagen: "cama-madera.jpg", destacado: 1, oferta: 1, fecha: "2026-09-18T10:00:00"
        },
        {
            id: 4, nombre: "Escritorio ejecutivo", categoria: "Oficina", precio: 1650000,
            descripcion: "Escritorio amplio en madera con cajonera lateral. Perfecto para estudio o trabajo en casa.",
            imagen: "escritorio-ejecutivo.jpg", destacado: 1, oferta: 0, fecha: "2026-09-17T10:00:00"
        },
        {
            id: 5, nombre: "Cama imperial capitoneada", categoria: "Habitación", precio: 4100000,
            descripcion: "Cama king con cabecero capitoneado y detalles tallados en tono marfil. Elegancia clásica para tu habitación.",
            imagen: "cama-imperial.jpg", destacado: 0, oferta: 1, fecha: "2026-09-16T10:00:00"
        }
    ],
    administradores: [
        // Mismo administrador que creaba crear_admin.php → usuario: admin / contraseña: admin123
        { id: 1, nombre: "Administrador", usuario: "admin", password: hashTexto("admin123") }
    ]
};

function inicializarDatos() {
    if (leer(CLAVES.productos, null) === null) guardar(CLAVES.productos, DATOS_INICIALES.productos);
    if (leer(CLAVES.categorias, null) === null) guardar(CLAVES.categorias, DATOS_INICIALES.categorias);
    if (leer(CLAVES.administradores, null) === null) guardar(CLAVES.administradores, DATOS_INICIALES.administradores);
    if (leer(CLAVES.usuarios, null) === null) guardar(CLAVES.usuarios, []);
    if (leer(CLAVES.pedidos, null) === null) guardar(CLAVES.pedidos, []);
}

function restablecerDatos() {
    Object.values(CLAVES).forEach((clave) => localStorage.removeItem(clave));
    inicializarDatos();
}

inicializarDatos();

/* ---------- Productos ---------- */

const Productos = {
    todos() { return leer(CLAVES.productos, []); },
    porId(id) { return this.todos().find((p) => p.id === Number(id)) || null; },
    guardarLista(lista) { return guardar(CLAVES.productos, lista); },
    recientes() { return this.todos().sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); }
};

/* ---------- Categorías ---------- */

const Categorias = {
    todas() { return leer(CLAVES.categorias, []); },
    guardarLista(lista) { return guardar(CLAVES.categorias, lista); }
};

/* ---------- Carrito (equivale a $_SESSION['carrito']) ---------- */

const Carrito = {
    items() { return leer(CLAVES.carrito, []); },
    guardarItems(items) { guardar(CLAVES.carrito, items); actualizarContadorCarrito(); },

    agregar(id) {
        const producto = Productos.porId(id);
        if (!producto) return false;
        const items = this.items();
        const existente = items.find((i) => i.id === producto.id);
        if (existente) {
            existente.cantidad++;
        } else {
            items.push({ id: producto.id, nombre: producto.nombre, precio: producto.precio, cantidad: 1 });
        }
        this.guardarItems(items);
        return true;
    },

    actualizar(id, cantidad) {
        cantidad = Math.max(1, Math.min(99, parseInt(cantidad) || 1));
        const items = this.items();
        const item = items.find((i) => i.id === Number(id));
        if (item) item.cantidad = cantidad;
        this.guardarItems(items);
    },

    eliminar(id) {
        this.guardarItems(this.items().filter((i) => i.id !== Number(id)));
    },

    vaciar() { this.guardarItems([]); },

    cantidadTotal() { return this.items().reduce((s, i) => s + i.cantidad, 0); },

    total() { return this.items().reduce((s, i) => s + i.precio * i.cantidad, 0); }
};

/* ---------- Usuarios y sesión del cliente ---------- */

const Usuarios = {
    todos() { return leer(CLAVES.usuarios, []); },

    registrar({ nombre, apellido, correo, telefono, password }) {
        const lista = this.todos();
        if (lista.some((u) => u.correo.toLowerCase() === correo.toLowerCase())) {
            return { ok: false, mensaje: "El correo ya está registrado." };
        }
        lista.push({ id: siguienteId(lista), nombre, apellido, correo, telefono, password: hashTexto(password) });
        guardar(CLAVES.usuarios, lista);
        return { ok: true };
    },

    iniciarSesion(correo, password) {
        const usuario = this.todos().find((u) => u.correo.toLowerCase() === correo.toLowerCase());
        if (!usuario) return { ok: false, mensaje: "El correo no está registrado." };
        if (usuario.password !== hashTexto(password)) return { ok: false, mensaje: "Contraseña incorrecta." };
        guardar(CLAVES.sesion, { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo });
        return { ok: true };
    },

    sesion() { return leer(CLAVES.sesion, null); },

    cerrarSesion() { localStorage.removeItem(CLAVES.sesion); }
};

/* ---------- Administradores ---------- */

const Admin = {
    iniciarSesion(usuario, password) {
        const admin = leer(CLAVES.administradores, []).find((a) => a.usuario === usuario.trim());
        if (!admin) return { ok: false, mensaje: "El usuario no existe." };
        if (admin.password !== hashTexto(password)) return { ok: false, mensaje: "Contraseña incorrecta." };
        sessionStorage.setItem(CLAVES.sesionAdmin, JSON.stringify({ id: admin.id, nombre: admin.nombre }));
        return { ok: true };
    },
    sesion() {
        try { return JSON.parse(sessionStorage.getItem(CLAVES.sesionAdmin)); } catch (e) { return null; }
    },
    cerrarSesion() { sessionStorage.removeItem(CLAVES.sesionAdmin); }
};

/* ---------- Pedidos (tablas pedidos + detalle_pedidos) ---------- */

const ESTADOS_PEDIDO = ["Pendiente", "Confirmado", "Enviado", "Entregado", "Cancelado"];

const Pedidos = {
    todos() { return leer(CLAVES.pedidos, []); },
    porId(id) { return this.todos().find((p) => p.id === Number(id)) || null; },

    crear({ nombre, telefono, direccion }) {
        const items = Carrito.items();
        if (items.length === 0) return null;
        const lista = this.todos();
        const sesion = Usuarios.sesion();
        const pedido = {
            id: siguienteId(lista),
            usuario_id: sesion ? sesion.id : null,
            nombre_cliente: nombre,
            telefono,
            direccion,
            total: Carrito.total(),
            estado: "Pendiente",
            fecha: new Date().toISOString(),
            detalle: items.map((i) => ({
                producto_id: i.id,
                nombre_producto: i.nombre,
                cantidad: i.cantidad,
                precio: i.precio
            }))
        };
        lista.push(pedido);
        guardar(CLAVES.pedidos, lista);
        Carrito.vaciar();
        return pedido;
    },

    cambiarEstado(id, estado) {
        const lista = this.todos();
        const pedido = lista.find((p) => p.id === Number(id));
        if (pedido && ESTADOS_PEDIDO.includes(estado)) {
            pedido.estado = estado;
            guardar(CLAVES.pedidos, lista);
        }
    }
};

/* ---------- Mensajes de contacto ---------- */

const Mensajes = {
    todos() { return leer(CLAVES.mensajes, []); },
    crear(datos) {
        const lista = this.todos();
        lista.push({ id: siguienteId(lista), ...datos, fecha: new Date().toISOString() });
        guardar(CLAVES.mensajes, lista);
    }
};

/* Se define aquí para que Carrito pueda llamarla; layout.js la completa */
function actualizarContadorCarrito() {
    document.querySelectorAll(".contador").forEach((el) => {
        el.textContent = Carrito.cantidadTotal();
    });
}
