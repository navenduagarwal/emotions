'use strict';
console.log("Application starting to listen for images to find faces....");


var express = require('express');
var cors = require('cors');
var serviceAccount = require('./firebase-privatekey.json');
var fs = require('fs');
var firebase = require('firebase-admin');
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://spvision-f2ef7.firebaseio.com"
});
var ref = firebase.database().ref('faces');
// var userId = (Math.random() + 1).toString(36).substring(2, 12);



var gcloud = require('google-cloud')({
	projectId: 'spvision-f2ef7',
	keyFilename: 'firebase-privatekey.json'
});

//https://googlecloudplatform.github.io/gcloud-node/#/docs/vision
var vision = gcloud.vision();
var bodyParser = require('body-parser');
var app = express();

app.use(cors());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit:'50mb',extended: true }));

app.use(express.static('public'))

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
						var surprise = convertEmotionInfoToNum(apiResponse.responses[0].faceAnnotations[0].surpriseLikelihood);
						var rollAngle = apiResponse.responses[0].faceAnnotations[0].rollAngle;
						var panAngle = apiResponse.responses[0].faceAnnotations[0].panAngle;
						var tiltAngle = apiResponse.responses[0].faceAnnotations[0].tiltAngle;
						
						var browserId = req.body.browserId;
						console.log(browserId);
						var emotionsRef = ref.child(browserId);

						emotionsRef.set({happiness : happy, sadness: sad, anger: angry, surprise: surprise, rollAngle: rollAngle, panAngle: panAngle, tiltAngle: tiltAngle, numFaces: numFaces},function(data){
							console.log("emotion identified for face 1");
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
