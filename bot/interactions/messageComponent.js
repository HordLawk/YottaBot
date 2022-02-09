const axios = require('axios');

module.exports = {
    name: 'MESSAGE_COMPONENT',
    execute: async interaction => {
        if(interaction.customId === 'modal'){
            axios({
                method: 'POST',
                url: `https://discord.com/api/v8/interactions/${interaction.id}/${interaction.token}/callback`,
                data: {
                    type: 9,
                    data: {
                        custom_id: 'teste',
                        title: 'form de moderacao',
                        components: [
                            {
                                type: 1,
                                components: [
                                    {
                                        type: 4,
                                        custom_id: 'nome',
                                        style: 1,
                                        label: 'qual seu nome',
                                        placeholder: 'seu nome',
                                    }
                                ]
                            },
                            {
                                type: 1,
                                components: [
                                    {
                                        type: 4,
                                        custom_id: 'motivo',
                                        style: 2,
                                        label: 'pq quer ser mod',
                                        placeholder: 'explica pra mim',
                                    }
                                ]
                            },
                            {
                                type: 1,
                                components: [
                                    {
                                        type: 4,
                                        custom_id: 'motivo2',
                                        style: 2,
                                        label: 'nao obrigatoria',
                                        placeholder: 'explica pra mim',
                                        required: false,
                                    }
                                ]
                            },
                            {
                                type: 1,
                                components: [
                                    {
                                        type: 4,
                                        custom_id: 'motivo3',
                                        style: 2,
                                        label: 'limite foda',
                                        placeholder: 'explica pra mim',
                                        max_length: 69,
                                    }
                                ]
                            },
                            // {
                            //     type: 1,
                            //     components: [
                            //         {
                            //             type: 3,
                            //             custom_id: 'horas',
                            //             label: 'que horas voce quer trabalhar',
                            //             placeholder: 'marca os turnos',
                            //             options: [
                            //                 {
                            //                     label: 'manha',
                            //                     value: 'manha',
                            //                     description: 'de manha ne porra',
                            //                 },
                            //                 {
                            //                     label: 'tarde',
                            //                     value: 'tard',
                            //                     description: 'de tarde ne porra',
                            //                 },
                            //                 {
                            //                     label: 'noite',
                            //                     value: 'noite',
                            //                     description: 'de noite ne porra',
                            //                 },
                            //             ],
                            //             max_values: 2,
                            //         }
                            //     ]
                            // },
                        ]
                    }
                }
            }).catch(res => console.log(JSON.stringify(res.response.data)));
        }
    },
};