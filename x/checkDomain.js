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

export const checkDomain = async (domain) => {
  const domainDNS = await checkDomainDNS(domain);

  if (domainDNS) {
    return false;
  }

  const domainWhois = await whoiser(domain);

  return isDomainAvailableFromWhois(domainWhois);
};
