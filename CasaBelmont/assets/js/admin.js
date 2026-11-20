/* =========================================================
   CASA BELMONT - PANEL DE ADMINISTRACIÓN (admin.js)
   Reemplaza todos los archivos de la carpeta admin/*.php
   ========================================================= */

const paginaAdmin = document.body.dataset.admin;

/* Proteger páginas: equivale a if(!isset($_SESSION['admin_id'])) */
if (paginaAdmin !== "login" && !Admin.sesion()) {
    window.location.replace("login.html");
}

/* ---------- Menú lateral común ---------- */
function crearSidebar() {
    const enlaces = [
        { id: "dashboard", icono: "fa-house", texto: "Dashboard", url: "dashboard.html" },
        { id: "productos", icono: "fa-box", texto: "Productos", url: "productos.html" },
        { id: "categorias", icono: "fa-folder-open", texto: "Categorías", url: "categorias.html" },
        { id: "pedidos", icono: "fa-cart-shopping", texto: "Pedidos", url: "pedidos.html" },
        { id: "mensajes", icono: "fa-envelope", texto: "Mensajes", url: "mensajes.html" },
        { id: "tienda", icono: "fa-store", texto: "Ver tienda", url: "../index.html" }
    ];
    const activo = document.body.dataset.menu || paginaAdmin;

    const aside = document.createElement("aside");
    aside.className = "sidebar";
    aside.innerHTML = `
        <h2>Casa Belmont</h2>
        <ul>
            ${enlaces.map((e) => `
                <li><a href="${e.url}" class="${e.id === activo ? "activo" : ""}">
                    <i class="fa-solid ${e.icono}"></i> ${e.texto}
                </a></li>`).join("")}
            <li><a href="#" id="admin-salir"><i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión</a></li>
        </ul>`;
    document.querySelector(".dashboard").prepend(aside);

    document.getElementById("admin-salir").addEventListener("click", (e) => {
        e.preventDefault();
        Admin.cerrarSesion();
        window.location.href = "login.html";
    });
}

/* Reduce la imagen antes de guardarla para no llenar el localStorage */
function comprimirImagen(archivo, anchoMax = 900, calidad = 0.8) {
    return new Promise((resolver, rechazar) => {
        const lector = new FileReader();
        lector.onload = () => {
            const img = new Image();
            img.onload = () => {
                const escala = Math.min(1, anchoMax / img.width);
                const canvas = document.createElement("canvas");
                canvas.width = Math.round(img.width * escala);
                canvas.height = Math.round(img.height * escala);
                const ctx = canvas.getContext("2d");
                ctx.fillStyle = "#fff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolver(canvas.toDataURL("image/jpeg", calidad));
            };
            img.onerror = rechazar;
            img.src = lector.result;
        };
        lector.onerror = rechazar;
        lector.readAsDataURL(archivo);
    });
}

const PaginasAdmin = {

    // admin/login.php
    login() {
        if (Admin.sesion()) {
            window.location.replace("dashboard.html");
            return;
        }
        const form = document.getElementById("form-login");
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const r = Admin.iniciarSesion(form.usuario.value, form.password.value);
            if (r.ok) {
                window.location.href = "dashboard.html";
            } else {
                document.getElementById("mensaje").innerHTML = `<div class="mensaje-error">${r.mensaje}</div>`;
            }
        });
    },

    // admin/dashboard.php
    dashboard() {
        const pedidos = Pedidos.todos();
        const ventas = pedidos
            .filter((p) => p.estado !== "Cancelado")
            .reduce((suma, p) => suma + p.total, 0);
        const pendientes = pedidos.filter((p) => p.estado === "Pendiente").length;

        document.getElementById("nombre-admin").textContent = Admin.sesion().nombre;
        document.getElementById("total-productos").textContent = Productos.todos().length;
        document.getElementById("total-pedidos").textContent = pedidos.length;
        document.getElementById("total-pendientes").textContent = pendientes;
        document.getElementById("total-ventas").textContent = formatoPrecio(ventas);

        document.getElementById("btn-restablecer").addEventListener("click", () => {
            if (confirm("Se borrarán productos, pedidos, usuarios y mensajes, y se cargarán los datos de ejemplo. ¿Continuar?")) {
                restablecerDatos();
                window.location.href = "login.html";
            }
        });
    },

    // admin/productos.php + eliminar_producto.php
    productos() {
        const cuerpo = document.getElementById("tabla-productos");

        const pintar = () => {
            const lista = Productos.todos().sort((a, b) => b.id - a.id);
            if (lista.length === 0) {
                cuerpo.innerHTML = `<tr><td colspan="8" class="tabla-vacia">No hay productos. Agrega el primero.</td></tr>`;
                return;
            }
            cuerpo.innerHTML = lista.map((p) => `
                <tr>
                    <td>${p.id}</td>
                    <td><img src="${rutaImagen(p)}" alt=""></td>
                    <td>${escapar(p.nombre)}</td>
                    <td>${escapar(p.categoria)}</td>
                    <td>${formatoPrecio(p.precio)}</td>
                    <td>${p.destacado ? "⭐ Sí" : "No"}</td>
                    <td>${p.oferta ? "🔥 Sí" : "No"}</td>
                    <td>
                        <a href="producto_form.html?id=${p.id}" class="btn-editar">Editar</a>
                        <button class="btn-eliminar" data-eliminar="${p.id}">Eliminar</button>
                    </td>
                </tr>`).join("");
        };

        cuerpo.addEventListener("click", (e) => {
            const boton = e.target.closest("[data-eliminar]");
            if (boton && confirm("¿Eliminar este producto?")) {
                Productos.guardarLista(Productos.todos().filter((p) => p.id !== Number(boton.dataset.eliminar)));
                pintar();
            }
        });

        pintar();
    },

    // admin/agregar_producto.php + editar_producto.php (un solo formulario)
    productoForm() {
        const id = parametro("id");
        const editando = id ? Productos.porId(id) : null;
        const form = document.getElementById("form-producto");
        const preview = document.getElementById("vista-previa");
        let imagenNueva = null;

        if (id && !editando) {
            document.querySelector(".contenido").innerHTML =
                `<h1>Producto no encontrado</h1><p><a href="productos.html" class="btn-agregar">← Volver a productos</a></p>`;
            return;
        }

        // Categorías desde la "tabla" categorias
        form.categoria.innerHTML = Categorias.todas()
            .map((c) => `<option value="${escapar(c.nombre)}">${escapar(c.nombre)}</option>`).join("");

        if (editando) {
            document.getElementById("titulo-form").textContent = "Editar Producto";
            document.getElementById("btn-guardar").textContent = "Actualizar Producto";
            form.nombre.value = editando.nombre;
            if (![...form.categoria.options].some((o) => o.value === editando.categoria)) {
                form.categoria.insertAdjacentHTML("beforeend",
                    `<option value="${escapar(editando.categoria)}">${escapar(editando.categoria)}</option>`);
            }
            form.categoria.value = editando.categoria;
            form.precio.value = editando.precio;
            form.descripcion.value = editando.descripcion;
            form.destacado.checked = !!editando.destacado;
            form.oferta.checked = !!editando.oferta;
            form.imagen.required = false;
            document.getElementById("label-imagen").textContent = "Cambiar imagen (opcional)";
            preview.src = rutaImagen(editando);
            preview.style.display = "block";
        }

        form.imagen.addEventListener("change", async () => {
            const archivo = form.imagen.files[0];
            if (!archivo) return;
            try {
                imagenNueva = await comprimirImagen(archivo);
                preview.src = imagenNueva;
                preview.style.display = "block";
            } catch (err) {
                alert("No se pudo leer la imagen. Prueba con un archivo JPG o PNG.");
                form.imagen.value = "";
            }
        });

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            if (!editando && !imagenNueva) {
                alert("Selecciona una imagen para el producto.");
                return;
            }
            const lista = Productos.todos();
            const datos = {
                nombre: form.nombre.value.trim(),
                categoria: form.categoria.value,
                precio: Number(form.precio.value),
                descripcion: form.descripcion.value.trim(),
                destacado: form.destacado.checked ? 1 : 0,
                oferta: form.oferta.checked ? 1 : 0
            };

            if (editando) {
                const producto = lista.find((p) => p.id === editando.id);
                Object.assign(producto, datos);
                if (imagenNueva) producto.imagen = imagenNueva;
            } else {
                lista.push({ id: siguienteId(lista), ...datos, imagen: imagenNueva, fecha: new Date().toISOString() });
            }

            if (Productos.guardarLista(lista)) window.location.href = "productos.html";
        });
    },

    // admin/categorias.php + agregar / editar / eliminar_categoria.php
    categorias() {
        const cuerpo = document.getElementById("tabla-categorias");
        const formNueva = document.getElementById("form-categoria");
        let editandoId = null;

        const pintar = () => {
            const lista = Categorias.todas();
            const productos = Productos.todos();
            if (lista.length === 0) {
                cuerpo.innerHTML = `<tr><td colspan="4" class="tabla-vacia">No hay categorías.</td></tr>`;
                return;
            }
            cuerpo.innerHTML = lista.map((c) => {
                const cantidad = productos.filter((p) => p.categoria === c.nombre).length;
                if (c.id === editandoId) {
                    return `
                        <tr>
                            <td>${c.id}</td>
                            <td><input type="text" id="editar-nombre" value="${escapar(c.nombre)}" aria-label="Nuevo nombre"></td>
                            <td>${cantidad}</td>
                            <td>
                                <button class="btn-agregar" data-accion="actualizar" data-id="${c.id}">Actualizar</button>
                                <button class="btn-secundario" data-accion="cancelar">Cancelar</button>
                            </td>
                        </tr>`;
                }
                return `
                    <tr>
                        <td>${c.id}</td>
                        <td>${escapar(c.nombre)}</td>
                        <td>${cantidad}</td>
                        <td>
                            <button class="btn-editar" data-accion="editar" data-id="${c.id}">Editar</button>
                            <button class="btn-eliminar" data-accion="eliminar" data-id="${c.id}">Eliminar</button>
                        </td>
                    </tr>`;
            }).join("");

            const input = document.getElementById("editar-nombre");
            if (input) input.focus();
        };

        formNueva.addEventListener("submit", (e) => {
            e.preventDefault();
            const nombre = formNueva.nombre.value.trim();
            const lista = Categorias.todas();
            if (lista.some((c) => normalizar(c.nombre) === normalizar(nombre))) {
                alert("Esa categoría ya existe.");
                return;
            }
            lista.push({ id: siguienteId(lista), nombre });
            Categorias.guardarLista(lista);
            formNueva.reset();
            pintar();
        });

        cuerpo.addEventListener("click", (e) => {
            const boton = e.target.closest("[data-accion]");
            if (!boton) return;
            const id = Number(boton.dataset.id);
            const lista = Categorias.todas();

            if (boton.dataset.accion === "editar") {
                editandoId = id;
            } else if (boton.dataset.accion === "cancelar") {
                editandoId = null;
            } else if (boton.dataset.accion === "actualizar") {
                const nuevo = document.getElementById("editar-nombre").value.trim();
                const categoria = lista.find((c) => c.id === id);
                if (nuevo && categoria) {
                    // También se actualizan los productos que usaban el nombre anterior
                    const productos = Productos.todos();
                    productos.forEach((p) => { if (p.categoria === categoria.nombre) p.categoria = nuevo; });
                    Productos.guardarLista(productos);
                    categoria.nombre = nuevo;
                    Categorias.guardarLista(lista);
                }
                editandoId = null;
            } else if (boton.dataset.accion === "eliminar") {
                const categoria = lista.find((c) => c.id === id);
                const enUso = Productos.todos().filter((p) => p.categoria === categoria.nombre).length;
                const aviso = enUso
                    ? `La categoría "${categoria.nombre}" tiene ${enUso} producto(s). Los productos no se borran, pero quedarán con esa categoría. ¿Eliminar de todas formas?`
                    : "¿Eliminar categoría?";
                if (!confirm(aviso)) return;
                Categorias.guardarLista(lista.filter((c) => c.id !== id));
            }
            pintar();
        });

        cuerpo.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && e.target.id === "editar-nombre") {
                cuerpo.querySelector('[data-accion="actualizar"]').click();
            }
        });

        pintar();
    },

    // admin/pedidos.php + actualizar_estado.php
    pedidos() {
        const cuerpo = document.getElementById("tabla-pedidos");
        const lista = Pedidos.todos().sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        if (lista.length === 0) {
            cuerpo.innerHTML = `<tr><td colspan="8" class="tabla-vacia">Todavía no hay pedidos.</td></tr>`;
            return;
        }

        cuerpo.innerHTML = lista.map((p) => `
            <tr>
                <td>${p.id}</td>
                <td>${escapar(p.nombre_cliente)}</td>
                <td>${escapar(p.telefono)}</td>
                <td>${escapar(p.direccion)}</td>
                <td>${formatoPrecio(p.total)}</td>
                <td>
                    <select data-estado="${p.id}" aria-label="Estado del pedido ${p.id}">
                        ${ESTADOS_PEDIDO.map((e) => `<option ${e === p.estado ? "selected" : ""}>${e}</option>`).join("")}
                    </select>
                    <button class="btn-editar" data-guardar="${p.id}">Guardar</button>
                </td>
                <td>${formatoFecha(p.fecha)}</td>
                <td><a href="detalle_pedido.html?id=${p.id}" class="btn-editar">Ver pedido</a></td>
            </tr>`).join("");

        cuerpo.addEventListener("click", (e) => {
            const boton = e.target.closest("[data-guardar]");
            if (!boton) return;
            const id = boton.dataset.guardar;
            const select = cuerpo.querySelector(`[data-estado="${id}"]`);
            Pedidos.cambiarEstado(id, select.value);
            boton.textContent = "✓ Guardado";
            setTimeout(() => { boton.textContent = "Guardar"; }, 1500);
        });
    },

    // admin/detalle_pedido.php
    detallePedido() {
        const pedido = Pedidos.porId(parametro("id"));
        const contenedor = document.getElementById("detalle-pedido");

        if (!pedido) {
            contenedor.innerHTML = `<h1>Pedido no encontrado</h1><br><a href="pedidos.html" class="btn-agregar">← Volver a pedidos</a>`;
            return;
        }

        contenedor.innerHTML = `
            <h1><i class="fa-solid fa-file-lines"></i> Pedido #${pedido.id}</h1>
            <br>
            <div class="card-dashboard">
                <h2>Datos del cliente</h2>
                <p><strong>Nombre:</strong> ${escapar(pedido.nombre_cliente)}</p>
                <p><strong>Teléfono:</strong> ${escapar(pedido.telefono)}</p>
                <p><strong>Dirección:</strong> ${escapar(pedido.direccion)}</p>
                <p><strong>Fecha:</strong> ${formatoFecha(pedido.fecha)}</p>
                <p><strong>Estado:</strong> <span class="estado estado-${normalizar(pedido.estado)}">${pedido.estado}</span></p>
                <p><strong>Total:</strong> ${formatoPrecio(pedido.total)}</p>
            </div>
            <br><br>
            <h2>Productos comprados</h2>
            <br>
            <div class="tabla-contenedor">
                <table class="tabla-admin">
                    <thead>
                        <tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr>
                    </thead>
                    <tbody>
                        ${pedido.detalle.map((d) => `
                            <tr>
                                <td>${escapar(d.nombre_producto)}</td>
                                <td>${d.cantidad}</td>
                                <td>${formatoPrecio(d.precio)}</td>
                                <td>${formatoPrecio(d.precio * d.cantidad)}</td>
                            </tr>`).join("")}
                    </tbody>
                </table>
            </div>
            <br>
            <a href="pedidos.html" class="btn-agregar">← Volver a pedidos</a>`;
    },

    // Mensajes enviados desde contacto.html
    mensajes() {
        const cuerpo = document.getElementById("tabla-mensajes");
        const lista = Mensajes.todos().sort((a, b) => b.id - a.id);
        if (lista.length === 0) {
            cuerpo.innerHTML = `<tr><td colspan="5" class="tabla-vacia">No hay mensajes.</td></tr>`;
            return;
        }
        cuerpo.innerHTML = lista.map((m) => `
            <tr>
                <td>${formatoFecha(m.fecha)}</td>
                <td>${escapar(m.nombre)}</td>
                <td>${escapar(m.correo)}</td>
                <td>${escapar(m.telefono)}</td>
                <td style="text-align:left; white-space:normal">${escapar(m.mensaje)}</td>
            </tr>`).join("");
    }
};

if (paginaAdmin !== "login" && Admin.sesion()) {
    crearSidebar();
}

const mapaAdmin = {
    "login": "login", "dashboard": "dashboard", "productos": "productos",
    "producto-form": "productoForm", "categorias": "categorias", "pedidos": "pedidos",
    "detalle-pedido": "detallePedido", "mensajes": "mensajes"
};
if (mapaAdmin[paginaAdmin] && (paginaAdmin === "login" || Admin.sesion())) {
    PaginasAdmin[mapaAdmin[paginaAdmin]]();
}
