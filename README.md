[README.md](https://github.com/user-attachments/files/35117969/README.md)
# Casa_Belmont

Página web desarrollada para Casa Belmont, ubicada en Pachaquiaro.

## Problemática de la comunidad
La dificultad para encontrar muebles que combinen calidad, comodidad, diseño y precios accesibles.

## Tecnologías usadas
- HTML5
- CSS3
- JavaScript (sin librerías ni frameworks)
- `localStorage` del navegador como base de datos

No necesita XAMPP, PHP ni MySQL. Basta con abrir `CasaBelmont/index.html` en el navegador
o publicar la carpeta en GitHub Pages.

## Cómo ejecutarlo
1. Abrir `CasaBelmont/index.html` con doble clic (Chrome, Edge o Firefox).
2. Panel de administración: `CasaBelmont/admin/login.html`
   - Usuario: `admin`
   - Contraseña: `admin123`
3. Para volver a los datos de ejemplo: Dashboard → **Restablecer datos**.

## Publicar en GitHub Pages
1. Subir el repositorio a GitHub.
2. Settings → Pages → Branch `main` → carpeta `/ (root)`.
3. La tienda queda en `https://github.com/danielespinosa1211/Casa_Belmont.git`

## Estructura
```
CasaBelmont/
├── index.html            Inicio (banner, beneficios, categorías, destacados)
├── productos.html        Catálogo (filtra con ?categoria=Sala)
├── detalle.html          Detalle de producto (?id=1)
├── buscador.html         Resultados de búsqueda (?buscar=cama)
├── ofertas.html          Productos en oferta
├── nosotros.html         Quiénes somos, misión, visión y valores
├── contacto.html         Formulario de contacto
├── login.html            Inicio de sesión de clientes
├── registro.html         Registro de clientes
├── perfil.html           Perfil del cliente
├── mis_pedidos.html      Pedidos del cliente
├── carrito.html          Carrito de compras
├── finalizar_compra.html Datos de entrega
├── pedido_exitoso.html   Confirmación
├── admin/
│   ├── login.html          Ingreso del administrador
│   ├── dashboard.html      Resumen (productos, pedidos, ventas)
│   ├── productos.html      Lista, edición y eliminación de productos
│   ├── producto_form.html  Agregar / editar producto
│   ├── categorias.html     Agregar, editar y eliminar categorías
│   ├── pedidos.html        Lista de pedidos y cambio de estado
│   ├── detalle_pedido.html Detalle de un pedido
│   └── mensajes.html       Mensajes enviados desde Contacto
└── assets/
    ├── css/estilos.css   Estilos de la tienda
    ├── css/admin.css     Estilos del panel
    ├── js/db.js          "Base de datos" (reemplaza MySQL y conexion.php)
    ├── js/layout.js      Encabezado, menú y pie (reemplaza includes/*.php)
    ├── js/tienda.js      Lógica de las páginas de la tienda
    ├── js/admin.js       Lógica del panel de administración
    └── img/              Imágenes optimizadas (de 29 MB a 1,6 MB)
```

## Equivalencias PHP → JavaScript
| Antes (PHP / MySQL)                  | Ahora (HTML / JS)                          |
|--------------------------------------|--------------------------------------------|
| `config/conexion.php` + MySQL        | `db.js` con `localStorage`                 |
| `include("includes/header.php")`     | `layout.js` inserta encabezado y pie       |
| `$_GET['id']`                        | `parametro("id")`                          |
| `$_SESSION['carrito']`               | `Carrito` (guardado en `localStorage`)     |
| `$_SESSION['usuario_id']`            | `Usuarios.sesion()`                        |
| `$_SESSION['admin_id']`              | `Admin.sesion()` (`sessionStorage`)        |
| `number_format($p, 0, ",", ".")`     | `formatoPrecio(p)`                         |
| `password_hash` / `password_verify`  | `hashTexto()`                              |
| `move_uploaded_file()`               | `comprimirImagen()` guarda la imagen como texto |
| `while($fila = mysqli_fetch_assoc())`| `lista.map(...)` + `innerHTML`             |

## Limitaciones (importante)
Al no tener servidor, los datos viven **solo en el navegador de cada persona**:
los productos que cree el administrador en un computador no aparecen en otro, y
los pedidos de un cliente solo los ve el administrador si usa el mismo navegador.
Las contraseñas no tienen seguridad real (cualquiera puede ver el código).
Es ideal para presentar y demostrar el proyecto; para una tienda real se necesita
un servidor (PHP, Node.js, Firebase, etc.).

## Integrantes
- Ana Lucia Sanchez Barreiro - creativa
- Daniel Santiago Espinosa Orozco - líder

## Institución
Media Técnica en Desarrollo de Software - Grado 11 - Año 2026
