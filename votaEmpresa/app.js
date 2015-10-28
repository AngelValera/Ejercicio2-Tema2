var express = require('express');
var http = require('http');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var routes = require('./routes');
var users = require('./routes/user');
var session = require('express-session');
var assert = require('assert');
var app = express();
//-----------------------------------------------------------------------------------------------------------------------------------------
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
//-----------------------------------------------------------------------------------------------------------------------------------------
app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret: '123456', resave: true, saveUninitialized: true}));
app.use(app.router);
//-----------------------------------------------------------------------------------------------------------------------------------------
app.get('/', routes.index);
app.get('/users', users.list);
//-----------------------------------------------------------------------------------------------------------------------------------------
app.get('/login', function(req, res){
  res.render('login', { title:'Identificar' });
});
app.get('/RegistroAlumno', function(req, res){
  res.render('RegistroAlumno', { title:'Registrar' });
});
app.get('/votacion', login, function(req, res){
  res.render('votacion', { title:'Votaciones', usuario: req.session.nombre});
});
app.get('/inscribirEmpresa', function(req, res){
  res.render('inscribirEmpresa', { title:'Inscribe tu empresa' });
});
app.get('/clasificacion', function(req, res){
  res.render('clasificacion', { title:'Clasificación de las empresas' });
});
//-----------------------------------------------------------------------------------------------------------------------------------------
// Funcion que permite loguearte
function login(req, res, next){
  if( typeof req.session.nombre!='undefined'){
    next();
  }else{
    res.redirect('/login');
    res.send('no esta identificado');
  }
};
//-----------------------------------------------------------------------------------------------------------------------------------------
//Funcion para conectar a la base de datos
function BD(){
  var conexion = mysql.createConnection({
    user: 'root',
    password: '1',
    host: 'localhost',
    port: 3306,
    database: 'ejercicioIV'
  });
  return conexion;
}
//-----------------------------------------------------------------------------------------------------------------------------------------
//Permite registrar un alumno
app.post('/registrarAlumno', function(req, res){
  var objBD = BD();
  var email = req.body.txtEmail;
  var nombre = req.body.txtNombre;
  var apellidos = req.body.txtApellidos;
  var contraseña = req.body.txtClave;
  objBD.query('INSERT INTO `ejercicioIV`.`alumnos` (`email`, `contraseña`, `nombre`, `apellidos`) VALUES ("'  + email +  '", "'+ contraseña +'", "'+ nombre +'", "'+ apellidos +'")', function( error ){
    if(error){
      console.log(error.message);
      res.send('Registro del alumno inválido o el usuario ya está registrado');
    }else{
      console.log('Insertado');
      req.session.nombre = email;
      res.redirect('/');
    }
  });
});
//-----------------------------------------------------------------------------------------------------------------------------------------
//Permite insertar una nueva puntuación
app.post('/registrarVoto', function(req, res){
  var objBD = BD();
  var nombreEmpresa = req.body.txtEmpresa;
  var nota = req.body.txtNota;
  var user = req.session.nombre;

  objBD.query('INSERT INTO `ejercicioIV`.`votacion` (`email` ,`empresa` ,`nota`) VALUES ("'+ user +'","'+ nombreEmpresa +'","'+ nota +'")', function( error ){
    if(error){
      console.log(error.message);
      res.send('Puntuación inválida o ya realizaste esa puntuación');
    }else{
      console.log('Insertado');
      res.redirect('/clasificacion');
    }
  });
});
//-----------------------------------------------------------------------------------------------------------------------------------------
//Permite inscribir una empresa
app.post('/inscribirEmpresa', function(req, res){
  var objBD = BD();
  var nombreEmpresa = req.body.txtNombreEmpresa;

  objBD.query('INSERT INTO `ejercicioIV`.`empresas` (`nombre`) VALUES ("'+ nombreEmpresa +'")', function( error ){
    if(error){
      console.log(error.message);
      res.send('Inscripción de la empresa inválida o la empresa ya está registrada');
    }else{
      console.log('Insertado');
      res.redirect('/');
    }
  });
});
//-----------------------------------------------------------------------------------------------------------------------------------------
//Permite autenticar un usuario
app.post('/autenticar', function(req, res){
  var objBD = BD();
  var email = req.body.txtEmail;
  var clave = req.body.txtClave;

    assert(email, "email del alumno");
   assert(clave, "clave del alumno");
   console.log("Identificación completada con éxito");

  objBD.query('SELECT * FROM alumnos WHERE email LIKE "'+ email +'" AND contraseña LIKE "'+ clave +'"', function( error, resultado, fila){
    if(!error){
      if(resultado.length > 0){
        req.session.nombre = email;
        res.redirect('/votacion');
      }else{
        res.send('El usuario no existe o sus datos son incorrectos');
      }
    }else{
      console.log('Error');
    }
  });
});
//-----------------------------------------------------------------------------------------------------------------------------------------
//funcion para cerrar la session
app.post('/salir', function(req, res){
  delete req.session.nombre;
  res.redirect('/');
});
//-----------------------------------------------------------------------------------------------------------------------------------------
//Permite mostrar todas las empresas del sistema
app.get('/mostrarEmpresas', login,  function(req, res){
  var objBD = BD();
  objBD.query('SELECT nombre FROM empresas ', function( error, resultado, fila){
    if(!error){
      if(resultado.length > 0){
      res.render('votar.jade', { empresas:resultado } );

      }else{
        res.send('No hay empresas en el sistema');
      }
    }else{
      console.log('Error');
    }
  });
});
//-----------------------------------------------------------------------------------------------------------------------------------------
//Permite mostrar todas las empresas, la puntuación y el alumno que realizó la puntuacion del sistema
app.get('/mostrarclasificacion',  function(req, res){
  var objBD = BD();
  objBD.query('SELECT * FROM votacion ', function( error, resultado, fila){
    if(!error){
      if(resultado.length > 0){
      res.render('clasificacion.jade', {datos:resultado } );

      }else{
        res.send('No hay empresas en el sistema');
      }
    }else{
      console.log('Error');
    }
  });
});

//-----------------------------------------------------------------------------------------------------------------------------------------
/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
