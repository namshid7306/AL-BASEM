export const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const formattedErrors = result.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message
      }));
      return res.status(422).json({
        success: false,
        message: formattedErrors[0]?.message || "Validation failed",
        errors: formattedErrors
      });
    }
    req[source] = result.data;
    next();
  };
};
