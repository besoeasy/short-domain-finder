// Generate domain names of a specified length with an optional keyword
export const generateDomains = (length, keyword) => {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const domains = [];

  const suffixLength = length - (keyword.length || 0);

  const generateWithSuffix = (prefix, remainingLength) => {
    if (remainingLength === 0) {
      domains.push(prefix);
      return;
    }
    for (let i = 0; i < chars.length; i++) {
      generateWithSuffix(prefix + chars[i], remainingLength - 1);
    }
  };

  // Generate domains with the keyword appended
  if (keyword) {
    generateWithSuffix(keyword, suffixLength);
  } else {
    // Generate random domains without a keyword
    const generateRandom = (prefix, remainingLength) => {
      if (remainingLength === 0) {
        domains.push(prefix);
        return;
      }
      for (let i = 0; i < chars.length; i++) {
        generateRandom(prefix + chars[i], remainingLength - 1);
      }
    };
    generateRandom("", length);
  }

  for (let i = domains.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i);
    const temp = domains[i];
    domains[i] = domains[j];
    domains[j] = temp;
  }

  return domains;
};
