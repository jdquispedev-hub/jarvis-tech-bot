import { fetchTechNews } from './services/news.js';
import { generateNewsSummary } from './services/gemini.js';
import { config } from './config.js';

async function ejecutarPruebaLocal() {
  console.log('\n🧪 INICIANDO PRUEBA LOCAL (DRY-RUN) DEL RADAR TECNOLÓGICO...');
  console.log('===========================================================');

  // Validación básica previa de configuración
  if (!config.geminiApiKey || config.geminiApiKey === 'tu_gemini_api_key_aqui') {
    console.error('\x1b[31m%s\x1b[0m', '❌ ERROR: GEMINI_API_KEY no configurado.');
    console.error('Por favor, edita tu archivo ".env" y añade tu clave API de Google AI Studio.');
    process.exit(1);
  }

  try {
    // PASO 1: Recolección de feeds RSS
    console.log('\n👉 PASO 1: Recolectando noticias de ciberseguridad, Laravel, Go e IA...');
    const noticias = await fetchTechNews();

    if (!noticias || noticias.length === 0) {
      console.warn('\x1b[33m%s\x1b[0m', '⚠️  No se obtuvieron noticias de los feeds RSS. Revisa tu conexión de red.');
      return;
    }

    console.log(`\n✅ ¡Recolección exitosa! Se obtuvieron ${noticias.length} noticias en total.`);
    console.log('Muestra de las primeras 5 noticias recolectadas:');
    noticias.slice(0, 5).forEach((n, index) => {
      console.log(`   [${index + 1}] [${n.category}] ${n.title} (Fuente: ${n.source})`);
    });

    // PASO 2: Procesamiento y síntesis con Gemini AI
    console.log('\n👉 PASO 2: Enviando datos a Gemini API para redactar boletín...');
    const boletin = await generateNewsSummary(noticias);

    console.log('\n===========================================================');
    console.log('📝 BOLETÍN SINTETIZADO POR GEMINI (FORMATO DISCORD):');
    console.log('===========================================================');
    console.log(boletin);
    console.log('===========================================================');
    
    // Verificación de límites de tamaño
    const totalCaracteres = boletin.length;
    console.log(`📏 Tamaño del Boletín: ${totalCaracteres} caracteres.`);
    
    if (totalCaracteres <= 2000) {
      console.log('\x1b[32m%s\x1b[0m', '✅ Cumple con el límite de Discord (menos de 2000 caracteres). ¡Listo para enviar!');
    } else {
      console.log('\x1b[31m%s\x1b[0m', '❌ Supera el límite de Discord (más de 2000 caracteres).');
    }

    console.log('\n🎉 ¡Prueba local completada con éxito!');
  } catch (error) {
    console.error('\n\x1b[31m%s\x1b[0m', '❌ Ocurrió un error inesperado durante el dry-run:', error.message);
  }
}

ejecutarPruebaLocal();
