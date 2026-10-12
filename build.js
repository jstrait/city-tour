import * as esbuild from "esbuild";
import * as fs from "node:fs/promises";

const outputDirectory = "dist";

const esbuildConfig = {
  entryPoints: [
    { out: "city_tour", in: "src/app/app.js" },
    { out: "city_tour", in: "css/city_tour.css" },
    { out: "index", in: "html/index.html" },
    "textures/*.png",
  ],
  loader: {
    ".html": "copy",
    ".png": "copy",
  },
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  target: [
    "safari15.0",
    "ios15.0",
    "firefox92",
    "chrome94",
    "edge94",
  ],
  outbase: ".",
  outdir: outputDirectory,
  plugins: [],
  write: false,
};

const cleanOutputFolderPlugin = {
  name: "clean-output-folder",
  setup(build) {
    build.onStart(async () => {
      await fs.rm(outputDirectory, { recursive: true, force: true });
    });
  },
};

// Node.js adds its own 2 arguments to the beginning of `process.argv` before
// any user-supplied arguments. To make downstream logic a little more clear
// the extra 2 arguments are first removed.
const userSuppliedArguments = [...process.argv.slice(2)];

if (userSuppliedArguments.length === 0) {
  esbuildConfig.plugins.push(cleanOutputFolderPlugin);
  esbuildConfig.write = true;

  await esbuild.build(esbuildConfig);
}
else if (userSuppliedArguments.length === 1 && userSuppliedArguments[0] === "--serve") {
  const esbuildContext = await esbuild.context(esbuildConfig);
  const { hosts, port } = await esbuildContext.serve();

  const urls = hosts.map((host) => `http://${host}:${port}/`);

  console.log(`Serving at ${urls.join(" or ")}`);
}
else {
  console.log("Unexpected command-line argument. `--serve` (which is optional) is the only argument allowed.");
  process.exit(1);
}
