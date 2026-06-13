import AppError from './AppError.js';

export function validate(schema, value, source = 'request') {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError(`Invalid ${source}`, 400, 'VALIDATION_ERROR', result.error.flatten());
  }
  return result.data;
}
