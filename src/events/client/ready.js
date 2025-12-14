module.exports = {
  name: "clientReady",
  once: true,
  async execute(client) {
    console.log(`
      ✅ Client is ready!
      👤 Logged in as: ${client.user.tag}
    `);
  }
};
