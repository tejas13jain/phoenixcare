import { ApiError } from '../utils/ApiError.js';

// Validates req.body/query/params against a Zod schema shape { body?, query?, params? }.
export const validate = (schema) => (req, res, next) => {
  const toValidate = {
    body: req.body,
    query: req.query,
    params: req.params,
  };

  const result = schema.safeParse(toValidate);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    return next(ApiError.badRequest('Validation failed', details));
  }

  req.validated = result.data;
  next();
};
