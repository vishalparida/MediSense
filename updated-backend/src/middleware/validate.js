export const validate = (schema) => (req, _res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    return next(
      Object.assign(new Error("Validation failed"), {
        statusCode: 422,
        details: error.details,
      })
    );
  }
  req.body = value;
  next();
};
