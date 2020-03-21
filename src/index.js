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
app.set('port', process.env.PORT || 3000);
app.use(cors());

//Midlewares
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: false }));

//AWS
const s3 = new AWS.S3(aws_keys.s3);
const dynDb = new AWS.DynamoDB(aws_keys.dynamodb);
const rekognition = new AWS.Rekognition(aws_keys.rekognition);

//Routes
app.post('/api/signin', (req, res) => {
    let body = req.body;

    if (body.base64) {
        let base64 = body.base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)[2];
        let extension = body.extension;
        let username = body.username;
        let password = body.password;

        //Decoded Image
        let decodedImage = Buffer.from(base64, 'base64');
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
        s3.upload(uploadParamsS3, function sync(err, data) {
            if (err) {
                console.log('Error uploading file:', err);
                res.send({ status: false })
            }
            else {
                console.log('Upload success at:', data.Location);
                dynDb.putItem({
                    TableName: "uPhotos",
                    Item: {
                        "username": { S: username },
                        "password": { S: password },
                        "profileImg": { S: data.Location },
                        "pictures": { L: [] }
                    },
                    ConditionExpression: 'attribute_not_exists(username)'
                }, (err, data2) => {
                    if (err) {
                        console.log('Error saving data:', err);
                        res.send({ status: false });
                    }
                    else {
                        console.log('Save success:', data2);
                        res.send({ username: username, src: data.Location });
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
            TableName: "uPhotos",
            Item: {
                "username": { S: username },
                "password": { S: password },
                "pictures": { L: [] },
                "src": { S: "" }
            },
            ConditionExpression: 'attribute_not_exists(username)'
        }, (err, data) => {
            if (err) {
                console.log('Error saving data:', err);
                res.send({ status: false });
            }
            else {
                console.log('Save success:', data);
                res.send({ username: username, src: 'https://images.pexels.com/photos/38238/maldives-ile-beach-sun-38238.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' });
            }
        });
    }
});

app.post('/api/upload', (req, res) => {
    let body = req.body;
    let base64 = body.base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)[2];
    let extension = body.extension;
    let username = body.username;

    //Decoded Image
    let decodedImage = Buffer.from(base64, 'base64');
    let filename = `${username}-${uuid()}.${extension}`;

    //S3 params 
    let bucketname = 'bucketfotosg5';
    let folder = 'fotos/';
    let filepath = `${folder}${filename}`;

    var uploadParamsS3 = {
        Bucket: bucketname,
        Key: filepath,
        Body: decodedImage,
        ACL: 'public-read',
    };

    s3.upload(uploadParamsS3, function sync(err, data) {
        if (err) {
            console.log('Error uploading file:', err);
            res.send({ 'message': 'failed' })
        }
        const params = {
            Image: {
                S3Object: {
                    Bucket: bucketname,
                    Name: filepath
                }
            },
            MaxLabels: 10
        }
        var paramsCompare = {
            SimilarityThreshold: 80,
            TargetImage: {
                S3Object: {
                    Bucket: bucketname,
                    Name: filepath
                }
            },
            SourceImage: {
                S3Object: {
                    Bucket: bucketname,
                    Name: 'usuarios/' + body.profile
                }
            }
        };
        rekognition.detectLabels(params, (err, dataRek) => {
            if (err) {
                console.log('Error: ' + err);
            }
            rekognition.compareFaces(paramsCompare, function (err, response) {
                var aparece = false;
                if (err) {
                    console.log(err);
                }
                else {
                    response.FaceMatches.forEach(data => {
                        let position = data.Face.BoundingBox
                        let similarity = data.Similarity
                        console.log(`The face at: ${position.Left}, ${position.Top} matches with ${similarity} % confidence`);
                        if (similarity > 90)
                            aparece = true;
                    });
                }

                dynDb.updateItem({
                    TableName: "uPhotos",
                    Key: { "username": { S: username } },
                    UpdateExpression: "SET #attrName = list_append(#attrName,:attrValue)",
                    ExpressionAttributeNames: {
                        "#attrName": "pictures"
                    },
                    ExpressionAttributeValues: {
                        ":attrValue": {
                            L: [
                                {
                                    M:
                                    {
                                        "src": { "S": data.Location },
                                        "tag": { "S": dataRek.Labels[0].Name },
                                        "itsme": { "BOOL": aparece }
                                    }
                                }
                            ]
                        }
                    },
                    ReturnValues: "UPDATED_NEW"
                }, (err, data) => {
                    if (err) {
                        console.log('Error saving data:', err);
                        res.send({ 'message': 'ddb failed' });
                    }
                    else {
                        console.log('Update success:', data);
                        res.send(data);
                    }
                });
            });
        });
    });
});


//COMPARACION DE FOTO DE PERFIL PARA EL LOGIN.

app.get(`/api/getUsers`, (request, response) => {


    let params = {
        TableName: "uPhotos",
    };

    dynDb.scan(params, function (err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            //console.log("Success", data.Items);
            data.Items.forEach(function (element, index, array) {
                console.log(element);
            });

        }

        response.json(data);
    });

});

app.post(`/api/iniciarSesion`, (req, response) => {
    let params = {
        TableName: "uPhotos",
    };

    let body = req.body;
    const similarity = 90;//porcentaje de similitud
    const source = body.sourceBase64; //dirección relativa de la imagen origen (captura)
    const buffer = new Buffer.from(source, 'base64');

    dynDb.scan(params, async function (err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            var respuesta = {
                statusCode: 200,
                estado: false
            }
            //console.log('Aqui voy');
            for (let i = 0; i < data.Items.length; i++) {
                console.log(i + ', ' + data.Items[i].username.S);
                //comparar con imagen.
                if (data.Items[i].profileImg == null) {
                    console.log('Es null: ' + data.Items[i].username);
                    return;
                }
                const imagen = data.Items[i].profileImg.S.replace('https://bucketfotosg5.s3.us-east-2.amazonaws.com/', '');
                var params = {
                    SimilarityThreshold: similarity,
                    SourceImage: {
                        Bytes: buffer
                    },
                    TargetImage: {
                        S3Object:
                        {
                            Bucket: "bucketfotosg5",
                            Name: imagen
                        }
                    }
                }
                const datos = await rekognition.compareFaces(params).promise();

                if (datos.FaceMatches.length > 0) {
                    respuesta = {
                        statusCode: 200,
                        similutud: JSON.stringify(datos.FaceMatches[0].Similarity),
                        body: JSON.stringify({ "message": datos }),
                        estado: true,
                        username: data.Items[i].username,
                        src: data.Items[i].profileImg.S
                    }
                    console.log(respuesta);
                    response.json(respuesta);
                    return;
                }
                console.log('Imagen: ' + imagen);
                // });
                //console.log(element);
            }
            console.log(respuesta);
            response.json(respuesta);
            return;
        }
    });
});

app.post(`/api/login`, (req, response) => {
    let params = {
        TableName: "uPhotos",
    };

    let body = req.body;

    dynDb.scan(params, async function (err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            var respuesta = {
                statusCode: 200,
                estado: false
            }
            for (const element of data.Items) {
                if(element.username.S == body.username){
                    if(element.password.S == body.password){ //Ingreso correcto
                        respuesta = {
                            statusCode: 200,
                            estado: true,
                            username: element.username.S,
                            src: element.profileImg.S
                        }
                        response.json(respuesta);
                        return;
                    }
                }
            }
            console.log(respuesta);
            response.json(respuesta);
            return;
        }
    });
});







app.listen(app.get('port'), () => {
    console.log("Servidor corriendo en el puerto " + app.get('port'));
});

/*function foo(arg, callback) {
    if (arg < 0) {
        callback('error');
        return;
    }
    console.log(arg);
    callback(null, arg + 1);
    return arg;

}

function bar(arg, callback) {
    if (arg < 0) {
        callback('error');
        return;
    }
    console.log(arg);
    return arg;
    //callback(null, arg + 2);
}

function baz(arg, callback) {
    if (arg < 0) {
        callback('error');
        return;
    }
    console.log(arg);
    return arg;
    //callback(null, arg + 3);
}


async function fooBarBaz(arg) {
    try {
        const fooResponse = await foo(arg + 1);
        const barResponse = await bar(fooResponse + 1);
        const bazResponse = await baz(barResponse + 1);
        console.log(bazResponse);
        return bazResponse;
    } catch (error) {
        return Error(error);
    }
}

fooBarBaz(1);
*/