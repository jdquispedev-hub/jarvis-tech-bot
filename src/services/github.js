import axios from 'axios';

/**
 * Obtiene las tendencias diarias de repositorios desde GitHub.
 * Permite filtrar por un lenguaje específico o general si se omite.
 * @param {string} [language=''] - Lenguaje de programación a buscar (ej: 'go', 'php', 'javascript').
 * @returns {Promise<Array>} Listado de hasta 5 repositorios tendencia.
 */
export async function fetchTrendingRepos(language = '') {
  const cleanLang = language.trim().toLowerCase();
  
  // Si el lenguaje es 'all' o 'todos', lo tratamos como vacío para traer todas las tendencias
  const pathLang = (cleanLang === 'all' || cleanLang === 'todos' || !cleanLang) 
    ? '' 
    : encodeURIComponent(cleanLang);

  const url = pathLang 
    ? `https://github.com/trending/${pathLang}?since=daily`
    : 'https://github.com/trending?since=daily';

  console.log(`📡 Consultando tendencias de GitHub en: ${url}`);

  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000 // 10 segundos de timeout
    });

    const repoRegex = /<article class="Box-row">([\s\S]*?)<\/article>/g;
    const repos = [];
    let match;

    while ((match = repoRegex.exec(html)) !== null && repos.length < 5) {
      const boxContent = match[1];

      // Extraer la ruta del repositorio: href="/propietario/repositorio"
      const hrefMatch = boxContent.match(/href="\/([^"\s>]+)"/);
      if (!hrefMatch) continue;
      const repoPath = hrefMatch[1];
      
      // Filtrar páginas internas de GitHub que no son repositorios (deben tener estructura propietario/nombre)
      const pathParts = repoPath.split('/');
      if (pathParts.length !== 2) continue;
      if (['site', 'features', 'pulls', 'issues', 'marketplace', 'trending', 'collections'].includes(pathParts[0])) continue;

      const [owner, name] = pathParts;

      // Extraer la descripción del repositorio
      let description = '';
      const descMatch = boxContent.match(/<p class="[^"]*col-9[^"]*">([\s\S]*?)<\/p>/);
      if (descMatch) {
        description = descMatch[1].trim().replace(/\s+/g, ' ');
      }

      // Extraer las estrellas
      let stars = '0';
      const starsMatch = boxContent.match(/href="\/[^"]+\/stargazers"[\s\S]*?>([\s\S]*?)<\/a>/);
      if (starsMatch) {
        stars = starsMatch[1].trim().replace(/[\n\r,]/g, '').trim().replace(/\s+/g, ' ');
      }

      // Extraer lenguaje si está indicado en el Box-row
      let detectedLanguage = '';
      const langMatch = boxContent.match(/itemprop="programmingLanguage">([\s\S]*?)<\/span>/);
      if (langMatch) {
        detectedLanguage = langMatch[1].trim();
      }

      repos.push({
        owner,
        name,
        fullName: repoPath,
        url: `https://github.com/${repoPath}`,
        description: description || 'Sin descripción disponible.',
        stars: stars || '0',
        language: detectedLanguage || language || 'Varios'
      });
    }

    console.log(`✅ Se encontraron ${repos.length} repositorios tendencia en GitHub.`);
    return repos;
  } catch (error) {
    console.error(`❌ Error al recopilar tendencias de GitHub:`, error.message);
    throw new Error(`No se pudo obtener información de tendencias de GitHub: ${error.message}`);
  }
}
