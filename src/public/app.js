// Verificar existencia de Sesión Activa
const token = localStorage.getItem('token');
const usuarioData = JSON.parse(localStorage.getItem('usuario'));

if (!token || !usuarioData) {
    window.location.href = '/login.html';
} else {
    document.getElementById('userInfo').textContent = `${usuarioData.nombre} (${usuarioData.rol} - ${usuarioData.departamento})`;
}

// Interceptor de cabeceras para inyectar entorno simulado
function obtenerHeadersSimulados() {
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-sim-hora': document.getElementById('simHora').value,
        'x-sim-ubicacion': document.getElementById('simUbicacion').value,
        'x-sim-dispositivo': document.getElementById('simDispositivo').value,
        'x-sim-ip': document.getElementById('simIp').value
    };
}

// Renderizar la Consola de Auditoría Visual en pantalla
function mostrarVeredicto(ok, datos) {
    const consola = document.getElementById('veredictoConsola');
    if (ok) {
        consola.innerHTML = `<span class="text-success">[AUTORIZADO]</span><br>Operación ejecutada con éxito.<br>RBAC: OK | ABAC: Cumple políticas.`;
    } else {
        consola.innerHTML = `<span class="text-danger">[ACCESO DENEGADO]</span><br>Fase de Rechazo: <b class="text-warning">${datos.fase || 'Servidor'}</b><br>Motivo: ${datos.error}`;
    }
    cargarAuditoria(); // Refrescar logs al instante
}

// Cargar Listado de Documentos desde la API
async function cargarDocumentos() {
    try {
        const res = await fetch('/api/documentos', { headers: obtenerHeadersSimulados() });
        if (!res.ok) {
            const errData = await res.json();
            document.getElementById('documentosTabla').innerHTML = `<tr><td colspan="7" class="text-center text-danger p-3">${errData.error}</td></tr>`;
            return;
        }
        const documentos = await res.json();
        const tbody = document.getElementById('documentosTabla');
        tbody.innerHTML = '';

        documentos.forEach(doc => {
            tbody.innerHTML += `
                <tr>
                    <td>${doc.id}</td>
                    <td class="fw-bold">${doc.titulo}</td>
                    <td><span class="badge bg-light text-dark border">${doc.departamento}</span></td>
                    <td><span class="badge bg-warning text-dark">Nivel ${doc.nivel_confidencialidad}</span></td>
                    <td>${doc.pais}</td>
                    <td><span class="badge ${doc.estado === 'APROBADO' ? 'bg-success' : 'bg-secondary'}">${doc.estado}</span></td>
                    <td class="text-end px-4">
                        <div class="btn-group btn-group-sm">
                            <button onclick="ejecutarAccion('/api/documentos/${doc.id}', 'GET')" class="btn btn-outline-primary">Consultar</button>
                            <button onclick="ejecutarAccion('/api/documentos/${doc.id}', 'PUT', {titulo: '${doc.titulo} Modificado', descripcion: 'Cambio aplicado'})" class="btn btn-outline-warning">Modificar</button>
                            <button onclick="ejecutarAccion('/api/documentos/${doc.id}/aprobar', 'POST')" class="btn btn-outline-success">Aprobar</button>
                            <button onclick="ejecutarAccion('/api/documentos/${doc.id}', 'DELETE')" class="btn btn-outline-danger">Eliminar</button>
                        </div>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Error al cargar documentos", err);
    }
}

// Ejecutar operaciones operacionales sobre documentos
async function ejecutarAccion(url, metodo, cuerpo = null) {
    try {
        const opciones = {
            method: metodo,
            headers: obtenerHeadersSimulados()
        };
        if (cuerpo) opciones.body = JSON.stringify(cuerpo);

        const res = await fetch(url, opciones);
        const data = await res.json();

        if (res.ok) {
            mostrarVeredicto(true, data);
            if (metodo !== 'GET') cargarDocumentos(); // Refrescar si hubo mutación
        } else {
            mostrarVeredicto(false, data);
        }
    } catch (err) {
        console.error(err);
    }
}

// Cargar Historial de Auditoría
async function cargarAuditoria() {
    try {
        const res = await fetch('/api/auditoria', { headers: obtenerHeadersSimulados() });
        if (!res.ok) return;
        const logs = await res.json();
        const tbody = document.getElementById('auditoriaTabla');
        tbody.innerHTML = '';
        
        logs.forEach(log => {
            const statusClass = log.resultado === 'PERMITIDO' ? 'text-success' : 'text-danger fw-bold';
            tbody.innerHTML += `
                <tr>
                    <td>${log.usuario}</td>
                    <td>${log.recurso}</td>
                    <td>${log.accion}</td>
                    <td class="${statusClass}">${log.resultado}</td>
                    <td class="text-muted">${log.motivo}</td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
    }
}

// Desconexión del sistema
function logout() {
    localStorage.clear();
    window.location.href = '/login.html';
}

// Inicialización Automática al Cargar Pantalla
cargarDocumentos();
cargarAuditoria();