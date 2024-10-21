import { generateDomains } from "./x/generateDomains";
import { checkDomain } from "./x/checkDomain";

const file = Bun.file("domains.txt");
const writer = file.writer();

const length = 4;
const keyword = "aa";
const domain_extension = ".com";

async function main() {
  const domains = generateDomains(length, keyword);

  console.log("Total Possible Domains : " + domains.length);

  for await (const element of domains) {
    const domain = element + domain_extension;

    const addrs = await checkDomain(domain);

    if (addrs) {
      console.log("Found : " + domain);

      writer.write(domain + "\n");
    }
  }
}

main();
