import { brotliCompress, constants } from "node:zlib";
import { promisify } from "node:util";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";

const compress = promisify(brotliCompress);
const assets = new URL("../scratch/asar/webview/assets/", import.meta.url);

for (const name of await readdir(assets)) {
  if (!/^(?:app-(?:initial|shared|primary)-.+|preload)\.js$/.test(name)) continue;

  const source = new URL(name, assets);
  const target = new URL(`${name}.br`, assets);
  const sourceStat = await stat(source);
  const targetStat = await stat(target).catch(() => null);
  if (targetStat && targetStat.mtimeMs >= sourceStat.mtimeMs) continue;

  const compressed = await compress(await readFile(source), {
    params: { [constants.BROTLI_PARAM_QUALITY]: 5 },
  });
  await writeFile(target, compressed);
  console.log(`Compressed ${name}: ${sourceStat.size} -> ${compressed.length} bytes`);
}
