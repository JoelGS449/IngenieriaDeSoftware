//FRONTEND SCRIPT
let idUsuario = -1;
let tipoUsuario = -1;


document.addEventListener('DOMContentLoaded', function () {
    // Obtener el idUsuario, por ejemplo, desde una variable global o cualquier otra forma
    idUsuario = parseInt(getCookieValue("sessionId"));
    tipoUsuario = parseInt(getCookieValue("tipoUsuario"));
    if (!idUsuario) {
        // Redirigir al usuario a la página de origen
        const url = "../Index.html";
        window.location.href = url;
        return;
    }
});


document.getElementById("btnEnviar").addEventListener("click", function (event) {
    event.preventDefault(); // Evitar que el formulario se envíe de forma predeterminada

    // Obtener los valores de los campos del formulario
    const nombre = document.getElementById("nombre").value;
    const email = document.getElementById("email").value;
    const asunto = document.getElementById("asunto").value;
    const mensaje = document.getElementById("mensaje").value;

    // Crear el objeto formulario con los valores obtenidos
    const formulario = {
        nombre: nombre,
        email: email,
        asunto: asunto,
        mensaje: mensaje
    };

    // Realizar la solicitud POST utilizando fetch
    fetch('/registrarFormularioSoporte', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formulario),
    })
        .then(response => response.json())
        .then(data => {
            alert("Formulario enviado, gracias por tu retroalimentación");
        })
        .catch(error => {
            // Manejar errores
            alert("Ocurrió un error", error);
        });
});




function getCookieValue(cookieName) {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(cookieName + '=')) {
            return cookie.substring(cookieName.length + 1);
        }
    }
    return null;
}