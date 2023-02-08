const express = require('express');
const fs = require('fs').promises;

const path = require('path');

const app = express();
app.use(express.json());

const HTTP_OK_STATUS = 200;
const PORT = '3000';

const talkersPath = path.resolve(__dirname, './talker.json');

app.get('/talker', async (req, res) => {
  try {
    const talkers = await fs.readFile(talkersPath, 'utf-8');
    return res.status(HTTP_OK_STATUS).json(JSON.parse(talkers));
  } catch (error) {
    console.error('Não foi possível ler o arquivo talker.json');
  }
});

// não remova esse endpoint, e para o avaliador funcionar
app.get('/', (_request, response) => {
  response.status(HTTP_OK_STATUS).send();
});

app.listen(PORT, () => {
  console.log('Online');
});
