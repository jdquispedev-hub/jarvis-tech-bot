import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { config } from './config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// Obtener rutas absolutas compatibles con ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializar cliente de Discord con Intents mínimos necesarios
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Colección para almacenar los comandos slash cargados
client.commands = new Collection();

console.log('🔄 Iniciando carga dinámica de módulos...');

// 1. CARGA DINÁMICA DE COMANDOS
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const fileUrl = pathToFileURL(filePath).href; // Clave para compatibilidad de import() en Windows
    const { command } = await import(fileUrl);
    
    if (command && command.data && command.execute) {
      client.commands.set(command.data.name, command);
      console.log(`🤖 Comando cargado: /${command.data.name}`);
    } else {
      console.warn(`⚠️  El comando en "${file}" carece de propiedad 'data' o 'execute'.`);
    }
  }
} else {
  console.log('📂 No se encontró la carpeta de comandos (se creará al crear los comandos).');
}

// 2. CARGA DINÁMICA DE EVENTOS
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const fileUrl = pathToFileURL(filePath).href;
    const { event } = await import(fileUrl);
    
    if (event && event.name && event.execute) {
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
      console.log(`🔌 Evento cargado: ${event.name}`);
    } else {
      console.warn(`⚠️  El evento en "${file}" carece de propiedad 'name' o 'execute'.`);
    }
  }
} else {
  console.log('📂 No se encontró la carpeta de eventos.');
}

// Conectar el cliente a los servidores de Discord
client.login(config.discordToken);
