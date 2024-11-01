const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
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

// Worker function
const workerFunction = async (domains) => {
  const foundDomains = [];
  
  for (const domain of domains) {
    const available = await checkDomain(domain);
    if (available) {
      foundDomains.push(domain);
      console.log(`Found available domain: ${domain}`); // Logging found domains in worker
    }
  }

  return foundDomains;
};

const main = async () => {
  const baseDomain = config.domain; 
  const domains = generateDomains(baseDomain);
  const numThreads = 20; // Number of worker threads
  const chunkSize = Math.ceil(domains.length / numThreads);
  
  const workers = [];
  
  for (let i = 0; i < numThreads; i++) {
    const chunk = domains.slice(i * chunkSize, (i + 1) * chunkSize);
    const worker = new Worker(__filename, { workerData: chunk });
    
    worker.on('message', (foundDomains) => {
      foundDomains.forEach((domain) => {
        writer.write(domain + '\n');
      });
    });

    worker.on('exit', () => {
      console.log(`Worker ${i} has finished processing.`); // Log when each worker is done
    });

    workers.push(worker);
  }

  await Promise.all(workers.map(worker => new Promise((resolve) => {
    worker.on('exit', resolve);
  })));

  writer.end();
  console.log('All workers have finished processing.');
};

// Start the main process
if (isMainThread) {
  main();
} else {
  // In the worker thread
  (async () => {
    const foundDomains = await workerFunction(workerData);
    parentPort.postMessage(foundDomains);
  })();
}
