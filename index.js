require('dotenv').config();
const { App } = require('@slack/bolt');

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// Slash command handler
app.command('/joingroup', async ({ command, ack, respond }) => {
  await ack();

  const usergroupHandle = command.text.trim();

  if (!usergroupHandle) {
    return respond("Please provide a user group handle, like `.developers`");
  }

  try {
    // Fetch usergroups to find matching one by handle
    const usergroupsRes = await app.client.usergroups.list({ token: process.env.SLACK_BOT_TOKEN });
    const targetGroup = usergroupsRes.usergroups.find(
      (ug) => ug.handle === usergroupHandle.replace(/^\./, '')
    );

    if (!targetGroup) {
      return respond(`User group ${usergroupHandle} not found.`);
    }


    // Fetch current members of the target group
    const currentMembersRes = await app.client.usergroups.users.list({
    token: process.env.SLACK_BOT_TOKEN,
    usergroup: targetGroup.id,
    });

    const currentMembers = currentMembersRes.users || [];
    const newMembers = [...new Set([...currentMembers, command.user_id])];

    // Update user group members
    await app.client.usergroups.users.update({
    token: process.env.SLACK_BOT_TOKEN,
    usergroup: targetGroup.id,
    users: newMembers.join(','),
    });

    await respond(`You have been added to ${usergroupHandle}!`);
  } catch (error) {
    console.error(error);
    await respond(`There was an error adding you to ${usergroupHandle}.`);
  }
});

// Start the app
(async () => {
  await app.start(process.env.PORT || 3001);
  console.log('⚡️ Slack Bolt app is running!');
})();