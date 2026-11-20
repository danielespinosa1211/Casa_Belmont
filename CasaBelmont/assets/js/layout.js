/* =========================================================
   CASA BELMONT - PLANTILLA COMÚN (layout.js)
   Reemplaza includes/header.php, includes/navbar.php e
   includes/footer.php. Se inserta en todas las páginas de la tienda.
   ========================================================= */

function crearEncabezado() {
    const b = base();
    const pagina = document.body.dataset.pagina || "";
    const sesion = Usuarios.sesion();
    const busqueda = parametro("buscar") || "";

    const enlaces = [
        { id: "inicio", texto: "Inicio", url: "index.html" },
        { id: "catalogo", texto: "Catálogo", url: "productos.html" },
        { id: "ofertas", texto: "Ofertas", url: "ofertas.html" },
        { id: "nosotros", texto: "Nosotros", url: "nosotros.html" },
        { id: "contacto", texto: "Contacto", url: "contacto.html" }
    ];

    const menu = enlaces.map((e) => `
        <li><a href="${b}${e.url}" class="${e.id === pagina ? "activo" : ""}">${e.texto}</a></li>
    `).join("");

    const usuario = sesion
        ? `<a href="${b}perfil.html" class="usuario-logueado" title="Mi perfil">
               <i class="fa-solid fa-user"></i><span>${escapar(sesion.nombre)}</span>
           </a>
           <a href="#" id="btn-salir" title="Cerrar sesión"><i class="fa-solid fa-right-from-bracket"></i></a>`
        : `<a href="${b}login.html" title="Iniciar sesión"><i class="fa-regular fa-user"></i></a>`;

    const header = document.createElement("header");
    header.className = "header";
    header.innerHTML = `
        <div class="contenedor nav">
            <a href="${b}index.html" class="logo">
                <img src="${b}assets/img/logo/logo.png" alt="Casa Belmont">
            </a>

            <button class="btn-menu" id="btn-menu" aria-label="Abrir menú" aria-expanded="false">
                <i class="fa-solid fa-bars"></i>
            </button>

            <div class="nav-desplegable" id="nav-desplegable">
                <nav class="menu"><ul>${menu}</ul></nav>

                <form action="${b}buscador.html" method="GET" class="buscador" role="search">
                    <input type="text" name="buscar" placeholder="Buscar productos..." value="${escapar(busqueda)}" required>
                    <button type="submit" aria-label="Buscar"><i class="fa-solid fa-magnifying-glass"></i></button>
                </form>
            </div>

            <div class="iconos">
                ${usuario}
                <a href="${b}carrito.html" title="Carrito">
                    <i class="fa-solid fa-cart-shopping"></i>
                    <span class="contador">0</span>
                </a>
            </div>
        </div>
    `;
    document.body.prepend(header);

    // Menú móvil
    const btnMenu = document.getElementById("btn-menu");
    const desplegable = document.getElementById("nav-desplegable");
    btnMenu.addEventListener("click", () => {
        const abierto = desplegable.classList.toggle("abierto");
        btnMenu.setAttribute("aria-expanded", abierto);
    });

    // Cerrar sesión (equivale a logout.php)
    const btnSalir = document.getElementById("btn-salir");
    if (btnSalir) {
        btnSalir.addEventListener("click", (e) => {
            e.preventDefault();
            Usuarios.cerrarSesion();
            window.location.href = b + "index.html";
        });
    }
}

function crearPie() {
    const footer = document.createElement("footer");
    footer.className = "footer";
    footer.innerHTML = `
        <div class="contenedor-footer">
            <p>&copy; ${new Date().getFullYear()} Casa Belmont. Todos los derechos reservados.</p>
        </div>
    `;
    document.body.append(footer);
}

/* Mensaje flotante (por ejemplo: "Producto agregado al carrito") */
function mostrarAviso(html) {
    let aviso = document.getElementById("aviso");
    if (!aviso) {
        aviso = document.createElement("div");
        aviso.id = "aviso";
        aviso.className = "aviso";
        aviso.setAttribute("role", "status");
        document.body.append(aviso);
    }
    aviso.innerHTML = html;
    aviso.classList.add("visible");
    clearTimeout(aviso._temporizador);
    aviso._temporizador = setTimeout(() => aviso.classList.remove("visible"), 3500);
}

/* Botones "Agregar al carrito" de cualquier página (equivale a carrito/agregar.php) */
document.addEventListener("click", (e) => {
    const boton = e.target.closest("[data-agregar]");
    if (!boton) return;
    e.preventDefault();
    if (Carrito.agregar(boton.dataset.agregar)) {
        mostrarAviso(`<i class="fa-solid fa-check"></i> Producto agregado. <a href="${base()}carrito.html">Ver carrito</a>`);
    }
});

if (!document.body.dataset.sinPlantilla) {
    crearEncabezado();
    crearPie();
}
actualizarContadorCarrito();
