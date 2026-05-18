import dotenv from 'dotenv';

// Cargar las variables del archivo .env
dotenv.config();

// Definir variables obligatorias para el funcionamiento del bot
const requiredEnv = [
  'DISCORD_TOKEN',
  'DISCORD_CLIENT_ID',
  'GEMINI_API_KEY'
];

const missingVars = requiredEnv.filter(envVar => !process.env[envVar]);

if (missingVars.length > 0) {
  console.error('\x1b[31m%s\x1b[0m', '❌ ERROR DE CONFIGURACIÓN: Faltan variables esenciales en tu archivo .env:');
  missingVars.forEach(envVar => {
    console.error('\x1b[33m%s\x1b[0m', `   ⚠️  ${envVar}`);
  });
  console.error('\x1b[36m%s\x1b[0m', '\n💡 Solución: Duplica ".env.template" como ".env" y escribe los valores correctos.\n');
  process.exit(1);
}

// Configuración exportada lista para usar de forma segura y optimizada
export const config = {
  discordToken: process.env.DISCORD_TOKEN,
  discordClientId: process.env.DISCORD_CLIENT_ID,
  discordGuildId: process.env.DISCORD_GUILD_ID || null, // Opcional, pero vital para registrar comandos al instante
  newsChannelId: process.env.NEWS_CHANNEL_ID || null,   // Canal por defecto donde se enviarán las noticias diarias
  geminiApiKey: process.env.GEMINI_API_KEY
};
