exports.requestFilter = (filter) => {
  const result = {};
  for (const key in filter) {
    if (filter[key]) {
      result[key] = filter[key];
    }
  }
  return result;
};
