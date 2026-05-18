import { SlashCommandBuilder } from 'discord.js';
import { fetchTechNews } from '../services/news.js';
import { generateNewsSummary } from '../services/gemini.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('technews')
    .setDescription('Obtén un resumen instantáneo del radar de noticias del día (IA, Ciberseguridad, Laravel, Go).'),

  async execute(interaction) {
    // 1. Diferir la respuesta debido al tiempo acumulado de descargar feeds y consultar a la IA
    await interaction.deferReply();

    try {
      // 2. UX Premium: Informar sobre el progreso actual de la recolección
      await interaction.editReply('📡 *Recopilando noticias de Ciberseguridad, Laravel, Go e Inteligencia Artificial...*');

      // 3. Descargar las noticias usando nuestro servicio paralelo
      const noticias = await fetchTechNews();

      if (!noticias || noticias.length === 0) {
        await interaction.editReply('📭 No se encontraron noticias nuevas en las fuentes configuradas el día de hoy.');
        return;
      }

      // 4. UX Premium: Actualizar el estado indicando que Gemini está redactando
      await interaction.editReply('🤖 *Analizando noticias y redactando el boletín informativo con la IA de Gemini...*');

      // 5. Procesar noticias y redactar boletín con Gemini
      const boletin = await generateNewsSummary(noticias);

      // 6. Responder finalmente mostrando el boletín completo y formateado
      await interaction.editReply(boletin);
    } catch (error) {
      console.error('❌ Error en el comando technews:', error);
      await interaction.editReply(
        '❌ Ha ocurrido un error al recolectar o procesar el boletín de noticias. ' +
        'Por favor, asegúrate de que las APIs estén configuradas correctamente e inténtalo de nuevo.'
      );
    }
  }
};
