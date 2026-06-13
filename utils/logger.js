function write(level, message, meta = {}) {
  const safeMeta = { ...meta };
  delete safeMeta.password;
  delete safeMeta.session;
  delete safeMeta.cookies;
  console[level](JSON.stringify({ level, message, ...safeMeta, timestamp: new Date().toISOString() }));
}

export const logger = {
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
};
