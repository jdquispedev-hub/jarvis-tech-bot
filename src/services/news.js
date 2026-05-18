import Parser from 'rss-parser';

const parser = new Parser();

// Fuentes RSS oficiales y de alta fiabilidad técnica
const FUENTES_NOTICIAS = [
  {
    name: 'The Hacker News',
    url: 'https://thehackernews.com/feeds/posts/default',
    category: 'Ciberseguridad'
  },
  {
    name: 'Laravel News',
    url: 'https://laravel-news.com/feed',
    category: 'Laravel & Backend'
  },
  {
    name: 'Official Go Blog',
    url: 'https://blog.golang.org/feed.atom',
    category: 'Go & Infraestructura'
  },
  {
    name: 'Hacker News (AI Trends)',
    url: 'https://hnrss.org/newest?q=AI+OR+LLM+OR+Gemini+OR+Llama+OR+OpenAI',
    category: 'Modelos de IA & Tecnología'
  },
  {
    name: 'Hacker News (GitHub & OpenSource)',
    url: 'https://hnrss.org/newest?q=GitHub+OR+opensource',
    category: 'Plataformas & Código Abierto'
  }
];

/**
 * Obtiene y unifica las noticias más recientes de todas las fuentes configuradas.
 * Las descargas se realizan en paralelo para lograr un rendimiento óptimo.
 * @returns {Promise<Array>} Listado de artículos de noticias unificado.
 */
export async function fetchTechNews() {
  console.log('📡 Iniciando recolección de noticias en paralelo...');
  const noticiasConsolidadas = [];

  const promesas = FUENTES_NOTICIAS.map(async (fuente) => {
    try {
      // Descargar y parsear el feed XML
      const feed = await parser.parseURL(fuente.url);
      
      // Extraemos únicamente las 3 noticias más recientes de cada fuente para no saturar a la IA
      const articulos = feed.items.slice(0, 3).map(item => ({
        title: item.title,
        link: item.link,
        description: item.contentSnippet || item.summary || item.content || 'Sin descripción disponible.',
        source: fuente.name,
        category: fuente.category,
        pubDate: item.pubDate
      }));

      return articulos;
    } catch (error) {
      // Manejo individual de excepciones: si un feed falla, se avisa pero no detiene el bot
      console.warn(`⚠️ No se pudo recolectar noticias de "${fuente.name}":`, error.message);
      return [];
    }
  });

  // Esperar a que se resuelvan todas las peticiones simultáneas
  const resultados = await Promise.all(promesas);

  // Unificar las noticias en un único arreglo plano
  resultados.forEach(articulos => {
    noticiasConsolidadas.push(...articulos);
  });

  console.log(`✅ Recolección terminada. Artículos listos para análisis: ${noticiasConsolidadas.length}`);
  return noticiasConsolidadas;
}
