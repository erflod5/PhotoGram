//Libs, Modules & Package
const express = require('express');
const cors = require('cors');

//Inicializaciones
const app = express();

//Configuraciones
app.set('port',process.env.PORT || 3000);
app.use(cors());

//Midlewares
app.use(express.json());
app.use(express.urlencoded({extended :false}));

app.listen(app.get('port'),()=>{
    console.log("Servidor corriendo en el puerto " + app.get('port'));
});