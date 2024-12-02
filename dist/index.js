"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
var DeploymentStatus;
(function (DeploymentStatus) {
    DeploymentStatus["deploymentCreated"] = "deployment.created";
    DeploymentStatus["deploymentError"] = "deployment.error";
    DeploymentStatus["deploymentSuccess"] = "deployment.succeeded";
})(DeploymentStatus || (DeploymentStatus = {}));
const deploymentStatus = (appTitle) => ({
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
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
console.log('discordWebhookUrl', discordWebhookUrl);
app.use(body_parser_1.default.json());
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
        await axios_1.default.post(discordWebhookUrl, {
            username: `${payload.deployment.name}`,
            avatar_url: 'https://static1.srcdn.com/wordpress/wp-content/uploads/2024/05/10-ways-naruto-changed-anime-forever.jpg',
            embeds: [
                {
                    title: deploymentStatus(payload.deployment.name)[type].title,
                    description: `**Deployment Name:** ${payload.deployment.name}\n**Action:** ${payload.deployment.meta.action}\n**Project:** ${payload.deployment.meta.gitlabProjectName}\n**Branch:** ${payload.deployment.meta.gitlabCommitRef}`,
                    color: deploymentStatus(payload.deployment.name)[type].color,
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
                            value: `**Author**: ${payload.deployment.meta.gitlabCommitAuthorLogin ||
                                payload.deployment.meta.gitlabCommitAuthorName}\n**Message**: ${payload.deployment.meta.gitlabCommitMessage}`,
                            inline: false,
                        },
                    ],
                },
            ],
        });
    }
    catch (err) {
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
