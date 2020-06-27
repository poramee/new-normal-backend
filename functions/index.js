const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const places = require('./functions/places');

admin.initializeApp();

const database = admin.firestore();

const app = express();

app.get('/places/:id',(request,response) => places.getInfo(request,response,database));




exports.api = functions.https.onRequest(app);
