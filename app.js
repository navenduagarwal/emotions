'use strict';
var express = require('express');
var cors = require('cors');
var fs = require('fs');
var MilkCocoa = require('milkcocoa');
var gcloud = require('google-cloud')({
	projectId: 'monalisa-e921b',
	keyFilename: 'monalisa-e73595d3fd2c.json'
});

var milkcocoa = new MilkCocoa('MILKCOCOA_ID');
var ds = milkcocoa.dataStore('DATASTORE_NAME');

//https://googlecloudplatform.github.io/gcloud-node/#/docs/vision
var vision = gcloud.vision();
var bodyParser = require('body-parser');
var app = express();
console.log("Application started and listening for images to find faces....");

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit:'50mb',extended: true }));

app.use('/static', express.static('public'))

app.post('/submit', function(req, res){
	fs.writeFile('image.jpeg', decodeBase64Image(req.body.dataUri), function(err){

		vision.detectFaces('image.jpeg', function(err, faces, apiResponse){
			if (err) {
				console.log(err);
				return res.send(err);
			} else {
				var numFaces = faces.length;
				console.log('Found ' + numFaces + (numFaces === 1 ? ' face' : ' faces'));
				if(numFaces>0){
					if (apiResponse.responses[0].faceAnnotations) {
						console.log(apiResponse.responses[0].faceAnnotations[0]);
						var happy = convertEmotionInfoToNum(apiResponse.responses[0].faceAnnotations[0].joyLikelihood);
						var sad = convertEmotionInfoToNum(apiResponse.responses[0].faceAnnotations[0].sorrowLikelihood);
						var angry = convertEmotionInfoToNum(apiResponse.responses[0].faceAnnotations[0].angerLikelihood);

						ds.push({happiness : happy, sadness: sad, anger: angry},function(data){
							console.log("送信完了!");
						});
					}
				}
			}
			res.send('（・・`）');
		});
	});
});

app.listen(3000);

function convertEmotionInfoToNum (emotion) {
	return ({
		VERY_UNLIKELY: 0,
		UNLIKELY: 1,
		POSSIBLE: 2,
		LIKELY: 3,
		VERY_LIKELY: 4
	})[emotion]
}

// http://stackoverflow.com/a/20272545/114157
function decodeBase64Image(dataString) {
	var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
	response = {}

	if (matches.length !== 3) {
		return new Error('Invalid input string')
	}

	response.type = matches[1]
	response.data = new Buffer(matches[2], 'base64')

	return response.data
}
