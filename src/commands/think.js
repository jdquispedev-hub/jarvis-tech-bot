import { SlashCommandBuilder } from 'discord.js';
import { askGeminiWithReasoning } from '../services/gemini.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('think')
    .setDescription('Realiza una consulta técnica con análisis de arquitectura y razonamiento profundo.')
    .addStringOption(option => 
      option.setName('pregunta')
        .setDescription('La duda de arquitectura, optimización o bug complejo a analizar.')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();
    const pregunta = interaction.options.getString('pregunta');

    try {
      await interaction.editReply(`🧠 *Analizando y planificando una solución arquitectónica en mi motor de razonamiento...*`);
      
      const respuesta = await askGeminiWithReasoning(pregunta);
      
      await interaction.editReply(
        `💡 **Consulta:** *"${pregunta}"*\n\n` +
        `🤖 **Jarvis (Razonamiento Profundo):**\n${respuesta}`
      );
    } catch (error) {
      console.error('❌ Error en comando think:', error);
      await interaction.editReply(`❌ No he podido conectar con mi motor de razonamiento en este momento. Inténtalo de nuevo más tarde.`);
    }
  }
};
