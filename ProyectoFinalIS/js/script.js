// Frontend script
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');
const inputImagen = document.getElementById('imagen');
const imagenPreview = document.getElementById('imagen-preview');
const registroButton = document.getElementById('btnRegistro');

window.addEventListener('DOMContentLoaded', () => {
  const sessionId = getCookieValue('sessionId');
  if (sessionId) {
    // Redirigir al usuario a la página de origen
    const url = "../Trabajos.html"; 
    window.location.href = url;
  }
});


signUpButton.addEventListener('click', () => {
  container.classList.add('right-panel-active');
});

signInButton.addEventListener('click', () => {
  container.classList.remove('right-panel-active');
});

inputImagen.addEventListener('change', function (e) {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    imagenPreview.src = e.target.result;
    imagenPreview.classList.remove('img-placeholder');
    registroButton.style.display = 'block';
  };

  if (file) {
    reader.readAsDataURL(file);
  } else {
    imagenPreview.src = '';
    imagenPreview.classList.add('img-placeholder');
    registroButton.style.display = 'none';
  }
});


registroButton.addEventListener('click', function (e) {
  e.preventDefault();
  const nombre = document.getElementById('txtNombre').value;
  const apellidoP = document.getElementById('txtAP').value;
  const apellidoM = document.getElementById('txtAM').value;
  const correo = document.getElementById('txtemail').value;
  const contrasena = document.getElementById('txtpass').value;
  let tipoUsuario;

  if (!nombre || !apellidoP || !apellidoM || !correo || !contrasena) {
    alert("Para registrarse, todos los campos son obligatorios");
    return;
  }

  if (document.getElementById('rdnCliente').checked) {
    tipoUsuario = 1;
  } else if (document.getElementById('rdnTrabajador').checked) {
    tipoUsuario = 2;
  } else {
    alert('Debes seleccionar un tipo de usuario');
    return;
  }
  const file = inputImagen.files[0];

  if (!file) {
    alert('Debes seleccionar una imagen');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  fetch('http://localhost:3000/upload', {
    method: 'POST',
    body: formData
  })
    .then((response) => response.text())
    .then((result) => {
      const INE = result;

      const userData = {
        nombre,
        apellidoP,
        apellidoM,
        correo,
        contrasena,
        INE,
        tipoUsuario,
      };

      fetch('http://localhost:3000/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      })
        .then((response) => response.text())
        .then((result) => {
          if (result === 1) {
            location.reload();
          }
          else if (result === 1) {
            alert("Correo electrónico repetido");
          }
          else {
            alert("Para registrarse debe llenar todos los campos");
          }
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    })
    .catch((error) => {
      console.error('Error:', error);
    });
});


document.getElementById('btnSesion').addEventListener('click', function (event) {
  event.preventDefault();

  const correo = document.getElementById('correo').value;
  const contrasena = document.getElementById('contrasena').value;

  if (!correo || !contrasena) {
    alert("Debes de llenar todos los campos para iniciar sesión");
    return;
  }

  fetch('http://localhost:3000/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',

    },
    'credentials': 'include', // Enviar cookies de sesión
    body: JSON.stringify({ correo, contrasena })
  })
    .then((response) => response.json())
    .then((result) => {
      if (result === true) {
        const tipoUsuario = parseInt(getCookieValue('tipoUsuario'), 10);
        if (tipoUsuario === 1) {
          console.log("tipo 1");
          window.location.href = "../Trabajos.html";
        } else if (tipoUsuario === 2) {
          console.log("tipo 2");
          window.location.href = "../perfilTrabajador.html";
        }
      } else{
        alert("Credenciales inválidas");
      }
    })
    .catch((error) => {
      console.error('Error:', error);
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