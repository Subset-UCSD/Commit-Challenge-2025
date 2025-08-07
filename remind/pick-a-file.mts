import { readdir, stat } from "fs/promises";
import { join, extname } from "path";

async function findFiles(dir: string): Promise<string[]> {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = join(dir, dirent.name);
      if (dirent.isDirectory()) {
        return findFiles(res);
      } else {
        const ext = extname(res);
        if (ext === ".js" || ext === ".ts" || ext === ".mts" || ext === ".tsx") {
          return res;
        } else {
          return [];
        }
      }
    })
  );
  return Array.prototype.concat(...files);
}

async function main() {
  const allFiles = await findFiles(".");
  const randomIndex = Math.floor(Math.random() * allFiles.length);
  console.log(allFiles[randomIndex]);
}

main();
