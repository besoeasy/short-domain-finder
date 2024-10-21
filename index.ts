import { generateDomains } from "./x/generateDomains";
import { checkDomain } from "./x/checkDomain";
import config from "./config.json";

const file = Bun.file("domains.txt");
const writer = file.writer();

async function main() {
  const domains = generateDomains(config.length, config.keyword);

  console.log("Total Possible Domains : " + domains.length);

  for await (const element of domains) {
    const domain = `${element}.${config.extension}`;

    const addrs = await checkDomain(domain);

    if (addrs) {
      console.log("Found : " + domain);

      writer.write(domain + "\n");
    }
  }
}

main();
