# Servidor Web
Para correr el servidor, ejecutar los siguientes comandos
````sh
git clone https://github.com/erflod5/Semi1_Practica1.git
cd Semi1_Practica1
npm install
npm run dev
````
## Requisitos
### Node && NPM
````
https://nodejs.org/en/download/package-manager/
````

### Nodemon
Es una herramienta que ayuda a desarrollar aplicaciones basadas en node.js al reiniciar automáticamente la aplicación de nodo cuando se detectan cambios en el directorio.
````
npm i nodemon -d
````

### Express
Infraestructura web rápida, minimalista y flexible para Node.js
````
npm i express
````

### Aws-sdk
El SDK oficial de AWS para JavaScript, disponible para navegadores y dispositivos móviles, o backends de Node.js
````
npm i aws-sdk
````

## Rutas
### Signin
* **Funcion:** Registra un nuevo usuario en el sistema.
* **Metodo:** POST
* **Formato de Envio:** JSON
* **Body:**
````js
		{
			base64: string,
			extension : string,
			username : string,
			password : string
		}
````
* **Formato de Respuesta:** JSON
* **Estructura de Respuesta Correcta:**
````js
		{
			username : string,
			src : string
		}
````
* **Estructura de Respuesta Incorrecta:**
````js
		{
			status: false		
		}
````
* **Servicios utilizados:** La foto de perfil se almacena en S3 y la informacion del usuario en DynamoDB.
### Upload
* **Funcion:** Sube una nueva fotografia de un usuario en especifico, registra tambien el Tag de la imagen y si el usuario aparece en la foto.
* **Metodo:** POST
* **Formato de Envio:** JSON
* **Body:**
````js
		{
			base64: string,
			extension : string,
			username : string
		}
````
* **Formato de Respuesta:** JSON
* **Estructura de Respuesta Correcta:**
````js
		{
			src: "url de la imagen"
		}
````
* **Estructura de Respuesta Incorrecta:**
````js
		{
			status: false
		}
````
* **Servicios Utilizados:** S3 para guardar la imagen subida, DynamoDb para guardar la informacion de la imagen y Rekognition para determinar el Tag de la imagen y si el usuario aparece en dicha imagen.

### iniciarSesion
* **Funcion:** Inicio de sesion de un usuario, mediante reconocimiento facial.
* **Metodo:** POST
* **Formato de Envio:** JSON
* **Body:**
````js
		{
			sourceBase64: string
		}
````
* **Formato de Respuesta:** JSON
* **Estructura de Respuesta Correcta:**
````js
		{
			src: string,
			username : string,
			status : true
		}
````
* **Estructura de Respuesta Incorrecta:**
````js
		{
			status: false
		}
````
* **Servicios Utilizados:** DynamoDb para obtener los usuarios registrados, S3 para obtener las imagenes de perfil y Rekognition para realizar el reconocimiento facial.

### login
* **Funcion:** Inicio de sesion de un usuario, mediante username y password.
* **Metodo:** POST
* **Formato de Envio:** JSON
* **Body:**
````js
		{
			username : string,
			password : string
		}
````
* **Formato de Respuesta:** JSON
* **Estructura de Respuesta Correcta:**
````js
		{
			status : true,
			src: string,
			username : string
		}
````
* **Estructura de Respuesta Incorrecta:**
````js
		{
			status: false
		}
````
* **Servicios Utilizados:** DynamoDb para comparar credenciales del usuario ingresado con los usuarios almacenados.