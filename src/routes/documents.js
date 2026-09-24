const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authorize = require('../middlewares/authorize');

// GET /documentos - Listar todos los documentos disponibles
router.get('/', authorize('CONSULTAR_DOCUMENTO'), (req, res) => {
    db.all("SELECT * FROM documentos", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// GET /documentos/{id} - Consultar un documento específico (Protegido por ABAC dinámico)
router.get('/:id', authorize('CONSULTAR_DOCUMENTO'), (req, res) => {
    res.json({ message: "Acceso autorizado al documento", documento: req.recursoCargado });
});

// POST /documentos - Crear un nuevo documento
router.post('/', authorize('CREAR_DOCUMENTO'), (req, res) => {
    const { titulo, descripcion, departamento, nivel_confidencialidad, estado, pais } = req.body;
    const propietario_id = req.usuario.id;

    db.run(
        `INSERT INTO documentos (titulo, descripcion, propietario_id, departamento, nivel_confidencialidad, estado, pais) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [titulo, descripcion, propietario_id, departamento, nivel_confidencialidad, estado, pais],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: 'Documento creado con éxito', id: this.lastID });
        }
    );
});

// PUT /documentos/{id} - Modificar un documento
router.put('/:id', authorize('MODIFICAR_DOCUMENTO'), (req, res) => {
    const { titulo, descripcion } = req.body;
    db.run(
        `UPDATE documentos SET titulo = ?, descripcion = ? WHERE id = ?`,
        [titulo, descripcion, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Documento modificado correctamente' });
        }
    );
});

// DELETE /documentos/{id} - Eliminar un documento
router.delete('/:id', authorize('ELIMINAR_DOCUMENTO'), (req, res) => {
    db.run("DELETE FROM documentos WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Documento eliminado de manera definitiva' });
    });
});

// POST /documentos/{id}/aprobar - Cambiar estado a aprobado
router.post('/:id/aprobar', authorize('APROBAR_DOCUMENTO'), (req, res) => {
    db.run("UPDATE documentos SET estado = 'APROBADO' WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'El documento ha sido marcado como APROBADO' });
    });
});

module.exports = router;