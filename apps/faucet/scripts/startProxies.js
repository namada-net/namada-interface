const { exec } = require("child_process");
const path = require("path");
const toml = require("toml");
const fs = require("fs");
require("dotenv").config();

const { NAMADA_INTERFACE_PROXY_PORT: proxyPort = "9000" } = process.env;

const runProxy = () => {
  const tomlPath = path.join(__dirname, "../public/config.toml");
  fs.readFile(tomlPath, "utf-8", (err, tomlData) => {
    if (err) {
      console.error("Error reading config.toml:", err);
      return;
    }

    const config = toml.parse(tomlData);
    const lcpCommand = `lcp --proxyUrl ${config.base_url || "http://localhost:5000/"} --port ${proxyPort}`;

    console.log(`Running command '${lcpCommand}'\n`);
    console.log("Starting local-cors-proxy for faucet API endpoint");
    console.log(
      `-> ${config.base_url} proxied to http://localhost:${proxyPort}/proxy\n`
    );

    exec(lcpCommand, (error, stdout, stderr) => {
      console.log(stdout);
      console.log(stderr);
      if (error !== null) {
        console.log(`exec error: ${error}`);
      }
    });
  });
};

runProxy();
