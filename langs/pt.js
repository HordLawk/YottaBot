module.exports = {
    lang: 'pt',
    get: (line, vars = []) => {
        switch(line){
            case 'mentionHelp': return `Use \`${vars[0]}help\` para ver todos os meus comandos!`;
            case 'noArgs': return `Você não forneceu nenhum argumento, ${vars[0]}!\nO uso correto seria:\n${vars[3].map(e => `\`${vars[1]}${vars[2]} ${e}\``).join('\n')}`;
            case 'cooldown': return `Por favor espere mais ${vars[0]} segundo(s) antes de usar o comando \`${vars[1]}\` novamente`;
            case 'error': return `Houve um erro ao tentar executar o comando \`${vars[0]}\`!`;
            case 'helpDescription': return 'Lista todos os comandos ou mostra informações sobre um específico';
            case 'helpUsage': return '[(comando)]';
            case 'pingDescription': return 'Ping!';
            case 'pruneDescription': return 'Deleta uma quantidade escolhida de mensagens';
            case 'pruneUsage': return '(quantidade)';
            case 'botEmbed': return 'Eu preciso de permissão para enviar links nesse canal';
            case 'botManageMessages': return 'Eu preciso de permissão para gerenciar mensagens nesse canal';
            case 'helpEmbedTitle': return 'Ajuda de comandos';
            case 'helpEmbedDescription': return `Use \`${vars[0]}help (comando)\` para mais informações sobre um comando específico\n\n__Note que:__\n- \`(canal)\` = \`<(menção de canal)/(ID de canal)>\`\n- \`(usuário)\` = \`<(menção de usuário)/(ID de usuário)>\`\n- \`(cargo)\` = \`<(menção de cargo)/(ID de cargo)/(nome de cargo)>\``;
            case 'helpEmbedFooter': return `${vars[0]} comandos | [] = Opcional - () = Variável - </> = Qualquer`;
            case 'category0': return 'Comandos';
            case 'invalidCommand': return 'Esse não é um comando válido';
            case 'helpCommandEmbedTitle': return `Ajuda para o comando ${vars[0]}`;
            case 'helpCommandEmbedFooter': return '[] = Opcional - () = Variável - </> = Qualquer';
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
            case 'forbidden': return 'Você não tem permissão para usar esse comando';
            case 'disabled': return 'Esse comando foi desativado nesse canal';
            case 'permDescription': return 'Permite ou proibe cargos de usarem comandos específicos';
            case 'permUsage0': return '<allow/deny/default> <(menção de cargo)/(ID de cargo)/"(nome de cargo)"> (lista de comandos)';
            case 'permUsage1': return 'view <(menção de cargo)/(ID de cargo)/"(nome de cargo)">';
            case 'ADMINISTRATOR': return 'Administrador';
            case 'invArgs': return `Argumentos inválidos!\nO uso correto seria:\n${vars[2].map(e => `\`${vars[0]}${vars[1]} ${e}\``).join('\n')}`;
            case 'permSuccess': return `**${vars[0]}** foi ${(vars[1] === 'allow') ? 'permitido a' : 'proibido de'} usar esses comandos`;
            case 'noSpecialPerms': return 'Não há nenhuma permissão especial definida para esse cargo';
            case 'defaultPermsSuccess': return `Permissões especiais de **${vars[0]}** sobre esses comandos foram removidas`;
            case 'permsEmbedAuthor': return 'Permissões especiais';
            case 'permsAllowed': return 'Comandos permitidos';
            case 'permsDenied': return 'Comandos proibidos';
            case 'disableDescription': return 'Bloqueia comandos em canais específicos';
            case 'disableUsage0': return '(canal) <on/off> <(lista de comandos)/all>';
            case 'disableUsage1': return '(canal) view';
            case 'disableAll': return `Todos os comandos foram ${(vars[0] === 'on') ? 'bloqueados' : 'desbloqueados'} em ${vars[1]}`;
            case 'disableSome': return `Esses comandos foram ${(vars[0] === 'on') ? 'bloqueados' : 'desbloqueados'} em ${vars[1]}`;
            case 'permsEmbedDesc': return `Cargo: ${vars[0]}`;
            case 'noDisabledCmds': return 'Não há comandos bloqueados nesse canal';
            case 'disabledEmbedAuthor': return 'Comandos de canais específicos';
            case 'disabledEmbedDesc': return `Canal: ${vars[0]}`;
            case 'disabledField': return 'Bloqueado';
            case 'achieveGuild': return `Parabéns ${vars[0]}! Você conquistou o cargo **${vars[1]}**`;
            case 'achieveDM': return `Parabéns! Você conquistou o cargo **${vars[0]}** no servidor **${vars[1]}**`;
        }
    },
};