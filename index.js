const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');

// Retrieve Firebase credentials from environment variables
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Handle newline characters
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID, // Use project ID from environment variable
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
