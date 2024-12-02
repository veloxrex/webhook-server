import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import dotenv from 'dotenv';

enum DeploymentStatus {
  deploymentCreated = 'deployment.created',
  deploymentError = 'deployment.error',
  deploymentSuccess = 'deployment.succeeded',
}

const deploymentStatus = (appTitle: string) => ({
  [DeploymentStatus.deploymentCreated]: {
    title: `Deployment ${appTitle} Created`,
    color: 16370212, // Yellow
  },
  [DeploymentStatus.deploymentError]: {
    title: `Deployment  ${appTitle} Error`,
    color: 15158332, // Red
  },
  [DeploymentStatus.deploymentSuccess]: {
    title: `Deployment  ${appTitle} Success`,
    color: 3066993, // Green
  },
});

dotenv.config();

const app = express();
const port = process.env.PORT;
const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;

console.log('discordWebhookUrl', discordWebhookUrl);
app.use(bodyParser.json());

app.get('/api/webhook', (req, res) => {
  res.status(200).send('Webhook is working');
  return;
});

app.post('/api/webhook', async (req, res) => {
  console.log(req.body);
  const { type, payload } = req.body;
  if (!discordWebhookUrl) {
    res.status(400).send('Discord Webhook URL is required');
    return;
  }
  try {
    await axios.post(discordWebhookUrl, {
      username: `${payload.deployment.name}`,
      avatar_url:
        'https://static1.srcdn.com/wordpress/wp-content/uploads/2024/05/10-ways-naruto-changed-anime-forever.jpg',
      embeds: [
        {
          title: deploymentStatus(payload.deployment.name)[
            type as DeploymentStatus
          ].title,
          description: `**Deployment Name:** ${payload.deployment.name}\n**Action:** ${payload.deployment.meta.action}\n**Project:** ${payload.deployment.meta.gitlabProjectName}\n**Branch:** ${payload.deployment.meta.gitlabCommitRef}`,
          color: deploymentStatus(payload.deployment.name)[
            type as DeploymentStatus
          ].color,
          fields: [
            {
              name: 'Deployment URL',
              value: `[View Deployment](${payload.links.deployment})`,
              inline: false,
            },
            {
              name: 'Inspector URL',
              value: `[Open Inspector](${payload.links.deployment})`,
              inline: false,
            },
            {
              name: 'Commit Info',
              value: `**Author**: ${
                payload.deployment.meta.gitlabCommitAuthorLogin ||
                payload.deployment.meta.gitlabCommitAuthorName
              }\n**Message**: ${payload.deployment.meta.gitlabCommitMessage}`,
              inline: false,
            },
          ],
        },
      ],
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to send message to discord');
    return;
  }
  res.status(200).send(JSON.stringify(req.body));
  return;
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
