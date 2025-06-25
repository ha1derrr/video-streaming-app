// This asyncHandler is just a wrapper function to wrap async functions in try catch
// So that we don't have to write try-catch block for every async function

// Below code is done with async-await
const asyncHandler = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      // Passes the error to Express now
      next(error);
    }
  };
};

// Below code done with .then() and .catch() format
// This version wraps the fn in a Promise
// const asyncHandler = (fn) => {
//   return (req, res, next) => {
//     Promise.resolve(fn(req, res, next)).catch((error) => next(error));
//   };
// };

export { asyncHandler };
