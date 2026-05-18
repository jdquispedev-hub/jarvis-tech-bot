import { REST, Routes } from 'discord.js';
import { config } from '../config.js';

export const event = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`\n🤖 Bot Conectado Exitosamente!`);
    console.log(`👤 Usuario: ${client.user.tag}`);
    console.log(`🆔 ID de Cliente: ${client.user.id}\n`);

    // Recopilar la información de comandos slash cargados
    const commandsJson = [];
    client.commands.forEach(command => {
      commandsJson.push(command.data.toJSON());
    });

    const rest = new REST({ version: '10' }).setToken(config.discordToken);

    try {
      console.log(`🔄 Iniciando registro de ${commandsJson.length} comandos slash...`);

      if (config.discordGuildId) {
        // Registro en servidor específico (Instantáneo - perfecto para desarrollo)
        await rest.put(
          Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId),
          { body: commandsJson }
        );
        console.log(`✅ Comandos slash registrados INSTANTÁNEAMENTE en el Servidor (Guild ID: ${config.discordGuildId}).`);
      } else {
        // Registro global (Tarda hasta 1 hora en propagarse en Discord)
        await rest.put(
          Routes.applicationCommands(config.discordClientId),
          { body: commandsJson }
        );
        console.log('✅ Comandos slash registrados GLOBALMENTE con éxito.');
      }
    } catch (error) {
      console.error('❌ Error al registrar los comandos slash:', error);
    }

    // Inicializar tareas programadas (cron)
    try {
      // Importación dinámica para evitar errores si no hemos creado aún el cronNotifier.js
      const { initCronTasks } = await import('../tasks/cronNotifier.js');
      initCronTasks(client);
      console.log('⏰ Planificador de tareas cron inicializado con éxito.');
    } catch (error) {
      console.log('ℹ️  Nota: Tareas cron no inicializadas aún (se activarán al crear cronNotifier.js).');
    }
  }
};
