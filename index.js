const serverless = require('serverless-http');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const serviceAccount = require('./serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://ippo-app.firebaseio.com',
});

const { MESSAGE_COLLECTION_NAME, IMAGE_COLLECTION_NAME } = process.env;

const db = admin.firestore();
const messagesRef = db.collection(MESSAGE_COLLECTION_NAME);
const imagesRef = db.collection(IMAGE_COLLECTION_NAME);

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello');
});

app.get('/messages', async (req, res, next) => {
  try {
    const { limit: inputLimit, startAfterId: id } = req.query;
    const limit = Number(inputLimit) || 30;
    let startAfter = '1970-01-01';
    if (id) {
      const doc = await messagesRef.doc(id).get();
      if (doc.exists) startAfter = doc.data().timestamp.toDate();
    }
    console.log(`GET /messages?limit=${limit}&startAfter=${startAfter}`);

    const snapshots = await messagesRef
      .orderBy('timestamp', 'desc')
      .startAfter(startAfter)
      .limit(limit)
      .get();
    const messages = snapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log({ messages });
    res.send(messages);
  } catch (e) {
    console.log(e);
    next(e);
  }
});

app.post('/messages', async (req, res, next) => {
  console.log('POST /messages');
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
    next(e);
  }
});

app.delete('/messages/:id', async (req, res, next) => {
  console.log('DELET /messages/:id');
  try {
    console.log(req.params);
    const { id } = req.params;
    if (id) {
      await messagesRef.doc(id).delete();
      res.send(null);
    } else {
      res.send(null);
    }
  } catch (e) {
    console.log(e);
    next(e);
  }
});

app.get('/images', async (req, res, next) => {
  const { limit: inputLimit, startAfterId: id } = req.query;
  const limit = Number(inputLimit) || 10;
  let startAfter = '1970-01-01';
  if (id) {
    const doc = await imagesRef.doc(id).get();
    if (doc.exists) startAfter = doc.data().timestamp.toDate();
  }
  console.log(`GET /images?limit=${limit}&startAfter=${startAfter}`);

  try {
    const snapshots = await imagesRef
      .orderBy('timestamp', 'desc')
      .startAfter(startAfter)
      .limit(limit)
      .get();
    const images = snapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log({ images });
    res.send(images);
  } catch (e) {
    console.log(e);
    next(e);
  }
});

app.post('/images', async (req, res, next) => {
  console.log('POST /images');
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
    next(e);
  }
});

app.delete('/images/:id', async (req, res, next) => {
  console.log('DELETE /images/:id');
  try {
    console.log(req.params);
    const { id } = req.params;
    if (id) {
      await imagesRef.doc(id).delete();
      res.send(null);
    } else {
      res.send(null);
    }
  } catch (e) {
    console.log(e);
    next(e);
  }
});

module.exports.handler = serverless(app);

const port = '8080';
app.listen(port, () => {
  console.log(`app start listening on port ${port}`);
});
