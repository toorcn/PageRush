export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Use require for CJS compatibility
  const formidable = require('formidable');
  const fs = require('fs');
  const pdfParse = require('pdf-parse');

  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Formidable error:', err);
        return resolve(res.status(500).json({ error: 'File upload error' }));
      }

      try {
        let allText = '';
        const fileArray = Array.isArray(files.pdfs) ? files.pdfs : [files.pdfs];

        for (const file of fileArray) {
          if (!file.filepath) {
            console.error('No filepath found for file:', file);
            continue;
          }

          const dataBuffer = fs.readFileSync(file.filepath);
          const pdfData = await pdfParse(dataBuffer);
          allText += pdfData.text + '\n';

          // Clean up the temporary file
          fs.unlinkSync(file.filepath);
        }

        resolve(res.status(200).json({ text: allText }));
      } catch (error) {
        console.error('PDF parsing error:', error);
        resolve(res.status(500).json({ error: 'PDF parsing failed' }));
      }
    });
  });
} 