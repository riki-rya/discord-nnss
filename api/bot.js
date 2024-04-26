const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, EmbedBuilder, GatewayIntentBits, IntentsBitField } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const { LISTENER, supabase } = require('../config.json');

// const supabase = createClient(supabase.SUPABASE_URL, supabase.SUPABASE_API_KEY);
const supabaseClient = createClient(supabase.SUPABASE_URL, supabase.SUPABASE_API_KEY);


const client = new Client({
    intents: [
		GatewayIntentBits.Guilds,
        IntentsBitField.Flags.Guilds, // ギルド（サーバー）の情報を取得するためのインテント
        IntentsBitField.Flags.GuildMembers, // ギルドメンバーの情報を取得するためのインテント
        IntentsBitField.Flags.GuildPresences, // ギルドメンバーのプレゼンス情報を取得するためのインテント
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
});
client.commands = new Collection();

// commandsフォルダから、.jsで終わるファイルのみを取得
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// 取得した.jsファイル内の情報から、コマンドと名前をListenner-botに対して設定
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING]  ${filePath} のコマンドには、必要な "data" または "execute" プロパティがありません。`);
	}
}

// コマンドが送られてきた際の処理
client.on(Events.InteractionCreate, async interaction => {
    // コマンドでなかった場合は処理せずさよなら。
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

    // 一致するコマンドがなかった場合
	if (!command) {
		console.error(` ${interaction.commandName} というコマンドは存在しません。`);
		return;
	}

	try {
        // コマンドを実行
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'コマンドを実行中にエラーが発生しました。', ephemeral: true });
	}
});

client.on('messageCreate', async (message) => {
    // 特定のチャンネルでのみ反応する
    if (!message.author.bot) {
        try {
            // Supabaseからデータを取得
            const { data, error } = await supabaseClient.from('channel_info')
                .select('language,channel_id')
                .eq('channel_id', message.channel.id);
            console.log(data)

            // data が存在し、かつ channel_id が一致する場合のみ翻訳を行う
            if (data && data.length > 0 && data[0].channel_id === message.channel.id) {
                let embedDescription = '';
                for (let i = 0; i < data.length; i++) {
                    const channelData = data[i];
                    let targetLang = channelData.language.toUpperCase(); // 大文字に変換
                    console.log(targetLang)

                    const translationResult = await translateText(message.content, message, targetLang);
                    const translatedText = translationResult.translatedText;
                    const sourceLanguage = translationResult.sourceLanguage;

                    // Embedに追加するテキストを作成
                    embedDescription += `**${sourceLanguage || 'Unknown'} → ${targetLang}**\n${translatedText}\n\n`;
                }

                // Embedを作成
                const embed = new EmbedBuilder()
                    .setTitle('Translation Results')
                    .setDescription(embedDescription)
                    .setColor(0x0099FF);

                // Embedを送信
                await message.reply({ embeds: [embed] });
            }
        } catch (err) {
            console.error('Error:', err);

            // Embedを作成
            const embed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription('An error occurred. Please try again later.')
                .setColor(0xFF0000);

            // Embedを送信
            await message.reply({ embeds: [embed] });
        }
    }
});


async function translateText(text, message, targetLang) {
    try {
        const response = await fetch('https://api-free.deepl.com/v2/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'DeepL-Auth-Key c98d4a48-0fb8-484e-b243-6e2aef58de77:fx'
            },
            body: new URLSearchParams({
                'text': text,
                'target_lang': targetLang
            })
        });

        if (!response.ok) {
            const errorResponse = await response.text();
            console.error('DEEPL APIエラー:\n', errorResponse);
            throw new Error(`DEEPL APIエラー: ${errorResponse}`);
        }

        const responseData = await response.json();
        const translatedText = responseData.translations[0].text;
        const sourceLanguage = responseData.translations[0].detected_source_language;

        return {
            translatedText,
            sourceLanguage,
            targetLang
        };

    } catch (error) {
        console.error('テキスト翻訳中にエラーが発生しました:', error);
        throw error;
    }
}

	

client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.login(LISTENER.TOKEN);


// app.listen(PORT);
// console.log(`Server running at ${PORT}`);
(process.env.NOW_REGION) ? module.exports = app : app.listen(PORT);
console.log(`Server running at ${PORT}`);