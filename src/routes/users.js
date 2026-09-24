const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authorize = require('../middlewares/authorize');

// GET /auditoria - Consultar registros de acceso del sistema
router.get('/auditoria', authorize('VER_AUDITORIA'), (req, res) => {
    db.all("SELECT * FROM auditoria ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// GET /usuarios - Listar todos los perfiles de la base de datos
router.get('/usuarios', authorize('GESTIONAR_USUARIOS'), (req, res) => {
    db.all("SELECT id, nombre, correo, rol, departamento, nivel_seguridad, pais, tipo_contrato, estado FROM usuarios", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

module.exports = router;