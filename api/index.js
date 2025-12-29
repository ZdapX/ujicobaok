
const express = require('express');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const axios = require('axios'); // Tambahkan axios

const app = express();

cloudinary.config({
  cloud_name: 'dnb0q2s2h',
  api_key: '838368993294916',
  api_secret: 'N9U1eFJGKjJ-A8Eo4BTtSCl720c',
});

function getResourceType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const images = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const videos = ['mp4', 'mov', 'avi', 'mkv'];
  if (images.includes(ext)) return 'image';
  if (videos.includes(ext)) return 'video';
  return 'raw';
}

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'public_uploads',
    resource_type: (req, file) => getResourceType(file.originalname),
    public_id: (req, file) => 'file-' + Date.now(),
  },
});

const upload = multer({ storage: storage });

app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/upload', upload.single('media'), (req, res) => {
  try {
    if (!req.file) return res.status(400).send('Upload gagal.');
    
    const resourceType = getResourceType(req.file.originalname);
    const fileNameOnCloud = req.file.filename.split('/').pop();
    const extension = req.file.originalname.split('.').pop();

    // Link akan tetap di domain kamu
    const proxyUrl = `${req.protocol}://${req.get('host')}/s/${resourceType}/${fileNameOnCloud}.${extension}`;

    res.render('result', { url: proxyUrl });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// LOGIKA PROXY (Agar URL tidak berubah)
app.get('/s/:type/:filename', async (req, res) => {
  const { type, filename } = req.params;
  const targetUrl = `https://res.cloudinary.com/dnb0q2s2h/${type}/upload/public_uploads/${filename}`;

  try {
    // Ambil data dari Cloudinary sebagai stream
    const response = await axios({
      method: 'get',
      url: targetUrl,
      responseType: 'stream',
    });

    // Teruskan header Content-Type agar browser tahu ini gambar/video
    res.setHeader('Content-Type', response.headers['content-type']);
    
    // Alirkan data langsung ke browser user
    response.data.pipe(res);
  } catch (error) {
    res.status(404).send('File tidak ditemukan atau terjadi kesalahan proxy.');
  }
});

module.exports = app;
