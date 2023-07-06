//BACKEND SCRIPT
const express = require('express');
const app = express();
const port = 3000;
const sql = require('mssql');
const path = require('path');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(
    session({
        secret: 'secreto', // Cambia 'secreto' por una cadena secreta más segura
        resave: false,
        saveUninitialized: true,
        store: new MemoryStore({
            checkPeriod: 86400000, // Tiempo de limpieza de la caché (en milisegundos), 86400000 = 1 día
        }),
        cookie: {
            secure: false, // Cambia a true si utilizas HTTPS
            httpOnly: true,
        },
    })
);

// Ruta estática para servir el frontend
app.use(express.static(path.resolve()));


const config = {
    server: 'localhost',
    database: 'ManoAMano',
    user: 'mano',
    password: 'manoamano',
    connectionTimeout: 15000,
    options: {
        encrypted: false,
        trustServerCertificate: true,
    },
};



// Configuración del servidor
app.use(express.json());
app.use(fileUpload());


// Rutas de la API
app.get('/', (req, res) => {
    res.send('API en funcionamiento');
});


// Ruta para guardar una imagen
app.post('/upload', (req, res) => {
    const file = req.files.file;

    if (!file) {
        res.status(400).send('No se envió ningún archivo');
        return;
    }

    const imagePath = './' + 'INE/' + file.name;

    file.mv(imagePath, (err) => {
        if (err) {
            res.status(500).send('Error al guardar la imagen')
            return;
        }

        res.send(imagePath);
    });
});

app.post('/uploadProfile', (req, res) => {
    const file = req.files.file;

    if (!file) {
        res.status(400).send('No se envió ningún archivo');
        return;
    }

    const imagePath = './' + 'fotoPerfil/' + file.name;

    file.mv(imagePath, (err) => {
        if (err) {
            res.status(500).send('Error al guardar la imagen')
            return;
        }

        res.send(imagePath);
    });
});

// Ruta para registrar un usuario en la base de datos
app.post('/registro', (req, res) => {
    const { nombre, apellidoP, apellidoM, correo, contrasena, INE, tipoUsuario } = req.body;

    sql.connect(config, function (err) {
        if (err) {
            res.status(500).send('Error de conexión');
            return;
        }

        const request = new sql.Request();

        request.input('nombre', sql.VarChar(50), nombre);
        request.input('apellidoP', sql.VarChar(50), apellidoP);
        request.input('apellidoM', sql.VarChar(50), apellidoM);
        request.input('correo', sql.VarChar(50), correo);
        request.input('contrasena', sql.VarChar(50), contrasena);
        request.input('INE', sql.VarChar(255), INE);
        request.input('tipoUsuario', sql.Int, tipoUsuario);
        request.output('idUsuario', sql.Int);

        request.execute('SP_RegistrarUsuario', function (err, recordsets, returnValue) {
            if (err) {
                res.status(500).send('Error al ejecutar el stored procedure');
                return;
            }

            const idUsuario = recordsets.returnValue;


            if (idUsuario === -1) {
                // Eliminar la imagen de la ruta
                const imagePath = INE;
                fs.unlinkSync(imagePath, (err) => {
                    if (err) {
                        res.status(500).send('Error al eliminar la imagen');
                    }
                });

                res.send(-1);
            } else {
                res.send(idUsuario);
            }

        });
    });
});



// Ruta para iniciar sesión
app.post('/login', (req, res) => {
    const { correo, contrasena } = req.body;

    sql.connect(config, function (err) {
        if (err) {
            res.status(500).json(false);
            return;
        }

        const request = new sql.Request();
        request.input('correo', sql.VarChar(50), correo);
        request.input('contrasena', sql.VarChar(50), contrasena);
        request.output('idUsuario', sql.Int);
        request.output('tipoUsuario', sql.Int);

        request.execute('SP_Login', function (err, result) {
            if (err) {
                res.status(500).json(false);
                sql.close();
                return;
            }

            const idUsuario = result.output.idUsuario;
            const tipoUsuario = result.output.tipoUsuario;

            if (idUsuario < 0) {
                res.json(false);
            } else {
                req.session.idUsuario = idUsuario;
                req.session.tipoUsuario = tipoUsuario;
                res.cookie('sessionId', req.session.id);
                res.cookie('tipoUsuario', req.session.tipoUsuario);
                res.json(true);
            }
            sql.close();
        });
    });
});

// Ruta para obtener los datos de un usuario por ID
app.get('/usuario/:id', (req, res) => {
    const idUsuario = req.params.id;

    sql.connect(config, function (err) {
        if (err) {
            res.status(500).send('Error de conexión');
            return;
        }

        const request = new sql.Request();

        // Definir los parámetros de entrada y salida
        request.input('idUsuario', sql.Int, idUsuario);
        request.output('nombre',sql.VarChar(100));
        request.output('fechaNacimiento', sql.Date);
        request.output('telefono', sql.VarChar(50));
        request.output('estado', sql.VarChar(50));
        request.output('municipio', sql.VarChar(50));
        request.output('fotoPerfil', sql.VarChar(255));

        // Ejecutar el procedimiento almacenado
        request.execute('SP_GetUsuarioByID', function (err, result) {
            if (err) {
                res.status(500).send('Error al ejecutar el stored procedure' + err);
                return;
            }

            // Obtener los valores de salida
            const nombre = result.output.nombre;
            const fechaNacimientoISO = result.output.fechaNacimiento.toISOString();
            const fechaNacimiento = fechaNacimientoISO.split('T')[0]; // Extraer solo la parte de la fecha
            const telefono = result.output.telefono;
            const estado = result.output.estado;
            const municipio = result.output.municipio;
            const fotoPerfil = result.output.fotoPerfil;
            // Construir el objeto de respuesta
            const usuario = {
                id: idUsuario,
                nombre,
                fechaNacimiento,
                telefono,
                estado,
                municipio,
                fotoPerfil,
            };
            console.log(usuario);
            res.json(usuario);
        });
    });
});

// Ruta para actualizar los datos de un usuario
app.post('/usuario/:id/actualizar', (req, res) => {
    const idUsuario = req.params.id;
    const { fechaNacimiento, telefono, estado, municipio } = req.body;
    sql.connect(config, function (err) {
        if (err) {
            res.status(500).send('Error de conexión');
            return;
        }

        const request = new sql.Request();

        // Definir los parámetros de entrada y salida
        request.input('idUsuario', sql.Int, idUsuario);
        request.input('fechaNacimiento', sql.Date, fechaNacimiento);
        request.input('telefono', sql.VarChar(50), telefono);
        request.input('estado', sql.VarChar(50), estado);
        request.input('municipio', sql.VarChar(50), municipio);
        request.output('actualizacionExitosa', sql.Bit);

        // Ejecutar el procedimiento almacenado
        request.execute('SP_ActualizarUsuario', function (err, result) {
            if (err) {
                res.status(500).send('Error al ejecutar el stored procedure');
                console.log(err);
                return;
            }

            // Obtener el valor de salida
            const actualizacionExitosa = result.output.actualizacionExitosa;

            res.json({ success: actualizacionExitosa });
        });
    });
});

// Ruta para guardar la foto de perfil de un usuario
app.post('/usuario/:id/foto', (req, res) => {
    const idUsuario = req.params.id;
    const direccionFoto = req.body.direccionFoto;
    sql.connect(config, function (err) {
        if (err) {
            res.status(500).send('Error de conexión');
            return;
        }

        const request = new sql.Request();

        // Definir los parámetros de entrada y salida
        request.input('idUsuario', sql.Int, idUsuario);
        request.input('direccionFoto', sql.VarChar(255), direccionFoto);
        request.output('exito', sql.Bit);

        // Ejecutar el procedimiento almacenado
        request.execute('SP_GuardarFotoPerfil', function (err, result) {
            if (err) {
                res.status(500).send('Error al ejecutar el stored procedure');
                return;
            }

            // Obtener el valor de salida
            const exito = result.output.exito;
            console.log(exito);
            res.json({ success: exito });
        });
    });
});

// Ruta para registrar un formulario de soporte
app.post('/registrarFormularioSoporte', (req, res) => {
    const { nombre, email, asunto, mensaje } = req.body;

    sql.connect(config, function (err) {
        if (err) {
            res.status(500).send('Error de conexión');
            return;
        }

        const request = new sql.Request();

        // Definir los parámetros de entrada y salida
        request.input('nombre', sql.VarChar(50), nombre);
        request.input('email', sql.VarChar(50), email);
        request.input('asunto', sql.VarChar(100), asunto);
        request.input('mensaje', sql.Text, mensaje);
        request.output('idFormulario', sql.Int);

        // Ejecutar el stored procedure
        request.execute('SP_RegistrarFormularioSoporte', function (err, result) {
            if (err) {
                res.status(500).send('Error al ejecutar el stored procedure');
                return;
            }

            // Obtener el valor de salida
            const idFormulario = result.output.idFormulario;

            res.json({ idFormulario });
        });
    });
});


// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor API en ejecución en http://localhost:${port}`);
});

