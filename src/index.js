//Libs, Modules & Package
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const AWS = require('aws-sdk');
const aws_keys = require('./keys/awsKeys');
var uuid = require('uuid');

//Inicializaciones
const app = express();

//Configuraciones
app.set('port',process.env.PORT || 3000);
app.use(cors());

//Midlewares
app.use(express.json({limit : '5mb'}));
app.use(express.urlencoded({limit : '5mb',extended :false}));

//AWS
const s3 = new AWS.S3(aws_keys.s3);
const dynDb = new AWS.DynamoDB(aws_keys.dynamodb);

//Routes
app.post('/api/upload',(req,res)=>{
    let body = req.body;

    if(body.base64){
        let base64 = body.base64;
        let extension = body.extension;
        let name = body.name;
    
        //Decoded Image
        let decodedImage = Buffer.from(base64,'base64');
        let filename = `${name}-${uuid()}.${extension}`;
    
        //S3 params
        let bucketname = 'bucketfotosg5';
        let folder = 'usuarios/';
        let filepath = `${folder}${filename}`;
        var uploadParamsS3 = {
            Bucket: bucketname,
            Key: filepath,
            Body: decodedImage,
            ACL: 'public-read',
        };
        s3.upload(uploadParamsS3, function sync(err,data){
            if (err) {
                console.log('Error uploading file:', err);
                res.send({ 'message': 'failed' })
              } 
            else {
                console.log('Upload success at:', data.Location);
                res.send({ 'message': 'uploaded' })
            }    
        });
    }
    else {

    }
});

app.post('/api/signin',(req,res)=>{

});

app.listen(app.get('port'),()=>{
    console.log("Servidor corriendo en el puerto " + app.get('port'));
});