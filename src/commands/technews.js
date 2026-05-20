import { SlashCommandBuilder } from 'discord.js';
import { fetchTechNews } from '../services/news.js';
import { generateNewsSummary } from '../services/gemini.js';

/**
 * Divide un texto largo en fragmentos de máximo `maxLength` caracteres,
 * intentando cortar por separadores de sección (---) o saltos de línea.
 */
function splitMessage(text, maxLength = 1900) {
  if (text.length <= maxLength) return [text];

  const chunks = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Intentar cortar por un separador de sección "---"
    let cutIndex = remaining.lastIndexOf('\n---\n', maxLength);

    // Si no hay separador, intentar cortar por doble salto de línea
    if (cutIndex === -1 || cutIndex < 100) {
      cutIndex = remaining.lastIndexOf('\n\n', maxLength);
    }

    // Si tampoco, cortar por salto de línea simple
    if (cutIndex === -1 || cutIndex < 100) {
      cutIndex = remaining.lastIndexOf('\n', maxLength);
    }

    // Último recurso: cortar en el límite duro
    if (cutIndex === -1 || cutIndex < 100) {
      cutIndex = maxLength;
    }

    chunks.push(remaining.substring(0, cutIndex).trim());
    remaining = remaining.substring(cutIndex).trim();
  }

  return chunks;
}

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

      // 6. Dividir el boletín en fragmentos seguros para Discord (máx. 2000 chars)
      const partes = splitMessage(boletin);

      // 7. Enviar la primera parte como respuesta principal
      await interaction.editReply(partes[0]);

      // 8. Enviar las partes restantes como mensajes de seguimiento
      for (let i = 1; i < partes.length; i++) {
        await interaction.followUp(partes[i]);
      }
    } catch (error) {
      console.error('❌ Error en el comando technews:', error);
      await interaction.editReply(
        '❌ Ha ocurrido un error al recolectar o procesar el boletín de noticias. ' +
        'Por favor, asegúrate de que las APIs estén configuradas correctamente e inténtalo de nuevo.'
      );
    }
  }
};
