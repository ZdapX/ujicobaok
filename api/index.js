
const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();

// Setting EJS
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

// 1. Halaman Utama
app.get('/', (req, res) => {
  res.render('index');
});

// 2. Halaman Hasil (Setelah upload dari frontend selesai)
app.get('/generate-result', (req, res) => {
  const { type, file } = req.query;
  if (!type || !file) return res.redirect('/');

  // Link buatan kita yang akan tetap di domain Vercel
  const finalUrl = `${req.protocol}://${req.get('host')}/s/${type}/${file}`;
  res.render('result', { url: finalUrl });
});

// 3. LOGIKA PROXY (Agar URL tidak redirect ke Cloudinary)
app.get('/s/:type/:filename', async (req, res) => {
  const { type, filename } = req.params;
  
  // URL asli di Cloudinary
  const targetUrl = `https://res.cloudinary.com/dnb0q2s2h/${type}/upload/${filename}`;

  try {
    const response = await axios({
      method: 'get',
      url: targetUrl,
      responseType: 'stream',
      timeout: 10000 // 10 detik timeout
    });

    // Teruskan header tipe konten (image/png, video/mp4, dll)
    res.setHeader('Content-Type', response.headers['content-type']);
    
    // Alirkan data langsung ke user
    response.data.pipe(res);
  } catch (error) {
    console.error("Proxy Error:", error.message);
    res.status(404).send('File tidak ditemukan atau terjadi kesalahan saat memuat file.');
  }
});

module.exports = app;
