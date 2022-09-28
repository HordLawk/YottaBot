module.exports = {
    lang: 'pt',
    name: 'Português',
    flag: '🇧🇷',
    code: 'pt-BR',
    get: (line, vars = []) => {
        switch(line){
            case 'mentionHelp': return `Use \`${vars[0]}help\` para ver todos os meus comandos!`;
            case 'blacklisted': return `Você está proibido de usar este bot!`;
            case 'noArgs': return `Você não forneceu nenhum argumento, ${vars[0]}!\nO uso correto seria:\n${vars[3].map(e => `\`${vars[1]}${vars[2]} ${e}\``).join('\n')}`;
            case 'cooldown': return `Por favor espere mais ${vars[0]} segundo(s) antes de usar o comando \`${vars[1]}\` novamente${vars[2] ? '' : `\nDica: Servidores premium tem metade do cooldown para todos os comandos\nPara adquirir premium [se junte ao Patreon](<https://www.patreon.com/YottaBot>)`}`;
            case 'error': return `Houve um erro ao tentar executar o comando \`${vars[0]}\`\nO problema foi enviado à equipe de suporte e será corrigido no futuro proximo`;
            case 'helpDescription': return 'Lista todos os comandos ou mostra informações sobre um específico';
            case 'helpUsage': return '[(comando)]';
            case 'pingDescription': return 'Ping!';
            case 'pruneDescription': return 'Deleta uma quantidade escolhida de mensagens de qualquer usuário ou de um específico no canal atual';
            case 'pruneUsage': return '(quantidade) [(usuário)]';
            case 'botEmbed': return 'Eu preciso de permissão para enviar links nesse canal';
            case 'botManageMessages': return 'Eu preciso de permissão para gerenciar mensagens nesse canal';
            case 'helpEmbedTitle': return 'Ajuda de comandos';
            case 'helpEmbedDescription': return `[\`Servidor de suporte\`](https://discord.gg/${vars[0]})\n[\`Me convide\`](${vars[1]})\n[\`Documentação avançada\`](https://github.com/HordLawk/YottaBot#get-started)\n[\`Top.gg\`](https://top.gg/bot/${vars[3]})\n\nUse \`${vars[2]}help (comando)\` para mais informações sobre um comando específico`;
            case 'helpEmbedFooter': return `${vars[0]} comandos | [] = Opcional - () = Variável - </> = Qualquer`;
            case 'category0': return 'Comandos';
            case 'category1': return 'Informação';
            case 'category2': return 'Administração';
            case 'category3': return 'Moderação';
            case 'category4': return 'Níveis';
            case 'category5': return 'Outros';
            case 'invalidCommand': return 'Esse não é um comando válido';
            case 'invalidStructure': return `O comando \`${vars[0]}\` não possui uma estrutura válida`;
            case 'deploySuccess': return `O comando \`${vars[0]}\` foi implantado com sucesso no \`${vars[1]}\``;
            case 'deployFail': return `O comando \`${vars[0]}\` não pode ser implantado no \`${vars[1]}\``;
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
            case 'average': return 'Conexão';
            case 'current': return 'Resposta';
            case 'invalidValue': return `Valor inválido. ${vars[0]}`;
            case 'maintenance': return 'Em manutenção, tente novamente mais tarde';
            case 'guildOnly': return 'Esse comando funciona apenas em servidores';
            case 'forbidden': return 'Você não tem permissão para usar esse comando';
            case 'disabled': return 'Esse comando foi desativado nesse canal';
            case 'permDescription': return 'Permite ou proibe cargos de usarem comandos específicos';
            case 'permUsage0': return '<allow/deny/default> <(menção de cargo)/(ID de cargo)/"(nome de cargo)"> (lista de comandos)';
            case 'permUsage1': return 'view <(menção de cargo)/(ID de cargo)/"(nome de cargo)">';
            case 'permission8': return 'Administrador';
            case 'permission268435456': return 'Gerenciar Cargos';
            case 'permission4': return 'Banir Membros';
            case 'permission2': return 'Expulsar Membros';
            case 'permission1099511627776': return 'Moderar Membros';
            case 'permission16': return 'Gerenciar Canais';
            case 'permission8192': return 'Gerenciar Mensagens';
            case 'permission1': return 'Criar Convite';
            case 'permission17179869184': return 'Gerenciar Threads';
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
            case 'achieveGuild': return `Parabéns ${vars[0]}! Você conquistou o cargo ${vars[1]}`;
            case 'achieveDM': return `Parabéns! Você conquistou o cargo **${vars[0]}** no servidor **${vars[1]}**`;
            case 'msgxpDescription': return 'Gerencia o sistema de xp desse servidor';
            case 'msgxpUsage0': return 'enable <on/off>';
            case 'msgxpUsage1': return 'roles set (cargo) (xp)';
            case 'msgxpUsage2': return 'roles remove <(cargo)/all>';
            case 'msgxpUsage3': return 'user <add/remove/set> (xp) (lista de usuários)';
            case 'msgxpUsage4': return 'ignore role <add/remove> (cargo)';
            case 'msgxpUsage5': return 'ignore channel <add/remove> (canal)';
            case 'msgxpUsage6': return 'notify <default/none/dm/(canal)>';
            case 'msgxpUsage7': return 'view';
            case 'msgxpUsage8': return 'stack <on/off>';
            case 'msgxpUsage9': return 'reset';
            case 'msgxpUsage10': return 'recommend (quantia de cargos) (xp máximo)';
            case 'msgxpUsage11': return 'multiplier (cargo) (valor)';
            case 'xpEnable': return `Sistema de xp do servidor ${(vars[0] === 'on') ? 'ativado': 'desativado'}`
            case 'xpStack': return `Acumulo de cargos de xp ${(vars[0] === 'on') ? 'ativado': 'desativao'}`
            case 'manageRole': return 'Eu preciso de permissão para gerenciar esse cargo';
            case 'sameXp': return 'Já existe outro cargo definido para essa quantidade de xp';
            case 'maxXpRoles': return 'O número maximo de cargos de xp para servidores não premium é 10, mas você pode adicionar mais com premium! Para adquirir premium [se junte ao Patreon](<https://www.patreon.com/YottaBot>)';
            case 'setXpRole': return `**${vars[0]}** definido como recompensa para **${vars[1]}** xp\nesteja ciente que membros apenas receberão esse cargo ao enviar novas mensagens`;
            case 'resetXpRoles': return `Todos os cargos de xp foram removidos\nesteja ciente que esses cargos não serão removidos automaticamente dos membros, se você quiser isso, é recomendado deletar os cargos do servidor para que nenhum membro continue com eles`;
            case 'removeXpRole': return `**${vars[0]}** foi removido das recompensas de xp\nesteja ciente que esse cargo não será removido automaticamente dos membros, se você quiser isso, é recomendado deletar o cargo do servidor para que nenhum membro continue com ele`;
            case 'setUserXp': return 'Novas quantias de xp definidas';
            case 'xpIgnoreRole': return `O cargo **${vars[0]}** ${(vars[1] === 'add') ? 'não vai' : 'vai'} receber xp`;
            case 'xpIgnoreChannel': return `Usuários ${(vars[0] === 'add') ? 'não vão' : 'vão'} receber xp em ${vars[1]}`;
            case 'notifyDefault': return `Notificações de novos cargos de xp serão enviadas ${(vars[0] === 'dm') ? 'nas MDs' : 'no canal onde o cargo foi alcançado'}`;
            case 'notifyNone': return 'Nenhuma notificação de novos cargos de xp será enviada';
            case 'notifyChannel': return `Notificações de novos cargos serão enviadas em ${vars[0]}`;
            case 'notifyDefaultView': return '\`Mesmo canal\`';
            case 'notifyDMView': return '\`MDs\`';
            case 'notifyNoneView': return '\`Nenhum\`';
            case 'xpViewEmbedAuthor': return 'Configurações do sistema de xp do servidor';
            case 'xpViewEmbedDesc': return `Ativado: \`${vars[0] ? 'sim': 'não'}\`\nAcumulo: \`${vars[1] ? 'não': 'sim'}\`\nNotificações: ${vars[2]}`;
            case 'xpViewRoles': return 'Cargos conquistáveis';
            case 'xpViewIgnoredRoles': return 'Cargos ignorados';
            case 'xpViewIgnoredChannels': return 'Canais ignorados';
            case 'xpViewMultipliedRoles': return 'Multiplicadores de xp';
            case 'resetXpConfirm': return 'Isso **__REDEFINIRÁ O XP DE TODOS OS USUÁRIOS__** para 0, você tem certeza que deseja prosseguir?';
            case 'timedOut': return 'Limite de tempo da operação atingido';
            case 'cancelled': return 'Operação cancelada';
            case 'resetXp': return 'O xp do servidor foi redefinido com sucesso';
            case 'memberManageRole': return 'Você não tem permissão para gerenciar esse cargo';
            case 'sendMessages': return 'Eu preciso de permissão para enviar mensagens nesse canal';
            case 'rolemenuDescription': return 'Cria uma mensagem onde usuários podem reagir para reivindicar um ou mais cargos';
            case 'rolemenuUsage0': return 'create (canal) <(menção de cargo)/(ID de cargo)/"(nome de cargo)"> (emoji) [(lista de cargos e emojis)] [toggle]';
            case 'rolemenuUsage1': return 'edit (ID de menu) <(menção de cargo)/(ID de cargo)/"(nome de cargo)"> (emoji) [(lista de cargos e emojis)] [toggle]';
            case 'maxRolesMenu': return 'O número máximo de cargos por menu é 20';
            case 'botReactions': return 'Eu preciso de permissão para adicionar reações nesse canal';
            case 'maxRolemenus': return 'O número máximo de menus para servidores não premium é 10, mas você pode adicionar mais com premium! Para adquirir premium [se junte ao Patreon](<https://www.patreon.com/YottaBot>)';
            case 'uniqueEmoji': return 'Cada emoji só pode ser usado uma vez por menu';
            case 'loading': return 'Carregando...';
            case 'rolemenuEmbedAuthor': return 'Reaja para reivindicar um cargo';
            case 'rolemenuCreated': return 'Rolemenu criada com sucesso';
            case 'menu404': return 'Menu não encotrado';
            case 'rolemenuEdited': return 'Rolemenu editado com sucesso';
            case 'configsDescription': return 'Configurações gerais do servidor';
            case 'configsUsage0': return 'prefix (novo prefixo)';
            case 'configsUsage1': return 'language <en/pt>';
            case 'configsUsage2': return 'view';
            case 'configsUsage3': return 'mod logs (canal) <warn/mute/kick/ban> [(outros tipos de casos)]';
            case 'configsUsage4': return 'mod clearonban (dias)';
            case 'configsUsage5': return 'massbanprotection on [(máximo de bans por moderador por 10 segundos)]';
            case 'longPrefix': return 'O prefixo não pode conter mais de 10 caracteres';
            case 'newPrefix': return 'Prefixo do servidor atualizado';
            case 'lang404': return 'Idioma não suportado';
            case 'newLang': return 'Idioma do servidor atualizado';
            case 'configsEmbedAuthor': return 'Configurações do servidor';
            case 'configsEmbedDesc': return `Prefixo: \`${vars[0]}\`\n` +
                                            `Idioma: \`${vars[1]}\`\n` +
                                            `Registrar anexos: \`${vars[2] ? 'ativado' : 'desativado'}\`\n` +
                                            'Canal de registro de warn: ' +
                                            `${vars[3].warn ? `<#${vars[3].warn}>` : '`nenhum`'}\n` +
                                            'Canal de registro de mute/castigo: ' +
                                            `${vars[3].mute ? `<#${vars[3].mute}>` : '`nenhum`'}\n` +
                                            'Canal de registro de kick: ' +
                                            `${vars[3].kick ? `<#${vars[3].kick}>` : '`nenhum`'}\n` +
                                            'Canal de registro de ban: ' +
                                            `${vars[3].ban ? `<#${vars[3].ban}>` : '`nenhum`'}\n` +
                                            `Número de dias de mensagens deletadas em bans: \`${vars[4]}\`\n` +
                                            `Máximo de bans por moderador por 10 segundos: \`${vars[5] ?? '∞'}\`\n` +
                                            `Banimentos globais: \`${vars[6] ? 'ativados' : 'desativados'}\`\n` +
                                            `Canal de boas vindas: ${vars[8] ? `<#${vars[8]}>` : '`nenhum`'}\n` +
                                            `Funções beta: \`${vars[7] ? 'ativadas' : 'desativadas'}\``;
            case 'betaCommand': return 'Esse comando atualmente está disponível apenas para servidor que ativaram funcionalidade beta nas configurações do bot';
            case 'premiumCommand': return `Esse comando é uma funcionalidade premium, para adquirir premium [se junte ao Patreon](<https://www.patreon.com/YottaBot>)`;
            case 'botWebhooks': return 'Eu preciso de permissão para gerenciar webhooks nesse canal';
            case 'executor': return `\nExecutor: ${vars[0]}`;
            case 'delmsgEmbedAuthor': return 'Mensagem deletada';
            case 'delmsgEmbedAuthorTitle': return 'Autor';
            case 'delmsgEmbedChannelTitle': return 'Canal';
            case 'delmsgEmbedExecutorTitle': return 'Executor';
            case 'delmsgEmbedSentTitle': return 'Enviada';
            case 'delmsgEmbedSentValue': return `<t:${vars[0]}>`;
            case 'delmsgEmbedAttachmentsTitle': return 'Anexos';
            case 'delmsgEmbedAttachmentsMedia': return `[\`Anexo-${vars[0]}-Mídia\`](${vars[1]})`;
            case 'delmsgEmbedAttachmentsFile': return `[\`Anexo-${vars[0]}-Arquivo\`](${vars[1]})`;
            case 'actionlogsDescription': return 'Gerencia registros de ações no servidor';
            case 'actionlogsUsage0': return 'defaultchannel (canal)';
            case 'actionlogsUsage1': return 'set <delmsg/prune/editmsg/memberjoin/memberleave> <(canal)/default>';
            case 'actionlogsUsage2': return 'ignore channel <add/remove> (canal) <delmsg/prune/editmsg/all>';
            case 'actionlogsUsage3': return 'ignore channel view (canal)';
            case 'actionlogsUsage4': return 'ignore role <add/remove> (cargo) <delmsg/prune/editmsg/memberleave/all>';
            case 'actionlogsUsage5': return 'ignore role view (cargo)';
            case 'newDefaultHookReason': return 'Webhook do canal de registros padrão';
            case 'oldDefaultHookReason': return 'Webhook do canal antigo de registros padrão';
            case 'newDefaultLog': return `Canal de registros padrão definido para ${vars[0]}`;
            case 'noDefaultLog': return 'Canal de registros padrão não definido';
            case 'oldHookReason': return `Webhook do canal antigo de registros de ${vars[0]}`;
            case 'newDefaultLogSuccess': return 'Essa ação foi definida para ser registrada no canal de registros padrão';
            case 'newHookReason': return `Webhook do canal de registros de ${vars[0]}`;
            case 'newLogSuccess': return `Essa ação foi definida para ser registrada em ${vars[0]}`;
            case 'removeLogSuccess': return 'Essa ação não será registrada';
            case 'noIgnoredActionsChannel': return 'Nenhum ação está sendo ignorada nesse canal'
            case 'ignoredActionsChannelEmbedAuthor': return 'Canal ignorado';
            case 'ignoredActionsChannelEmbedDesc': return `Canal: ${vars[0]}`;
            case 'ignoredActionsEmbedFooter': return `${vars[0]} ações ignoradas`;
            case 'ignoredActionsEmbedActionsTitle': return 'Ações';
            case 'actiondelmsg': return '**mensagens deletadas**';
            case 'actionprune': return '**mensagens limpas**';
            case 'actioneditmsg': return '**mensagens editadas**';
            case 'actionmemberjoin': return '**novos membros**';
            case 'actionmemberleave': return '**saida de membros**';
            case 'noIgnoredActionsRole': return 'Nenhuma ação está sendo ignorada para esse cargo';
            case 'ignoredActionsRoleEmbedAuthor': return 'Cargo ignorado';
            case 'ignoredActionsRoleEmbedDesc': return `Cargo: ${vars[0]}`;
            case 'allActionsIgnoredChannelSuccess': return `Todas as ações serão ignoradas em ${vars[0]}`;
            case 'noActionsIgnoredChannelSuccess': return `Nenhuma ação será ignorada em ${vars[0]}`;
            case 'allActionsIgnoredRoleSuccess': return `Todas as ações serão ignorada para **${vars[0]}**`;
            case 'noActionsIgnoredRoleSuccess': return `Nenhuma ação será ignorada para **${vars[0]}**`;
            case 'actionIgnoredChannelSuccess': return `**${vars[0]}** será ignorada em ${vars[1]}`;
            case 'actionNotIgnoredChannelSuccess': return `**${vars[0]}** não será ignorada em ${vars[1]}`;
            case 'actionIgnoredRoleSuccess': return `**${vars[0]}** será ignorada para **${vars[1]}**`;
            case 'actionNotIgnoredRoleSuccess': return `**${vars[0]}** não será ignorada para **${vars[1]}**`;
            case 'logsViewEmbedAuthor': return 'Informações sobre registro de ações';
            case 'logsViewEmbedDesc': return `Canal padrão: ${vars[0] ? `<#${vars[0]}>` : '\`nenhum\`'}`;
            case 'logsViewEmbedActionsTitle': return 'Ações registradas';
            case 'logsViewEmbedActions': return `**${vars[0]}** - ${vars[1] ? `<#${vars[1]}>` : '`Padrão`'}`
            case 'logsViewEmbedIgnoredChannelsTitle': return 'Canais ignorados';
            case 'logsViewEmbedIgnoredRolesTitle': return 'Cargos ignorados';
            case 'logsViewEmbedIgnoredSome': return 'Alguns';
            case 'logsViewEmbedIgnoredAll': return 'Todos';
            case 'logattachmentsBadArgs': return 'Essa configuração deve ser definida como `on` ou `off`';
            case 'logattachmentsNoHook': return 'Escolha um canal para registrar mensagens deletadas primeiro';
            case 'logattachmentsNoNSFW': return 'Para usar essa configuração o canal de registros de mensagens deletadas precisa estar definido como NSFW';
            case 'logattachmentsOnSuccess': return 'Anexos serão registrados';
            case 'logattachmentsOffSuccess': return 'Anexos não serão registrados';
            case 'premiumDescription': return 'Gerencia o premium de servidores';
            case 'alreadyPremium': return 'Esse servidor já tem acesso a funções premium';
            case 'premiumEmbedDesc': return `Ainda não é possível comprar o modo premium, se você deseja solicitar parceria ou pagar pelo premium diretamente **[entre no servidor de suporte](https://discord.gg/${vars[0]})** e contate os desenvolvedores`;
            case 'banDescription': return 'Bane um usuário';
            case 'banUsage': return '(usuário) [(motivo)]';
            case 'invUser': return 'Usuário inválido';
            case 'cantBan': return 'Eu não consigo banir esse membro';
            case 'youCantBan': return 'Você não pode banir esse membro';
            case 'dmBanned': return `Você foi banido em **${vars[0]}**${vars[1] ? `\n__Motivo:__ *${vars[1]}*` : ''}`;
            case 'alreadyBanned': return 'Esse usuário já está banido';
            case 'banReason': return `Executor: ${vars[0]}${vars[1] ? ` | Motivo: ${vars[1]}` : ''}`;
            case 'memberBanSuccess': return `Membro banido\nID do caso: \`${vars[0]}\``;
            case 'banEmbedAuthor': return `${vars[0]} baniu ${vars[1]}`;
            case 'banEmbedDescription': return `[\`Mensagem da ação\`](${vars[0]})`;
            case 'banEmbedTargetTitle': return 'Alvo';
            case 'banEmbedTargetValue': return `${vars[0]}\n${vars[0].id}`;
            case 'banEmbedExecutorTitle': return 'Executor';
            case 'banEmbedFooter': return `Caso ${vars[0]}`;
            case 'banEmbedReasonTitle': return 'Motivo';
            case 'checkDescription': return 'Mostra os casos de um usuário';
            case 'checkUsage': return '(usuário) <all/warn/mute/kick/ban> [(filtro de tempo)]';
            case 'invLogs': return 'Nenhum registro atendendo a essas condições foi encontrado';
            case 'checkEmbedAuthor': return 'Casos';
            case 'checkEmbedFooter': return `${vars[0]} casos encontrados`;
            case 'checkEmbedCaseTitle': return `Caso ${vars[0]}`;
            case 'checkEmbedCaseValueTarget': return `${vars[0].actionMessage ? `[\`Mensagem da ação\`](${vars[0].actionMessage})\n` : ''}Tipo: \`${vars[0].removal ? `${'un'}${vars[0].type}` : vars[0].type}\`\n${vars[0].executor ? `Executor: <@${vars[0].executor}>\n` : ''}${vars[1] ? `Duração: \`${vars[1][0] ? `${vars[1][0]}d` : ''}${vars[1][1] ? `${vars[1][1]}h` : ''}${vars[1][2] ? `${vars[1][2]}m` : ''}\`\n` : ''}${vars[0].reason ? `Motivo: *${vars[0].reason.slice(0, 250)}*\n` : ''}Data: <t:${Math.floor(vars[0].timeStamp.getTime() / 1000)}>${vars[0].image ? `\n[\`Mídia\`](${vars[0].image})` : ''}`;
            case 'checkEmbedCaseValueExecutor': return `${vars[0].actionMessage ? `[\`Mensagem da ação\`](${vars[0].actionMessage})\n` : ''}Tipo: \`${vars[0].removal ? `${'un'}${vars[0].type}` : vars[0].type}\`\nTarget: <@${vars[0].target}>\n${vars[1] ? `Duração: \`${vars[1][0] ? `${vars[1][0]}d` : ''}${vars[1][1] ? `${vars[1][1]}h` : ''}${vars[1][2] ? `${vars[1][2]}m` : ''}\`\n` : ''}${vars[0].reason ? `Motivo: *${vars[0].reason.slice(0, 250)}*\n` : ''}Data: <t:${Math.floor(vars[0].timeStamp.getTime() / 1000)}>${vars[0].image ? `\n[\`Mídia\`](${vars[0].image})` : ''}`;
            case 'modLogsSetSuccess': return `Canal de registro de ${vars[0].map(e => `\`${e}\``).join(' ')} definido como ${vars[1]}`;
            case 'invClearOnBanDays': return 'O número de dias precisa ser entre 0 e 7';
            case 'clearOnBanDaysSetSuccess': return `Número de dias de mensagens para deletar em bans definido como **${vars[0]}**`;
            case 'invRole': return 'Cargo não encontrado';
            case 'muteRoleSetSuccess': return `Cargo de mute definido como **${vars[0]}**`;
            case 'autoSetupMuteSetSuccess': return `Modo de configuração automática de mute foi **${(vars[0] === 'on') ? '' : 'des'}ativado**`;
            case 'inviteDescription': return 'Envia um link para adicionar o bot ao seu servidor';
            case 'inviteEmbedDescription': return `**[Me convide](${vars[0]})** para o seu servidor!`;
            case 'muteDescription': return 'Muta/Castiga um membro';
            case 'muteUsage': return '(membro) (duração) [(motivo)]';
            case 'invMember': return 'Membro não encontrado';
            case 'youCantMute': return 'Você não pode mutar/castigar esse membro';
            case 'iCantMute': return 'Eu não tenho permissão para moderar esse membro';
            case 'invMuteDuration': return 'Duração de mute/castigo inválida';
            case 'alreadyMuted': return 'Esse usuário já está mutado/castigado';
            case 'botManageRolesServer': return 'Eu não consigo gerenciar cargos nesse servidor';
            case 'botModerateMembersServer': return 'Eu não consigo moderar membros nesse servidor';
            case 'cantGiveMuteRole': return 'Eu não consigo dar o cargo de mute aos membros';
            case 'noMuteRole': return 'Nenhum cargo de mute foi definido e o modo de configuração automática de mute está desativado';
            case 'muteRoleName': return 'Mutado';
            case 'muteMemberSuccess': return `Membro mutado/castigado\nID do caso: \`${vars[0]}\``;
            case 'muteRoleSetupReason': return 'Configuração das permissões do cargo de mute';
            case 'muteEmbedAuthor': return `${vars[0]} mutou/castigou ${vars[1]}`;
            case 'muteEmbedDescription': return `[\`Mensagem da ação\`](${vars[0]})`;
            case 'muteEmbedTargetTitle': return 'Alvo';
            case 'muteEmbedTargetValue': return `${vars[0]}\n${vars[0].id}`;
            case 'muteEmbedExecutorTitle': return 'Executor';
            case 'muteEmbedDurationTitle': return 'Duração';
            case 'muteEmbedDurationValue': return `${vars[0] ? `${vars[0]}d` : ''}${vars[1] ? `${vars[1]}h` : ''}${vars[2] ? `${vars[2]}m` : ''}\n<t:${vars[3]}:R>`;
            case 'muteEmbedFooter': return `Caso ${vars[0]}`;
            case 'muteEmbedReasonTitle': return 'Motivo';
            case 'activatePremium': return `Você tem **${vars[0] ?? 0}** chaves premium restantes`;
            case 'confirm': return 'Confirmar';
            case 'cancel': return 'Cancelar';
            case 'previous': return 'Anterior';
            case 'next': return 'Próxima';
            case 'activatePremiumSuccess': return 'Funções premium ativadas';
            case 'reasonDescription': return 'Edita o motivo de um caso de moderação';
            case 'reasonUsage': return '(ID do caso) (novo motivo)';
            case 'invCase': return 'Caso não encontrado';
            case 'youCantEditCase': return 'Você não pode editar esse caso';
            case 'reasonEditSuccess': return 'Motivo editado';
            case 'reasonEmbedTargetTitle': return 'Alvo';
            case 'reasonEmbedTargetValue': return `<@${vars[0]}>\n${vars[0]}`;
            case 'reasonEmbedExecutorTitle': return 'Executor';
            case 'reasonEmbedExecutorValue': return `<@${vars[0]}>`;
            case 'reasonEmbedDurationTitle': return 'Duração';
            case 'reasonEmbedDurationValue': return `${vars[0] ? `${vars[0]}d` : ''}${vars[1] ? `${vars[1]}h` : ''}${vars[2] ? `${vars[2]}m` : ''}\n<t:${vars[3]}:R>`;
            case 'reasonEmbedReasonTitle': return 'Motivo';
            case 'supportDescription': return 'Envia um convite para o servidor de suporte';
            case 'supportEmbedDescription': return `**[Entre](https://discord.gg/${vars[0]})** em meu servidor de suporte!`;
            case 'unbanDescription': return 'Desbane um usuário';
            case 'unbanUsage': return '(usuário) [(motivo)]';
            case 'invBanned': return 'Usuário banido não encontrado';
            case 'cantUnban': return 'Eu não tenho permissão para desbanir membros';
            case 'unbanAuditReason': return `Executor: ${vars[0]}${vars[1] ? ` | Motivo: ${vars[1]}` : ''}`;
            case 'unbanSuccess': return `Usuário desbanido\nID do caso: \`${vars[0]}\``;
            case 'unbanEmbedAuthor': return `${vars[0]} desbaniu ${vars[1]}`;
            case 'unbanEmbedDescription': return `[\`Mensagem da ação\`](${vars[0]})`;
            case 'unbanEmbedTargetTitle': return 'Alvo';
            case 'unbanEmbedTargetValue': return `${vars[0]}\n${vars[0].id}`;
            case 'unbanEmbedExecutorTitle': return 'Executor';
            case 'unbanEmbedFooter': return `Caso ${vars[0]}`;
            case 'unbanEmbedReasonTitle': return 'Motivo';
            case 'unmuteDescription': return 'Desmuta um usuário';
            case 'unmuteUsage': return '(usuário) [(motivo)]';
            case 'youCantUnmute': return 'Você não pode desmutar esse membro';
            case 'invMuteRole': return 'Cargo de mute não encontrado';
            case 'cantManageMuteRole': return 'Eu não posso gerenciar o cargo de mute';
            case 'invMuted': return 'Membro mutado/castigado não encontrado';
            case 'unmuteSuccess': return `Membro desmutado\nID do caso: \`${vars[0]}\``;
            case 'unmuteEmbedAuthor': return `${vars[0]} desmutou ${vars[1] || 'alguém'}`;
            case 'unmuteEmbedDescription': return `[\`Mensagem da ação\`](${vars[0]})`;
            case 'unmuteEmbedTargetTitle': return 'Alvo';
            case 'unmuteEmbedTargetValue': return `<@${vars[0]}>\n${vars[0]}`;
            case 'unmuteEmbedExecutorTitle': return 'Executor';
            case 'unmuteEmbedFooter': return `Caso ${vars[0]}`;
            case 'unmuteEmbedReasonTitle': return 'Motivo';
            case 'warnDescription': return 'Adverte um membro';
            case 'warnUsage': return '(usuário) [(motivo)]';
            case 'cantWarnBot': return 'Eu não posso advertir um bot';
            case 'youCantWarn': return 'Você não tem permissão para advertir esse membro';
            case 'dmWarned': return `Você foi advertido em **${vars[0]}**${vars[1] ? `\n__Motivo:__ *${vars[1]}*` : ''}`;
            case 'warnedBlockedDms': return 'A advertência não pode ser enviado nas MDs do usuário. Isso normalmente acontece quando um usuário desativa MDs para esse servidor';
            case 'warnSuccess': return `Membro advertido\nID do caso: \`${vars[0]}\``;
            case 'warnEmbedAuthor': return `${vars[0]} advertiu ${vars[1]}`;
            case 'warnEmbedDescription': return `[\`Mensagem da ação\`](${vars[0]})`;
            case 'warnEmbedTargetTitle': return 'Alvo';
            case 'warnEmbedTargetValue': return `${vars[0]}\n${vars[0].id}`;
            case 'warnEmbedExecutorTitle': return 'Executor';
            case 'warnEmbedFooter': return `Caso ${vars[0]}`;
            case 'warnEmbedReasonTitle': return 'Motivo';
            case 'xpDescription': return 'Mostra o xp de um membro em um servidor';
            case 'xpUsage0': return '[(usuário)]';
            case 'xpUsage1': return 'rank';
            case 'xpUsage2': return 'roles';
            case 'xpDisabled': return 'O sistema de xp está desativado nesse servidor';
            case 'lbDeprecated': return 'O argumento `lb` foi descontinuado e será removido em uma atualização futura, em vez disso, por favor use `rank`';
            case 'xpRankEmbedAuthor': return 'Ranking de xp';
            case 'xpRankEmbedFooter': return `Você está posicionado em #${vars[0]}`;
            case 'noXpRoles': return 'Não há nenhum cargo de xp nesse servidor';
            case 'xpRolesEmbedAuthor': return 'Cargos de xp';
            case 'noXp': return 'Esse membro ainda não tem nenhum xp';
            case 'xpEmbedAuthor': return 'Xp';
            case 'xpEmbedDescription': return `${vars[0] ? `Nível atual: <@&${vars[0].roleID}>\n` : ''}${vars[1] ? `Proximo nível: <@&${vars[1].roleID}>\n` : ''}Progresso: **${vars[2]}${vars[1] ? `/${vars[1].xp}` : ''}**`;
            case 'xpEmbedFooter': return `#${vars[0]}`;
            case 'dmBotAdder': return `Saudações ${vars[0]}! Obrigado por me adicionar a **${vars[1]}**. Como eu sou um bot muito customizável recomendo que comece dando uma olhada em \`${vars[2]}help configs\` e configurando as permissões dos comandos com \`${vars[2]}help perm\`, senão alguns deles podem ter permissões padrão muito restritivas, como o comando \`rolemenu\`, que por padrão só é permitido para usuários com a permissão Gerenciar Cargos\n\nSe precisar de ajuda, não hesite em **[entrar no servidor de suporte](https://discord.gg/${vars[3]})**, você também pode ler a **[documentação completa](https://github.com/HordLawk/YottaBot#get-started)** para informações mais detalhadas`;
            case 'autoUnmuteEmbedAuthorMember': return `${vars[0]} foi desmutado`;
            case 'autoUnmuteEmbedAuthorNoMember': return 'Unmute';
            case 'autoUnmuteEmbedTargetTitle': return 'Alvo';
            case 'autoUnmuteEmbedTargetValue': return `<@${vars[0]}>\n${vars[0]}`;
            case 'autoUnmuteEmbedReasonTitle': return 'Motivo';
            case 'autoUnmuteEmbedReasonValue': return 'Fim do mute/castigo';
            case 'autoUnmuteEmbedDescription': return `[\`Mute/castigo referido\`](${vars[0]})`;
            case 'kickDescription': return 'Expulsa um membro de um servidor';
            case 'kickUsage': return '(usuário) [(motivo)]';
            case 'cantKick': return 'Eu não consigo expulsar esse membro';
            case 'youCantKick': return 'Você não pode expulsar esse membro';
            case 'kickAuditReason': return `Executor: ${vars[0]}${vars[1] ? ` | Motivo: ${vars[1]}` : ''}`;
            case 'kickSuccess': return `Membro expulso\nID do caso: \`${vars[0]}\``;
            case 'kickEmbedAuthor': return `${vars[0]} expulsou ${vars[1]}`;
            case 'kickEmbedDescription': return `[\`Mensagem da ação\`](${vars[0]})`;
            case 'kickEmbedTargetTitle': return 'Alvo';
            case 'kickEmbedTargetValue': return `${vars[0]}\n${vars[1]}`;
            case 'kickEmbedExecutorTitle': return 'Executor';
            case 'kickEmbedFooter': return `Caso ${vars[0]}`;
            case 'kickEmbedReasonTitle': return 'Motivo';
            case 'massbanDescription': return 'Bane varios usuários ao mesmo tempo';
            case 'massbanUsage': return '(usuário) [(lista de usuários)] [(motivo)]';
            case 'massbanSuccess': return `${vars[0] ? `${vars[0]} usuários banidos\n` : ''}` +
                                          `${vars[1] ? `${vars[1]} usuários inválidos\n` : ''}` +
                                          `${vars[2] ? `${vars[2]} usuários não puderam ser banidos\n` : ''}` +
                                          `${vars[3] ? `${vars[3]} usuários já estavam banidos\n` : ''}` +
                                          `${vars[4] ? '' : '\nNote que servidores não premium tem um limite de massban de 300 usuários\n' +
                                                            'Para aumentar esse limite para 1000 você pode adquirir premium [se juntando ao Patreon](<https://www.patreon.com/YottaBot>)'}`;
            case 'firstBoost': return `Parabéns ${vars[0]}, você impulsionou **${vars[1]}** e foi recompensado com uma chave premium, use o comando \`/premium activate\` em qualquer servidor para ativar as funções premium`;
            case 'renewBoost': return `Obrigado por impulsionar **${vars[0]}** por mais um mês! Você recebeu uma chave premium como recompensa, use o comando \`/premium activate\` em qualquer servidor para ativar as funções premium`;
            case 'recommendMinLevels': return 'Você não pode pedir por recomendações para menos de 2 níveis';
            case 'recommendMinXp': return 'O xp do nível máximo deve ser no mínimo 13';
            case 'recommendXpNotEnough': return `**${vars[0]}** não é xp suficiente para **${vars[1]}** níveis`;
            case 'recommendSuccess': return `As quantias de xp recomendadas são ${vars[0].map(e => `\`${Math.round(e / 20)}\``).join(' ')}`;
            case 'infoEmbedAuthor': return 'Informações sobre YottaBot';
            case 'infoEmbedDescription': return `[\`Me convide\`](${vars[0]})`;
            case 'infoEmbedVersionTitle': return 'Versão';
            case 'infoEmbedEngineTitle': return 'Engine';
            case 'infoEmbedEngineValue': return `Node.js ${vars[0]}`;
            case 'infoEmbedLibraryTitle': return 'Biblioteca';
            case 'infoEmbedLibraryValue': return `discord.js v${vars[0]}`;
            case 'infoEmbedDeveloperTitle': return 'Desenvolvedor';
            case 'infoEmbedDeveloperValue': return `[${vars[0]}](https://discord.com/users/${vars[1]})`;
            case 'infoEmbedUptimeTitle': return 'Último login';
            case 'infoEmbedUptimeValue': return `<t:${Math.floor(vars[0] / 1000)}:R>`;
            case 'infoEmbedRAMTitle': return 'Uso de RAM';
            case 'infoEmbedRAMValue': return `${(vars[0] / 1048576).toFixed(2)} MB`;
            case 'infoEmbedSupportTitle': return 'Servidor de suporte';
            case 'infoEmbedSupportValue': return `[\`discord.gg/${vars[0]}\`](https://discord.gg/${vars[0]})`;
            case 'infoEmbedRepoTitle': return 'Código fonte';
            case 'infoEmbedRepoValue': return '[\`github.com/HordLawk/YottaBot\`](https://github.com/HordLawk/YottaBot)';
            case 'infoEmbedPrivacyTitle': return 'Política de privacidade';
            case 'infoEmbedPrivacyValue': return '[\`yottabot.dev/privacy\`](https://yottabot.dev/privacy)';
            case 'upvoteDescription': return 'Vote em mim no Top.gg';
            case 'upvoteEmbedDescription': return `**[Vote em mim](https://top.gg/bot/${vars[0]}/vote)** no Top.gg!`;
            case 'voiceXpEmbedAuthor': return 'Configurações do sistema de xp por voz';
            case 'voiceXpEmbedDesc': return `Ativado: ${vars[0] ? `\`sim\`\nCooldown: \`${vars[0]} minutos\``: '`não`'}`;
            case 'voiceXpIgnoredChannels': return 'Canais de voz ignorados';
            case 'betaSuccess': return `Funções beta foram **${vars[0] ? 'ativadas' : 'desativadas'}**`;
            case 'voicexpDescription': return 'Gerencia o ganho de xp em canais de voz';
            case 'voicexpUsage0': return 'enable (cooldown em minutos)';
            case 'voicexpUsage1': return 'ignore <add/remove> (canal)';
            case 'invCooldown': return 'O cooldown em minutos deve ser um inteiro entre 1 e 59';
            case 'voicexpEnableSuccess': return `O ganho de xp em canais de voz foi ativado e seu cooldown definido como ${vars[0]}`;
            case 'voicexpDisableSuccess': return 'O ganho de xp em canais de voz foi desativado';
            case 'slashOnly': return `O comando \`${vars[0]}\` pode ser executado apenas por meio da função nativa de comandos de barra de Discord\nDigite \`/${vars[0]}\` para usa-lo`;
            case 'processing': return 'Esse comando já está atualmente sendo processado em algum lugar desse servidor\nTente novamente mais tarde';
            case 'invMassBanProtectionAmount': return 'Quantidade inválida de bans em 10 segundos';
            case 'massBanProtectionSuccess': return `Configuração de proteção de banimentos em massa foi ${(vars[0] === 'on') ? 'ativada' : 'desativada'}`;
            case 'multiplierSuccess': return `O multiplicador de xp de ${vars[0]} foi definido para \`${vars[1]}\` com sucesso`;
            case 'editmsgEmbedAuthor': return 'Mensagem editada';
            case 'editmsgEmbedDescription': return `**Conteúdo anterior:**\n${vars[0] || '*Vazio*\n'}\n**Novo conteúdo:**\n${vars[1] || '*Vazio*'}`;
            case 'atwoodDescription': return 'Cita a Lei de Atwood';
            case 'atwoodsLaw': return '> Qualquer aplicação que possa ser escrita em JavaScript, será eventualmente escrita em JavaScript.\n- Jeff Atwood (2007)';
            case 'globalBanReason': return 'O usuário está banido globalmente';
            case 'globalbanSuccess': return `Banimentos globais foram **${(vars[0] === 'on') ? '' : 'des'}ativados**`;
            case 'undo': return 'Desfazer';
            case 'banUndone': return 'Ban desfeito';
            case 'muteMemberUndone': return '~~Membro mutado/castigado~~ *desfeito*';
            case 'muteUndone': return 'Mute/Castigo desfeito';
            case 'language': return 'Idioma do servidor';
            case 'premiumKeysLabel': return 'Usar chave';
            case 'premiumPatreonLabel': return 'Usar recompensa Patreon';
            case 'pledgeNotFound': return `Você não parece fazer parte do meu Patreon\nSe você acha que isso é um erro, se certifique que a sua conta Discord está conectada à sua conta Patreon\n[Esse artigo](https://support.patreon.com/hc/en-us/articles/212052266) vai te guiar por esse processo\nSe você ainda não é um patrão de YottaBot [se junte ao Patreon](<https://www.patreon.com/YottaBot>)`;
            case 'noRewardsRemaining': return 'Você já usou todas as suas recompensas Patreon, espere até que um dos premiums que você reivindicou expire para reivindicar nesse servidor';
            case 'patreonRewardClaimed': return 'Você ativou funções premium nesse servidor com sucesso usando as suas recompensas Patreon\nVocê deseja que isso seja automaticamente renovado mensalmente?';
            case 'enableRenew': return 'Renovar mensalmente';
            case 'renewEnabled': return 'As funções premium serão automaticamente renovadas para esse servidor';
            case 'notPatron': return 'Você não está atualmente usando recompensas Patreon em nenhum servidor\nSe você ainda não é um patrão de YottaBot [se junte ao Patreon](<https://www.patreon.com/YottaBot>)';
            case 'unknownGuild': return 'Servidor desconhecido';
            case 'premiumInfoFieldValue': return `**Expira:** <t:${vars[0]}>\n**Renovar mensalmente:** ${vars[1] ? '`ativado`' : '`desativado`'}`;
            case 'invGuild': return 'Servidor inválido';
            case 'renewChangeSuccess': return `O premium de **${vars[0]}** ${vars[1] ? 'irá' : 'não irá'} ser renovado automaticamente`;
            case 'premiumUsage0': return 'renew <on/off> (servidor)';
            case 'delmsgActionName': return 'Mensagens deletadas';
            case 'editmsgActionName': return 'Mensagens editadas';
            case 'pruneActionName': return 'Mensagens limpas';
            case 'cantIgnoreEveryone': return 'Ações não podem ser ignoradas de @everyone\nSe você não quer que essa ação seja registrada use \`/actionlogs actions remove (ação)\`';
            case 'invAction': return 'Ação inválida';
            case 'delmsgEmbedStickerTitle': return 'Figurinha';
            case 'getstickerContextName': return 'Extrair arquivo da figurinha';
            case 'noStickerFound': return 'Isso não é uma figurinha!';
            case 'getstickerContent': return '**Arquivo da figurinha:**';
            case 'add': return 'Adicionar';
            case 'checkContextName': return 'Checar casos';
            case 'checkLocalisedName': return 'checar';
            case 'xpContextName': return 'Informações de xp';
            case 'xpLocalisedName': return 'xp';
            case 'stickerCreator': return `Adicionado por ${vars[0]} (${vars[1]})`;
            case 'stickerAdded': return 'Figurinha adicionada com sucesso';
            case 'maxStickersReached': return 'Número máximo de figurinhas alcançado';
            case 'componentError': return 'Houve um erro!\nO problema foi enviado à equipe de suporte e será corrigido no futuro proximo';
            case 'disabledPremiumXpRoles': return 'Como o número de cargos de xp excedia o limite para servidores não premium, os cargos mais altos acima desse limite foram desativados temporariamente\nVocê pode tornar esses cargos alcançaveis novamente com premium, para adquirir premium [se junte ao Patreon](<https://www.patreon.com/YottaBot>)';
            case 'disabledPremiumXpRolesNoHL': return 'Como o número de cargos de xp excedia o limite para servidores não premium, os cargos mais altos acima desse limite foram desativados temporariamente\nVocê pode tornar esses cargos alcançaveis novamente com premium, para adquirir premium se junte ao Patreon: <https://patreon.com/YottaBot>';
            case 'getstickerDescription': return 'Responde com o arquivo do primeiro sticker da mensagem selecionada\nSe o autor tiver permissão para adicionar sticker, também mostrará um botão para upar o arquivo como sticker no servidor\n(Apenas em menu de mensagem)';
            case 'memberjoinActionName': return 'Novos membros';
            case 'memberjoinEmbedAuthor': return `${vars[0]} entrou no servidor`;
            case 'memberjoinEmbedCreationTitle': return 'Conta criada em';
            case 'memberjoinEmbedCreationValue': return `<t:${vars[0]}> (<t:${vars[0]}:R>)`;
            case 'banButton': return 'Banir';
            case 'cantEditSlowmode': return `Você não tem permissão para editar o slowmode em ${vars[0]}`;
            case 'botCantEditSlowmode': return `Eu preciso de permissão para gerenciar ${vars[0]} para editar seu slowmode`;
            case 'slowmodeEdited': return `O slowmode em ${vars[3]} foi alterado para **${vars[0] ? `${vars[0]}h` : ''}${vars[1] ? `${vars[1]}m` : ''}${vars[2] ? `${vars[2]}s` : ''}** com sucesso`;
            case 'slowmodeRemoved': return `O slowmode em ${vars[0]} foi removido com sucesso`;
            case 'slowmodeUsage': return '(cooldown) [(canal)]';
            case 'slowmodeDescription': return 'Edita o cooldown de slowmode no canal escolhido';
            case 'pruneSuccess': return `Todas ${vars[0]} mensagens foram deletadas com sucesso`;
            case 'prunePartial': return `Apenas **${vars[0]}** das **${vars[1]}** mensagens foram deletadas\nNote que mensagens mais velhas que 2 semanas ou enviadas antes das ultimas 1000 mensagens desse canal não podem ser deletadas\nMensagens fixadas propositalmente também não são deletadas`;
            case 'invalidPruneAmount': return 'A quantidade de mensagens para deletar precisa estar entre 2 e 999';
            case 'slowValueTooHigh': return 'O cooldown do slowmode não pode ser maior que 6 horas';
            case 'pruneLocalisedName': return 'limpar';
            case 'delcasesLocalisedName': return 'delcasos';
            case 'delcasesDescription': return 'Deleta um ou mais casos registrados do servidor atual';
            case 'delcasesUsage0': return 'user (usuário)';
            case 'delcasesUsage1': return 'case (ID)';
            case 'resetServerCasesConfirm': return 'Tem certeza que deseja apagar todos os casos registrados desse servidor?\nEssa ação não pode ser desfeita';
            case 'resetServerCasesSuccess': return 'Todos os casos registrados do servidor foram deletadas com sucesso';
            case 'resetUserCasesConfirm': return `Tem certeza que deseja deletar todos os casos registrados que tiveram ${vars[0]} como alvo?\nEssa ação não pode ser desfeita`;
            case 'resetUserCasesSuccess': return `Todos os casos registrados que tiveram ${vars[0]} como alvo foram deletados com sucesso`;
            case 'caseNotFound': return `Nenhum caso foi encontrado com ID **${vars[0]}**`;
            case 'caseDeletedSuccess': return `Caso **${vars[0]}** foi deletado com sucesso`;
            case 'memberleaveActionName': return 'Saida de membros';
            case 'memberleaveEmbedAuthor': return `${vars[0]} saiu do servidor`;
            case 'memberleaveEmbedJoinedTitle': return 'Membro desde';
            case 'memberleaveEmbedJoinedValue': return `<t:${vars[0]}> (<t:${vars[0]}:R>)`;
            case 'memberleaveEmbedMembershipTitle': return 'Passou pela avaliação de associação';
            case 'memberleaveEmbedMembershipValue': return `\`${vars[0] ? 'não' : 'sim'}\``;
            case 'memberleaveEmbedTimeoutTitle': return 'Mutado/Castigado até';
            case 'memberleaveEmbedTimeoutValue': return `<t:${vars[0]}> (<t:${vars[0]}:R>)`;
            case 'memberleaveEmbedNickTitle': return 'Nick';
            case 'memberleaveEmbedBoostTitle': return 'Booster desde';
            case 'memberleaveEmbedBoostValue': return `<t:${vars[0]}> (<t:${vars[0]}:R>)`;
            case 'memberleaveEmbedRolesTitle': return 'Cargos';
            case 'memberleaveEmbedRolesValue': return `${[...vars[0].first(42).values()].join(' ')}${(vars[0].size > 42) ? `*+${vars[0].size - 42}*` : ''}`;
            case 'memberjoinEmbedBadgesTitle': return 'Insígnias';
            case 'configsLocalisedName': return 'configs';
            case 'warnChoiceLocalisedName': return 'Warns';
            case 'muteChoiceLocalisedName': return 'Mutes/Castigos';
            case 'kickChoiceLocalisedName': return 'Kicks';
            case 'banChoiceLocalisedName': return 'Bans';
            case 'cantPruneMessages': return 'Você não tem permissão para limpar mensagens nesse canal';
            case 'botCantPruneMessages': return 'Eu preciso de permissão para gerenciar mensagens nesse canal para limpar elas';
            case 'pruneafterSuccess': return `**${vars[0]}** mensagens foram limpas desse canal`;
            case 'pruneafterDescription': return 'Limpa todas as mensagens que foram enviadas depois de uma mensagem alvo selecionada';
            case 'pruneafterContextName': return 'Limpar abaixo disso';
            case 'pruneEmbedAuthor': return 'Mensagens limpas';
            case 'pruneEmbedAmountTitle': return 'Número de mensagens';
            case 'editionsDescription': return 'Gerencia o armazenamento e listagem de versões anteriores de mensagens editadas.';
            case 'storageSuccess': return `Armazenamento de mensagens editadas **${vars[0] ? 'ativado' : 'desativado'}**`;
            case 'listeditsEmbedAuthor': return 'Edições da mensagem';
            case 'listeditsEmbedVersionTitle': return `Versão ${vars[0]}`;
            case 'listeditsEmbedVersionValue': return `\`\`\`${(vars[0].slice(0, 1014 - vars[1].toString().length))}\`\`\`<t:${vars[1]}>`;
            case 'listeditsDescription': return 'Lista edições anteriores de uma mensagem selecionada';
            case 'listeditsContextName': return 'Listar edições';
            case 'editionsinfoEmbedAuthor': return 'Informações sobre o armazenamento de edições';
            case 'editionsinfoEmbedDescription': return `Ativado: \`${vars[0] ? 'on' : 'off'}\`\n` +
                                                        `Edições armazenadas: \`${vars[1]}${vars[2] ? '' : '/100'}\``;
            case 'nonPremiumStorage': return 'Servidores não premium tem um limite de apenas 100 edições armazenadas\n' +
                                             'Para se tornar premium e desbloquear armazenamento ilimitado além de varias outras funções incríveis [se junte ao Patreon](<https://www.patreon.com/YottaBot>)';
            case 'wipeEditionsConfirm': return 'Você tem certeza que deseja deletar todas as edições armazenadas de mensagens desse servidor?\n' +
                                               'Essa ação não pode ser desfeita';
            case 'wipeEditionsSuccess': return 'Armazenamento de edições foi limpo com sucesso';
            case 'noEditsFound': return 'Não há nenhuma versão anterior dessa mensagem armazenada';
            case 'editionsLocalisedName': return 'edicoes';
            case 'actionlogsLocalisedName': return 'logacoes';
            case 'helpLocalisedName': return 'ajuda';
            case 'inviteLocalisedName': return 'convidar';
            case 'supportLocalisedName': return 'suporte';
            case 'voicexpLocalisedName': return 'xpvoz';
            case 'premiumAd0': return 'YottaBot precisa do seu apoio para se manter rápido e consistente enquanto continua oferencendo tantas funções gratuitas para todos\n' +
                                      'Você sabia que servidores premium podem **recompensar seus membros com xp por tempo passado conversando em canais de voz**?\n' +
                                      'Para desbloquear isso assim como [várias outras funções incríveis](<https://github.com/HordLawk/YottaBot/wiki/Premium>) ~~e parar de receber esses anúncios~~ [se junte ao Patreon](<https://www.patreon.com/YottaBot>)';
            case 'premiumAd1': return 'YottaBot precisa do seu apoio para se manter rápido e consistente enquanto continua oferencendo tantas funções gratuitas para todos\n' +
                                      'Você sabia que servidores premium podem **adicionar cargos ilimitados para seus membros conquistarem ganhando xp**?\n' +
                                      'Para desbloquear isso assim como [várias outras funções incríveis](<https://github.com/HordLawk/YottaBot/wiki/Premium>) ~~e parar de receber esses anúncios~~ [se junte ao Patreon](<https://www.patreon.com/YottaBot>)';
            case 'premiumAd2': return 'YottaBot precisa do seu apoio para se manter rápido e consistente enquanto continua oferencendo tantas funções gratuitas para todos\n' +
                                      'Você sabia que servidores premium podem **armazenar listas de versões antigas de mensagens editadas**?\n' +
                                      'Para desbloquear isso assim como [várias outras funções incríveis](<https://github.com/HordLawk/YottaBot/wiki/Premium>) ~~e parar de receber esses anúncios~~ [se junte ao Patreon](<https://www.patreon.com/YottaBot>)';
            case 'selectCategory': return 'Selecione uma categoria';
            case 'helpHome': return 'Página inicial';
            case 'selectCommand': return 'Selecione um comando';
            case 'selectCategoryFirst': return 'Selecione uma categoria primeiro';
            case 'EmbedHelpCategory1Author': return 'Comandos informativos';
            case 'EmbedHelpCategory2Author': return 'Comandos administrativos';
            case 'EmbedHelpCategory3Author': return 'Comandos moderativos';
            case 'EmbedHelpCategory4Author': return 'Comando de nivelamento';
            case 'EmbedHelpCategory5Author': return 'Outros comandos';
            case 'modalEditSuccess': return 'O motivo desse caso foi editado com sucesso';
            case 'modalTimeOut': return 'Limite de tempo de envio do formulário atingido!';
            case 'editReasonModalReasonLabel': return 'Motivo';
            case 'editReasonModalTitle': return 'Editar motivo';
            case 'editReason': return 'Editar motivo';
            case 'banOptiontargetLocalisedName': return 'alvo';
            case 'banOptiontargetLocalisedDesc': return 'O usuário para banir';
            case 'banOptionwith_reasonLocalisedName': return 'com_motivo';
            case 'banOptionwith_reasonLocalisedDesc': return 'Se deve ser apresentado um formulário com um campo para informar o motivo do banimento';
            case 'setReasonModalTitle': return 'Registrar motivo';
            case 'setReasonModalReasonLabel': return 'Motivo';
            case 'kickOptiontargetLocalisedName': return 'alvo';
            case 'kickOptiontargetLocalisedDesc': return 'O usuário para expulsar';
            case 'kickOptionwith_reasonLocalisedName': return 'com_motivo';
            case 'kickOptionwith_reasonLocalisedDesc': return 'Se deve ser apresentado um formulário com um campo para informar o motivo da expulsão';
            case 'unbanOptiontargetLocalisedName': return 'alvo';
            case 'unbanOptiontargetLocalisedDesc': return 'O usuário para desbanir';
            case 'optionalInput': return '(opcional)';
            case 'reasonLocalisedName': return 'motivo';
            case 'warnContextName': return 'Advertir';
            case 'massbanOptiontargetsLocalisedName': return 'alvos';
            case 'massbanOptiontargetsLocalisedDesc': return 'Menções ou IDs dos usuários para banir separados por espaços';
            case 'massbanOptionwith_reasonLocalisedName': return 'com_motivo';
            case 'massbanOptionwith_reasonLocalisedDesc': return 'Se deve ser apresentado um formulário com um campo para informar o motivo dos banimentos';
            case 'filteridsDescription': return 'Lê texto de um arquivo ou caixa de texto e retorna todos os IDs do Discord encontrados';
            case 'filteridsOptiontext_fileLocalisedName': return 'arquivo_texto';
            case 'filteridsOptiontext_fileLocalisedDesc': return 'Um arquivo de texto com IDs do Discord para serem filtrados';
            case 'filteridsModaltextLabel': return 'Texto com IDs';
            case 'fileTooBig': return 'Esse arquivo é grande demais para ser filtrado';
            case 'invalidFile': return 'Apenas arquivos totalmente de texto são aceitos';
            case 'filteridsLocalisedName': return 'filtrarids';
            case 'botCantAddSticker': return 'Eu não tenho permissão para adicionar figurinhas nesse servidor';
            case 'stickerTooBig': return 'Figurinhas devem ter um tamanho menor que 500 KB';
            case 'lottieNotPartner': return 'Stickers Lottie só podem ser adicionados em servidores parceiros ou verificados';
            case 'newinviteLocalisedName': return 'criarconvite';
            case 'newinviteDescription': return 'Cria um convite para o servidor atual com as configurações selecionadas';
            case 'newinviteOptionmax_usesLocalisedName': return 'limite_usos';
            case 'newinviteOptionmax_usesLocalisedDesc': return 'Número máximo de vezes que esse convite pode ser usado';
            case 'newinviteOptionexpire_afterLocalisedName': return 'expira_em';
            case 'newinviteOptionexpire_afterLocalisedDesc': return 'Validade do convite em horas';
            case 'newinviteOptiondestinationLocalisedName': return 'destino';
            case 'newinviteOptiondestinationLocalisedDesc': return 'O canal ao qual esse convite leva';
            case 'newinviteOptionrequire_roleLocalisedName': return 'requer_cargo';
            case 'newinviteOptionrequire_roleLocalisedDesc': return 'Se os novos membros devem ser expulsos após 24 horas caso ainda não tenham recebido um cargo';
            case 'botCantCreateInvite': return `Eu não tenho permissão para criar convites para ${vars[0]}`;
            case 'memberCantCreateInvite': return `Você não tem permissão para criar convites para ${vars[0]}`;
            case 'banOptionprune_daysLocalisedName': return 'limpa_dias';
            case 'banOptionprune_daysLocalisedDesc': return 'Número de dias de mensagens para limpar, substitui a configuração padrão para isso';
            case 'guildVoiceUnsupported': return 'Comandos ainda não são suportados em canais de voz';
            case 'massbanNoValidIds': return 'Alvos devem incluir menções ou IDs válidos de usuários';
            case 'namebansLocalisedName': return 'nomebans';
            case 'namebansDescription': return 'Bane automaticamente usuários com nomes que correspondem a textos ' +
                                               'escolhidos';
            case 'namebans_addLocalisedName': return 'adicionar';
            case 'namebans_manageLocalisedDesc': return 'Adiciona texto à lista de textos banidos em usernames';
            case 'namebans_addOptiontextLocalisedName': return 'texto';
            case 'namebans_addOptiontextLocalisedDesc': return 'O pedaço de texto que será parcialmente ou completamente ' +
                                                               'banido do servidor';
            case 'namebans_addOptionpartialLocalisedName': return 'parcial';
            case 'namebans_addOptionpartialLocalisedName': return 'Se os usernames devem ser exatamente iguais ou apenas ' +
                                                                  'conter o texto selecionado';
            case 'namebans_addOptioncase_sensitiveLocalisedName': return 'diferenciar_maiusculas';
            case 'namebans_addOptioncase_sensitiveLocalisedDesc': return 'Se a correspondencia de usernames deve ' +
                                                                         'diferenciar letras maiúsculas de minúsculas ou não';
            case 'namebans_removeLocalisedName': return 'remover';
            case 'namebans_removeLocalisedDesc': return 'Remove da lista de textos banidos em usernames';
            case 'namebans_removeOptiontextLocalisedName': return 'texto';
            case 'namebans_removeOptiontextLocalisedDesc': return 'O pedaço de texto à ser removido da lista de usernames ' +
                                                                  'banidos';
            case 'namebans_listLocalisedName': return 'listar';
            case 'namebans_listLocalisedDesc': return 'Lista informações sobre todos os usernames banidos atualmente';
            case 'usernameTooLong': return 'O pedaço de texto banido deve ter menos de 33 caracteres';
            case 'tooManyNamebans': return `Você alcançou o limite de ${vars[0]} usernames banidos para esse servidor\n` +
                                           `Se você deseja aumentar esse limite para ${vars[1]} ` +
                                           '[se junte ao Patreon](<https://www.patreon.com/YottaBot>)';
            case 'tooManyNamebansPremium': return `Você alcançou o limite de ${vars[1]} usernames banidos para esse ` +
                                                  'servidor';
            case 'namebanAddSuccess': return `\`${vars[0]}\` foi adicionado a lista de usernames banidos com sucesso`;
            case 'namebanRemoveSuccess': return `\`${vars[0]}\` foi removido da lista de usernames banidos com sucesso`;
            case 'namebanNotFound': return 'O texto precisa ser escolhido de uma das opções apresentadas na lista de ' +
                                           'usernames banidos';
            case 'disabledExtraNamebans': return 'Como o número de usernames banidos excedia o limite para servidores não ' +
                                                'premium, os últimos usernames acima desse limite foram desativados ' +
                                                'temporariamente\n' +
                                                'Você pode tornar esses usernames banidos novamente com premium, para ' +
                                                'adquirir premium [se junte ao Patreon](<https://www.patreon.com/YottaBot>)';
            case 'namebans_listEmbedAuthor': return 'Usernames banidos atualmente';
            case 'namebans_listEmbedDescription': return `Texto: \`${vars[0]}\`\n` +
                                                         `Parcial: \`${vars[1] ? 'sim' : 'não'}\`\n` +
                                                         `Diferencia maiúsculas: \`${vars[2] ? 'sim' : 'não'}\``;
            case 'namebanReason': return 'Username proibido detectado';
            case 'idsNotFound': return 'Nenhum ID do Discord foi encontrado no texto';
            case 'notarchiveLocalisedName': return 'naoarquivar';
            case 'notarchiveDescription': return 'Define threads que devem ser desarquivadas automaticamente';
            case 'notarchive_manageLocalisedName': return 'gerenciar';
            case 'notarchive_manageLocalisedDesc': return 'Ativa ou desativa o desarquivamento automatico da thread atual';
            case 'notarchive_manageOptionenableLocalisedName': return 'ativar';
            case 'notarchive_manageOptionenableLocalisedDesc': return 'Se deve ser ativado ou desativado';
            case 'notarchive_listLocalisedName': return 'listar';
            case 'notarchive_listLocalisedDesc': return 'Lista threads que foram configuradas para serem automaticamente desarquivadas';
            case 'channelIsNotThread': return 'Esse comando so pode ser utilizado dentro de uma thread';
            case 'threadNotArchiveSuccess': return `O estado de não arquivamento dessa thread foi definido para \`${vars[0] ? 'ativo' : 'desativado'}\``;
            case 'noThreadsWontArchive': return 'Não há nenhuma thread definida para não ser arquivada nesse servidor';
            case 'notarchiveEmbedAuthor': return 'Threads que serão automaticamente desarquivadas';
            case 'botCantUnarchive': return 'Eu preciso de permissão para gerenciar essa thread';
            case 'threadUnarchiveReason': return 'Essa thread foi definida para ser desarquivada automaticamente';
            case 'tooManyAutoUnarchives': return `Você atingiu o limite de ${vars[0]} threads automaticamente ` +
                                                 'desarquivadas para esse servidor\n' +
                                                 `Caso deseje aumentar esse limite para ${vars[1]} ` +
                                                 '[se junte ao Patreon](<https://www.patreon.com/YottaBot>)';
            case 'tooManyAutoUnarchivesPremium': return `Você atingiu o limite de ${vars[0]} threads automaticamente ` +
                                                        'desarquivadas para esse servidor';
            case 'disabledExtraNotArchiveds': return 'Como o número de threads automaticamente desarquivadas excedeu ' +
                                                     'o limite para servidores não premium, as últimas threads ' +
                                                     'adicionadas acima desse limite foram temporariamente ' +
                                                     'desativadas\n' +
                                                     'Você pode tornar essas threads automaticamente desarquivadas ' +
                                                     'novamente com premium, para adquirir premium ' +
                                                     '[se junte ao Patreon](<https://www.patreon.com/YottaBot>)';
            case 'welcomeMessage': return `[**${vars[0]}**](<https://discord.com/users/${vars[1]}>) acabou de entrar!\n` +
                                          'Desejem boas vindas ao servidor para ele(a)';
            case 'newWelcomeHookReason': return 'Criado para recepcionar novos membros';
            case 'WelcomeOldHookDeletedReason': return 'Webhook de boas vindas antigo não utilizado mais';
            case 'welcomEnableSuccess': return `Mensagens de boas vindas ativadas em ${vars[0]} com sucesso`;
            case 'welcomeDisableSuccess': return 'Mensagens de boas vindas desativadas com sucesso';
            case 'configs_welcomeLocalisedName': return 'boas_vindas';
            case 'configs_welcome_enableLocalisedName': return 'ativar';
            case 'configs_welcome_enableLocalisedDesc': return 'Seleciona um canal para a mensagemm de boas vindas ' +
                                                               'ser enviada quando um novo membro entrar';
            case 'configs_welcome_enableOptionchannelLocalisedName': return 'canal';
            case 'configs_welcome_enableOptionchannelLocalisedDesc': return 'O canal para recepcionar novos membros';
            case 'configs_welcome_disableLocalisedName': return 'desativar';
            case 'configs_welcome_disableLocalisedDesc': return 'Desativa mensagens de boas vindas para novos membros';
            case 'userInfoTitle': return 'Informações de usuário';
            case 'userInfoUsername': return 'Nome de usuário';
            case 'userInfoNickname': return 'Apelido';
            case 'userInfoCreatedAt': return 'Conta criada em';
            case 'userInfoJoinedAt': return 'Entrou no servidor em';
            case 'userInfoRoles': return 'Cargos';
            case 'userInfoDescription': return 'Mostra informações sobre um membro';
            case 'userInfoOptiontargetLocalisedDesc': return 'O usuário para mostrar as informações';
            case 'userInfoOptiontargetLocalisedName': return 'alvo';
            case 'userinfoLocalisedName': return 'usuarioinfo';
            case 'userinfoUsage': return '[(usuário)]';
            case 'muteOptiontargetLocalisedName': return 'alvo';
            case 'muteOptiondurationLocalisedName': return 'duracao';
            case 'muteOptionwith_reasonLocalisedName': return 'com_motivo';
            case 'muteOptiontargetLocalisedDesc': return 'O membro que deve ser mutado/castigado';
            case 'muteOptiondurationLocalisedDesc': return 'Por quanto tempo o membro deve permanecer mutado/castigado';
            case 'muteOptionwith_reasonLocalisedDesc': {
                return 'Se deve ser apresentado um formulário com um campo para informar o motivo do mute/castigo';
            }
            case 'timeAmountDays': return `${vars[0]} dias`;
            case 'timeAmountHours': return `${vars[0]} horas`;
            case 'timeAmountMinutes': return `${vars[0]} minutos`;
            case 'timeAmountSeconds': return `${vars[0]} segundos`;
            case 'slowmodeDisable': return 'Desativar';
            case 'slowmodeLocalisedName': return 'modolento';
            case 'slowmodeOptioncooldownLocalisedName': return 'intervalo';
            case 'slowmodeOptioncooldownLocalisedDesc': {
                return 'O intervalo entre cada mensagem que um usuário pode enviar';
            }
            case 'slowmodeOptionchannelLocalisedName': return 'canal';
            case 'slowmodeOptionchannelLocalisedDesc': return 'O canal para aplicar o intervalo do modo lento';
            case 'lockLocalisedName': return 'trancar';
            case 'lockDescription': return 'Impede que novas mensagens possam ser enviadas no canal atual';
            case 'lockUsage': return '[<on/off>]';
            case 'lockOptiondisableLocalisedName': return 'desativar';
            case 'lockOptiondisableLocalisedDesc': return 'Verdadeiro para destrancar o canal';
            case 'botCantLock': return 'Eu não tenho permissão para gerenciar as permissões desse canal';
            case 'lockAuditReason': return `Canal ${vars[0] ? 'des' : ''}trancado por ${vars[1]}`;
            case 'lockSuccess': return `Canal ${vars[0] ? 'des' : ''}trancado com sucesso`;
            case 'lockignoreLocalisedName': return 'trancaignorar';
            case 'lockignoreDescription': return 'Define cargos que serão ignorados pelo comando de lock';
            case 'lockignore_toggleLocalisedName': return 'alternar';
            case 'lockignore_toggleLocalisedDesc': {
                return 'Alterna um comando entre ignorado pelo comando de lock e não ignorado';
            }
            case 'lockignore_toggleOptionroleLocalisedName': return 'cargo';
            case 'lockignore_toggleOptionroleLocalisedDesc': {
                return 'O cargo que deve ser alternado entre ignorado e não ignorado';
            }
            case 'lockignore_listLocalisedName': return 'listar';
            case 'lockignore_listLocalisedDesc': return 'Lista cargos ignorados pelo comando de lock';
            case 'lockignoreSuccess': return `O cargo ${vars[0]} será ignorado pelo comando de lock com sucesso`;
            case 'botCantManageRole': return 'Eu não tenho permissão para generciar esse cargo';
            case 'lockignoreTooManyRoles': {
                return (
                    'Você atingiu o limite de cargos ignorados pelo comando de lock para esse servidor\n' +
                    'Note que esse limite é de 10 cargos para servidores premium e 1 cargo para servidores não premium'
                );
            }
            case 'lockignoreRemoveSuccess': return `O cargo ${vars[0]} não será mais ignorado pelo comando de lock`;
            case 'lockignore_listEmbedAuthor': return 'Cargos atualmente ignorados pelo comando de lock';
            case 'voiceconnectActionName': return 'Conexões de voz';
            case 'voicedisconnectActionName': return 'Desconexões de voz';
            case 'voicemoveActionName': return 'Movimentos de voz';
            case 'voiceconnectEmbedAuthor': return `${vars[0]} se conectou a ${vars[1]}`;
            case 'voiceconnectEmbedUserTitle': return 'Usuário';
            case 'voiceconnectEmbedChannelTitle': return 'Canal';
            case 'voicedisconnectEmbedAuthor': return `${vars[0]} se desconectou de ${vars[1]}`;
            case 'voicedisconnectEmbedUserTitle': return 'User';
            case 'voicedisconnectEmbedChannelTitle': return 'Channel';
            case 'voicedisconnectEmbedExecutorTitle': return 'Executor';
            case 'voicemoveEmbedAuthor': return `${vars[0]} trocou de canal de voz`;
            case 'voicemoveEmbedFromTitle': return 'Do canal';
            case 'voicemoveEmbedToTitle': return 'Para o canal';
            case 'voicemoveEmbedTargetTitle': return 'Alvo';
            case 'voicemoveEmbedExecutorTitle': return 'Executor';
            case 'voicemoveEmbedUserTitle': return 'Usuário';
        }
    },
};