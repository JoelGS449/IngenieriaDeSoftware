//FRONTEND SCRIPT
const inputImagen = document.getElementById('imagen');
const imagenPreview = document.getElementById('imagen-preview');
const telefonoInput = document.getElementById('txttelefono');
const btnActualizar = document.getElementById('btnActualizar');
let idUsuario = -1;
let tipoUsuario = -1;

inputImagen.addEventListener('change', function (e) {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    imagenPreview.src = e.target.result;
  };

  if (file) {
    reader.readAsDataURL(file);
  }

  const formData = new FormData();
  formData.append('file', file);

  fetch('http://localhost:3000/uploadProfile', {
    method: 'POST',
    body: formData
  })
    .then((response) => response.text())
    .then((result) => {
      console.log(result);
      const direccionFoto = result;
      const bodyData = { direccionFoto };
      fetch(`/usuario/${idUsuario}/foto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData) // Convertir el objeto a JSON
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            imagenPreview.src = direccionFoto;
          } else {
            alert("Error al cambiar la foto");
          }
        })
        .catch(error => {
          alert(error);
        });
    })
});




// Agregar evento keydown al campo de entrada de teléfono
telefonoInput.addEventListener('keydown', function (event) {
  // Obtener la tecla presionada
  const tecla = event.key;

  // Permitir solo teclas numéricas y teclas de control (como borrar y retroceso)
  const teclasPermitidas = ['Backspace', 'Delete', 'Tab'];

  if (!teclasPermitidas.includes(tecla) && isNaN(tecla)) {
    // Si la tecla presionada no es numérica ni una tecla permitida, cancelar el evento
    event.preventDefault();
  }

});




btnActualizar.addEventListener('click', function (e) {
  e.preventDefault();
  var telefono = document.getElementById('txttelefono').value;
  var estado = document.getElementById('txtestado').value;
  var municipio = document.getElementById('txtmunicipio').value;
  var fechaNacimiento = document.getElementById('txtfecha').value;

  var telefonoRegex = /^\d{10}$/;


  if (!telefonoRegex.test(telefono)) {
    alert('DATOS INGRESADOS INCORRECTOS: TELEFONO');
  }

  if (!/^[a-zA-Z\sáéíóúÁÉÍÓÚ]+$/.test(estado)) {
    alert('DATOS INGRESADOS INCORRECTOS: ESTADO');
  }
  
  if (!/^[a-zA-Z\sáéíóúÁÉÍÓÚ]+$/.test(municipio)) {
    alert('DATOS INGRESADOS INCORRECTOS: MUNICIPIO');
  }
  

  const data = {
    fechaNacimiento: fechaNacimiento,
    telefono: telefono,
    estado: estado,
    municipio: municipio
  };



  fetch(`/usuario/${idUsuario}/actualizar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        alert('Los datos se han actualizado correctamente.');
      } else {
        alert('Hubo un error al actualizar los datos. Por favor, inténtelo de nuevo.');
      }
    })
    .catch(error => {
      console.log('Error al actualizar los datos:', error);
    });
});



document.addEventListener('DOMContentLoaded', function() {
  // Obtener el idUsuario, por ejemplo, desde una variable global o cualquier otra forma
  idUsuario = parseInt(getCookieValue("sessionId"));
  tipoUsuario = parseInt(getCookieValue("tipoUsuario"));
  if (!idUsuario || tipoUsuario != 2) {
    // Redirigir al usuario a la página de origen
    const url = "../Index.html"; 
    window.location.href = url;
    return;
  }
  // Llamar a la ruta del backend para obtener los datos del usuario
  fetch(`/usuario/${idUsuario}`)
    .then(response => response.json())
    .then(data => {
      // Utilizar los datos del usuario para actualizar la página
      // Por ejemplo, puedes asignar los valores a los campos del formulario
      document.getElementById('hNombre').textContent = data.nombre;
      document.getElementById('fecha-nacimiento').textContent = data.fechaNacimiento;
      document.getElementById('telefono').textContent = data.telefono;
      document.getElementById('estado').textContent = data.estado;
      document.getElementById('municipio').textContent = data.municipio;
      imagenPreview.src =(data.fotoPerfil.length > 0) ? data.fotoPerfil: "./fotoPerfil/blank.png";
    })
    .catch(error => {
      console.log('Error al obtener los datos del usuario:', error);
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
