
import * as dns from "node:dns";
import whoiser from "whoiser";

const checkDomainDNS = async (domain) => {
  try {
    const data = await dns.promises.resolve4(domain);
    return data || null;
  } catch (error) {
    return null;
  }
};

const isDomainAvailableFromWhois = (whoisData) => {
  // Convert WHOIS data to string if it's not already
  const whoisString =
    typeof whoisData === "string" ? whoisData : JSON.stringify(whoisData);

  // Check for indicators of an available domain in the WHOIS data
  const indicators = [
    "No match for",
    "NOT FOUND",
    "Domain not found",
    "Domain is available",
    "Free for registration",
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

// Generate domain names of a specified length with an optional keyword
const generateDomains = (length, keyword) => {
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


import config from "./config.json";

const file = Bun.file("domains.txt");
const writer = file.writer();

async function main() {
  const domains = generateDomains(config.length, config.keyword);

  let domaincounter = 0;
  let founddomaincounter = 0;

  for await (const element of domains) {
    const domain = `${element}.${config.extension}`;

    const addrs = await checkDomain(domain);

    if (addrs) {
      founddomaincounter++;
      writer.write(domain + "\n");
    }

    domaincounter++;

    console.clear();

    console.log(
      `Checking : ${element}.${config.extension} (${domaincounter}/${domains.length}) - Found : ${founddomaincounter}`
    );
  }
}

main();
