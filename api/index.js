
const express = require('express');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: 'dnb0q2s2h',
  api_key: '838368993294916',
  api_secret: 'N9U1eFJGKjJ-A8Eo4BTtSCl720c',
});

// Storage Config
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'public_uploads',
    resource_type: 'auto', // Cloudinary akan otomatis deteksi
  },
});

const upload = multer({ storage: storage });

app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index');
});

// Proses Upload
app.post('/upload', upload.single('media'), (req, res) => {
  try {
    if (!req.file) return res.status(400).send('File tidak ada.');

    // Ambil detail dari Cloudinary
    const resourceType = req.file.resource_type; // image, video, atau raw
    const secureUrl = req.file.path;
    
    // Ambil nama file asli dari URL Cloudinary
    // Contoh path: ".../image/upload/v123/public_uploads/file123.jpg"
    const parts = secureUrl.split('/');
    const fileName = parts[parts.length - 1]; 

    // BUAT URL CUSTOM: domain.com/image-file123.jpg atau domain.com/raw-file123.pdf
    const customUrl = `${req.protocol}://${req.get('host')}/${resourceType}-${fileName}`;

    res.render('result', { url: customUrl });
  } catch (error) {
    res.status(500).send('Error: ' + error.message);
  }
});

// ROUTE HANDLER (Mencegah 404)
app.get('/:slug', (req, res) => {
  const slug = req.params.slug;

  // Pola slug: [tipe]-[namafile]
  // Contoh: image-file123.jpg atau raw-document.pdf
  const firstDash = slug.indexOf('-');
  if (firstDash === -1) return res.status(404).send('File tidak ditemukan');

  const type = slug.substring(0, firstDash); // ambil 'image', 'video', atau 'raw'
  const fileName = slug.substring(firstDash + 1); // ambil sisa namanya

  // Redirect ke URL Cloudinary yang tepat
  // Format: https://res.cloudinary.com/[cloud_name]/[type]/upload/public_uploads/[fileName]
  const finalCloudinaryUrl = `https://res.cloudinary.com/dnb0q2s2h/${type}/upload/public_uploads/${fileName}`;
  
  res.redirect(finalCloudinaryUrl);
});

module.exports = app;
