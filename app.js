var express = require('express');
var app = express('');
var hbs = require('express-handlebars');
var mongoose = require('mongoose');
var session = require('express-session')
app.use(session({ secret: 'cmvnbalksdjriut2554sdfkjgh' }));
app.engine('handlebars', hbs());
app.set('view engine', 'handlebars');
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true })); // para recibir info de formulario
app.use(express.json());



// **CONEXION PROMISE** //
mongoose.connect(
    'mongodb://127.0.0.1',
    { useNewUrlParser: true }
).then(function () {
    console.log('Conectado Local!');
});

// **BASE DE REGISTRO DE USUARIO** //
const UsuarioSchema = mongoose.Schema({
    nombre: String,
    apellido: String,
    email: String,
    password: String
})
const UsuarioModel = mongoose.model('usuario', UsuarioSchema);
UsuarioModel.create({
    nombre: '',
    apellido: '',
    email: '',
    password:''
});

// **BASE DE NOTAS** //
const DiarioSchema = mongoose.Schema({
    estado: String,
    text: String,
    user_id: String

})
const DiarioModel = mongoose.model('Diario', DiarioSchema);
app.get('/alta', function (req, res) {
    res.render('formulario');
})

// **REGISTRARSE NOMBRE-APELLIDO-EMAIL** //
app.get('/signin', function (req, res) {
    res.render('alta');
});
app.post('/signin', async function (req, res) {
    if (req.body.nombre == "" || req.body.apellido == "" || req.body.email == "") {
        res.render('alta', {
            error: 'Es obligatorio el email',
            datos: req.body
        });
        return;
    }
    await UsuarioModel.create({
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        email: req.body.email,
        password: req.body.password
    });
    res.redirect('/login')
});

// **INGRESAR USUARIO-PASSWORD** //
app.get('/login', function (req, res) {
    res.render('login');
});
app.post('/login', async function (req, res) {
    var usuarios = await UsuarioModel.find({
        username: req.body.email,
        password: req.body.password,
    });
    if (usuarios.length != 0) {
        req.session.user_id = usuarios[0]._id;
        res.redirect('/listado');
    } else {
        res.send('incorrecto');
    }
});

// **HANDLEBARS FORMULARIO** //
app.get('/formulario', async function (req, res) {
    var listados = await DiarioModel.find();
    res.render('formulario', { alta: listados });
});
app.post('/formulario', async function (req, res) {
    if (req.body.text == '') {
        res.render('formulario', {
            error: 'El campo es obligatorio',
            datos: {
                text: req.body.text,
            }
        });
        return;
    }
    await DiarioModel.create({
        estado: req.body.estado,
        text: req.body.text,
        user_id: req.session.user_id
    })
    res.redirect('/listado');
});

// **HANDLEBARS LISTADO** //
app.get('/listado', async function (req, res) {
    if (!req.session.user_id) {
        res.redirect('/login');
        return;
    }
    var abc = await DiarioModel.find({user_id: req.session.user_id}).lean();
    res.render('listado', { listado: abc });
});

// **AGREGAR NOTA** //
app.get('/formulario', async function (req, res) {
    var nuevoDiario = await DiarioModel.create(
        { estado: 'NA', text: 'NA' }
    );
    res.send(nuevoDiario);
});

// **BORRAR NOTA** //
app.get('/borrar/:id', async function (req, res) {
    await DiarioModel.findByIdAndRemove(
        { _id: req.params.id });
    res.redirect('/listado');
});

// **EDITAR NOTA** //
app.get('/editar/:id', async function (req, res) {
    var Diario = await DiarioModel.findById(
        { _id: req.params.id }
    ).lean();
    res.render('formulario', { datos: Diario });
});
app.post('/editar/:id', async function (req, res) {
    if (req.body.text == '') {
        res.render('formulario', {
            error: 'El campo es obligatorio',
            datos: {
                text: req.body.text,
            }
        })
        return;
    }
    await DiarioModel.findByIdAndUpdate(
        { _id: req.params.id },
        {
            text: req.body.text,
        }
    );
    res.redirect('/listado');
});

// **API REST** //
app.get('/api/Diarios', async function (req, res) {
    var listado = await DiarioModel.find().lean();
    res.json(listado);
});

app.get('/api/Usuarios', async function (req, res) {
    var listado = await UsuarioModel.find().lean();
    res.json(listado);
});

// **API REST GET BUSCAR POR ID** //
app.get('/api/Diarios/:id', async function (req, res) {
    try {
        var unDiario = await DiarioModel.findById(req.params.id);
        res.json(unDiario);
    } catch (e) {
        res.status(404).send('error')
    }
})

// **API REST POST CREAR** //
app.post('/api/Diarios', async function (req, res) {
    var Diario = DiarioModel.create({
        estado: req.body.estado,
        text: req.body.text,
    });
    res.json(Diario);
})

// **API REST PUT ACTUALIZAR** //
app.put('/api/Diarios/:id', async function (req, res) {
    try {
        await DiarioModel.findByIdAndUpdate(
            req.params.id,
            {
                estado: req.body.estado,
                text: req.body.text,
            }
        );
        res.status(200).send('ok');
    } catch (e) {
        res.status(404).send('error');
    }
});

// **API REST ELIMINAR** //
app.delete('/api/Diarios/:id', async function (req, res) {
    try {
        DiarioModel.findByIdAndDelete(req.params.id);
        res.status(20).send('ok');
    } catch (e) {
        res.status(404).send('no encontrado');
    }
});


app.listen(80, function () {
    console.log('App en localhost');
});
