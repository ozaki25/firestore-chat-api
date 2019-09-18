const serverless = require('serverless-http');
const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const serviceAccount = require('./serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://ippo-app.firebaseio.com',
});

const db = admin.firestore();
const messagesRef = db.collection('messages');
const imagesRef = db.collection('imagees');

const app = express();
app.use(bodyParser.json());

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept',
  );
  next();
});

app.get('/', (req, res) => {
  res.send('Hello');
});

app.get('/messages', async (req, res) => {
  try {
    const snapshots = await messagesRef
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();
    let messages = [];
    snapshots.forEach(doc => messages.push(doc.data()));
    console.log({ messages });
    res.send(messages);
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send(e);
  }
});

app.post('/messages', async (req, res) => {
  try {
    console.log(req.body);
    const { content } = req.body;
    if (content) {
      const message = {
        content,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      };
      await messagesRef.add(message);
      res.send(message);
    } else {
      res.send(null);
    }
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send(e);
  }
});

app.get('/images', async (req, res) => {
  try {
    const snapshots = await imagesRef
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();
    let images = [];
    snapshots.forEach(doc => images.push(doc.data()));
    console.log({ images });
    res.send(images);
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send(e);
  }
});

app.post('/images', async (req, res) => {
  try {
    console.log(req.body);
    const { url, comment, caption } = req.body;
    if (url) {
      const image = {
        url,
        commnet: comment || '',
        caption: caption || '',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      };
      await imagesRef.add(image);
      res.send(image);
    } else {
      res.send(null);
    }
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send(e);
  }
});

const port = '8080';

app.listen(port, () => {
  console.log(`app start listening on port ${port}`);
});

module.exports.handler = serverless(app);
