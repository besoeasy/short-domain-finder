const dns = require('node:dns').promises;
const whoiser = require('whoiser');
const fs = require('fs');
const path = require('path');

const checkDomainDNS = async (domain) => {
  try {
    const data = await dns.resolve4(domain);
    return data || null;
  } catch (error) {
    return null;
  }
};

const isDomainAvailableFromWhois = (whoisData) => {
  const whoisString =
    typeof whoisData === 'string' ? whoisData : JSON.stringify(whoisData);

  const indicators = [
    'No match for',
    'NOT FOUND',
    'Domain not found',
    'Domain is available',
    'Free for registration',
  ];

  return indicators.some((indicator) => whoisString.includes(indicator));
};

const checkDomain = async (domain) => {
  const domainDNS = await checkDomainDNS(domain);

  if (domainDNS) {
    return false;
  }

  const domainWhois = await whoiser(domain, { timeout: 1000, follow: 2 });

  return isDomainAvailableFromWhois(domainWhois);
};

const generateDomains = (length, keyword) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
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

  if (keyword) {
    generateWithSuffix(keyword, suffixLength);
  } else {
    const generateRandom = (prefix, remainingLength) => {
      if (remainingLength === 0) {
        domains.push(prefix);
        return;
      }
      for (let i = 0; i < chars.length; i++) {
        generateRandom(prefix + chars[i], remainingLength - 1);
      }
    };
    generateRandom('', length);
  }

  for (let i = domains.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i);
    [domains[i], domains[j]] = [domains[j], domains[i]];
  }

  return domains;
};

const config = require('./config.json');

const filePath = path.join(__dirname, 'domains.txt');
const writer = fs.createWriteStream(filePath);

async function main() {
  const domains = generateDomains(config.length, config.keyword);

  let domaincounter = 0;
  let founddomaincounter = 0;

  for (const element of domains) {
    const domain = `${element}.${config.extension}`;

    const addrs = await checkDomain(domain);

    if (addrs) {
      founddomaincounter++;
      writer.write(domain + '\n');
    }

    domaincounter++;

    console.clear();

    console.log(
      `Checking : ${element}.${config.extension} (${domaincounter}/${domains.length}) - Found : ${founddomaincounter}`
    );
  }

  writer.end();
}

main();
