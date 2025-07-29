require('dotenv').config();
const { App } = require('@slack/bolt');

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  // ⚠️ Only set endpoints if you *actually* want to change the path!
  // The default is "/slack/events", which is fine for slash commands.
  // Remove this line entirely if you want default behavior:
  // endpoints: '/slack/events'
});

// Slash command handler
app.command('/joingroup', async ({ command, ack, respond }) => {
  console.log("Received slash command:", command);
  await ack();

  const usergroupHandle = command.text.trim();

  if (!usergroupHandle) {
    return respond("Please provide a user group handle, like `.developers`");
  }

  try {
    // Fetch usergroups
    const usergroupsRes = await app.client.usergroups.list();
    const targetGroup = usergroupsRes.usergroups.find(
      (ug) => ug.handle === usergroupHandle.replace(/^\./, '')
    );

    if (!targetGroup) {
      return respond(`User group ${usergroupHandle} not found.`);
    }

    // Fetch current members
    const currentMembersRes = await app.client.usergroups.users.list({
      usergroup: targetGroup.id,
    });

    const currentMembers = currentMembersRes.users || [];
    const newMembers = [...new Set([...currentMembers, command.user_id])];

    // Update user group
    await app.client.usergroups.users.update({
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
  const port = process.env.PORT || 3000;
  await app.start(port);
  console.log(`⚡️ Slack Bolt app is running on port ${port}!`);
})();
