const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const SECRET_KEY = 'ClaveUltraSecretaSecureDocs';

router.post('/login', (req, res) => {
    const { correo, password } = req.body;

    if (!correo || !password) {
        return res.status(400).json({ error: 'Correo y contraseña requeridos' });
    }

    db.get("SELECT * FROM usuarios WHERE correo = ?", [correo], async (err, usuario) => {
        if (err) return res.status(500).json({ error: 'Error del servidor' });
        if (!usuario) return res.status(401).json({ error: 'Credenciales inválidas' });

        const validPwd = await bcrypt.compare(password, usuario.password);
        if (!validPwd) return res.status(401).json({ error: 'Credenciales inválidas' });

        // Generar Token conteniendo los datos clave de identidad
        const token = jwt.sign(
            { id: usuario.id, correo: usuario.correo, rol: usuario.rol }, 
            SECRET_KEY, 
            { expiresIn: '2h' }
        );

        res.json({
            message: 'Autenticación exitosa',
            token,
            usuario: {
                nombre: usuario.nombre,
                rol: usuario.rol,
                departamento: usuario.departamento
            }
        });
    });
});

module.exports = router;