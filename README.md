# SecureDocs 🛡️ - Sistema de Gestión de Expedientes con RBAC y ABAC

Este proyecto implementa una arquitectura desacoplada de autorización en dos etapas (Control de Acceso Basado en Roles y Control de Acceso Basado en Atributos) empleando Node.js y SQLite de acuerdo con los requerimientos del laboratorio.

## 🚀 Requisitos Previos
* Node.js (versión v18 o superior)
* Visual Studio Code

## 🛠️ Instalación y Despliegue Local

1. Clonar el repositorio o extraer los archivos del proyecto.
2. Abrir la carpeta raíz en la terminal de VS Code.
3. Instalar las dependencias del sistema ejecutando:
   ```bash
   npm install
   ```
4. Iniciar el servidor en modo desarrollo mediante el script automatizado:
   ```bash
   npm run dev
   ```
5. El sistema detectará e inicializará automáticamente la base de datos local `securedocs.db`.
6. Abrir en el navegador web la dirección: **http://localhost:5000**

## 👥 Cuentas semilla para testing
* **Supervisor (Finanzas):** ana@techcorp.com / password123
* **Empleado (RRHH):** laura@techcorp.com / password123
* **Invitado (Externo):** juan@externo.com / password123