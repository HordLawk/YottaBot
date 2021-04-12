module.exports = {
    lang: 'pt',
    get: (line, vars = []) => {
        switch(line){
            case 'mentionHelp': return `Use \`${vars[0]}help\` para ver todos os meus comandos!`;
            case 'noArgs': return `Você não forneceu nenhum argumento, ${vars[0]}!\nO uso correto seria: \`${vars[1]}${vars[2]} ${vars[3]}\``;
            case 'cooldown': return `Por favor espere mais ${vars[0]} segundo(s) antes de usar o comando \`${vars[1]}\` novamente`;
            case 'error': return `Houve um erro ao tentar executar o comando \`${vars[0]}\`!`;
            case 'helpDescription': return 'Lista todos os comandos ou mostra informações sobre um específico';
            case 'helpUsage': return '[(comando)]';
            case 'pingDescription': return 'Ping!';
            case 'pruneDescription': return 'Deleta uma quantidade escolhida de mensagens';
            case 'pruneUsage': return '(quantidade)';
            case 'prunePerm': return 'Administrador';
            case 'botEmbed': return 'Eu preciso de permissão para enviar links nesse canal';
            case 'botManageMessages': return 'Eu preciso de permissão para gerenciar mensagens nesse canal';
            case 'helpEmbedTitle': return 'Ajuda de comandos';
            case 'helpEmbedDescription': return `Use \`${vars[0]}help (comando)\` para mais informações sobre um comando específico`;
            case 'helpEmbedFooter': return `${vars[0]} comandos`;
            case 'category0': return 'Comandos';
            case 'invalidCommand': return 'Esse não é um comando válido';
            case 'helpCommandEmbedTitle': return `Ajuda para o comando ${vars[0]}`;
            case 'helpCommandEmbedFooter': return '[] = Opcional - () = Variável - <|> = Qualquer';
            case 'syntax': return 'Sintaxe';
            case 'example': return 'Exemplo';
            case 'aliases': return 'Apelidos';
            case 'permissionLevel': return 'Nível de permissão';
            case 'helpCommandCooldown': return `${vars[0]} segundo(s)`;
            case 'terrible': return 'Terrível';
            case 'bad': return 'Ruim';
            case 'normal': return 'Normal';
            case 'good': return 'Bom';
            case 'average': return 'Médio';
            case 'current': return 'Atual';
            case 'invalidValue': return `Valor inválido. ${vars[0]}`;
            case 'maintenance': return 'Em manutenção, tente novamente mais tarde';
            case 'guildOnly': return 'Esse comando funciona apenas em servidores';
        }
    },
}