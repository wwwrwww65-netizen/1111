import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const mediaRouter = Router();

// Ensure uploads directory exists
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Helper to get file extension from mime type
function getExtension(mime: string): string {
    switch (mime) {
        case 'image/jpeg': return 'jpg';
        case 'image/png': return 'png';
        case 'image/webp': return 'webp';
        case 'image/gif': return 'gif';
        case 'image/svg+xml': return 'svg';
        default: return 'bin';
    }
}

// Upload endpoint
mediaRouter.post('/upload', async (req, res) => {
    try {
        const { dataUrl } = req.body;

        if (!dataUrl || typeof dataUrl !== 'string') {
            return res.status(400).json({ error: 'Missing dataUrl' });
        }

        // Parse data URL
        const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return res.status(400).json({ error: 'Invalid data URL format' });
        }

        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        // Determine filename
        const ext = getExtension(mimeType);
        let filename;

        if (req.body.customName) {
            // Sanitize custom name for SEO (e.g. "Red Dress" -> "red-dress")
            const safeName = req.body.customName
                .toLowerCase()
                .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-') // Support Arabic & English
                .replace(/^-+|-+$/g, '') || 'image';

            // Add random suffix to avoid collisions
            const suffix = crypto.randomBytes(4).toString('hex');
            filename = `${safeName}-${suffix}.${ext}`;
        } else {
            // Fallback to hash
            const hash = crypto.createHash('sha256').update(buffer).digest('hex');
            filename = `${hash}.${ext}`;
        }

        const filePath = path.join(UPLOADS_DIR, filename);

        // Save file
        fs.writeFileSync(filePath, buffer);

        // Construct public URL
        const protocol = req.protocol;
        const host = req.get('host');
        const fullUrl = `${protocol}://${host}/uploads/${filename}`;

        return res.json({
            url: fullUrl,
            filename: filename,
            mime: mimeType,
            size: buffer.length
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return res.status(500).json({ error: 'Upload failed', details: error.message });
    }
});

// Verification File Upload (HTML)
mediaRouter.post('/upload-verification', async (req, res) => {
    try {
        const { content, filename } = req.body;

        if (!content || !filename) {
            return res.status(400).json({ error: 'Missing content or filename' });
        }

        if (!filename.endsWith('.html') && !filename.endsWith('.xml')) {
            return res.status(400).json({ error: 'Only .html or .xml files allowed' });
        }

        const VERIFICATION_DIR = path.resolve(process.cwd(), 'verification');
        if (!fs.existsSync(VERIFICATION_DIR)) {
            fs.mkdirSync(VERIFICATION_DIR, { recursive: true });
        }

        const filePath = path.join(VERIFICATION_DIR, filename);
        fs.writeFileSync(filePath, content);

        return res.json({ ok: true, url: `/${filename}` });
    } catch (error: any) {
        console.error('Verification upload error:', error);
        return res.status(500).json({ error: 'Upload failed' });
    }
});
