const fs = require("node:fs");
const sharp = require("sharp");
(async () => {
  const png = await sharp("build/aether.svg").resize(256, 256).png().toBuffer();
  const pngToIco = (await import("png-to-ico")).default;
  const ico = await pngToIco(png);
  fs.writeFileSync("build/aether.ico", ico);
  console.log("Generated build/aether.ico");
})().catch(error => { console.error(error); process.exit(1); });
