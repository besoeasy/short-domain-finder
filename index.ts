import { generateDomains } from "./x/generateDomains";
import { checkDomain } from "./x/checkDomain";
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
      "Checking : " +
        element +
        "." +
        config.extension +
        " (" +
        domaincounter +
        "/" +
        domains.length +
        ") - Found : " +
        founddomaincounter
    );
  }
}

main();
