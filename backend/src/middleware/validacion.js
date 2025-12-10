// backend/src/middleware/validacion.js

// Expresión regular básica para emails
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Valores permitidos
const TIPOS_SERVICIO_VALIDOS = ['instalacion', 'mantenimiento', 'reparacion', 'asesoria'];
const PRIORIDADES_VALIDAS = ['baja', 'media', 'alta'];

// Sanitizar string (asegura string + trim)
function sanitizeString(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

// Helper: responder con lista de errores
function enviarErrores(res, errores) {
  return res.status(400).json({
    success: false,
    message: 'Datos inválidos, revisa los campos indicados',
    errors: errores
  });
}

/* ---------------------------------------------------
 *  LOGIN
 * --------------------------------------------------- */
function validarLogin(req, res, next) {
  const errores = [];

  let email = sanitizeString(req.body?.email);
  const password = req.body?.password;

  if (!email) {
    errores.push({ campo: 'email', mensaje: 'El email es obligatorio' });
  } else {
    if (email.length > 100) {
      errores.push({ campo: 'email', mensaje: 'El email no puede superar 100 caracteres' });
    }
    email = email.toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      errores.push({ campo: 'email', mensaje: 'El formato de email no es válido' });
    }
  }

  if (typeof password !== 'string' || password.length === 0) {
    errores.push({ campo: 'password', mensaje: 'La contraseña es obligatoria' });
  } else if (password.length > 200) {
    errores.push({ campo: 'password', mensaje: 'La contraseña es demasiado larga' });
  }

  if (errores.length > 0) {
    return enviarErrores(res, errores);
  }

  // Normalizamos en el body para que server.js lo use
  req.body.email = email;
  req.body.password = password;

  next();
}

/* ---------------------------------------------------
 *  REGISTRO CLIENTE
 * --------------------------------------------------- */
function validarRegisterCliente(req, res, next) {
  const errores = [];

  let nombre = sanitizeString(req.body?.nombre);
  let email = sanitizeString(req.body?.email);
  const password = req.body?.password;
  let telefono = sanitizeString(req.body?.telefono);

  // Obligatorios
  if (!nombre) errores.push({ campo: 'nombre', mensaje: 'El nombre es obligatorio' });
  if (!email) errores.push({ campo: 'email', mensaje: 'El email es obligatorio' });
  if (!password) errores.push({ campo: 'password', mensaje: 'La contraseña es obligatoria' });
  if (!telefono) errores.push({ campo: 'telefono', mensaje: 'El teléfono es obligatorio' });

  // Longitudes
  if (nombre && nombre.length > 100) {
    errores.push({ campo: 'nombre', mensaje: 'El nombre no puede superar 100 caracteres' });
  }
  if (telefono && telefono.length > 20) {
    errores.push({ campo: 'telefono', mensaje: 'El teléfono no puede superar 20 caracteres' });
  }

  // Email
  if (email) {
    if (email.length > 100) {
      errores.push({ campo: 'email', mensaje: 'El email no puede superar 100 caracteres' });
    }
    email = email.toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      errores.push({ campo: 'email', mensaje: 'El formato de email no es válido' });
    }
  }

  // Password
  if (password && typeof password === 'string') {
    if (password.length < 6) {
      errores.push({ campo: 'password', mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    } else if (password.length > 100) {
      errores.push({ campo: 'password', mensaje: 'La contraseña no puede superar 100 caracteres' });
    }
  }

  if (errores.length > 0) {
    return enviarErrores(res, errores);
  }

  // Normalizados
  req.body.nombre = nombre;
  req.body.email = email;
  req.body.telefono = telefono;
  req.body.password = password;

  next();
}

/* ---------------------------------------------------
 *  CREAR SOLICITUD
 * --------------------------------------------------- */
function validarCrearSolicitud(req, res, next) {
  const errores = [];

  let titulo = sanitizeString(req.body?.titulo);
  let descripcion = sanitizeString(req.body?.descripcion);
  let direccion_servicio = sanitizeString(req.body?.direccion_servicio);
  let comuna = sanitizeString(req.body?.comuna);
  let region = sanitizeString(req.body?.region);
  let tipo_servicio = sanitizeString(req.body?.tipo_servicio || 'instalacion').toLowerCase();
  let prioridad = sanitizeString(req.body?.prioridad || 'media').toLowerCase();

  // Obligatorios
  if (!titulo) errores.push({ campo: 'titulo', mensaje: 'El título es obligatorio' });
  if (!descripcion) errores.push({ campo: 'descripcion', mensaje: 'La descripción es obligatoria' });
  if (!direccion_servicio) errores.push({ campo: 'direccion_servicio', mensaje: 'La dirección de servicio es obligatoria' });
  if (!comuna) errores.push({ campo: 'comuna', mensaje: 'La comuna es obligatoria' });
  if (!region) errores.push({ campo: 'region', mensaje: 'La región es obligatoria' });

  // Longitudes
  if (titulo && titulo.length > 200) {
    errores.push({ campo: 'titulo', mensaje: 'El título no puede superar 200 caracteres' });
  }
  if (descripcion && descripcion.length > 2000) {
    errores.push({ campo: 'descripcion', mensaje: 'La descripción no puede superar 2000 caracteres' });
  }
  if (direccion_servicio && direccion_servicio.length > 500) {
    errores.push({ campo: 'direccion_servicio', mensaje: 'La dirección no puede superar 500 caracteres' });
  }
  if (comuna && comuna.length > 50) {
    errores.push({ campo: 'comuna', mensaje: 'La comuna no puede superar 50 caracteres' });
  }
  if (region && region.length > 50) {
    errores.push({ campo: 'region', mensaje: 'La región no puede superar 50 caracteres' });
  }

  // tipo_servicio
  if (!TIPOS_SERVICIO_VALIDOS.includes(tipo_servicio)) {
    errores.push({
      campo: 'tipo_servicio',
      mensaje: `Tipo de servicio inválido. Debe ser uno de: ${TIPOS_SERVICIO_VALIDOS.join(', ')}`
    });
  }

  // prioridad
  if (!PRIORIDADES_VALIDAS.includes(prioridad)) {
    errores.push({
      campo: 'prioridad',
      mensaje: `Prioridad inválida. Debe ser una de: ${PRIORIDADES_VALIDAS.join(', ')}`
    });
  }

  if (errores.length > 0) {
    return enviarErrores(res, errores);
  }

  req.body.titulo = titulo;
  req.body.descripcion = descripcion;
  req.body.direccion_servicio = direccion_servicio;
  req.body.comuna = comuna;
  req.body.region = region;
  req.body.tipo_servicio = tipo_servicio;
  req.body.prioridad = prioridad;

  next();
}

/* ---------------------------------------------------
 *  ACTUALIZAR SOLICITUD (estado / técnico)
 * --------------------------------------------------- */
function validarActualizarSolicitud(req, res, next) {
  const errores = [];

  // estado_actual / estado
  if (req.body.estado_actual !== undefined || req.body.estado !== undefined) {
    let est = sanitizeString(req.body.estado_actual ?? req.body.estado);
    if (est.length === 0) {
      errores.push({ campo: 'estado_actual', mensaje: 'El estado no puede estar vacío si se envía' });
    } else if (est.length > 30) {
      errores.push({ campo: 'estado_actual', mensaje: 'El estado no puede superar 30 caracteres' });
    }
    // No validamos contra la lista aquí porque ya lo hace la lógica del server
  }

  // comentario
  if (req.body.comentario !== undefined) {
    let comentario = sanitizeString(req.body.comentario);
    if (comentario.length > 1000) {
      errores.push({ campo: 'comentario', mensaje: 'El comentario no puede superar 1000 caracteres' });
    }
    req.body.comentario = comentario;
  }

  // tecnico_id
  if (req.body.tecnico_id !== undefined && req.body.tecnico_id !== null && req.body.tecnico_id !== '') {
    const raw = req.body.tecnico_id;
    const parsed = parseInt(raw, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      errores.push({ campo: 'tecnico_id', mensaje: 'tecnico_id debe ser un número entero positivo' });
    } else {
      req.body.tecnico_id = parsed;
    }
  }

  if (errores.length > 0) {
    return enviarErrores(res, errores);
  }

  next();
}

/* ---------------------------------------------------
 *  CREAR/ACTUALIZAR USUARIO INTERNO (admin / técnico)
 * --------------------------------------------------- */
function validarCrearUsuario(req, res, next) {
  const errores = [];

  let email = sanitizeString(req.body?.email);
  let nombre = sanitizeString(req.body?.nombre);
  const password = req.body?.password;
  let telefono = sanitizeString(req.body?.telefono);
  let especialidad = sanitizeString(req.body?.especialidad);
  let rol = sanitizeString(req.body?.rol).toLowerCase();

  // Obligatorios básicos
  if (!email) errores.push({ campo: 'email', mensaje: 'El email es obligatorio' });
  if (!password) errores.push({ campo: 'password', mensaje: 'La contraseña es obligatoria' });
  if (!rol) errores.push({ campo: 'rol', mensaje: 'El rol es obligatorio' });

  // Rol
  if (rol && !['administrador', 'tecnico'].includes(rol)) {
    errores.push({ campo: 'rol', mensaje: 'El rol debe ser "administrador" o "tecnico"' });
  }

  // Email
  if (email) {
    if (email.length > 100) {
      errores.push({ campo: 'email', mensaje: 'El email no puede superar 100 caracteres' });
    }
    email = email.toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      errores.push({ campo: 'email', mensaje: 'El formato de email no es válido' });
    }
  }

  // Nombre
  if (nombre && nombre.length > 100) {
    errores.push({ campo: 'nombre', mensaje: 'El nombre no puede superar 100 caracteres' });
  }

  // Teléfono
  if (telefono && telefono.length > 20) {
    errores.push({ campo: 'telefono', mensaje: 'El teléfono no puede superar 20 caracteres' });
  }

  // Especialidad
  if (especialidad && especialidad.length > 500) {
    errores.push({ campo: 'especialidad', mensaje: 'La especialidad no puede superar 500 caracteres' });
  }

  // Password
  if (password && typeof password === 'string') {
    if (password.length < 6) {
      errores.push({ campo: 'password', mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    } else if (password.length > 100) {
      errores.push({ campo: 'password', mensaje: 'La contraseña no puede superar 100 caracteres' });
    }
  }

  if (errores.length > 0) {
    return enviarErrores(res, errores);
  }

  req.body.email = email;
  req.body.nombre = nombre;
  req.body.telefono = telefono;
  req.body.especialidad = especialidad;
  req.body.rol = rol;
  req.body.password = password;

  next();
}

module.exports = {
  validarLogin,
  validarRegisterCliente,
  validarCrearSolicitud,
  validarActualizarSolicitud,
  validarCrearUsuario,
};
