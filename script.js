// --- CONFIGURACIÓN FIREBASE (Usa las tuyas) ---
const firebaseConfig = {
    apiKey: "AIzaSyCh_YzqEDjuAz5Jx9i4pgezCx6saLy9XCU",
    authDomain: "mihatodb.firebaseapp.com",
    databaseURL: "https://mihatodb-default-rtdb.firebaseio.com",
    projectId: "mihatodb",
    storageBucket: "mihatodb.firebasestorage.app",
    messagingSenderId: "835130222154",
    appId: "1:835130222154:web:2708bb77ac4bdf073ee8b3"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let menuData = {}, categorias = [], configData = {}, carrito = [];
let catActual = "Todas";

// --- SINCRONIZACIÓN EN TIEMPO REAL ---

db.ref('configuracion').on('value', snap => {
    configData = snap.val() || {};
    document.getElementById('tab-title').innerText = configData.nombre || "Menú";
    document.getElementById('main-name').innerText = configData.nombre || "EL HATO MASTER";
    document.getElementById('main-slogan').innerText = configData.eslogan || "";
    document.getElementById('main-desc').innerText = configData.desc || "";
    document.getElementById('tasa-cliente').innerText = configData.t || "1";
    document.getElementById('loc-txt').innerText = `${configData.ciudad || ""}, ${configData.estado || ""} - ${configData.pais || ""}`;
    
    // Cargar datos en el form de Admin para que no estén vacíos al entrar
    document.getElementById('conf-nombre').value = configData.nombre || "";
    document.getElementById('conf-wa').value = configData.w || "";
    document.getElementById('conf-tasa').value = configData.t || "";

    // Redes Sociales
    let redHTML = "";
    if(configData.w) redHTML += `<a href="https://wa.me/${configData.w}" target="_blank"><i class="fab fa-whatsapp"></i></a>`;
    if(configData.ig) redHTML += `<a href="${configData.ig}" target="_blank"><i class="fab fa-instagram"></i></a>`;
    if(configData.fb) redHTML += `<a href="${configData.fb}" target="_blank"><i class="fab fa-facebook"></i></a>`;
    if(configData.tk) redHTML += `<a href="${configData.tk}" target="_blank"><i class="fab fa-tiktok"></i></a>`;
    document.getElementById('redes-sociales').innerHTML = redHTML;

    filtrarProductos();
});

db.ref('categorias').on('value', snap => {
    categorias = ["Todas"];
    if(snap.exists()) {
        Object.keys(snap.val()).forEach(id => categorias.push({id, nombre: snap.val()[id].nombre}));
    }
    renderCategoriasCliente();
    renderCategoriasAdmin();
    actualizarSelectCategorias();
});

db.ref('menu').on('value', snap => {
    menuData = snap.val() || {};
    filtrarProductos();
    renderInventarioAdmin();
});

// --- SISTEMA DE PESTAÑAS Y SEGURIDAD ---

function switchMainTab(v) {
    document.getElementById('seccion-cliente').style.display = v === 'cliente' ? 'block' : 'none';
    document.getElementById('seccion-admin').style.display = v === 'admin' ? 'block' : 'none';
    document.getElementById('btn-vista-cliente').classList.toggle('active', v === 'cliente');
    document.getElementById('btn-vista-admin').classList.toggle('active', v === 'admin');
    window.scrollTo(0,0);
}

function accesoAdmin() {
    const p = prompt("Introduzca Clave de Acceso:");
    if(p === "magdielomar19") switchMainTab('admin');
    else if(p !== null) alert("¡Clave Incorrecta!");
}

function switchAdminTab(e, id) {
    document.querySelectorAll('.admin-content').forEach(c => c.style.display = 'none');
    document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(id).style.display = 'block';
    e.currentTarget.classList.add('active');
}

// --- VISTA PREVIA (LÓGICA BLINDADA) ---

function verImagen(id) {
    const p = menuData[id];
    const tasa = parseFloat(configData.t) || 1;
    
    // Inyectar datos
    document.getElementById('v-img').src = p.img;
    document.getElementById('v-titulo').innerText = p.nombre;
    document.getElementById('v-desc-completo').innerText = p.desc || "Sabor original garantizado.";
    document.getElementById('v-bs').innerText = `Bs. ${p.precioBs}`;
    document.getElementById('v-usd').innerText = `$ ${(parseFloat(p.precioBs) / tasa).toFixed(2)}`;
    
    // Botón Carrito
    document.getElementById('v-btn-add').onclick = () => {
        addCar(id);
        cerrarModal('modal-preview');
    };

    document.getElementById('modal-preview').style.display = 'block';
}

// --- FUNCIONES DEL MENÚ ---

function filtrarProductos() {
    const bus = document.getElementById('busqueda').value.toLowerCase();
    const cont = document.getElementById('grid-productos');
    cont.innerHTML = "";
    
    Object.keys(menuData).forEach(id => {
        const p = menuData[id];
        const matchBus = p.nombre.toLowerCase().includes(bus);
        const matchCat = (catActual === "Todas" || p.cat === catActual);

        if(matchBus && matchCat) {
            cont.innerHTML += `
                <div class="card-llanera">
                    <div class="card-img" onclick="verImagen('${id}')"><img src="${p.img}"></div>
                    <div class="card-body">
                        <h3 onclick="verImagen('${id}')">${p.nombre}</h3>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <b style="color:var(--naranja)">Bs. ${p.precioBs}</b>
                            <button onclick="addCar('${id}')" class="btn-llanero" style="width:auto; padding:5px 12px; font-size:1rem;">🛒</button>
                        </div>
                    </div>
                </div>`;
        }
    });
}

function renderCategoriasCliente() {
    const bar = document.getElementById('cat-bar-cliente');
    bar.innerHTML = categorias.map(c => {
        const nom = typeof c === 'string' ? c : c.nombre;
        return `<button class="cat-btn ${catActual === nom ? 'active' : ''}" onclick="setCat('${nom}')">${nom}</button>`;
    }).join('');
}

function setCat(n) { catActual = n; renderCategoriasCliente(); filtrarProductos(); }

// --- CARRITO ---

function addCar(id) {
    carrito.push(menuData[id]);
    document.getElementById('cart-count').innerText = carrito.length;
}

function abrirCarrito() {
    const l = document.getElementById('carrito-lista');
    let total = 0;
    if(carrito.length === 0) {
        l.innerHTML = "<p style='text-align:center; color:#666'>El carrito está vacío, pariente.</p>";
        document.getElementById('carrito-total').innerText = "";
    } else {
        l.innerHTML = carrito.map((i, idx) => {
            total += parseFloat(i.precioBs);
            return `<div style="display:flex; justify-content:space-between; border-bottom:1px dashed #ccc; padding:8px 0; color:#333">
                <span>${i.nombre}</span>
                <b>Bs. ${i.precioBs}</b>
            </div>`;
        }).join('');
        document.getElementById('carrito-total').innerHTML = `<h3 style="text-align:right; color:var(--madera)">TOTAL: Bs. ${total.toFixed(2)}</h3>`;
    }
    document.getElementById('modal-carrito').style.display = 'block';
}

function enviarPedido() {
    if(carrito.length === 0) return alert("¡Añade algo al carrito primero!");
    let m = `*NUEVO PEDIDO - ${configData.nombre}*\n--------------------------\n`;
    let total = 0;
    carrito.forEach(i => {
        m += `• ${i.nombre} (Bs. ${i.precioBs})\n`;
        total += parseFloat(i.precioBs);
    });
    m += `--------------------------\n*TOTAL: Bs. ${total.toFixed(2)}*`;
    window.open(`https://wa.me/${configData.w}?text=${encodeURIComponent(m)}`);
}

function vaciarCarrito() { carrito = []; document.getElementById('cart-count').innerText = "0"; cerrarModal('modal-carrito'); }

// --- ADMINISTRACIÓN ---

// 1. ACTUALIZADO: Para que guarde si está disponible o no
function guardarProducto() {
    const id = document.getElementById('edit-id').value;
    const n = document.getElementById('p-nombre').value;
    const p = document.getElementById('p-precio').value;
    const c = document.getElementById('p-categoria-select').value;
    const f = document.getElementById('p-foto').files[0];
    const disp = document.getElementById('p-disponible').checked; // <-- Nuevo

    if(!n || !p || !c) return alert("Faltan datos, pariente.");

    const procesar = (imgBase64) => {
        const data = {
            nombre: n,
            desc: document.getElementById('p-desc').value,
            cat: c,
            precioBs: p,
            disponible: disp, // <-- Nuevo
            img: imgBase64 || (id ? menuData[id].img : "")
        };
        
        const ref = id ? db.ref('menu/' + id) : db.ref('menu').push();
        ref.set(data).then(() => {
            alert("¡Listo! Menú actualizado.");
            limpiarForm();
        });
    };

    if(f) {
        const r = new FileReader();
        r.onload = e => procesar(e.target.result);
        r.readAsDataURL(f);
    } else {
        procesar();
    }
}

// 2. ACTUALIZADO: Para que el cliente NO vea los bloqueados
function filtrarProductos() {
    const bus = document.getElementById('busqueda').value.toLowerCase();
    const cont = document.getElementById('grid-productos');
    cont.innerHTML = "";
    
    Object.keys(menuData).forEach(id => {
        const p = menuData[id];
        const matchBus = p.nombre.toLowerCase().includes(bus);
        const matchCat = (catActual === "Todas" || p.cat === catActual);
        
        // AQUÍ ESTÁ EL TRUCO: Si disponible es false, no pasa al menú del cliente
        if(matchBus && matchCat && p.disponible !== false) {
            cont.innerHTML += `
                <div class="card-llanera">
                    <div class="card-img" onclick="verImagen('${id}')"><img src="${p.img}"></div>
                    <div class="card-body">
                        <h3 onclick="verImagen('${id}')">${p.nombre}</h3>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <b style="color:var(--naranja)">Bs. ${p.precioBs}</b>
                            <button onclick="addCar('${id}')" class="btn-llanero" style="width:auto; padding:5px 12px; font-size:1rem;">🛒</button>
                        </div>
                    </div>
                </div>`;
        }
    });
}

// 3. ACTUALIZADO: Para que tú veas qué está bloqueado en tu panel
function renderInventarioAdmin() {
    const cont = document.getElementById('inventario-grid');
    cont.innerHTML = Object.keys(menuData).map(id => {
        const p = menuData[id];
        const claseAgotado = p.disponible === false ? 'agotado' : ''; // <-- Nuevo
        return `
        <div class="card-admin ${claseAgotado}" style="position:relative">
            <img src="${p.img}">
            <p><b>${p.nombre}</b></p>
            <div style="display:flex; gap:5px; justify-content:center">
                <button onclick="cargarEditar('${id}')" style="color:blue; border:none; background:none; cursor:pointer"><i class="fas fa-edit"></i></button>
                <button onclick="if(confirm('¿Borrar?')) db.ref('menu/${id}').remove()" style="color:red; border:none; background:none; cursor:pointer"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    }).join('');
}

// 4. ACTUALIZADO: Para que al editar, el botón muestre si estaba bloqueado o no
function cargarEditar(id) {
    const p = menuData[id];
    document.getElementById('edit-id').value = id;
    document.getElementById('p-nombre').value = p.nombre;
    document.getElementById('p-desc').value = p.desc;
    document.getElementById('p-categoria-select').value = p.cat;
    document.getElementById('p-precio').value = p.precioBs;
    document.getElementById('p-disponible').checked = p.disponible !== false; // <-- Nuevo
    document.querySelector('#adm-productos h3').innerText = "EDITANDO: " + p.nombre;
    window.scrollTo(0,0);
}
function cargarEditar(id) {
    const p = menuData[id];
    document.getElementById('edit-id').value = id;
    document.getElementById('p-nombre').value = p.nombre;
    document.getElementById('p-desc').value = p.desc;
    document.getElementById('p-categoria-select').value = p.cat;
    document.getElementById('p-precio').value = p.precioBs;
    document.querySelector('#adm-productos h3').innerText = "EDITANDO: " + p.nombre;
    window.scrollTo(0,0);
}

function renderInventarioAdmin() {
    const cont = document.getElementById('inventario-grid');
    cont.innerHTML = Object.keys(menuData).map(id => `
        <div class="card-admin">
            <img src="${menuData[id].img}">
            <p><b>${menuData[id].nombre}</b></p>
            <div style="display:flex; gap:5px; justify-content:center">
                <button onclick="cargarEditar('${id}')" style="color:blue; border:none; background:none; cursor:pointer"><i class="fas fa-edit"></i></button>
                <button onclick="if(confirm('¿Borrar?')) db.ref('menu/${id}').remove()" style="color:red; border:none; background:none; cursor:pointer"><i class="fas fa-trash"></i></button>
            </div>
        </div>`).join('');
}

function crearCategoria() {
    const n = document.getElementById('nueva-cat-input').value;
    if(n) db.ref('categorias').push({nombre: n}).then(() => document.getElementById('nueva-cat-input').value = "");
}

function renderCategoriasAdmin() {
    const cont = document.getElementById('lista-categorias-admin');
    cont.innerHTML = categorias.filter(c => c !== "Todas").map(c => `
        <div style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid #444;">
            <span>${c.nombre}</span>
            <i class="fas fa-trash" style="color:red; cursor:pointer;" onclick="db.ref('categorias/${c.id}').remove()"></i>
        </div>`).join('');
}

function guardarAjustes() {
    db.ref('configuracion').update({
        nombre: document.getElementById('conf-nombre').value,
        eslogan: document.getElementById('conf-eslogan').value,
        desc: document.getElementById('conf-desc').value,
        pais: document.getElementById('conf-pais').value,
        estado: document.getElementById('conf-estado').value,
        ciudad: document.getElementById('conf-ciudad').value,
        w: document.getElementById('conf-wa').value,
        t: document.getElementById('conf-tasa').value,
        ig: document.getElementById('conf-ig').value,
        fb: document.getElementById('conf-fb').value,
        tk: document.getElementById('conf-tk').value
    }).then(() => alert("¡Identidad actualizada!"));
}

// --- UTILIDADES ---

function cerrarModal(id) { document.getElementById(id).style.display = 'none'; }
function limpiarForm() { 
    document.getElementById('edit-id').value = ""; 
    document.getElementById('p-nombre').value = ""; 
    document.getElementById('p-desc').value = ""; 
    document.getElementById('p-precio').value = ""; 
    document.getElementById('p-foto').value = "";
    document.querySelector('#adm-productos h3').innerText = "AÑADIR / EDITAR PLATO";
}
function generarQR() { 
    new QRious({element: document.getElementById('qr-canvas'), value: window.location.href, size: 200}); 
    document.getElementById('modal-qr').style.display = 'block'; 
}
function copiarLink() { navigator.clipboard.writeText(window.location.href); alert("¡Link copiado!"); }
function actualizarSelectCategorias() {
    const sel = document.getElementById('p-categoria-select');
    sel.innerHTML = '<option disabled selected value="">Seleccione Categoría</option>' + 
    categorias.filter(c => c !== "Todas").map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
}