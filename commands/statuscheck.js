const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('指定したユーザーのステータスを取得します')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('ステータスを取得したいユーザーを指定します')
                .setRequired(true)),

    async execute(interaction) {
        // コマンドから指定されたユーザーを取得
        const user = interaction.options.getUser('user');

        // ユーザーが存在しない場合のエラーハンドリング
        if (!user) {
            await interaction.reply('指定されたユーザーが見つかりませんでした。');
            return;
        }

        // ユーザーのメンバー情報を取得
        const member = await interaction.guild.members.fetch(user.id).catch(console.error);
        if (!member) {
            await interaction.reply('ユーザーのメンバー情報を取得できませんでした。');
            return;
        }

        // ユーザーのプレゼンス情報を取得
        const presence = member.presence;
        if (!presence) {
            await interaction.reply('ユーザーのプレゼンス情報を取得できませんでした。');
            return;
        }

        // ユーザーのステータスを取得
        const status = presence.status;

        let response;
        switch (status) {
            case 'online':
                response = `${user.username} は現在オンラインです。`;
                break;
            case 'offline':
                response = `${user.username} は現在オフラインです。`;
                break;
            case 'idle':
                response = `${user.username} は現在離席中です。`;
                break;
            case 'dnd':
                response = `${user.username} は現在取り込み中です。`;
                break;
            default:
                response = `${user.username} のステータスを取得できませんでした。`;
                break;
        }
        await interaction.reply(response);
    },
};
