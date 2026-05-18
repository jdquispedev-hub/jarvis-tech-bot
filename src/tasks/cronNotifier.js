import cron from 'node-cron';
import { config } from '../config.js';
import { fetchTechNews } from '../services/news.js';
import { generateNewsSummary } from '../services/gemini.js';

/**
 * Inicializa y programa las tareas en segundo plano para el bot.
 * @param {Client} client - Cliente de Discord inicializado.
 */
export function initCronTasks(client) {
  // 1. Verificación defensiva preventiva
  if (!config.newsChannelId) {
    console.warn(
      '\x1b[33m%s\x1b[0m',
      '⚠️  [ADVERTENCIA] No se ha definido "NEWS_CHANNEL_ID" en tu archivo .env.\n' +
      '   El boletín automático de las 8:00 AM NO se enviará hasta que configures el ID del canal.'
    );
    return;
  }

  console.log('⏰ Tarea Cron programada: Boletín Informativo Diario a las 8:00 AM (Hora Local del Servidor).');

  // Expresión cron: '0 8 * * *' -> Minuto 0, Hora 8, Todos los días del año
  cron.schedule('0 8 * * *', async () => {
    console.log('\n⏰ [CRON] Ejecutando boletín programado diario (8:00 AM)...');

    try {
      // 2. Obtener el canal de Discord configurado
      const canal = await client.channels.fetch(config.newsChannelId);

      if (!canal) {
        console.error(`❌ [CRON] No se pudo encontrar el canal con ID: ${config.newsChannelId}`);
        return;
      }

      if (!canal.isTextBased()) {
        console.error(`❌ [CRON] El canal especificado con ID ${config.newsChannelId} no es de texto.`);
        return;
      }

      // Enviar mensaje temporal indicador en el canal
      const mensajeCarga = await canal.send('📡 *Iniciando recolección del Radar Tecnológico Diario...*');

      // 3. Obtener el lote consolidado de noticias técnicas
      const noticias = await fetchTechNews();

      if (!noticias || noticias.length === 0) {
        await mensajeCarga.edit('📭 No se encontraron noticias nuevas en las fuentes de RSS el día de hoy.');
        return;
      }

      // 4. Actualizar estado y redactar el reporte con Gemini AI
      await mensajeCarga.edit('🤖 *Analizando noticias y estructurando el resumen diario con Gemini...*');
      const boletin = await generateNewsSummary(noticias);

      // 5. Enviar boletín final y limpiar el chat eliminando el aviso de carga temporal
      await canal.send(boletin);
      await mensajeCarga.delete().catch(() => {}); // Eliminación segura sin generar caídas

      console.log(`✅ [CRON] Boletín diario enviado con éxito al canal "${canal.name}" (${canal.id}).`);
    } catch (error) {
      console.error('❌ [CRON] Error grave durante la ejecución de la tarea diaria:', error);
    }
  });
}
