import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

// Inicializar el cliente SDK de Google Generative AI
const genAI = new GoogleGenerativeAI(config.geminiApiKey);

// Configurar el modelo gemini-1.5-flash (rápido, inteligente y con excelente ventana de contexto)
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    maxOutputTokens: 1200, // Controlar la longitud máxima de tokens para evitar desbordes en Discord
    temperature: 0.6,      // Creatividad equilibrada para redacción técnica
  }
});

/**
 * Envía una consulta directa a la IA de Gemini.
 * @param {string} prompt - Pregunta del usuario.
 * @returns {Promise<string>} Respuesta de Gemini optimizada para Discord.
 */
export async function askGemini(prompt) {
  try {
    const systemPrompt = `Eres Jarvis, el asistente de tecnología del servidor de Discord de nuestro usuario. 
Eres experto en ciberseguridad, Laravel, Go, desarrollo de software e Inteligencia Artificial.
Responde de forma clara, amigable, concisa y estructurada. 
Usa el formato Markdown de Discord (emojis, viñetas, negritas, bloques de código si es necesario).
Importante: Mantén tu respuesta directa y por debajo de 1800 caracteres para evitar que se corte.`;

    const result = await model.generateContent([
      { text: `${systemPrompt}\n\nPregunta del usuario:\n"${prompt}"` }
    ]);

    return result.response.text().trim();
  } catch (error) {
    console.error('❌ Error en el servicio Gemini (askGemini):', error);
    throw new Error('No se pudo obtener una respuesta de la Inteligencia Artificial.');
  }
}

/**
 * Analiza un listado crudo de noticias y genera un boletín diario estructurado.
 * @param {Array} newsItems - Arreglo de objetos de noticias crudas.
 * @returns {Promise<string>} Boletín formateado en Markdown.
 */
export async function generateNewsSummary(newsItems) {
  try {
    if (!newsItems || newsItems.length === 0) {
      return '📡 *Hoy no se encontraron noticias nuevas en tus canales de interés.*';
    }

    const systemPrompt = `
Eres Jarvis, el Radar Tecnológico de nuestro usuario en Discord. Tu objetivo es generar un Boletín de Noticias Diario en español, sumamente estético, estructurado y al grano.
El boletín debe estar bellamente formateado para Discord (usando negritas, listas ordenadas/desordenadas, iconos emojis y separadores).

INSTRUCCIONES CLAVE DE FORMATO:
1. Agrupa las noticias estrictamente en las siguientes categorías (siempre que haya noticias relevantes para ellas):
   - 🛡️ **Ciberseguridad** (Hacks, parches críticos, vulnerabilidades, noticias de seguridad).
   - 🐘 **Laravel & Backend** (Laravel News, ecosistema PHP, backend general).
   - 🐹 **Go & Infraestructura** (Noticias de Golang, contenedores, arquitectura eficiente).
   - 🤖 **Modelos de IA & Tecnología** (Nuevos modelos libres y de pago, revoluciones de IA, OpenAI, Gemini, Meta Llama, etc.).
   - 🌐 **Plataformas & Código Abierto** (Proyectos interesantes en GitHub, herramientas útiles y sitios open source).

2. Reglas de Redacción:
   - Para cada noticia seleccionada, ponle un título en negrita que sea un enlace Markdown directo a la fuente, por ejemplo: [Título de la noticia](URL).
   - Escribe un resumen de máximo 1 o 2 líneas explicando qué ocurrió y por qué es importante de forma ultra-directa.
   - Descarta noticias irrelevantes, spam o artículos repetidos. Selecciona solo lo mejor de lo mejor (máximo 1 o 2 noticias destacadas por categoría).

3. Limitación de Tamaño (CRÍTICO):
   - El mensaje final NO debe superar bajo ningún concepto los 1900 caracteres. Discord rechaza mensajes mayores a 2000. Por ende, sé muy sintético y ve al grano sin introducciones largas ni despedidas pomposas.
`;

    // Serializar las noticias para pasarlas como contexto al modelo
    const rawNewsText = newsItems.map((item, index) => {
      return `[Item #${index + 1}]
Título: ${item.title}
Fuente: ${item.source}
Categoría: ${item.category || 'General'}
URL: ${item.link}
Resumen: ${item.description || item.summary || 'Sin descripción'}
---`;
    }).join('\n');

    const result = await model.generateContent([
      { text: `${systemPrompt}\n\nNoticias recopiladas para procesar:\n\n${rawNewsText}` }
    ]);

    let boletin = result.response.text().trim();

    // Recorte defensivo de seguridad si la IA excede los 2000 caracteres
    if (boletin.length > 2000) {
      boletin = boletin.substring(0, 1950) + '\n\n⚠️ *(El boletín superó el límite de caracteres y fue recortado para Discord)*';
    }

    return boletin;
  } catch (error) {
    console.error('❌ Error en el servicio Gemini (generateNewsSummary):', error);
    throw new Error('Ocurrió un error al procesar las noticias con la Inteligencia Artificial.');
  }
}
