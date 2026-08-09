# AFD Notebooks — sitio + panel de stock

Este repo tiene el sitio (mismo diseño que ya tenías) reorganizado para que el
stock se pueda editar **sin tocar código**, desde un panel web.

## Estructura

```
index.html          → el sitio público (no lo tenés que editar para cambiar stock)
admin.html           → panel para cargar/editar/borrar notebooks (uso interno)
assets/style.css     → todo el diseño del sitio (colores, tipografía, layout)
assets/catalog.js    → arma el catálogo leyendo data/productos.json
assets/theme.js      → tema oscuro/claro, menú mobile, formulario de contacto
assets/admin.js      → lógica del panel (habla con la API de GitHub)
assets/admin.css     → estilos del panel
data/productos.json  → EL STOCK. Acá vive cada notebook + el WhatsApp/Instagram
images/               → fotos que subís desde el panel caen acá
```

## Publicar el sitio (GitHub Pages)

1. Subí esta carpeta a un repositorio de GitHub (puede ser público o privado).
2. En el repo: **Settings → Pages → Build and deployment → Source: Deploy from
   a branch**, elegí la rama (`main`) y carpeta `/ (root)`.
3. En un par de minutos el sitio va a estar en
   `https://tu-usuario.github.io/tu-repo/`.

Cada vez que el panel guarda un cambio, hace un commit al repo y GitHub Pages
vuelve a publicar el sitio solo (tarda uno o dos minutos en verse reflejado).

## Cómo editar el stock

### Opción A — Panel visual (`admin.html`)

Es una página aparte, pensada para uso interno (no está linkeada desde el
sitio público). La abrís así: `https://tu-usuario.github.io/tu-repo/admin.html`

La primera vez te va a pedir conectarte a GitHub:

- **Usuario/organización** y **repositorio**: los de este repo.
- **Rama**: `main` (o la que hayas usado en Pages).
- **Token**: ver instrucciones abajo.
- Las rutas de `data/productos.json` y `images/` ya vienen con los valores
  correctos, no hace falta tocarlas.

Con eso conectado podés:

- Agregar, editar o eliminar notebooks (marca, modelo, specs, precio, estado,
  garantía, etiquetas).
- Subir una foto directamente desde tu computadora (se guarda en `images/` y
  queda enlazada automáticamente), o pegar una URL de imagen externa.
- Cambiar el número de WhatsApp y el usuario de Instagram del sitio entero
  desde un solo lugar (afecta todos los botones del sitio, no solo el
  catálogo).

Cada guardado hace un commit al repo. El sitio se actualiza solo, en 1-2
minutos.

#### Cómo generar el token de GitHub (Personal Access Token)

1. Andá a **github.com → foto de perfil → Settings → Developer settings →
   Personal access tokens → Fine-grained tokens → Generate new token**.
2. En **Repository access**, elegí "Only select repositories" y seleccioná
   este repositorio (no le des acceso a toda tu cuenta).
3. En **Permissions → Repository permissions**, buscá "Contents" y ponelo en
   **Read and write**. El resto podés dejarlo como está.
4. Generá el token y copialo — **empieza con `github_pat_`**. GitHub solo te
   lo muestra una vez.
5. Pegalo en el panel cuando te lo pida.

**Importante sobre seguridad**: el token queda guardado únicamente en el
navegador donde lo cargaste (en `localStorage`, nunca se sube a ningún lado ni
se le manda a nadie). Por eso:

- Usá el panel solo en dispositivos de confianza (tu compu o celular, no en
  una compu compartida o de un cyber).
- Si alguna vez sospechás que el token se filtró, andá a GitHub y **revocalo**
  desde la misma pantalla donde lo generaste, y creá uno nuevo.
- Ponele una fecha de expiración razonable al generarlo (por ejemplo 1 año) y
  generá uno nuevo cuando venza.

### Opción B — Editar el archivo directamente

Si en algún momento preferís no usar el panel, podés editar
`data/productos.json` a mano desde GitHub (ícono de lápiz en la página del
archivo, en github.com) o desde tu computadora. Es un JSON con esta forma:

```json
{
  "config": {
    "waNumber": "5493511234567",
    "instagram": "afd.notebooks"
  },
  "productos": [
    {
      "id": 1,
      "modelo": "ThinkPad E14 Gen 3",
      "marca": "Lenovo",
      "procesador": "AMD Ryzen 5 5500U",
      "ram": "16 GB DDR4",
      "almacenamiento": "512 GB SSD",
      "pantalla": "14\" FHD IPS",
      "estado": "Excelente",
      "precio": 320000,
      "garantia": "3 meses",
      "badges": ["recomendada"],
      "color": "#f07020",
      "imagenURL": ""
    }
  ]
}
```

- `badges` acepta: `"recomendada"`, `"oferta"`, `"gaming"` (podés combinar o
  dejarlo vacío `[]`).
- `imagenURL` vacío = se muestra un ícono de color de respaldo (usando
  `color`). Con una URL de imagen, se muestra la foto.
- `id` tiene que ser único entre todos los productos.

## Cambiar el diseño

Todo el diseño visual vive en `assets/style.css`. Es exactamente el mismo CSS
que tenía la versión original, solo que separado del HTML para que sea más
fácil de mantener. No hace falta tocarlo para el uso normal del sitio.

## Notas

- El logo se guarda como archivo de imagen real en `images/logo.jpg` (antes
  estaba incrustado como texto base64 gigante dentro del HTML).
- El número de WhatsApp que aparece en varios botones del sitio (nav, hero,
  footer, contacto) ahora sale todo de `data/productos.json → config.waNumber`,
  así que cambiarlo una vez lo actualiza en todos lados.
