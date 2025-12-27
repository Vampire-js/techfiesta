import express from 'express';
import dotenv from 'dotenv';
import { requireAuth } from '../middleware/auth.js';
import { Document } from '../models/Document.js';
import multer from 'multer';
import { BlobServiceClient } from '@azure/storage-blob'

dotenv.config();
const router = express.Router();
router.use(requireAuth);

const sas = process.env.AZURE_BLOB_SAS_CONNECTION_STRING;
const account = process.env.ACCOUNT_NAME;
const containerName = process.env.CONTAINER_NAME;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const blobServiceClient = new BlobServiceClient(`https://${account}.blob.core.windows.net?${sas}`);
const containerClient = blobServiceClient.getContainerClient(containerName);

router.post("/pdf", upload.single('image'), async (req, res) => {
    console.log(req.file)
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    } else {
        try {
            const blobName = req.file.originalname;
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
            const uploadBlobResponse = await blockBlobClient.upload(req.file.buffer, req.file.size);
            res.status(200).send('File uploaded successfully');
        } catch (err) {
            console.log(err)
            return res.status(500).send('Error uploading file');
        }

    }
})

export default router;
