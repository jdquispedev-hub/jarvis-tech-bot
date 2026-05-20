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

      // 5. Dividir el boletín si excede el límite de Discord (2000 chars)
      const partes = [];
      let remaining = boletin;
      while (remaining.length > 0) {
        if (remaining.length <= 1900) { partes.push(remaining); break; }
        let cut = remaining.lastIndexOf('\n---\n', 1900);
        if (cut === -1 || cut < 100) cut = remaining.lastIndexOf('\n\n', 1900);
        if (cut === -1 || cut < 100) cut = remaining.lastIndexOf('\n', 1900);
        if (cut === -1 || cut < 100) cut = 1900;
        partes.push(remaining.substring(0, cut).trim());
        remaining = remaining.substring(cut).trim();
      }

      // 6. Enviar cada parte del boletín y limpiar el mensaje de carga
      for (const parte of partes) {
        await canal.send(parte);
      }
      await mensajeCarga.delete().catch(() => {}); // Eliminación segura sin generar caídas

      console.log(`✅ [CRON] Boletín diario enviado con éxito al canal "${canal.name}" (${canal.id}).`);
    } catch (error) {
      console.error('❌ [CRON] Error grave durante la ejecución de la tarea diaria:', error);
    }
  });
}
