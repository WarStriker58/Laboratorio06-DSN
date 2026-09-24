/**
 * Motor de Políticas ABAC para SecureDocs
 */
function evaluateABAC(usuario, recurso, accion, entorno) {
    
    // Política 7: Estado del usuario (Afecta a cualquier intento de acceso)
    if (usuario.estado !== 'ACTIVO') {
        return { autorizado: false, motivo: 'Usuario suspendido o inactivo' };
    }

    // Política 8: Invitados (Reglas simultáneas específicas)
    if (usuario.rol === 'INVITADO') {
        const esExterno = usuario.tipo_contrato === 'EXTERNO';
        const esBajaConfidencialidad = recurso ? recurso.nivel_confidencialidad <= 1 : true;
        const esPublicado = recurso ? recurso.estado === 'PUBLICADO' : false;

        if (!(esExterno && esBajaConfidencialidad && esPublicado)) {
            return { autorizado: false, motivo: 'Invitado no cumple condiciones de acceso estricto' };
        }
        return { autorizado: true }; // Si cumple los filtros de invitado, pasa directo
    }

    // Si la acción requiere analizar un recurso específico (como un documento)
    if (recurso) {
        
        // Política 1: Departamento (Excepto si es Administrador)
        if (usuario.rol !== 'ADMINISTRADOR' && usuario.departamento !== recurso.departamento) {
            // Permitir si es Gerente/Supervisor/Auditor evaluando condiciones globales si aplica, 
            // pero la regla general dice: "Un empleado solamente puede consultar documentos de su propio departamento"
            if (usuario.rol === 'EMPLEADO' || usuario.rol === 'SUPERVISOR') {
                return { autorizado: false, motivo: 'El recurso pertenece a otro departamento' };
            }
        }

        // Política 2: Nivel de seguridad
        if (usuario.nivel_seguridad < recurso.nivel_confidencialidad) {
            return { autorizado: false, motivo: 'Nivel de seguridad insuficiente' };
        }

        // Política 3: Propiedad (Modificación de documentos)
        if (accion === 'MODIFICAR_DOCUMENTO') {
            if (usuario.rol !== 'ADMINISTRADOR' && usuario.rol !== 'GERENTE') {
                if (usuario.id !== recurso.propietario_id) {
                    return { autorizado: false, motivo: 'Solo el propietario puede modificar este documento' };
                }
            }
        }

        // Política 4: Horario (Documentos con confidencialidad >= 4)
        if (recurso.nivel_confidencialidad >= 4) {
            const horaActual = entorno.hora; // Recibida desde la simulación del cliente
            if (horaActual < '08:00' || horaActual > '18:00') {
                return { autorizado: false, motivo: 'Acceso denegado fuera del horario autorizado (08:00 - 18:00)' };
            }
        }

        // Política 5: País
        if (recurso.pais === 'PERU' && entorno.ubicacion !== 'PERU') {
            return { autorizado: false, motivo: 'Documentos de Perú solo accesibles desde territorio nacional' };
        }

        // Política 6: Dispositivo
        if (recurso.nivel_confidencialidad >= 4 && entorno.dispositivo !== 'CORPORATIVO') {
            return { autorizado: false, motivo: 'Documento altamente confidencial requiere dispositivo corporativo' };
        }
    }

    return { autorizado: true };
}

module.exports = { evaluateABAC };