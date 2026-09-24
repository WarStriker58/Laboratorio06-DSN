// Matriz de permisos estática mapeada según el requerimiento del laboratorio (Sección 4)
const rbacMatrix = {
    'ADMINISTRADOR': [
        'CREAR_DOCUMENTO', 'CONSULTAR_DOCUMENTO', 'MODIFICAR_DOCUMENTO', 
        'ELIMINAR_DOCUMENTO', 'APROBAR_DOCUMENTO', 'VER_AUDITORIA', 
        'GESTIONAR_USUARIOS', 'ASIGNAR_ROLES'
    ],
    'GERENTE': [
        'CREAR_DOCUMENTO', 'CONSULTAR_DOCUMENTO', 'MODIFICAR_DOCUMENTO', 
        'ELIMINAR_DOCUMENTO', 'APROBAR_DOCUMENTO', 'VER_AUDITORIA'
    ],
    'SUPERVISOR': [
        'CREAR_DOCUMENTO', 'CONSULTAR_DOCUMENTO', 'MODIFICAR_DOCUMENTO', 'APROBAR_DOCUMENTO'
    ],
    'EMPLEADO': [
        'CREAR_DOCUMENTO', 'CONSULTAR_DOCUMENTO', 'MODIFICAR_DOCUMENTO'
    ],
    'AUDITOR': [
        'CONSULTAR_DOCUMENTO', 'VER_AUDITORIA'
    ],
    'INVITADO': [
        'CONSULTAR_DOCUMENTO'
    ]
};

/**
 * Valida si un rol tiene asignado un permiso operacional específico
 */
function checkRBAC(rol, permisoRequerido) {
    const permisosDelRol = rbacMatrix[rol.toUpperCase()];
    if (!permisosDelRol) return false;
    return permisosDelRol.includes(permisoRequerido.toUpperCase());
}

module.exports = { checkRBAC };