const dns = require('node:dns').promises;
const whoiser = require('whoiser');
const fs = require('fs');
const path = require('path');

// Function to resolve DNS for a given domain
const checkDomainDNS = async (domain) => {
  try {
    const data = await dns.resolve4(domain);
    return data || null;
  } catch (error) {
    return null;
  }
};

// Function to check if the domain is available from WHOIS data
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

// Function to check the domain availability
const checkDomain = async (domain) => {
  const domainDNS = await checkDomainDNS(domain);
  if (domainDNS) {
    return false;
  }

  const domainWhois = await whoiser(domain, { timeout: 1000, follow: 2 });
  return isDomainAvailableFromWhois(domainWhois);
};

// Function to generate all possible domain names by replacing '*' with letters
const generateDomains = (baseDomain) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const domains = [];

  const generateWithWildcard = (domain, index) => {
    if (index === domain.length) {
      domains.push(domain);
      return;
    }

    if (domain[index] === '*') {
      for (let char of chars) {
        generateWithWildcard(domain.slice(0, index) + char + domain.slice(index + 1), index + 1);
      }
    } else {
      generateWithWildcard(domain, index + 1);
    }
  };

  generateWithWildcard(baseDomain, 0);
  return domains;
};

// Load configuration from JSON file
const config = require('./config.json');

const filePath = path.join(__dirname, 'domains.txt');
const writer = fs.createWriteStream(filePath);

async function main() {
  // Generate domains based on the format from config
  const baseDomain = config.domain; // e.g., "aman***.com"
  const domains = generateDomains(baseDomain);

  let domaincounter = 0;
  let founddomaincounter = 0;

  for (const domain of domains) {
    const addrs = await checkDomain(domain);

    if (addrs) {
      founddomaincounter++;
      writer.write(domain + '\n');
    }

    domaincounter++;

    console.clear();

    console.log(
      `Checking : ${domain} (${domaincounter}/${domains.length}) - Found : ${founddomaincounter}`
    );
  }

  writer.end();
}

main();
