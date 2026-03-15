import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.readonly'];

const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

// Fallback for local development if .env is not yet set up
// We'll use the service account JSON if available
import fs from 'fs';
import path from 'path';

let auth: any;

try {
  if (GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    auth = new google.auth.JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      scopes: SCOPES
    });
  } else {
    // Attempt to load from JSON file in root if env vars are missing
    const jsonPath = path.join(process.cwd(), 'orcamentos-489821-1d06ef9cc03a.json');
    if (fs.existsSync(jsonPath)) {
      auth = new google.auth.GoogleAuth({
        keyFile: jsonPath,
        scopes: SCOPES,
      });
    }
  }
} catch (error) {
  console.error('Error initializing Google Drive auth:', error);
}

const drive = google.drive({ version: 'v3', auth });

export async function uploadToDrive(filename: string, buffer: Buffer, mimeType: string = 'application/pdf') {
  if (!auth) throw new Error('Google Drive authentication not initialized');
  if (!GOOGLE_DRIVE_FOLDER_ID) {
    console.warn('GOOGLE_DRIVE_FOLDER_ID not set. Uploading to root folder.');
  }

  const fileMetadata = {
    name: filename,
    parents: GOOGLE_DRIVE_FOLDER_ID ? [GOOGLE_DRIVE_FOLDER_ID] : [],
  };

  const media = {
    mimeType: mimeType,
    body: Readable.from(buffer),
  };

  try {
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink',
    });
    return response.data;
  } catch (error: any) {
    console.error('Error uploading to Google Drive:', error);
    throw new Error(`Failed to upload to Google Drive: ${error.message}`);
  }
}

export async function listDriveFiles() {
  if (!auth) throw new Error('Google Drive authentication not initialized');

  let query = "trashed = false";
  if (GOOGLE_DRIVE_FOLDER_ID) {
    query += ` and '${GOOGLE_DRIVE_FOLDER_ID}' in parents`;
  }

  try {
    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name, mimeType, webViewLink, iconLink, size, createdTime)',
      orderBy: 'createdTime desc',
    });
    return response.data.files || [];
  } catch (error: any) {
    console.error('Error listing Google Drive files:', error);
    throw new Error(`Failed to list Google Drive files: ${error.message}`);
  }
}
