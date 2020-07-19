const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const places = require('./functions/places');
const geofirestore = require('geofirestore');

admin.initializeApp();

const database = admin.firestore();
const geofirestoreDB = geofirestore.initializeApp(database);

const app = express();

app.get('/places/:id/info',(request,response) => places.getInfo(request,response,geofirestoreDB));
app.get('/places/:id/recordPersonEntrance',(request,response) => places.recordPersonEntrance(request,response,geofirestoreDB));
app.get('/places/:id/recordPersonExit',(request,response) => places.recordPersonExit(request,response,geofirestoreDB));
app.post('/places/create',(request,response) => places.createNewPlace(request,response,geofirestoreDB));
app.get('/places/nearMe',(request,response) => places.getNearbyPlaces(request,response,geofirestoreDB));

exports.api = functions.https.onRequest(app);
