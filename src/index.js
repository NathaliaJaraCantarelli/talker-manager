const express = require('express');
const fs = require('fs').promises;
const crypto = require('crypto-js');

const path = require('path');

const app = express();
app.use(express.json());

const HTTP_OK_STATUS = 200;
const PORT = '3000';

const talkersPath = path.resolve(__dirname, './talker.json');

async function readTalker() {
  try {
    const talkers = await fs.readFile(talkersPath, 'utf-8');
    return JSON.parse(talkers);
  } catch (error) {
    console.error('Não foi possível ler o arquivo talker.json');
  }
}

function createToken(dataLogin) {
  return crypto.AES.encrypt(dataLogin, 'encrypted key').toString().substring(0, 16);
}

app.get('/talker', async (_req, res) => {
  const talkers = await readTalker();
  return res.status(HTTP_OK_STATUS).json(talkers);
});

app.get('/talker/:id', async (req, res) => {
  const { id } = req.params;
  const talkers = await readTalker();
  const talkerId = talkers.filter((talker) => talker.id === Number(id));
  if (talkerId.length > 0) {
    return res.status(HTTP_OK_STATUS).json(talkerId[0]);
  }
  return res.status(404).json({
    message: 'Pessoa palestrante não encontrada',
  });
});

app.post('/login', (req, res) => {
  const dataReq = JSON.stringify(req.body);
  const token = createToken(dataReq);
  return res.status(HTTP_OK_STATUS).json({ token });
});

// não remova esse endpoint, e para o avaliador funcionar
app.get('/', (_request, response) => {
  response.status(HTTP_OK_STATUS).send();
});

app.listen(PORT, () => {
  console.log('Online');
});
