const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    var name = event['username'];
    
    var params = {
        TableName: 'uPhotos',
        ProjectionExpression: 'pictures',
        KeyConditionExpression : 'username = :user',
        ExpressionAttributeValues : {":user" : name}    
      };

    let data = await docClient.query(params).promise();
    
    const response = {
        statusCode: 200,
        body: data.Items,
    };
    return response;
};
