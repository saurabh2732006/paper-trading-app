import pino from 'pino';

const logger = pino({
  level: process.env['LOG_LEVEL'] || 'info',
  transport: process.env['NODE_ENV'] === 'development' ? ({
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  } as any) : undefined,
});

export default logger;

