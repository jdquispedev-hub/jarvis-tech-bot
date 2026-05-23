import { SlashCommandBuilder } from 'discord.js';
import { fetchCriticalCVEs } from '../services/cve.js';
import { generateCveSummary } from '../services/gemini.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('cve')
    .setDescription('Obtén las alertas de vulnerabilidades críticas de ciberseguridad más recientes (CVSS >= 7.0).'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      await interaction.editReply(`📡 *Recopilando reportes de vulnerabilidades globales en tiempo real...*`);
      
      const cves = await fetchCriticalCVEs();
      
      await interaction.editReply(`🛡️ *Analizando criticidad y traduciendo impactos técnicos con la IA de Jarvis...*`);
      
      const summary = await generateCveSummary(cves);
      
      await interaction.editReply(summary);
    } catch (error) {
      console.error('❌ Error en comando cve:', error);
      await interaction.editReply(`❌ Ocurrió un error al consultar las alertas de ciberseguridad. Inténtalo de nuevo en unos instantes.`);
    }
  }
};
