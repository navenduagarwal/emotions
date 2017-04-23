# Emotions Example using - Firebase and Google Cloud Vision API

add config.js file with firebase config details. In following format:

var config = {
  apiKey: "<API_KEY>",
  authDomain: "<PROJECT_ID>.firebaseapp.com",
  databaseURL: "https://<DATABASE_NAME>.firebaseio.com",
  storageBucket: "<BUCKET>.appspot.com",
};

Add service account private key from your firebase console as firebase-privatekey.json, also do remember to change database read permissions to true.
