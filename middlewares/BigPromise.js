// we've to use try catch along with async await or promise everywhere

module.exports = (func) => (req, res, next) => {
    Promise.resolve(func(req, res, next)).catch(next);
  };
  