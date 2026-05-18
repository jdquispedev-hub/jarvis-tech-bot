import { SlashCommandBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Prueba la latencia y tiempo de respuesta del bot.'),
  
  async execute(interaction, client) {
    // Enviar mensaje temporal inicial y recuperar los datos del mensaje enviado
    const mensajeEnviado = await interaction.reply({ 
      content: '🏓 Calculando latencia...', 
      fetchReply: true 
    });

    // Calcular la diferencia de tiempo entre la creación de la interacción y el mensaje de respuesta
    const latenciaBot = mensajeEnviado.createdTimestamp - interaction.createdTimestamp;
    const latenciaAPI = Math.round(client.ws.ping);

    // Editar la respuesta con la información formateada estéticamente
    await interaction.editReply(
      `🏓 **¡Pong!**\n` +
      `- ⏱️ **Latencia del Bot:** \`${latenciaBot}ms\`\n` +
      `- ⚡ **Latencia API Discord:** \`${latenciaAPI}ms\``
    );
  }
};
