const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');

// Initialize Firebase Admin SDK
const serviceAccount = require('./firebase-admin-key.json');
 // Path to Firebase service account key
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "flutter-chat-app-5d74b" // Replace with your project ID
  });
  

const app = express();
const PORT = 3000;

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Endpoint to handle new chat messages
app.post('/new-message', async (req, res) => {
  const { text, userId, username, userImage } = req.body;

  if (!text || !userId || !username) {
    return res.status(400).send({ message: 'Text, userId, and username are required.' });
  }

  try {
    // Save message to Firestore
    const message = {
      text: text.trim(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      userId,
      username,
      userImage: userImage || '', // Default to empty string if image is missing
    };

    await admin.firestore().collection('chat').add(message);

    // Optional: Send push notification
    const topic = 'chat'; // Replace with your desired topic
    const notification = {
      notification: {
        title: username,
        body: text,
      },
      topic,
    };

    await admin.messaging().send(notification);

    res.status(200).send({ message: 'Message saved and notification sent.' });
  } catch (error) {
    console.error('Error handling new message:', error);
    res.status(500).send({ message: 'Failed to handle new message.', error });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
