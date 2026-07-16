function pickAllowedFields(source = {}, allowedKeys = []) {
  return allowedKeys.reduce((result, key) => {
    if (source[key] !== undefined) {
      result[key] = source[key];
    }
    return result;
  }, {});
}

module.exports = { pickAllowedFields };
