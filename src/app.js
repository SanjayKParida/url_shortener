const express = require('express');
const { nanoid } = require('nanoid');
const db = require('./db');

const app = express();
app.use(express.json());

app.get('/', async (req, res) => {
  const { shortCode } = req.params;

  try {
    res.send({"message":"Fuck you bitch"});
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

// POST /shorten  — create a short URL
app.post('/short', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'url is required' });
  }

  try {
    new URL(url); // validate format
  } catch {
    return res.status(400).json({ error: 'invalid url' });
  }

  const shortCode = nanoid(6);

  try {
    const result = await db.query(
      'INSERT INTO urls (short_code, original_url) VALUES ($1, $2) RETURNING short_code',
      [shortCode, url]
    );
    const code = result.rows[0].short_code;
    return res.status(201).json({
      short_url: `${process.env.BASE_URL}/${code}`,
      short_code: code,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

// GET /:shortCode  — redirect to original URL
app.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;

  try {
    const result = await db.query(
      'SELECT original_url FROM urls WHERE short_code = $1',
      [shortCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'short code not found' });
    }

    return res.redirect(301, result.rows[0].original_url);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal server error' });
  }
});

module.exports = app;
