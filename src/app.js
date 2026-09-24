const express = require('express');
const path = require('path');
const db = require('./config/database'); // Inicializa base de datos automática

const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares estándar para parsear JSON y formularios web
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'public')));

// Enrutamiento de la API REST del laboratorio
app.use('/api/auth', authRoutes);
app.use('/api/documentos', documentRoutes);
app.use('/api', userRoutes); // Raíz para /usuarios y /auditoria

// Levantar el servidor
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`   Servidor SecureDocs corriendo en puerto ${PORT}`);
    console.log(`   URL local: http://localhost:${PORT}`);
    console.log(`==================================================`);
});