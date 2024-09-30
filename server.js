const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());

// Настройка CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

app.get('/fetch-data', async (req, res) => {
  try {
    const { endDate, ids, metrics, startDate } = req.query;

    // Логирование полученных параметров запроса
    console.log('Received query parameters:', req.query);

    // Проверка наличия всех необходимых параметров
    if (!endDate || !ids || !metrics || !startDate) {
      console.error('Missing required query parameters:', req.query);
      return res.status(400).send('Missing required query parameters');
    }

    const response = await axios.get('https://api-metrika.yandex.net/analytics/v3/data/ga', {
      params: {
        'end-date': endDate,
        'ids': ids,
        'metrics': metrics,
        'start-date': startDate
      },
      headers: {
        'Authorization': 'Bearer y0_AgAEA7qjSGyWAAx0bwAAAAERWko5AABvTeGTSzdLpLb7yppsc5SkxU1OuA',
        'Accept': 'application/json'
      }
    });

    // Логирование ответа от Яндекс.Метрики
    console.log('Response from Yandex Metrika:', JSON.stringify(response.data, null, 2));

    // Преобразование данных в формат массива объектов
    const data = response.data.rows.map(row => ({
      endDate,
      ids,
      metrics,
      startDate,
      value: row[0]
    }));

    // Запись данных в файл JSON
    const filePath = path.join(__dirname, 'data.json');
    fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
      if (err) {
        console.error('Error writing file:', err);
        return res.status(500).send('Error writing file');
      }

      // Возвращение URL для доступа к файлу JSON
      res.json({ url: `http://localhost:${port}/data.json` });
    });
  } catch (error) {
    console.error('Error fetching data from Yandex Metrika:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    res.status(500).send('Error fetching data from Yandex Metrika');
  }
});

// Обслуживание файла JSON
app.get('/data.json', (req, res) => {
  const filePath = path.join(__dirname, 'data.json');
  
  // Проверка существования файла
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('File does not exist:', filePath);
      return res.status(404).send('File not found');
    }

    res.sendFile(filePath);
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});