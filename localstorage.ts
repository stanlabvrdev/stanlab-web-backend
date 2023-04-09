import fs from "fs";
import path from "path";

interface IMemoryStore {
  id: string;
  data: any;
}

const filename = path.join(__dirname, "../in-memory-cache.json");

class InMemoryCache {
  getData(): IMemoryStore {
    try {
      const data = fs.readFileSync(filename, "utf8");
      return JSON.parse(data);
    } catch (err: any) {
      if (err.code === "ENOENT") {
        fs.writeFileSync(filename, JSON.stringify({ data: null, id: "1234" }));
        return { data: null, id: "1234" };
      }
      throw err;
    }
  }

  saveData(data: IMemoryStore): void {
    fs.writeFileSync(filename, JSON.stringify(data));
  }
}

export const inMemoryCache = new InMemoryCache();
