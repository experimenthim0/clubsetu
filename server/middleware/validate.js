export const validate = (schema) => (req, res, next) => {
  try {
    const validData = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    // Only overwrite req.body — Express 5 makes req.query and req.params
    // read-only getters, so assigning to them throws TypeError.
    if (validData.body) req.body = validData.body;
    next();
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors,
      });
    }
    next(error);
  }
};
