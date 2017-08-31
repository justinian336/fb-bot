'use strict';

let https = require('https'),
	dutils = require('./dynamo_utils.js');

const VERIFICATION_TOKEN = process.env['VERIFICATION_TOKEN'],
	PAGE_ACCESS_TOKEN = process.env['PAGE_ACCESS_TOKEN'],
	SECRET = process.env['SECRET'];


exports.handler = function(event, context, callback){
	console.log("Received an event: ", event);

// Handle verification request sent by Facebook
	if(event.queryStringParameters){
		handleVerificationRequest(event, callback);
	} else {
		handleUserInteraction(event, callback);
	}
};

let callSendAPI = function(messageData){
	let body = JSON.stringify(messageData),
		path = '/v2.6/me/messages?access_token=' + PAGE_ACCESS_TOKEN,
		options = {
			host: "graph.facebook.com",
			path: path,
			method: 'POST',
			headers:{
				'Content-Type': 'application/json'
			}
		},
		callback = function(response) {
		    console.log(response.statusCode);
    		let str = '';
    		response.on('data', function (chunk) {
      			str += chunk;
    		});
    		response.on('end', function () {});
  		},
  		req = https.request(options, callback);

  		req.on('error', (e) => {
  			console.log("Could not contact the Graph API");
  		});
  		
  	console.log("data ", body);

  	req.write(body);
  	req.end();
};

let handleVerificationRequest = function(event, callback){
	let queryParams = event.queryStringParameters,
		verificationToken = queryParams['hub.verify_token'];

		let response;
		if(verificationToken === VERIFICATION_TOKEN){
			response = {
				'body': parseInt(queryParams['hub.challenge']),
				'statusCode': 200
			}
		} else {
			response = {
				'body': 'Token equivocado',
				'statusCode': 422
			}
		callback(null, response);
		}
}

let handleUserInteraction = function(event, callback){
	let data = JSON.parse(event.body);
	data.entry.forEach((e)=>{
		e.messaging.forEach((m)=>{
		    if(m.message){
		    	if(m.message.quick_reply){
		    		let payload = m.message.quick_reply.payload;
		    		switch(payload){
		    			case 'GET_STARTED_PAYLOAD': 
		    				sendMenu(m.sender.id, 'Selecciona una de las opciones siguientes:');
		    				break;
		    			case 'CONOCER':
		    				sendMessage(m.sender.id, 'Este es un grupo de apoyo para alumni ESEN interesados en trabajar en temas de Desarrollo Económico.');
		    				break;
		    			case 'HACERSE_MIEMBRO':
		    				sendAskForData(m.sender.id, 'Aunque no es obligatorio, darnos a conocer más sobre ti nos ayudaría a darte un mejor servicio. ¿Deseas entrar al directorio de miembros?');
		    				break;
		    			// case 'ACTUALIZAR_DATOS':
		    			// 	sendSurveyUpdate(m.sender.id, '');
		    			// 	break;
		    			case 'SOBRE_MANEJO_DE_DATOS':
		    				sendMessage(m.sender.id, 'Los datos que proveas serán para uso exclusivo de este grupo y sus miembros.');
		    				break;
		    			default:
		    				sendMessage(m.sender.id, 'Beep beep');
		    		}
		    	}
		    	else{
					sendMenu(m.sender.id, 'Beep beep');
		    	}
		    }
		});
	});
	callback(null,{
			'body':'everything good',
			'statusCode':200
		});
}

let sendMenu = function(recipientId, text){
	let messageData = {
		recipient: {
			id: recipientId
		},
		message:{
			text: text,
			quick_replies: [
				{
					content_type: "text",
					title: "Acerca de",
					payload: "CONOCER"
				},
				{
					content_type: "text",
					title: "Entrar al grupo",
					payload: "HACERSE_MIEMBRO"
				},
				{
					content_type: "text",
					title: "Actualizar datos",
					payload: "ACTUALIZAR_DATOS"
				}
			]
		}
	};

	callSendAPI(messageData);
}

let sendMessage = function(recipientId, text){
	let messageData = {
		recipient:{
			id: recipientId
		},
		message:{
			text:text
		}
	}

	callSendAPI(messageData);
}

let sendAskForData = function(recipientId, text){
	let messageData = {
		recipient: {
			id: recipientId
		},
		message:{
			text: text,
			quick_replies: [
				{
					content_type: "text",
					title: "Registrarse",
					payload: "PROVEER_DATOS"
				},
				{
					content_type: "text",
					title: "No registrarse",
					payload: "NO_PROVEER_DATOS"
				},
				{
					content_type: "text",
					title: "Acerca del manejo de datos",
					payload: "SOBRE_MANEJO_DE_DATOS"
				}
			]
		}
	};
	callSendAPI(messageData);
}

let sendMakeQuestion = function(recipientId, text){
	let messageData = {
		recipientId: {
			id: recipientId
		},
		message:{
			text: text,
			quick_replies: [
			{
				content_type: "text",
				title: "No responder",
				payload: "NO_REPLY"
			}]
		}
	}

	callSendAPI(messageData);
};
