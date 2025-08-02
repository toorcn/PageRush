export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Use require for CJS compatibility
  const formidable = require('formidable');
  const fs = require('fs');
  const pdfParse = require('pdf-parse');

  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm({
      maxFileSize: 50 * 1024 * 1024, // 50MB limit
      maxFields: 1,
      allowEmptyFiles: false,
      filter: function ({name, originalName, mimetype}) {
        // Only allow PDF files
        return mimetype && mimetype.includes("pdf");
      }
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Formidable error:', err);
        return resolve(res.status(500).json({ error: 'File upload error: ' + err.message }));
      }

      try {
        if (!files.pdfs) {
          return resolve(res.status(400).json({ error: 'No PDF files uploaded' }));
        }

        let allText = '';
        const fileArray = Array.isArray(files.pdfs) ? files.pdfs : [files.pdfs];

        for (const file of fileArray) {
          if (!file.filepath) {
            console.error('No filepath found for file:', file);
            continue;
          }

          try {
            const dataBuffer = fs.readFileSync(file.filepath);
            const pdfData = await pdfParse(dataBuffer);
            allText += pdfData.text + '\n';

            // Clean up the temporary file
            fs.unlinkSync(file.filepath);
          } catch (pdfError) {
            console.error('PDF parsing error for file:', file.originalFilename, pdfError);
            // Clean up the temporary file even if parsing fails
            try {
              fs.unlinkSync(file.filepath);
            } catch (cleanupError) {
              console.error('Failed to cleanup file:', cleanupError);
            }
            return resolve(res.status(500).json({ error: 'PDF parsing failed: ' + pdfError.message }));
          }
        }

        if (!allText.trim()) {
          return resolve(res.status(400).json({ error: 'No text could be extracted from the PDF files' }));
        }

        resolve(res.status(200).json({ text: allText }));
      } catch (error) {
        console.error('General error:', error);
        resolve(res.status(500).json({ error: 'Server error: ' + error.message }));
      }
    });
  });
} 