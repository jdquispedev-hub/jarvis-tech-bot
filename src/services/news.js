import Parser from 'rss-parser';

const parser = new Parser();

// Fuentes RSS oficiales y de alta fiabilidad técnica (reemplazando Hacker News para evitar errores 429)
const FUENTES_NOTICIAS = [
  {
    name: 'The Hacker News',
    url: 'https://thehackernews.com/feeds/posts/default',
    category: 'Ciberseguridad'
  },
  {
    name: 'Dark Reading',
    url: 'https://www.darkreading.com/rss.xml',
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
    name: 'Golang Weekly',
    url: 'https://golangweekly.com/rss',
    category: 'Go & Infraestructura'
  },
  {
    name: 'VentureBeat AI',
    url: 'https://venturebeat.com/category/ai/feed/',
    category: 'Modelos de IA & Tecnología'
  },
  {
    name: 'TechCrunch AI',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    category: 'Modelos de IA & Tecnología'
  },
  {
    name: 'GitHub Changelog',
    url: 'https://github.blog/changelog/feed/',
    category: 'Plataformas & Código Abierto'
  },
  {
    name: 'GitHub Blog',
    url: 'https://github.blog/feed/',
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
      
      // Extraemos únicamente las 5 noticias más recientes de cada fuente para no saturar a la IA
      const articulos = feed.items.slice(0, 5).map(item => ({
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
