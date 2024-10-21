import * as dns from "node:dns";

export const checkDomain = async (domain) => {
  try {
    const data = await dns.promises.resolve4(domain, { ttl: true });

    return data || null;
  } catch (error) {
    if (error.code === "ENOTFOUND") {
      return null;
    }

    return [];
  }
};
