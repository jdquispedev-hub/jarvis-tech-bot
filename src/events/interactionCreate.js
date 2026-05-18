export const event = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction, client) {
    // Ignorar si la interacción no es un comando slash
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.warn(`⚠️  Se recibió un comando slash no reconocido: /${interaction.commandName}`);
      return;
    }

    try {
      // Ejecutar el comando pasándole la interacción y el cliente
      await command.execute(interaction, client);
    } catch (error) {
      console.error(`❌ Error crítico al ejecutar el comando /${interaction.commandName}:`, error);

      const errorPayload = {
        content: '❌ Ocurrió un error inesperado al procesar este comando. Por favor, inténtalo de nuevo más tarde.',
        ephemeral: true // Solo el usuario que ejecutó el comando verá este error
      };

      // Controlar si la interacción ya fue respondida o diferida para evitar fallos de la API de Discord
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorPayload);
      } else {
        await interaction.reply(errorPayload);
      }
    }
  }
};
