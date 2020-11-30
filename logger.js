const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
const path = require('path')

const isEmpty = function(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

const logger = createLogger({
	level: "debug",
	format: combine(
		format.label({ label: path.basename(process.mainModule.filename) }),
		format.timestamp({format: 'DD.MM.YYYY HH:mm:ss'}),
		format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
		format.printf(info => {
			let out = `${info.timestamp} [${info.level.toUpperCase()}] ${info.label}: ${JSON.stringify(info.message, null, '\t')}`;
			if (!isEmpty(info.metadata))
				out += `\n${JSON.stringify(info.metadata, null, '\t')}`;
			return out;
		}),
	),
	transports: [
		new transports.File({ filename: 'logs/combined.log' })
	]
});

module.exports = logger;