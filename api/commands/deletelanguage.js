const { SlashCommandBuilder } = require('@discordjs/builders');
const { createClient } = require('@supabase/supabase-js');
const { supabase } = require('../config.json');

const supabaseClient = createClient(supabase.SUPABASE_URL, supabase.SUPABASE_API_KEY);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deletelang')
    .setDescription('Remove the set translation language.'),
    async execute(interaction) {
      if (!interaction.isCommand()) return;
      const { commandName, options } = interaction;
      if (commandName === 'deletelang') {
        const userId = interaction.user.id.toString();
        const channelId = interaction.channel.id.toString();
    
        try {
          const { data, error } = await supabaseClient.from('channel_info').delete().eq('channel_id', channelId);
    
          if (error) {
            console.error('Error deleting language:', error.message);
            await interaction.reply('Error deleting language:', error.message);
            return;
          }else{
            console.log('Language deleted successfully');
            await interaction.reply('Language deleted successfully');
        }} catch (error) {
          console.error('Error deleting language:', error.message);
          await interaction.reply('Delete data failed due to an unidentified error. Please contact the developer.');
        }
      }
    }
};