CREATE DATABASE ManoAMano;
use ManoAMano;


CREATE TABLE Usuario (
  id_Usuario INT PRIMARY KEY IDENTITY,
  nombre VARCHAR(50),
  apellidoP VARCHAR(50),
  apellidoM VARCHAR(50),
  fechaNac DATE,
  estado VARCHAR(50),
  municipio VARCHAR(50),
  telefono VARCHAR(50),
  correo VARCHAR(50) UNIQUE,
  contraseña VARCHAR(50),
  INE VARCHAR(255),
  fotoPerfil VARCHAR(255)
);

CREATE TABLE Oficio (
  id_oficio INT PRIMARY KEY IDENTITY,
  nombre VARCHAR(50)
);

CREATE TABLE Comentario (
  id_Comentario INT PRIMARY KEY IDENTITY,
  id_Usuario INT,
  id_Trabajo INT,
  comentario TEXT,
  FOREIGN KEY (id_Usuario) REFERENCES Usuario(id_Usuario),
  FOREIGN KEY (id_Trabajo) REFERENCES Trabajo(id_Trabajo)
);

CREATE TABLE Calificacion (
  id_Calificacion INT PRIMARY KEY IDENTITY,
  id_Usuario INT,
  id_Trabajo INT,
  calificacion FLOAT,
  FOREIGN KEY (id_Usuario) REFERENCES Usuario(id_Usuario),
  FOREIGN KEY (id_Trabajo) REFERENCES Trabajo(id_Trabajo)
);

CREATE TABLE Trabajo (
  id_Trabajo INT PRIMARY KEY IDENTITY,
  Descripcion VARCHAR(255),
  Disponible BIT,
  id_Usuario INT,
  id_oficio INT,
  FOREIGN KEY (id_Usuario) REFERENCES Usuario(id_Usuario),
  FOREIGN KEY (id_oficio) REFERENCES Oficio(id_oficio)
);

CREATE TABLE Notificacion (
  id_Notificacion INT PRIMARY KEY IDENTITY,
  id_Trabajo INT,
  id_UsuarioComentario INT,
  id_UsuarioCalificacion INT,
  FOREIGN KEY (id_Trabajo) REFERENCES Trabajo(id_Trabajo),
  FOREIGN KEY (id_UsuarioComentario) REFERENCES Usuario(id_Usuario),
  FOREIGN KEY (id_UsuarioCalificacion) REFERENCES Usuario(id_Usuario)
);


-- Crear la tabla Foto
CREATE TABLE Foto (
  id_foto INT PRIMARY KEY IDENTITY,
  url VARCHAR(255)
);

-- Crear la tabla OficioTrabajador_Foto
CREATE TABLE Trabajo_Foto (
  id_OT INT,
  id_foto INT,
  PRIMARY KEY (id_OT, id_foto),
  FOREIGN KEY (id_OT) REFERENCES Trabajo(id_Trabajo),
  FOREIGN KEY (id_foto) REFERENCES Foto(id_foto)
);

CREATE TABLE TipoUsuario (
  id_TipoUsuario INT PRIMARY KEY IDENTITY,
  tipo VARCHAR(50)
);

CREATE TABLE FormularioSoporte (
  id_Formulario INT PRIMARY KEY IDENTITY,
  nombre VARCHAR(50),
  email VARCHAR(50),
  asunto VARCHAR(100),
  mensaje TEXT
);


ALTER TABLE Usuario
ADD id_TipoUsuario INT;

ALTER TABLE Usuario
ADD CONSTRAINT FK_Usuario_TipoUsuario FOREIGN KEY (id_TipoUsuario) REFERENCES TipoUsuario(id_TipoUsuario);

INSERT INTO TipoUsuario (tipo)
VALUES ('cliente'), ('trabajador');




CREATE PROCEDURE ObtenerTrabajosPorOficio
  @id_oficio INT
AS
BEGIN
  SELECT Oficio.nombre AS NombreOficio, 
         CONCAT(Usuario.nombre, ' ', Usuario.apellidoP, ' ', Usuario.apellidoM) AS NombreCompletoTrabajador
  FROM Trabajo
  INNER JOIN Oficio ON Trabajo.id_oficio = Oficio.id_oficio
  INNER JOIN Usuario ON Trabajo.id_Usuario = Usuario.id_Usuario
  WHERE Trabajo.id_oficio = @id_oficio;
END;


CREATE PROCEDURE ObtenerTrabajosPorUsuario
  @id_Usuario INT
AS
BEGIN
  SELECT Oficio.nombre AS NombreOficio, 
         CONCAT(Usuario.nombre, ' ', Usuario.apellidoP, ' ', Usuario.apellidoM) AS NombreCompletoTrabajador
  FROM Trabajo
  INNER JOIN Oficio ON Trabajo.id_oficio = Oficio.id_oficio
  INNER JOIN Usuario ON Trabajo.id_Usuario = Usuario.id_Usuario
  WHERE Trabajo.id_Usuario = @id_Usuario
    AND Usuario.id_TipoUsuario = (SELECT id_TipoUsuario FROM TipoUsuario WHERE tipo = 'trabajador');
END;


CREATE PROCEDURE SP_GetTrabajoDetails
  @idTrabajo INT
AS
BEGIN
  SELECT
    CONCAT(U.nombre, ' ', U.apellidoP, ' ', U.apellidoM) AS 'Nombre completo',
    O.nombre AS 'Oficio',
    U.telefono AS 'TELÉFONO',
    U.correo AS 'CORREO',
    T.Disponible AS 'DISPONIBLE',
    T.Descripcion AS 'DESCRIPCIÓN',
    U.municipio AS 'CIUDAD',
    T.calificacion AS 'CALIFICACIÓN'
  FROM
    Trabajo T
    INNER JOIN Usuario U ON T.id_Usuario = U.id_Usuario
    INNER JOIN Oficio O ON T.id_oficio = O.id_oficio
  WHERE
    T.id_Trabajo = @idTrabajo;
END

CREATE PROCEDURE SP_GetComentariosTrabajo
  @idTrabajo INT
AS
BEGIN
  SELECT
    C.comentario AS 'Comentario',
    CONCAT(U.nombre, ' ', U.apellidoP, ' ', U.apellidoM) AS 'Usuario'
  FROM
    Comentario C
    INNER JOIN Trabajo T ON C.id_Comentario = T.id_Comentario
    INNER JOIN Usuario U ON C.id_Usuario = U.id_Usuario
  WHERE
    T.id_Trabajo = @idTrabajo;
END


CREATE PROCEDURE SP_ActualizarTrabajo
  @idTrabajo INT,
  @idOficio INT,
  @descripcion VARCHAR(255),  
  @costo MONEY,
  @disponible BIT
AS
BEGIN
  UPDATE Trabajo
  SET
    id_oficio = @idOficio,
	Descripcion = @descripcion,
    costo = @costo,
	Disponible = @disponible
  WHERE
    id_Trabajo = @idTrabajo;
END
CREATE PROCEDURE SP_Login
  @correo VARCHAR(50),
  @contrasena VARCHAR(50),
  @idUsuario INT OUTPUT,
  @tipoUsuario INT OUTPUT
AS
BEGIN
  -- Verificar si el usuario y contraseña coinciden
  IF EXISTS (SELECT 1 FROM Usuario WHERE correo = @correo AND contraseña = @contrasena)
  BEGIN
    SELECT @idUsuario = id_Usuario, @tipoUsuario = id_TipoUsuario
    FROM Usuario
    WHERE correo = @correo AND contraseña = @contrasena;
  END
  ELSE
  BEGIN
    SET @idUsuario = -1;
    SET @tipoUsuario = -1;
  END
END



CREATE PROCEDURE SP_RegistrarUsuario
  @nombre VARCHAR(50),
  @apellidoP VARCHAR(50),
  @apellidoM VARCHAR(50),
  @correo VARCHAR(50),
  @contrasena VARCHAR(50),
  @INE VARCHAR(255),
  @tipoUsuario INT,
  @idUsuario INT OUTPUT
AS
BEGIN
  SET NOCOUNT ON;

  -- Verificar si el correo ya está registrado
  IF EXISTS (SELECT 1 FROM Usuario WHERE correo = @correo)
  BEGIN
    -- El correo ya está repetido, retornar un código de error o mensaje
    SET @idUsuario = -1;
	SELECT @idUsuario AS 'idUsuario';
    RETURN @idUsuario;
  END

  -- Insertar el nuevo usuario en la tabla Usuario
  INSERT INTO Usuario (correo, contraseña, nombre, apellidoP, apellidoM, INE, id_TipoUsuario)
  VALUES (@correo, @contrasena, @nombre, @apellidoP, @apellidoM, @INE, @tipoUsuario);

  -- Obtener el ID del usuario recién registrado
  SET @idUsuario = SCOPE_IDENTITY();

  -- Retornar el ID del usuario registrado
  SELECT @idUsuario AS 'idUsuario';
  RETURN @idUsuario
END



CREATE PROCEDURE SP_RegistrarFormularioSoporte
  @nombre VARCHAR(50),
  @email VARCHAR(50),
  @asunto VARCHAR(100),
  @mensaje TEXT,
  @idFormulario INT OUTPUT
AS
BEGIN
  SET NOCOUNT ON;

  -- Insertar el nuevo formulario en la tabla FormularioSoporte
  INSERT INTO FormularioSoporte (nombre, email, asunto, mensaje)
  VALUES (@nombre, @email, @asunto, @mensaje);

  -- Obtener el ID del formulario recién registrado
  SET @idFormulario = SCOPE_IDENTITY();
END



CREATE PROCEDURE SP_GetUsuarioByID
  @idUsuario INT,
  @nombre VARCHAR(100) OUTPUT,
  @fechaNacimiento DATE OUTPUT,
  @telefono VARCHAR(50) OUTPUT,
  @estado VARCHAR(50) OUTPUT,
  @municipio VARCHAR(50) OUTPUT,
  @fotoPerfil VARCHAR(255) OUTPUT
AS
BEGIN
  SELECT
    @nombre = CONCAT(nombre, ' ', apellidoP, ' ', apellidoM),
    @fechaNacimiento = fechaNac,
    @telefono = telefono,
    @estado = estado,
    @municipio = municipio,
	@fotoPerfil = fotoPerfil
  FROM
    Usuario
  WHERE
    id_Usuario = @idUsuario;
END

CREATE PROCEDURE SP_ActualizarUsuario
  @idUsuario INT,
  @fechaNacimiento DATE,
  @telefono VARCHAR(50),
  @estado VARCHAR(50),
  @municipio VARCHAR(50),
  @actualizacionExitosa BIT OUTPUT
AS
BEGIN
  SET NOCOUNT ON;

  -- Variable para almacenar el resultado de la actualización
  DECLARE @rowCount INT;

  -- Actualizar los datos del usuario
  UPDATE Usuario
  SET
    fechaNac = @fechaNacimiento,
    telefono = @telefono,
    estado = @estado,
    municipio = @municipio
  WHERE
    id_Usuario = @idUsuario;

  -- Obtener el número de filas afectadas por la actualización
  SET @rowCount = @@ROWCOUNT;

  -- Establecer el valor de salida en función del resultado de la actualización
  IF @rowCount > 0
    SET @actualizacionExitosa = 1;
  ELSE
    SET @actualizacionExitosa = 0;
END


CREATE PROCEDURE SP_GuardarFotoPerfil
  @idUsuario INT,
  @direccionFoto VARCHAR(255),
  @exito BIT OUTPUT
AS
BEGIN
  SET @exito = 0; -- Inicializar @exito como 0 (no éxito) por defecto

  BEGIN TRY
    -- Actualizar la dirección de la foto de perfil del usuario
    UPDATE Usuario
    SET fotoPerfil = @direccionFoto
    WHERE id_Usuario = @idUsuario;

    SET @exito = 1; -- Actualización exitosa
  END TRY
  BEGIN CATCH
    -- Opcional: Puedes agregar código para manejar la excepción si ocurre algún error durante la actualización
    SET @exito = 0; -- Actualización fallida
  END CATCH;
END
