// Import necessary modules.
import express from 'express';
import { writeFile, readFile } from 'fs/promises';
import { Agent } from 'https';

// Define constants for the server and URLs.
const PORT = 3000;
const CERT_URL = 'https://cacerts.digicert.com/DigiCertGlobalG2TLSRSASHA2562020CA1-1.crt.pem';
const CERT_PATH = './cert-fetch/intermediate.pem';
const TARGET_URL = 'https://jury.scscourt.org/';

/**
 * Downloads the intermediate certificate from the given URL and saves it to a file.
 */
const downloadCertificate = async () => {
  try {
    const response = await fetch(CERT_URL);
    const certificate = await response.text();
    await writeFile(CERT_PATH, certificate);
    console.log('Successfully downloaded and saved the intermediate certificate.');
  } catch (error) {
    console.error('Failed to download the intermediate certificate:', error);
    process.exit(1); // Exit if the certificate cannot be downloaded.
  }
};

/**
 * Fetches the content of the target URL using the downloaded intermediate certificate.
 * @returns {Promise<string>} The HTML content of the target URL.
 */
const fetchTargetContent = async () => {
  try {
    const response = await fetch(TARGET_URL);
    return await response.text();
  } catch (error) {
    console.error('Failed to fetch the target content:', error);
    throw new Error('Failed to fetch the target content.'); // Re-throw to be caught by the route handler.
  }
};

// Create and configure the Express application.
const app = express();

app.get('/', async (req, res) => {
  try {
    const content = await fetchTargetContent();
    res.send(content);
  } catch (error) {
    res.status(500).send('An error occurred while fetching the content.');
  }
});

// Start the server after downloading the certificate.
const startServer = async () => {
  await downloadCertificate();
  const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
  return server;
};

// Export for testing
export { app, downloadCertificate, fetchTargetContent, startServer };

if (import.meta.url.startsWith('file://') && import.meta.url.endsWith(process.argv[1])) {
  startServer();
}
