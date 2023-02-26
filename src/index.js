const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const formatName = (str) => {
  const arr = str.split(/[/-]/);
  for (let i = 0; i < arr.length; i++)
    arr[i] = arr[i][0].toUpperCase() + arr[i].substr(1);
  return arr.join(' ');
};

app.get('/repos/:repoOwner/:repoName', async (req, res) => {
  const config = {
    headers: {
      Authorization: `Bearer <PASTE YOUR TOKEN HERE>`,
    },
  };

  const baseUrl = `https://api.github.com/repos/${req.params.repoOwner}/${req.params.repoName}`;

  try {
    const response = await axios.get(baseUrl, config);
    const tagResponse = await axios.get(`${baseUrl}/tags`, config);

    const packageName = formatName(response.data.full_name);
    const sourceVersion = tagResponse.data[0].name;
    const lastSlashIndex = sourceVersion.lastIndexOf('/');
    const deployVersion =
      (lastSlashIndex != -1
        ? sourceVersion.substr(lastSlashIndex+1)
        : sourceVersion) + '.1';

    const details = {
      packageName,
      sourceVersion,
      deployVersion,
      build: '',
    };

    try {
      const response = await axios.get(`${baseUrl}/contents/pom.xml`, config);
      details.build = 'Maven';
    } catch (error) {}

    try {
      const response = await axios.get(
        `${baseUrl}/contents/build.gradle`,
        config
      );
      details.build = 'Gradle';
    } catch (error) {}

    try {
      const response = await axios.get(`${baseUrl}/contents/build.xml`, config);
      details.build = 'Ant';
    } catch (error) {}

    res.send(details);
  } catch (error) {
    res.status(404).send(error.message ? error.message : error);
  }
});

const port = process.env.PORT || 3000;

app.listen(port, async () => {
  console.log('Server is up on port ' + port);
});
