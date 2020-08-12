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

const responseHeders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'Origin, X-Requested-With, Content-Type, Accept',
  'Access-Control-Allow-Methods': '*',
};

module.exports.getMessages = async event => {
  try {
    const { limit: inputLimit, startAfterId: id } = event.queryStringParameters;
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
    return {
      statusCode: 200,
      headers: responseHeders,
      body: JSON.stringify(messages),
    };
  } catch (e) {
    console.log(e);
    return {
      statusCode: 500,
      headers: responseHeders,
      body: JSON.stringify(e.message),
    };
  }
};

module.exports.postMessages = async event => {
  console.log('POST /messages');
  try {
    console.log(event.body);
    const { content } = JSON.parse(event.body);
    if (content) {
      const message = {
        content,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      };
      console.log({ message, collectionName: MESSAGE_COLLECTION_NAME });
      await messagesRef.add(message);
      console.log({ message, collectionName: MESSAGE_COLLECTION_NAME });
      return {
        statusCode: 200,
        headers: responseHeders,
        body: JSON.stringify(message),
      };
    } else {
      return {
        statusCode: 200,
        headers: responseHeders,
        body: 'post content is empty.',
      };
    }
  } catch (e) {
    console.log(e);
    return {
      statusCode: 500,
      headers: responseHeders,
      body: JSON.stringify(e.message),
    };
  }
};

module.exports.deleteMessages = async event => {
  console.log('DELET /messages/:id');
  try {
    console.log(event.pathParameters);
    const { id } = event.pathParameters;
    if (id) {
      await messagesRef.doc(id).delete();
      return {
        statusCode: 200,
        headers: responseHeders,
      };
    } else {
      return {
        statusCode: 200,
        headers: responseHeders,
      };
    }
  } catch (e) {
    console.log(e);
    return {
      statusCode: 500,
      headers: responseHeders,
      body: JSON.stringify(e.message),
    };
  }
};

module.exports.getImages = async event => {
  const { limit: inputLimit, startAfterId: id } = event.queryStringParameters;
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
    return {
      statusCode: 200,
      headers: responseHeders,
      body: JSON.stringify(images),
    };
  } catch (e) {
    console.log(e);
    return {
      statusCode: 500,
      headers: responseHeders,
      body: JSON.stringify(e.message),
    };
  }
};

module.exports.postImages = async event => {
  console.log('POST /images');
  try {
    console.log(event.body);
    const { url, comment, caption } = JSON.parse(event.body);
    if (url) {
      const image = {
        url,
        commnet: comment || '',
        caption: caption || '',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      };
      await imagesRef.add(image);
      return {
        statusCode: 200,
        headers: responseHeders,
        body: JSON.stringify(image),
      };
    } else {
      return {
        statusCode: 200,
        headers: responseHeders,
        body: 'post url is empty.',
      };
    }
  } catch (e) {
    console.log(e);
    return {
      statusCode: 500,
      headers: responseHeders,
      body: JSON.stringify(e.message),
    };
  }
};

module.exports.deleteImages = async event => {
  console.log('DELETE /images/:id');
  try {
    console.log(event.pathParameters);
    const { id } = event.pathParameters;
    if (id) {
      await imagesRef.doc(id).delete();
      return {
        statusCode: 200,
        headers: responseHeders,
      };
    } else {
      return {
        statusCode: 200,
        headers: responseHeders,
      };
    }
  } catch (e) {
    console.log(e);
    return {
      statusCode: 500,
      headers: responseHeders,
      body: JSON.stringify(e.message),
    };
  }
};
