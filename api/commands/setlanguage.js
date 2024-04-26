const { SlashCommandBuilder } = require('@discordjs/builders');
const { createClient } = require('@supabase/supabase-js');
const { supabase } = require('../config.json');

const supabaseClient = createClient(supabase.SUPABASE_URL, supabase.SUPABASE_API_KEY);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setlang')
    .setDescription('Set your preferred translation language')
    .addStringOption(option =>
      option
        .setName('language')
        .setDescription('Select your preferred translation language')
        .setRequired(true)
    ),
    async execute(interaction) {
      if (!interaction.isCommand()) return;
      const { commandName, options } = interaction;
      if (commandName === 'setlang') {
        const language = options.getString('language');
        const userId = interaction.user.id.toString();
        const channelId = interaction.channel.id.toString();
    
        try {
          const { data, error } = await supabaseClient.from('channel_info').insert([
            {
              user_id: userId,
              channel_id: channelId,
              language: language
            }
          ], { upsert: true });
    
          if (error) {
            // Unique 制約違反の場合の処理
            if (error.code === '23505') {
              console.error('Unique constraint violation:', error.message);
              await interaction.reply('This language is already set on this channel. Please select another language.');
            } else {
              console.error('Error saving value to Supabase:', error.message);
              await interaction.reply('Saving data failed due to an unidentified error. Please contact the developer.');
            }
          } else {
            console.log('Value saved to Supabase:', data);
            await interaction.reply('Language saved on this channel.');
          }
        } catch (err) {
          console.error('Error saving value to Supabase:', err.message);
          await interaction.reply('Saving data failed due to an unidentified error. Please contact the developer.');
        }
      }
    }
};