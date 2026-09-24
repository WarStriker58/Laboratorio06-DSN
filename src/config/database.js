const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

// Crear o conectar a la base de datos en la raíz del proyecto
const dbPath = path.resolve(__dirname, '../../securedocs.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar con SQLite:', err.message);
    } else {
        console.log('Conectado con éxito a la base de datos SQLite.');
    }
});

db.serialize(async () => {
    // 1. Tabla de Roles (Corregido 'NOT EXISTS' por 'NOT NULL')
    db.run(`CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT UNIQUE NOT NULL
    )`);

    // 2. Tabla de Permisos (Corregido 'NOT EXISTS' por 'NOT NULL')
    db.run(`CREATE TABLE IF NOT EXISTS permisos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT UNIQUE NOT NULL
    )`);

    // 3. Tabla Intermedia RolPermiso
    db.run(`CREATE TABLE IF NOT EXISTS rol_permisos (
        rol_id INTEGER,
        permiso_id INTEGER,
        PRIMARY KEY (rol_id, permiso_id),
        FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE
    )`);

    // 4. Tabla de Usuarios
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        correo TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        rol TEXT NOT NULL,
        departamento TEXT NOT NULL,
        nivel_seguridad INTEGER NOT NULL,
        pais TEXT NOT NULL,
        tipo_contrato TEXT NOT NULL,
        estado TEXT NOT NULL
    )`);

    // 5. Tabla de Documentos
    db.run(`CREATE TABLE IF NOT EXISTS documentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        descripcion TEXT,
        propietario_id INTEGER,
        departamento TEXT NOT NULL,
        nivel_confidencialidad INTEGER NOT NULL,
        estado TEXT NOT NULL,
        pais TEXT NOT NULL,
        FOREIGN KEY (propietario_id) REFERENCES usuarios(id)
    )`);

    // 6. Tabla de Auditoría
    db.run(`CREATE TABLE IF NOT EXISTS auditoria (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT NOT NULL,
        recurso TEXT NOT NULL,
        accion TEXT NOT NULL,
        fecha TEXT NOT NULL,
        resultado TEXT NOT NULL,
        motivo TEXT NOT NULL
    )`);

    // --- SEEDING (Inserción de datos de prueba base) ---
    
    // Verificar si ya existen datos para evitar duplicados
    db.get("SELECT COUNT(*) as count FROM roles", [], async (err, row) => {
        if (row && row.count === 0) {
            console.log("Insertando datos semilla (Seeds) en la Base de Datos...");

            // Insertar Roles
            const roles = ['ADMINISTRADOR', 'GERENTE', 'SUPERVISOR', 'EMPLEADO', 'AUDITOR', 'INVITADO'];
            roles.forEach(r => db.run("INSERT INTO roles (nombre) VALUES (?)", [r]));

            // Insertar Permisos Operacionales exigidos
            const permisos = [
                'CREAR_DOCUMENTO', 'CONSULTAR_DOCUMENTO', 'MODIFICAR_DOCUMENTO', 
                'ELIMINAR_DOCUMENTO', 'APROBAR_DOCUMENTO', 'VER_AUDITORIA', 
                'GESTIONAR_USUARIOS', 'ASIGNAR_ROLES'
            ];
            permisos.forEach(p => db.run("INSERT INTO permisos (nombre) VALUES (?)", [p]));

            // Mapear Relaciones Rol-Permiso según la matriz del documento (Ejemplo resumido para inicio)
            // Administrador (id 1) tiene todos (1 al 8)
            // Empleado (id 4) tiene Crear(1), Consultar(2), Modificar(3)
            setTimeout(() => {
                // Admin total (Permisos 1 al 8)
                for(let i=1; i<=8; i++) db.run("INSERT INTO rol_permisos VALUES (1, ?)", [i]);
                // Gerente total menos gestionar usuarios y asignar roles (1 al 6)
                for(let i=1; i<=6; i++) db.run("INSERT INTO rol_permisos VALUES (2, ?)", [i]);
                // Supervisor (Crear, Consultar, Modificar, Aprobar) -> Permisos: 1, 2, 3, 5
                [1, 2, 3, 5].forEach(pId => db.run("INSERT INTO rol_permisos VALUES (3, ?)", [pId]));
                // Empleado (Crear, Consultar, Modificar) -> Permisos: 1, 2, 3
                [1, 2, 3].forEach(pId => db.run("INSERT INTO rol_permisos VALUES (4, ?)", [pId]));
                // Auditor (Consultar, Ver Auditoría) -> Permisos: 2, 6
                [2, 6].forEach(pId => db.run("INSERT INTO rol_permisos VALUES (5, ?)", [pId]));
                // Invitado (Consultar) -> Permiso: 2
                [2].forEach(pId => db.run("INSERT INTO rol_permisos VALUES (6, ?)", [pId]));
            }, 500);

            // Insertar Usuarios del enunciado cifrando su contraseña por seguridad ('password123')
            const hashedPwd = await bcrypt.hash('password123', 10);
            
            // Usuario: Ana Torres (Supervisor - Finanzas)
            db.run(`INSERT INTO usuarios (nombre, correo, password, rol, departamento, nivel_seguridad, pais, tipo_contrato, estado) 
                    VALUES ('Ana Torres', 'ana@techcorp.com', ?, 'SUPERVISOR', 'FINANZAS', 3, 'PERU', 'INTERNO', 'ACTIVO')`, [hashedPwd]);

            // Usuario: Carlos Ruiz (Supervisor - Finanzas)
            db.run(`INSERT INTO usuarios (nombre, correo, password, rol, departamento, nivel_seguridad, pais, tipo_contrato, estado) 
                    VALUES ('Carlos Ruiz', 'carlos@techcorp.com', ?, 'SUPERVISOR', 'FINANZAS', 3, 'PERU', 'INTERNO', 'ACTIVO')`, [hashedPwd]);

            // Usuario: Empleada RRHH (Ejemplo de denegación del documento)
            db.run(`INSERT INTO usuarios (nombre, correo, password, rol, departamento, nivel_seguridad, pais, tipo_contrato, estado) 
                    VALUES ('Laura Gomez', 'laura@techcorp.com', ?, 'EMPLEADO', 'RRHH', 2, 'PERU', 'INTERNO', 'ACTIVO')`, [hashedPwd]);

            // Usuario: Invitado de prueba
            db.run(`INSERT INTO usuarios (nombre, correo, password, rol, departamento, nivel_seguridad, pais, tipo_contrato, estado) 
                    VALUES ('Juan Ext', 'juan@externo.com', ?, 'INVITADO', 'EXTERNO', 1, 'PERU', 'EXTERNO', 'ACTIVO')`, [hashedPwd]);

            // Usuario: Inactivo de prueba
            db.run(`INSERT INTO usuarios (nombre, correo, password, rol, departamento, nivel_seguridad, pais, tipo_contrato, estado) 
                    VALUES ('Luis Inactivo', 'luis@techcorp.com', ?, 'EMPLEADO', 'FINANZAS', 1, 'PERU', 'INTERNO', 'INACTIVO')`, [hashedPwd]);

            // Insertar Documentos del enunciado
            // Presupuesto 2027 (Creado por Ana Torres - ID 1)
            db.run(`INSERT INTO documentos (titulo, descripcion, propietario_id, departamento, nivel_confidencialidad, estado, pais) 
                    VALUES ('Presupuesto 2027', 'Documento de presupuesto anual de Finanzas', 1, 'FINANZAS', 3, 'PENDIENTE', 'PERU')`);
            
            // Documento altamente confidencial (Nivel 4)
            db.run(`INSERT INTO documentos (titulo, descripcion, propietario_id, departamento, nivel_confidencialidad, estado, pais) 
                    VALUES ('Estrategia Secreta 2026', 'Plan de expansión corporativo confidencial', 1, 'GERENCIA', 4, 'PUBLICADO', 'PERU')`);

            // Documento Público para invitados (Nivel 1 y Publicado)
            db.run(`INSERT INTO documentos (titulo, descripcion, propietario_id, departamento, nivel_confidencialidad, estado, pais) 
                    VALUES ('Manual de Bienvenida', 'Guía introductoria para personal', 1, 'RRHH', 1, 'PUBLICADO', 'PERU')`);

            console.log("Base de datos inicializada correctamente.");
        }
    });
});

module.exports = db;