import axios from 'axios';

/**
 * Obtiene las últimas vulnerabilidades críticas registradas globalmente de la API CIRCL CVE.
 * Filtra y ordena para retornar las 5 de mayor puntuación e impacto (CVSS >= 7.0).
 * @returns {Promise<Array>} Listado de 5 vulnerabilidades de alta gravedad.
 */
export async function fetchCriticalCVEs() {
  const url = 'https://cve.circl.lu/api/last';
  console.log(`📡 Consultando últimas vulnerabilidades en: ${url}`);

  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) JarvisTechBot/1.0'
      },
      timeout: 10000 // 10 segundos
    });

    if (!Array.isArray(data)) {
      throw new Error('La respuesta del API no es un arreglo válido.');
    }

    // 1. Filtrar los que tienen CVSS y mapear a nuestra estructura
    const cvesFiltrados = data
      .filter(item => item && item.id && item.summary)
      .map(item => {
        const score = parseFloat(item.cvss) || 0.0;
        return {
          id: item.id,
          summary: item.summary,
          cvss: score,
          published: item.Published ? new Date(item.Published).toLocaleDateString('es-ES') : 'N/A',
          references: Array.isArray(item.references) ? item.references.slice(0, 3) : []
        };
      });

    // 2. Ordenar de mayor a menor gravedad (puntuación CVSS)
    cvesFiltrados.sort((a, b) => b.cvss - a.cvss);

    // 3. Tomar los 5 más graves (o al menos de gravedad alta, CVSS >= 7.0)
    // Si no hay suficientes con CVSS >= 7.0, tomamos los últimos 5 disponibles de mayor puntuación
    const cvesCriticos = cvesFiltrados.slice(0, 5);

    console.log(`✅ Se recopilaron y ordenaron ${cvesCriticos.length} CVEs críticos con éxito.`);
    return cvesCriticos;
  } catch (error) {
    console.error('❌ Error al consultar CIRCL CVE API:', error.message);
    throw new Error(`No se pudo conectar al API de Ciberseguridad: ${error.message}`);
  }
}
