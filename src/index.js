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

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'O campo "email" é obrigatório' });
  }

  if (!(email.match(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/))) {
    return res.status(400).json({ message: 'O "email" deve ter o formato "email@email.com"' });
  }

  if (!password) {
    return res.status(400).json({ message: 'O campo "password" é obrigatório' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'O "password" deve ter pelo menos 6 caracteres' });
  }
  next();
};

const validateLoginTalker = (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).json({ message: 'Token não encontrado' });
  }

  if (authorization.length !== 16) {
    return res.status(401).json({ message: 'Token inválido' });
  }

  next();
};

const validateName = (req, res, next) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'O campo "name" é obrigatório' });
  }
  if (name.length < 3) {
    return res.status(400).json({ message: 'O "name" deve ter pelo menos 3 caracteres' });
  }
  next();
};

const validateAge = (req, res, next) => {
  const { age } = req.body;
  if (!age) {
    return res.status(400).json({ message: 'O campo "age" é obrigatório' }); 
  }
  if (typeof (age) !== 'number') {
    return res.status(400).json({ message: 'O campo "age" deve ser do tipo "number"' });
  }
  if (!Number.isInteger(age)) {
    return res.status(400).json({ message: 'O campo "age" deve ser um "number" do tipo inteiro' });
  }
  if (age < 18) {
    return res.status(400).json({ message: 'A pessoa palestrante deve ser maior de idade' });
  }
  next();
};

const validateTalk = (req, res, next) => {
  const { talk } = req.body;
  if (!talk) {
    return res.status(400).json({ message: 'O campo "talk" é obrigatório' });
  }
  next();
};

const validateWatchedAt = (req, res, next) => {
  const { talk: { watchedAt } } = req.body;
  if (!watchedAt) {
    return res.status(400).json({ message: 'O campo "watchedAt" é obrigatório' });
  }
  if (!(watchedAt.match(/^\d{2}\/\d{2}\/\d{4}$/))) {
    return res.status(400).json({ message: 'O campo "watchedAt" deve ter o formato "dd/mm/aaaa"' });
  }
  next();
};

const validateRate = (req, res, next) => {
  const { talk: { rate } } = req.body;
  if (rate === undefined) {
    return res.status(400).json({ message: 'O campo "rate" é obrigatório' });
  }
  if ((!Number.isInteger(rate)) || (rate < 1) || (rate > 5)) {
    return res.status(400).json({ message: 'O campo "rate" deve ser um inteiro de 1 à 5' });
  }
  next();
};

app.get('/talker', async (_req, res) => {
  const talkers = await readTalker();
  return res.status(HTTP_OK_STATUS).json(talkers);
});

app.post('/talker', validateLoginTalker, validateName, validateAge, validateTalk,
  validateWatchedAt, validateRate, async (req, res) => {
  const { name, age, talk } = req.body;
  const talkers = await readTalker();
  const newTalker = {
    id: talkers[talkers.length - 1].id + 1,
    name,
    age,
    talk,
  };

  await fs.writeFile(talkersPath, JSON.stringify([...talkers, newTalker]));
  return res.status(201).json(newTalker);
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

app.put('/talker/:id', validateLoginTalker, validateName, validateAge, validateTalk,
  validateWatchedAt, validateRate, async (req, res) => {
    const { id } = req.params;
    const { name, age, talk } = req.body;
    const talkers = await readTalker();
    const talkerIndex = talkers.findIndex((talker) => talker.id === Number(id));

    if (talkerIndex >= 0) {
      const updateTalker = {
        id: Number(id), name, age, talk,
      };
      talkers[talkerIndex] = updateTalker;
      await fs.writeFile(talkersPath, JSON.stringify([...talkers]));
      return res.status(HTTP_OK_STATUS).json(updateTalker);
    }
    return res.status(404).json({
      message: 'Pessoa palestrante não encontrada',
    });
});

app.post('/login', validateLogin, (req, res) => {
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
