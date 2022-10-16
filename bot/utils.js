const locale = require('../locale');

const getStringLocales = key => locale.reduce((acc, e) => e.get(key) ? {...acc, [e.code]: e.get(key)} : acc, {});

const timeSpanChoices = (value, locale, maxSeconds, div = 1) => {
    const choices = [];
    if((!maxSeconds || (value <= maxSeconds)) && (div == 1)){
        choices.push({name: locale.get('timeAmountSeconds', [value]), value});
    }
    if((!maxSeconds || (value <= (maxSeconds / 60))) && (div <= 60)) choices.push({
        name: locale.get('timeAmountMinutes', [value]),
        value: (value * 60) / div,
    });
    if((!maxSeconds || (value <= (maxSeconds / (60 * 60)))) && (div <= (60 * 60))) choices.push({
        name: locale.get('timeAmountHours', [value]),
        value: (value * 60 * 60) / div,
    });
    if((!maxSeconds || (value <= (maxSeconds / (24 * 60 * 60)))) && (div <= (24 * 60 * 60))) choices.push({
        name: locale.get('timeAmountDays', [value]),
        value: (value * 24 * 60 * 60) / div,
    });
    return choices;
};

module.exports = {getStringLocales, timeSpanChoices};