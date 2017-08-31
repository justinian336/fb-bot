'use strict';

let dynamodb = new require('aws-sdk').DynamoDB();

let DYNAMO_TABLE = process.env['DYNAMO_TABLE'];

let createGetSurveyRequest = function(user){
	return {
		Key:{
			S: user
		},
		TableName: DYNAMO_TABLE
	}
}

let createNewSurveyRequest = function(user, question, value, status){
	let item = {};

	item[question] = {
		S: value
	}

	item[context] = {
		M: {
			"question": question,
			"status": status
		}
	}

	return {
		Item: item,
		TableName: DYNAMO_TABLE,
		ReturnConsumedCapacity: "TOTAL"
	}
}

let createUpdateSurveyRequest = function(user, question, value, status){
	let key = {
		"uuid":{
			S: user
		}
	}

	let expressionAttributeNames = {
		"#C": "context"
	}

	let expressionAttributeValues = {
		":c":{
			M:{
				"question": question,
				"status": status
			}
		}
	}

	if(value!= null){
		expressionAttributeNames["#Q"] = question;
		expressionAttributeValues["q"] = {
			S: value
		}

		let updateExpression = 'SET #Q = :q, context = :c'
	} else{
		let updateExpression = 'SET context = :c'
	}

	return {
		ExpressionAttributeNames: expressionAttributeNames,
		ExpressionAttributeValues: expressionAttributeValues,
		Key: key,
		ReturnValues: "ALL_NEW",
		TableName: DYNAMO_TABLE,
		UpdateExpression: updateExpression
	}
}

module.exports = {
	get: function(user, callback){
		let getParams = createGetSurveyRequest(user);
		dynamodb.getItem(getParams, (err, data)=>{
			if(err){
				log("Error: ", err);
				throw err
			} else{
				callback(data);
			}
		});
	},
	update: function(user, question, value, status, callback){
		let updateParams = createUpdateSurveyRequest(user, params);
		dynamodb.updateItem(updateParams, (err, data)=>{
			if(err){
				console.log("Error: ", err);
				throw err;
			} else{
				console.log("Successfully updated:", data);
				callback(data);
			}
		});
	},
	put: function(user, question, value, status, callback){
		let putParams = createNewSurveyRequest(user, question, value, status);
		dynamodb.putItem(putParams, (err, data)=>{
			if(err){
				console.log("Error: ", err);
				throw err;
			}
			else{
				console.log("Successfully stored:", data);
				callback(data);
			}
		});	
	},
	getAndPutOrPatch: function(user, question, value, status, callback){
		this.get(user, (data)=>{
			if(data.Item){
				update(user, question, value, status, callback);
			} else{
				put(user, question, value, status, callback)
			}
		});
	},
	setContext(user, context, callback){
		let setContextParams = createUpdateSurveyRequest(user, context.question, null, context.value);
		dynamodb.updateItem(setContextParams, (err, data)=>{
			if(err){
				console.log("Error: ", err);
				throw err;
			}
			console.log("Successfully set context:", data);
			callback(data);
		});
	},
	getContext(user, callback){
		this.get(user, (data)=>{
			if(data.Item){
				let context = data.Item.context;
				if(context){
					callback(context);
				} else {
					null
				}
			} else{


			}
		});
	}
}
