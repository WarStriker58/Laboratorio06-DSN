const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { checkRBAC } = require('../policies/rbacRules');
const { evaluateABAC } = require('../policies/abacEngine');

const SECRET_KEY = 'ClaveUltraSecretaSecureDocs';

function authorize(permisoRequerido) {
    return (req, res, next) => {
        // 1. Extraer Token de Autenticación
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        // Capturar datos del entorno desde los headers simulados enviados por el frontend
        const entorno = {
            hora: req.headers['x-sim-hora'] || '12:00',
            direccion_ip: req.headers['x-sim-ip'] || '192.168.1.1',
            ubicacion: req.headers['x-sim-ubicacion'] || 'PERU',
            dispositivo: req.headers['x-sim-dispositivo'] || 'CORPORATIVO'
        };

        if (!token) {
            return res.status(401).json({ error: 'Acceso denegado. Token no provisto.' });
        }

        jwt.verify(token, SECRET_KEY, (err, usuarioToken) => {
            if (err) return res.status(403).json({ error: 'Token inválido o expirado.' });

            // Recuperar datos actualizados del usuario desde la BD (para evaluar atributos ABAC reales)
            db.get("SELECT * FROM usuarios WHERE id = ?", [usuarioToken.id], (err, usuario) => {
                if (err || !usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });

                const recursoId = req.params.id || null;
                const registrarAuditoria = (resultado, motivo) => {
                    const fechaActual = new Date().toISOString();
                    const recursoStr = recursoId ? `documento-${recursoId}` : 'sistema';
                    db.run(
                        `INSERT INTO auditoria (usuario, recurso, accion, fecha, resultado, motivo) VALUES (?, ?, ?, ?, ?, ?)`,
                        [usuario.correo, recursoStr, permisoRequerido, fechaActual, resultado, motivo]
                    );
                };

                // === PASO 1: VALIDACIÓN RBAC ===
                const rbacPermitido = checkRBAC(usuario.rol, permisoRequerido);
                if (!rbacPermitido) {
                    registrarAuditoria('DENEGADO', 'Denegado por RBAC: Rol sin permisos para la operación');
                    return res.status(403).json({ 
                        autorizado: false, 
                        fase: 'RBAC', 
                        error: 'Tu rol no cuenta con permisos para realizar esta acción.' 
                    });
                }

                // Si la petición requiere un recurso/documento, lo buscamos en la BD para evaluar ABAC
                if (recursoId) {
                    db.get("SELECT * FROM documentos WHERE id = ?", [recursoId], (err, recurso) => {
                        if (err || !recurso) {
                            return res.status(404).json({ error: 'Documento no encontrado.' });
                        }

                        // === PASO 2: VALIDACIÓN ABAC (Con recurso) ===
                        const resultadoABAC = evaluateABAC(usuario, recurso, permisoRequerido, entorno);
                        if (!resultadoABAC.autorizado) {
                            registrarAuditoria('DENEGADO', resultadoABAC.motivo);
                            return res.status(403).json({ 
                                autorizado: false, 
                                fase: 'ABAC', 
                                error: resultadoABAC.motivo 
                            });
                        }

                        // Ambos permitidos
                        registrarAuditoria('PERMITIDO', 'Acceso autorizado exitosamente');
                        req.usuario = usuario;
                        req.recursoCargado = recurso;
                        req.entornoSimulado = entorno;
                        next();
                    });
                } else {
                    // === PASO 2: VALIDACIÓN ABAC (Acción general del sistema sin recurso específico) ===
                    const resultadoABAC = evaluateABAC(usuario, null, permisoRequerido, entorno);
                    if (!resultadoABAC.autorizado) {
                        registrarAuditoria('DENEGADO', resultadoABAC.motivo);
                        return res.status(403).json({ autorizado: false, fase: 'ABAC', error: resultadoABAC.motivo });
                    }

                    registrarAuditoria('PERMITIDO', 'Acceso autorizado exitosamente');
                    req.usuario = usuario;
                    req.entornoSimulado = entorno;
                    next();
                }
            });
        });
    };
}

module.exports = authorize;