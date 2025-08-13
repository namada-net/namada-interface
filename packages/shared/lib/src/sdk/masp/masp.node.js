const fs = require("node:fs");

function writeFileSync(path, ui8a) {
  fs.writeFileSync(path, Buffer.from(ui8a));
}

function readFileSync(path) {
  const buffer = fs.readFileSync(path).buffer;
  return buffer;
}

function renameSync(pathA, pathB) {
  fs.renameSync(pathA, pathB);
}

function unlinkSync(path) {
  fs.unlinkSync(path);
}

function existsSync(path) {
  return fs.existsSync(path);
}

const MASP_MPC_RELEASE_URL =
  "https://github.com/anoma/masp-mpc/releases/download/namada-trusted-setup/";

const MaspParam = {
  Output: "masp-output.params",
  Convert: "masp-convert.params",
  Spend: "masp-spend.params",
};

async function hasMaspParams() {
  return (
    (await has(MaspParam.Spend)) &&
    (await has(MaspParam.Output)) &&
    (await has(MaspParam.Convert))
  );
}

async function fetchAndStoreMaspParams(url) {
  return Promise.all([
    fetchAndStore(MaspParam.Spend, url),
    fetchAndStore(MaspParam.Output, url),
    fetchAndStore(MaspParam.Convert, url),
  ]);
}

async function getMaspParams() {
  return Promise.all([
    get(MaspParam.Spend),
    get(MaspParam.Output),
    get(MaspParam.Convert),
  ]);
}

async function fetchAndStore(param, url) {
  return await fetchParams(param, url)
    .then((data) => set(param, data))
    .catch((e) => {
      return Promise.reject(`Encountered errors fetching ${param}: ${e}`);
    });
}

async function fetchParams(param, url) {
  if (!url) {
    url = MASP_MPC_RELEASE_URL;
  }
  return fetch(`${url}${param}`)
    .then((response) => response.arrayBuffer())
    .then((ab) => {
      const bytes = new Uint8Array(ab);
      return validateMaspParamBytes({ param, bytes });
    });
}

async function set(path, data) {
  console.log({ path, data });
  console.warn("TODO: IMPLEMENT FOR NODEJS!");
}

module.exports = {
  writeFileSync,
  readFileSync,
  renameSync,
  unlinkSync,
  existsSync,
  fetchAndStoreMaspParams,
  hasMaspParams,
  getMaspParams,
};
