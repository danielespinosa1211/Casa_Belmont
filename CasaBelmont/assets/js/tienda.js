/* =========================================================
   CASA BELMONT - LÓGICA DE LA TIENDA (tienda.js)
   Cada página tiene <body data-pagina="..."> y aquí se ejecuta
   la función correspondiente (reemplaza el PHP de cada archivo).
   ========================================================= */

/* ---------- Tarjetas reutilizables ---------- */

// Tarjeta pequeña (productos destacados del inicio)
function tarjetaDestacado(p) {
    return `
        <article class="card-producto">
            <a href="detalle.html?id=${p.id}">
                <img src="${rutaImagen(p)}" alt="${escapar(p.nombre)}" loading="lazy">
            </a>
            <div class="info-producto">
                <h3>${escapar(p.nombre)}</h3>
                <p class="categoria">${escapar(p.categoria)}</p>
                <p class="precio">${formatoPrecio(p.precio)}</p>
                <div class="botones">
                    <a href="detalle.html?id=${p.id}" class="btn-ver">Ver más</a>
                    <a href="#" class="btn-carrito" data-agregar="${p.id}">Agregar</a>
                </div>
            </div>
        </article>`;
}

// Tarjeta grande (catálogo, búsqueda y ofertas)
function tarjetaCatalogo(p, { etiqueta, textoBoton = "Agregar al carrito", claseprecio = "" } = {}) {
    return `
        <article class="card-catalogo">
            <a href="detalle.html?id=${p.id}" class="imagen-catalogo">
                <img src="${rutaImagen(p)}" alt="${escapar(p.nombre)}" loading="lazy">
            </a>
            <div class="info-catalogo">
                <span class="etiqueta">${etiqueta || escapar(p.categoria)}</span>
                <h2><a href="detalle.html?id=${p.id}">${escapar(p.nombre)}</a></h2>
                <p>${escapar(p.descripcion)}</p>
                <h3 class="${claseprecio}">${formatoPrecio(p.precio)}</h3>
                <a href="#" class="btn-carrito" data-agregar="${p.id}">
                    <i class="fa-solid fa-cart-shopping"></i> ${textoBoton}
                </a>
            </div>
        </article>`;
}

function pintarLista(contenedor, productos, plantilla, mensajeVacio) {
    if (productos.length === 0) {
        contenedor.innerHTML = `<div class="vacio">${mensajeVacio}</div>`;
        return;
    }
    contenedor.innerHTML = productos.map(plantilla).join("");
}

/* ---------- Páginas ---------- */

const Paginas = {

    // index.php → productos destacados
    inicio() {
        const destacados = Productos.todos().filter((p) => p.destacado).slice(0, 8);
        pintarLista(
            document.getElementById("grid-destacados"),
            destacados,
            tarjetaDestacado,
            "Pronto tendremos productos destacados."
        );
    },

    // productos.php?categoria=...
    catalogo() {
        const categoria = parametro("categoria");
        let productos = Productos.recientes();
        if (categoria) {
            productos = productos.filter((p) => normalizar(p.categoria) === normalizar(categoria));
            document.getElementById("titulo-catalogo").textContent = categoria;
        }

        // Filtros por categoría
        const filtros = document.getElementById("filtros");
        const cats = Categorias.todas();
        filtros.innerHTML =
            `<a href="productos.html" class="${!categoria ? "activo" : ""}">Todos</a>` +
            cats.map((c) => `
                <a href="productos.html?categoria=${encodeURIComponent(c.nombre)}"
                   class="${normalizar(c.nombre) === normalizar(categoria) ? "activo" : ""}">${escapar(c.nombre)}</a>
            `).join("");

        pintarLista(
            document.getElementById("catalogo"),
            productos,
            (p) => tarjetaCatalogo(p),
            `No hay productos en esta categoría todavía. <a href="productos.html">Ver todo el catálogo</a>`
        );
    },

    // buscador.php?buscar=...
    buscador() {
        const buscar = parametro("buscar") || "";
        const termino = normalizar(buscar);
        const productos = Productos.todos().filter((p) =>
            !termino ||
            normalizar(p.nombre).includes(termino) ||
            normalizar(p.categoria).includes(termino) ||
            normalizar(p.descripcion).includes(termino)
        );

        document.getElementById("texto-busqueda").textContent = buscar
            ? `${productos.length} resultado(s) para "${buscar}"`
            : "Escribe en el buscador lo que necesitas.";

        pintarLista(
            document.getElementById("catalogo"),
            productos,
            (p) => tarjetaCatalogo(p),
            `No encontramos productos con "${escapar(buscar)}". Prueba con otra palabra o <a href="productos.html">mira el catálogo</a>.`
        );
    },

    // ofertas.php
    ofertas() {
        const productos = Productos.todos().filter((p) => p.oferta).sort((a, b) => b.id - a.id);
        pintarLista(
            document.getElementById("catalogo"),
            productos,
            (p) => tarjetaCatalogo(p, {
                etiqueta: `<i class="fa-solid fa-fire"></i> Oferta`,
                textoBoton: "Comprar ahora",
                claseprecio: "precio-oferta"
            }),
            "En este momento no hay ofertas activas."
        );
    },

    // detalle.php?id=...
    detalle() {
        const contenedor = document.getElementById("detalle");
        const producto = Productos.porId(parametro("id"));

        if (!producto) {
            contenedor.innerHTML = `<div class="vacio">Producto no encontrado. <a href="productos.html">Volver al catálogo</a></div>`;
            return;
        }

        document.title = `${producto.nombre} | Casa Belmont`;
        contenedor.innerHTML = `
            <div class="detalle-imagen">
                <img src="${rutaImagen(producto)}" alt="${escapar(producto.nombre)}">
            </div>
            <div class="detalle-info">
                <a href="productos.html?categoria=${encodeURIComponent(producto.categoria)}" class="etiqueta">${escapar(producto.categoria)}</a>
                <h1>${escapar(producto.nombre)}</h1>
                <h2 class="${producto.oferta ? "precio-oferta" : ""}">${formatoPrecio(producto.precio)}</h2>
                <p>${escapar(producto.descripcion)}</p>
                <a href="#" class="btn-ver" data-agregar="${producto.id}">
                    <i class="fa-solid fa-cart-shopping"></i> Agregar al carrito
                </a>
            </div>`;
    },

    // carrito/carrito.php + actualizar.php + eliminar.php
    carrito() {
        const contenedor = document.getElementById("contenido-carrito");

        const pintar = () => {
            const items = Carrito.items();

            if (items.length === 0) {
                contenedor.innerHTML = `
                    <div class="carrito-vacio">
                        <h2>Tu carrito está vacío</h2>
                        <p>Explora nuestro catálogo y encuentra el mueble ideal para tu hogar.</p>
                        <a href="productos.html" class="btn-seguir">Ver catálogo</a>
                    </div>`;
                return;
            }

            contenedor.innerHTML = items.map((item) => {
                const producto = Productos.porId(item.id);
                const imagen = producto ? rutaImagen(producto) : "assets/img/logo/logo.png";
                return `
                    <div class="card-carrito">
                        <div class="card-imagen"><img src="${imagen}" alt="${escapar(item.nombre)}"></div>
                        <div class="card-info">
                            <h2>${escapar(item.nombre)}</h2>
                            <p class="precio">${formatoPrecio(item.precio)}</p>
                            <div class="cantidad">
                                <label for="cant-${item.id}">Cantidad</label>
                                <input type="number" id="cant-${item.id}" min="1" max="99" value="${item.cantidad}" data-cantidad="${item.id}">
                            </div>
                            <p class="subtotal">Subtotal: <strong>${formatoPrecio(item.precio * item.cantidad)}</strong></p>
                        </div>
                        <button class="btn-eliminar-carrito" data-eliminar="${item.id}" title="Quitar del carrito" aria-label="Quitar ${escapar(item.nombre)}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>`;
            }).join("") + `
                <div class="resumen-compra">
                    <h2>Total: ${formatoPrecio(Carrito.total())}</h2>
                    <div class="botones-finales">
                        <a href="productos.html" class="btn-seguir">← Seguir comprando</a>
                        <a href="finalizar_compra.html" class="btn-finalizar">Finalizar compra</a>
                    </div>
                </div>`;
        };

        contenedor.addEventListener("change", (e) => {
            if (e.target.dataset.cantidad) {
                Carrito.actualizar(e.target.dataset.cantidad, e.target.value);
                pintar();
            }
        });

        contenedor.addEventListener("click", (e) => {
            const boton = e.target.closest("[data-eliminar]");
            if (boton) {
                Carrito.eliminar(boton.dataset.eliminar);
                pintar();
            }
        });

        pintar();
    },

    // carrito/finalizar_compra.php
    finalizar() {
        if (Carrito.items().length === 0) {
            window.location.replace("carrito.html");
            return;
        }

        const resumen = document.getElementById("resumen-pedido");
        resumen.innerHTML = Carrito.items().map((i) =>
            `<li><span>${i.cantidad} × ${escapar(i.nombre)}</span><strong>${formatoPrecio(i.precio * i.cantidad)}</strong></li>`
        ).join("") + `<li class="total"><span>Total</span><strong>${formatoPrecio(Carrito.total())}</strong></li>`;

        const form = document.getElementById("form-checkout");
        const sesion = Usuarios.sesion();
        if (sesion) {
            const usuario = Usuarios.todos().find((u) => u.id === sesion.id);
            if (usuario) {
                form.nombre.value = `${usuario.nombre} ${usuario.apellido}`.trim();
                form.telefono.value = usuario.telefono || "";
            }
        }

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const pedido = Pedidos.crear({
                nombre: form.nombre.value.trim(),
                telefono: form.telefono.value.trim(),
                direccion: form.direccion.value.trim()
            });
            if (pedido) window.location.href = `pedido_exitoso.html?id=${pedido.id}`;
        });
    },

    // pedido_exitoso.php
    exito() {
        const id = parametro("id");
        if (id) document.getElementById("numero-pedido").textContent = `Número de pedido: #${id}`;
    },

    // nosotros.php (solo HTML, no necesita lógica)
    nosotros() {},

    // contacto.php
    contacto() {
        const form = document.getElementById("form-contacto");
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            Mensajes.crear({
                nombre: form.nombre.value.trim(),
                correo: form.correo.value.trim(),
                telefono: form.telefono.value.trim(),
                mensaje: form.mensaje.value.trim()
            });
            form.reset();
            document.getElementById("mensaje-contacto").innerHTML =
                `<div class="mensaje-exito">Mensaje enviado. Te responderemos pronto.</div>`;
        });
    },

    // login.php
    login() {
        if (parametro("registro") === "ok") {
            document.getElementById("mensaje").innerHTML =
                `<div class="mensaje-exito">Cuenta creada. Ya puedes iniciar sesión.</div>`;
        }
        const form = document.getElementById("form-login");
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const r = Usuarios.iniciarSesion(form.correo.value.trim(), form.password.value);
            if (r.ok) {
                const volver = parametro("volver") || "";
                // Solo se permite volver a páginas de esta misma tienda
                window.location.href = /^[\w-]+\.html$/.test(volver) ? volver : "index.html";
            } else {
                document.getElementById("mensaje").innerHTML = `<div class="mensaje-error">${r.mensaje}</div>`;
            }
        });
    },

    // registro.php
    registro() {
        const form = document.getElementById("form-registro");
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const mensaje = document.getElementById("mensaje");
            if (form.password.value !== form.confirmar.value) {
                mensaje.innerHTML = `<div class="mensaje-error">Las contraseñas no coinciden.</div>`;
                return;
            }
            const r = Usuarios.registrar({
                nombre: form.nombre.value.trim(),
                apellido: form.apellido.value.trim(),
                correo: form.correo.value.trim(),
                telefono: form.telefono.value.trim(),
                password: form.password.value
            });
            if (r.ok) {
                window.location.href = "login.html?registro=ok";
            } else {
                mensaje.innerHTML = `<div class="mensaje-error">${r.mensaje}</div>`;
            }
        });
    },

    // perfil.php
    perfil() {
        const sesion = Usuarios.sesion();
        if (!sesion) {
            window.location.replace("login.html?volver=perfil.html");
            return;
        }
        document.getElementById("perfil-nombre").textContent = sesion.nombre;
        document.getElementById("perfil-correo").textContent = sesion.correo;
        document.getElementById("perfil-salir").addEventListener("click", (e) => {
            e.preventDefault();
            Usuarios.cerrarSesion();
            window.location.href = "index.html";
        });
    },

    // mis_pedidos (enlazado desde perfil.php)
    misPedidos() {
        const sesion = Usuarios.sesion();
        if (!sesion) {
            window.location.replace("login.html?volver=mis_pedidos.html");
            return;
        }
        const pedidos = Pedidos.todos().filter((p) => p.usuario_id === sesion.id).sort((a, b) => b.id - a.id);
        const contenedor = document.getElementById("lista-pedidos");

        if (pedidos.length === 0) {
            contenedor.innerHTML = `<div class="vacio">Aún no tienes pedidos. <a href="productos.html">Explora el catálogo</a></div>`;
            return;
        }

        contenedor.innerHTML = pedidos.map((p) => `
            <article class="card-pedido">
                <header>
                    <h2>Pedido #${p.id}</h2>
                    <span class="estado estado-${normalizar(p.estado)}">${p.estado}</span>
                </header>
                <p class="fecha">${formatoFecha(p.fecha)}</p>
                <ul>
                    ${p.detalle.map((d) => `<li><span>${d.cantidad} × ${escapar(d.nombre_producto)}</span><span>${formatoPrecio(d.precio * d.cantidad)}</span></li>`).join("")}
                </ul>
                <p class="total">Total: <strong>${formatoPrecio(p.total)}</strong></p>
            </article>
        `).join("");
    }
};

const paginaActual = document.body.dataset.pagina;
const mapaPaginas = {
    "inicio": "inicio", "catalogo": "catalogo", "buscador": "buscador", "ofertas": "ofertas",
    "detalle": "detalle", "carrito": "carrito", "finalizar": "finalizar", "exito": "exito",
    "nosotros": "nosotros", "contacto": "contacto", "login": "login", "registro": "registro",
    "perfil": "perfil", "mis-pedidos": "misPedidos"
};
if (mapaPaginas[paginaActual]) Paginas[mapaPaginas[paginaActual]]();
