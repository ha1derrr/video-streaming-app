// This asyncHandler is just a wrapper function to wrap async functions in try catch
// So that we don't have to write try-catch block for every async function

const asyncHandler = (fn) => {
  return async (...args) => {
    try {
      await fn(...args);
      console.log("Database Connected Successfully");
    } catch (err) {
      console.log(`Error connecting DB ${err.name}`);
      throw err;
    }
  };
};

export { asyncHandler };
