import { BadRequestError } from '../utils/errors.js';

/**
 * Higher-order middleware function to validate incoming request data with a Zod schema.
 * @param {import('zod').ZodSchema} schema 
 * @param {'body' | 'query' | 'params'} [source='body']
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req[source]);
      if (!result.success) {
        const issues = result.error.issues || result.error.errors || [];
        const errorDetails = issues.map((e) => ({
          field: e.path ? e.path.join('.') : 'root',
          message: e.message,
        }));
        return next(new BadRequestError('Validation failed', errorDetails));
      }
      req[source] = result.data;
      next();
    } catch (err) {
      next(err);
    }
  };
}
