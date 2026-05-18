import { SlashCommandBuilder } from 'discord.js';
import { askGemini } from '../services/gemini.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('askgemini')
    .setDescription('Pregúntale algo directamente a la Inteligencia Artificial de Gemini.')
    .addStringOption(option => 
      option.setName('pregunta')
        .setDescription('La pregunta, duda o código que deseas enviarle a la IA.')
        .setRequired(true)
    ),

  async execute(interaction) {
    // 1. Diferir la respuesta inmediatamente: la IA puede tardar más de 3 segundos y Discord exige respuesta rápida
    await interaction.deferReply();

    const pregunta = interaction.options.getString('pregunta');

    try {
      // 2. Invocar al servicio optimizado de Gemini
      const respuesta = await askGemini(pregunta);

      // 3. Responder editando el mensaje de carga, formateando la pregunta e incorporando la respuesta
      await interaction.editReply(
        `💡 **Pregunta:** *"${pregunta}"*\n\n` +
        `🤖 **Jarvis:**\n${respuesta}`
      );
    } catch (error) {
      console.error('❌ Error en el comando askgemini:', error);
      await interaction.editReply(
        '❌ No he podido conectarme con mi motor de Inteligencia Artificial en este momento. ' +
        'Por favor, inténtalo de nuevo en unos instantes.'
      );
    }
  }
};
