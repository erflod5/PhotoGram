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
        let base64 = body.base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)[2];
        let extension = body.extension;
        let username = body.username;
        let password = body.password;

        //Decoded Image
        let decodedImage = Buffer.from(base64,'base64');
        let filename = `${username}-${uuid()}.${extension}`;
    
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
                dynDb.putItem({
                    TableName : "uPhotos",
                    Item : {
                        "username" : {S: username},
                        "password" : {S: password},
                        "profileImg" : {S: data.Location}
                    }
                }, (err,data2)=>{
                    if(err){
                        console.log('Error saving data:', err);
                        res.send({ 'message': 'ddb failed' });
                    }
                    else{
                        console.log('Save success:', data2);
                        res.send({ username : username, src : data.Location });
                    }
                });
            }    
        });
    }
    else {
        let username = body.username;
        let password = body.password;
        console.log(username);
        console.log(password);
        dynDb.putItem({
            TableName : "uPhotos",
            Item : {
                "username" : {S: username},
                "password" : {S: password}
            }
        }, (err,data)=>{
            if(err){
                console.log('Error saving data:', err);
                res.send({ 'message': 'ddb failed' });
            }
            else{
                console.log('Save success:', data);
                res.send({ 'message': 'ddb success' });
            }
        });
    }
});

app.post('/api/signin',(req,res)=>{

});

app.listen(app.get('port'),()=>{
    console.log("Servidor corriendo en el puerto " + app.get('port'));
});