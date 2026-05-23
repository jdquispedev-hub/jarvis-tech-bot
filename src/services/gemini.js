import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

// Inicializar el cliente SDK de Google Generative AI
const genAI = new GoogleGenerativeAI(config.geminiApiKey);

// Configurar el modelo gemini-2.5-flash con thinking desactivado para respuestas completas
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    maxOutputTokens: 8192, // Alto para asegurar respuestas completas (el límite final lo hace el bot)
    temperature: 0.6,      // Creatividad equilibrada para redacción técnica
    thinkingConfig: {
      thinkingBudget: 0,   // Desactivar el modo "thinking" que consumía tokens y truncaba la respuesta
    },
  }
});

// Configurar el modelo gemini-2.5-flash con thinking activado para análisis complejos y razonamiento
const thinkingModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    maxOutputTokens: 8192,
    temperature: 0.7,      // Un poco más de libertad creativa para arquitectura
    thinkingConfig: {
      thinkingBudget: 2048, // Habilitar 2K tokens de razonamiento interno
    },
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
   - Descarta noticias irrelevantes, spam o artículos repetidos. Selecciona solo lo mejor de lo mejor (2 o 3 noticias destacadas por categoría si son muy relevantes).

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

    return boletin;
  } catch (error) {
    console.error('❌ Error en el servicio Gemini (generateNewsSummary):', error);
    throw new Error('Ocurrió un error al procesar las noticias con la Inteligencia Artificial.');
  }
}

/**
 * Envía una consulta técnica compleja al modelo de razonamiento profundo.
 * @param {string} prompt - La duda o problema de arquitectura planteada por el usuario.
 * @returns {Promise<string>} Solución de ingeniería de software senior estructurada y formateada en Markdown.
 */
export async function askGeminiWithReasoning(prompt) {
  try {
    const systemPrompt = `Eres Jarvis, el Arquitecto de Software Principal e Ingeniero de Seguridad Senior.
Tu objetivo es dar respuestas técnicas excepcionalmente analíticas, detalladas y estructuradas a problemas de ingeniería.
INSTRUCCIONES DE RESPUESTA:
1. Desglosa el problema en sus desafíos fundamentales.
2. Analiza los pros y contras de diferentes enfoques (especialmente usando Laravel, Go, Docker o principios de ciberseguridad según corresponda).
3. Escribe código modular, limpio y seguro si es necesario, explicando las decisiones críticas.
4. Diseña una arquitectura conceptual (diagramas ASCII o diagramas Mermaid sencillos) si la pregunta lo amerita.
5. Sé directo, profesional e instructivo. Usa negritas, viñetas y formato Markdown estético de Discord.
6. Mantén tu respuesta final (excluyendo el proceso de pensamiento de la IA que se oculta) por debajo de 1800 caracteres para evitar recortes en Discord.`;

    const result = await thinkingModel.generateContent([
      { text: `${systemPrompt}\n\nProblema de ingeniería planteado:\n"${prompt}"` }
    ]);

    return result.response.text().trim();
  } catch (error) {
    console.error('❌ Error en el servicio Gemini (askGeminiWithReasoning):', error);
    throw new Error('No se pudo obtener una respuesta del motor de razonamiento de la IA.');
  }
}

/**
 * Genera un reporte resumido y estético sobre los repositorios tendencia en GitHub.
 * @param {Array} repos - Lista de repositorios crudos.
 * @param {string} language - Lenguaje por el cual se filtró.
 * @returns {Promise<string>} Reporte formateado en Markdown.
 */
export async function generateGithubSummary(repos, language) {
  try {
    if (!repos || repos.length === 0) {
      return `📭 *No se encontraron repositorios populares en GitHub para el filtro: "${language || 'general'}".*`;
    }

    const systemPrompt = `
Eres Jarvis, el analista de código abierto. Tu objetivo es estructurar un boletín en español sobre los repositorios que son tendencia hoy en GitHub.
Para el filtro de lenguaje: "${language || 'General (Varios Lenguajes)'}".

INSTRUCCIONES:
1. Escribe un titular estético con emojis (ej: ⭐️ **GitHub Trending Radar**).
2. Para cada repositorio, incluye su nombre formateado como enlace Markdown directo a su URL, autor, descripción corta resumida en español (máx. 2 líneas) y por qué está llamando la atención de la comunidad (su propuesta de valor).
3. Muestra también sus estrellas de forma visible.
4. Mantén el boletín súper dinámico, profesional y por debajo de 1800 caracteres para no romper los límites de Discord.
`;

    const rawReposText = repos.map((repo, i) => `
[Repo #${i + 1}]
Nombre completo: ${repo.fullName}
URL: ${repo.url}
Estrellas: ${repo.stars}
Lenguaje: ${repo.language}
Descripción original: ${repo.description}
---`).join('\n');

    const result = await model.generateContent([
      { text: `${systemPrompt}\n\nDatos de los repositorios:\n\n${rawReposText}` }
    ]);

    return result.response.text().trim();
  } catch (error) {
    console.error('❌ Error en el servicio Gemini (generateGithubSummary):', error);
    throw new Error('Ocurrió un error al procesar las tendencias de GitHub con la IA.');
  }
}

/**
 * Traduce y resume vulnerabilidades de ciberseguridad críticas en español técnico simplificado.
 * @param {Array} cves - Listado de CVEs crudos.
 * @returns {Promise<string>} Boletín de seguridad Markdown.
 */
export async function generateCveSummary(cves) {
  try {
    if (!cves || cves.length === 0) {
      return '🛡️ *No se encontraron alertas críticas de ciberseguridad recientes.*';
    }

    const systemPrompt = `
Eres Jarvis, el Oficial de Seguridad de la Información (CISO) e investigador de amenazas.
Tu objetivo es traducir, resumir y explicar técnicamente el impacto de las últimas vulnerabilidades críticas (CVEs) recopiladas.

INSTRUCCIONES CLAVE:
1. Crea un titular impactante (ej: 🔴 **Radar de Vulnerabilidades Críticas**).
2. Para cada CVE, muestra su código identificador, su puntuación CVSS (resalta la severidad), una traducción simplificada de lo que trata en español (1 o 2 líneas explicativas) y qué componentes o tecnologías afecta.
3. Proporciona una recomendación de mitigación ultra-concisa para desarrolladores (ej: "Actualizar a la versión X.X", "Sanitizar entradas de inputs").
4. Mantén la respuesta súper limpia, estructurada con emojis y por debajo de 1800 caracteres.
`;

    const rawCveText = cves.map((cve, i) => `
[CVE #${i + 1}]
ID: ${cve.id}
Severidad CVSS: ${cve.cvss}
Fecha Publicado: ${cve.published}
Resumen técnico original: ${cve.summary}
Referencias: ${cve.references.join(', ')}
---`).join('\n');

    const result = await model.generateContent([
      { text: `${systemPrompt}\n\nListado de CVEs para procesar:\n\n${rawCveText}` }
    ]);

    return result.response.text().trim();
  } catch (error) {
    console.error('❌ Error en el servicio Gemini (generateCveSummary):', error);
    throw new Error('Ocurrió un error al analizar las alertas de seguridad con la IA.');
  }
}

/**
 * Genera un desafío interactivo de opción múltiple estructurado en JSON.
 * @param {string} [topic='general'] - El tema del desafío.
 * @returns {Promise<Object>} Objeto JSON con la pregunta, opciones, respuesta correcta y explicación.
 */
export async function generateChallenge(topic = 'general') {
  try {
    const cleanTopic = topic.trim().toLowerCase();
    
    const systemPrompt = `
Eres Jarvis, un profesor de ciencias de la computación y ciberseguridad ultra-didáctico.
Tu objetivo es crear un desafío técnico interactivo de opción múltiple de alto nivel para programadores.

El tema solicitado es: "${cleanTopic}".
(Si es general, elige entre Laravel/PHP, Go, Ciberseguridad, Desarrollo de Software General, Patrones de Diseño, o Redes de forma aleatoria).

DEBES RETORNAR UN OBJETO JSON VÁLIDO QUE CUMPLA CON EL SIGUIENTE ESQUEMA DE FORMA ESTRICTA. No agregues texto adicional fuera del bloque JSON (como "aquí tienes tu json" o markdown de bloque \`\`\`json ... \`\`\`). Retorna ÚNICAMENTE la cadena JSON estructurada.

ESQUEMA JSON REQUERIDO:
{
  "question": "Escribe la pregunta técnica de opción múltiple. Puede plantear un problema o situación.",
  "code": "Si el desafío requiere un fragmento de código para analizar (ej: un script con un bug o una función en PHP/Go), escríbelo aquí (formateado con saltos de línea \\n). Si no es necesario, deja esta propiedad vacía: \"\"",
  "options": {
    "A": "Texto de la opción A",
    "B": "Texto de la opción B",
    "C": "Texto de la opción C",
    "D": "Texto de la opción D"
  },
  "correct": "La letra de la opción correcta en mayúscula (A, B, C, o D)",
  "explanation": "Una explicación brillante, concisa y detallada de por qué esa opción es la correcta y por qué las otras son incorrectas (máx. 3 o 4 líneas)."
}

Reglas del contenido del desafío:
- El nivel de dificultad debe ser Medio-Alto (para ingenieros y desarrolladores reales, no triviales).
- La explicación debe estar en español técnico fluido.
- Asegúrate de escapar las comillas dobles y saltos de línea internos dentro de los campos de texto JSON para evitar errores de parseo de JSON.parse().
`;

    const result = await model.generateContent([
      { text: systemPrompt }
    ]);

    const responseText = result.response.text().trim();
    
    // Limpieza defensiva en caso de que Gemini devuelva markdown de bloque de código de forma redundante
    let cleanJson = responseText;
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.substring(7);
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.substring(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    }
    cleanJson = cleanJson.trim();

    try {
      const parsedChallenge = JSON.parse(cleanJson);
      if (
        parsedChallenge.question &&
        parsedChallenge.options &&
        parsedChallenge.correct &&
        parsedChallenge.explanation
      ) {
        return parsedChallenge;
      }
      throw new Error('Estructura de JSON incompleta en el retorno.');
    } catch (parseError) {
      console.warn('⚠️ Error al parsear el JSON crudo retornado por Gemini. Contenido:', cleanJson);
      // Fallback estático de emergencia en caso de que falle el JSON generado por IA
      return {
        question: '¿Qué método se utiliza en Laravel para evitar ataques de inyección de código mediante suplantación de identidad en peticiones de formulario?',
        code: 'public function store(Request $request)\n{\n    // ¿Qué directiva o protección previene falsificación de peticiones en Laravel?\n}',
        options: {
          A: 'Middleware de Autenticación JWT',
          B: 'Protección de CSRF (Cross-Site Request Forgery)',
          C: 'Sanitización estricta por Query Builder',
          D: 'Cifrado de base de datos AES-256'
        },
        correct: 'B',
        explanation: 'Laravel utiliza la protección CSRF mediante el middleware VerifyCsrfToken, que valida un token de sesión para asegurar que las peticiones POST/PUT provienen del usuario autenticado en la aplicación y no de un tercero malicioso.'
      };
    }
  } catch (error) {
    console.error('❌ Error en el servicio Gemini (generateChallenge):', error);
    throw new Error('No se pudo generar el desafío técnico.');
  }
}
