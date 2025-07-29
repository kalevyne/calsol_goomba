require('dotenv').config();
const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  endpoints: '/slack/events',
});

// /joingroup .developers
app.command('/joingroup', async ({ command, ack, respond }) => {
  console.log("Received /joingroup:", command);
  await ack();
  const usergroupHandle = command.text.trim().replace(/^\./, '');

  if (!usergroupHandle) {
    return respond("Please provide a user group handle, like `.developers`");
  }

  try {
    const { usergroups } = await app.client.usergroups.list({ token: process.env.SLACK_BOT_TOKEN });
    const targetGroup = usergroups.find((ug) => ug.handle === usergroupHandle);

    if (!targetGroup) return respond(`User group .${usergroupHandle} not found.`);

    const { users = [] } = await app.client.usergroups.users.list({
      token: process.env.SLACK_BOT_TOKEN,
      usergroup: targetGroup.id,
    });

    const newMembers = [...new Set([...users, command.user_id])];

    await app.client.usergroups.users.update({
      token: process.env.SLACK_BOT_TOKEN,
      usergroup: targetGroup.id,
      users: newMembers.join(','),
    });

    await respond(`✅ You have been added to .${usergroupHandle}`);
  } catch (error) {
    console.error(error);
    await respond("❌ Error adding you to the user group.");
  }
});

// /leavegroup .developers
app.command('/leavegroup', async ({ command, ack, respond }) => {
  console.log("Received /leavegroup:", command);
  await ack();
  const usergroupHandle = command.text.trim().replace(/^\./, '');

  if (!usergroupHandle) {
    return respond("Please provide a user group handle, like `.developers`");
  }

  try {
    const { usergroups } = await app.client.usergroups.list({ token: process.env.SLACK_BOT_TOKEN });
    const targetGroup = usergroups.find((ug) => ug.handle === usergroupHandle);

    if (!targetGroup) return respond(`User group .${usergroupHandle} not found.`);

    const { users = [] } = await app.client.usergroups.users.list({
      token: process.env.SLACK_BOT_TOKEN,
      usergroup: targetGroup.id,
    });

    const updatedUsers = users.filter((u) => u !== command.user_id);

    await app.client.usergroups.users.update({
      token: process.env.SLACK_BOT_TOKEN,
      usergroup: targetGroup.id,
      users: updatedUsers.join(','),
    });

    await respond(`✅ You have been removed from .${usergroupHandle}`);
  } catch (error) {
    console.error(error);
    await respond("❌ Error removing you from the user group.");
  }
});

// /creategroup developers Developers
app.command('/creategroup', async ({ command, ack, respond }) => {
  console.log("Received /creategroup:", command);
  await ack();

  const args = command.text.trim().split(/\s+/);
  if (args.length < 2) {
    return respond("Please provide a handle and a name, like `developers Developers`");
  }

  const [handle, ...nameParts] = args;
  const name = nameParts.join(' ');

  try {
    const result = await app.client.usergroups.create({
      token: process.env.SLACK_BOT_TOKEN,
      name: name,
      handle: handle,
    });

    await respond(`✅ User group .${handle} (${name}) created successfully!`);
  } catch (error) {
    console.error(error);
    await respond("❌ Error creating user group. It may already exist or your app lacks permissions.");
  }
});

// Start the app
(async () => {
  await app.start(process.env.PORT || 3001);
  console.log('⚡️ Slack Bolt app is running!');
})();
