import { SlashCommandBuilder } from 'discord.js';
import { fetchTrendingRepos } from '../services/github.js';
import { generateGithubSummary } from '../services/gemini.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('githubtrending')
    .setDescription('Obtén los repositorios que son tendencia hoy en GitHub.')
    .addStringOption(option => 
      option.setName('lenguaje')
        .setDescription('El lenguaje de programación para filtrar las tendencias.')
        .setRequired(false)
        .addChoices(
          { name: 'Go', value: 'go' },
          { name: 'PHP / Laravel', value: 'php' },
          { name: 'JavaScript / TypeScript', value: 'javascript' },
          { name: 'Python', value: 'python' },
          { name: 'Rust', value: 'rust' },
          { name: 'Todos los Lenguajes', value: 'all' }
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();
    const lenguaje = interaction.options.getString('lenguaje') || 'all';

    try {
      await interaction.editReply(`📡 *Recopilando repositorios tendencia de GitHub para "${lenguaje.toUpperCase()}"...*`);
      
      const repos = await fetchTrendingRepos(lenguaje);
      
      await interaction.editReply(`🤖 *Analizando repositorios y redactando el informe con la IA de Jarvis...*`);
      
      const summary = await generateGithubSummary(repos, lenguaje);
      
      await interaction.editReply(summary);
    } catch (error) {
      console.error('❌ Error en comando githubtrending:', error);
      await interaction.editReply(`❌ Ocurrió un error al procesar las tendencias de GitHub. Asegúrate de tener conexión y vuelve a intentarlo.`);
    }
  }
};
