import { 
  SlashCommandBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} from 'discord.js';
import { generateChallenge } from '../services/gemini.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('challenge')
    .setDescription('Pon a prueba tus conocimientos con un desafío técnico interactivo de Jarvis.')
    .addStringOption(option =>
      option.setName('tema')
        .setDescription('El tema del desafío técnico.')
        .setRequired(false)
        .addChoices(
          { name: 'Ciberseguridad & Hacks', value: 'ciberseguridad' },
          { name: 'Laravel & PHP', value: 'laravel' },
          { name: 'Go & Infraestructura', value: 'go' },
          { name: 'General / Miscelánea', value: 'general' }
        )
    ),

  async execute(interaction) {
    // 1. Diferir la respuesta inmediatamente debido al tiempo de consulta a la IA
    await interaction.deferReply();
    const tema = interaction.options.getString('tema') || 'general';

    try {
      await interaction.editReply(`🎲 *Generando un desafío técnico de nivel profesional sobre "${tema.toUpperCase()}"...*`);

      // 2. Obtener el desafío JSON generado por la IA de Gemini
      const challenge = await generateChallenge(tema);

      // 3. Formatear el contenido estéticamente
      let content = `🎮 **DESAFÍO TÉCNICO INTERACTIVO DE JARVIS**\n`;
      content += `📌 **Tema:** *${tema.toUpperCase()}*\n`;
      content += `⚡ **Dificultad:** *Medio-Alto*\n\n`;
      content += `❓ **Pregunta:**\n>>> ${challenge.question}\n\n`;

      if (challenge.code) {
        content += `\`\`\`${tema === 'go' ? 'go' : 'php'}\n${challenge.code}\n\`\`\`\n`;
      }

      content += `**Opciones de Respuesta:**\n`;
      content += `🔵 **A.** ${challenge.options.A}\n`;
      content += `🟡 **B.** ${challenge.options.B}\n`;
      content += `🔵 **C.** ${challenge.options.C}\n`;
      content += `🟢 **D.** ${challenge.options.D}\n\n`;
      content += `⏱️ *Tienes 60 segundos para responder haciendo clic en los botones de abajo.*`;

      // 4. Crear los botones para las opciones A, B, C y D
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('challenge_A').setLabel('A').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('challenge_B').setLabel('B').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('challenge_C').setLabel('C').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('challenge_D').setLabel('D').setStyle(ButtonStyle.Primary)
      );

      // 5. Enviar la pregunta con los botones y capturar la respuesta
      const response = await interaction.editReply({
        content: content,
        components: [row]
      });

      // 6. Configurar el recolector de componentes de mensaje (Collector)
      const collector = response.createMessageComponentCollector({ time: 60000 });

      collector.on('collect', async i => {
        // Validación preventiva: solo el usuario que ejecutó el comando puede responder
        if (i.user.id !== interaction.user.id) {
          await i.reply({
            content: '❌ *Este desafío fue generado para otro desarrollador. Escribe `/challenge` para crear tu propio desafío.*',
            ephemeral: true
          });
          return;
        }

        // Detener el colector pasando como motivo la opción elegida
        const eleccion = i.customId.replace('challenge_', '');
        collector.stop(eleccion);
        await i.deferUpdate(); // Confirmamos la interacción de forma silenciosa
      });

      collector.on('end', async (collected, reason) => {
        const correctOption = challenge.correct.toUpperCase();
        
        // Reconstruir la botonera desactivada y con colores semánticos
        const finalRow = new ActionRowBuilder();
        const optionKeys = ['A', 'B', 'C', 'D'];

        optionKeys.forEach(key => {
          const button = new ButtonBuilder()
            .setCustomId(`challenge_ended_${key}`)
            .setLabel(key)
            .setDisabled(true);

          if (key === correctOption) {
            // La opción correcta se pinta de verde (Success)
            button.setStyle(ButtonStyle.Success);
          } else if (reason !== 'time' && key === reason) {
            // Si el usuario eligió esta opción incorrectamente, se pinta de rojo (Danger)
            button.setStyle(ButtonStyle.Danger);
          } else {
            // Las demás opciones se quedan en gris (Secondary)
            button.setStyle(ButtonStyle.Secondary);
          }
          finalRow.addComponents(button);
        });

        // Modificar el mensaje final con los resultados y explicaciones
        let finalContent = `🎮 **DESAFÍO TÉCNICO INTERACTIVO DE JARVIS**\n`;
        finalContent += `📌 **Tema:** *${tema.toUpperCase()}*\n\n`;
        finalContent += `❓ **Pregunta:**\n>>> ${challenge.question}\n\n`;

        if (challenge.code) {
          finalContent += `\`\`\`${tema === 'go' ? 'go' : 'php'}\n${challenge.code}\n\`\`\`\n`;
        }

        if (reason === 'time') {
          // El tiempo expiró
          finalContent += `⏰ **¡TIEMPO AGOTADO!** No respondiste a tiempo.\n\n`;
          finalContent += `✅ **Respuesta Correcta:** **${correctOption}**\n`;
        } else {
          // El usuario respondió
          const esCorrecto = reason === correctOption;
          if (esCorrecto) {
            finalContent += `🎉 **¡CORRECTO!** Excelente deducción, <@${interaction.user.id}>. Sabes de lo que hablas. 🚀\n\n`;
          } else {
            finalContent += `❌ **¡INCORRECTO!** Buen intento, <@${interaction.user.id}>, pero no es la respuesta correcta.\n\n`;
            finalContent += `✅ **Respuesta Correcta:** **${correctOption}** (Elegiste la **${reason}**)\n`;
          }
        }

        // Agregar la explicación detallada de la IA
        finalContent += `💡 **Explicación de Jarvis:**\n>>> ${challenge.explanation}`;

        // Editar el mensaje original con el resultado final y deshabilitar los botones
        await interaction.editReply({
          content: finalContent,
          components: [finalRow]
        }).catch(err => console.error('Error al actualizar el mensaje final del desafío:', err));
      });

    } catch (error) {
      console.error('❌ Error en el comando challenge:', error);
      await interaction.editReply(`❌ Ha ocurrido un error al generar tu desafío técnico. Por favor, vuelve a intentarlo.`);
    }
  }
};
