const PREFIX = "Namada::SDK";
const MASP_MPC_RELEASE_URL =
  "https://github.com/anoma/masp-mpc/releases/download/namada-trusted-setup/";

const sha256Hash = async (msg: Uint8Array): Promise<string> => {
  const hashBuffer = await crypto.subtle.digest("SHA-256", msg);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Return hash as hex
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

enum MaspParam {
  Output = "masp-output.params",
  Convert = "masp-convert.params",
  Spend = "masp-spend.params",
}

type MaspParamBytes = {
  param: MaspParam;
  bytes: Uint8Array;
};

/**
 * The following sha256 digests where produced by downloading the following:
 * https://github.com/anoma/masp-mpc/releases/download/namada-trusted-setup/masp-convert.params
 * https://github.com/anoma/masp-mpc/releases/download/namada-trusted-setup/masp-spend.params
 * https://github.com/anoma/masp-mpc/releases/download/namada-trusted-setup/masp-output.params
 *
 * And running "sha256sum" against each file:
 *
 * > sha256sum masp-convert.params
 * 8e049c905e0e46f27662c7577a4e3480c0047ee1171f7f6d9c5b0de757bf71f1  masp-convert.params
 *
 * > sha256sum masp-spend.params
 * 62b3c60ca54bd99eb390198e949660624612f7db7942db84595fa9f1b4a29fd8  masp-spend.params
 *
 * > sha256sum masp-output.params
 * ed8b5d354017d808cfaf7b31eca5c511936e65ef6d276770251f5234ec5328b8  masp-output.params
 *
 * Length is specified in bytes, and can be retrieved with:
 *
 * > wc -c < masp-convert.params
 * 22570940
 * > wc -c < masp-spend.params
 * 49848572
 * > wc -c < masp-output.params
 * 16398620
 */
const MASP_PARAM_ATTR: Record<
  MaspParam,
  { length: number; sha256sum: string }
> = {
  [MaspParam.Output]: {
    length: 16398620,
    sha256sum:
      "ed8b5d354017d808cfaf7b31eca5c511936e65ef6d276770251f5234ec5328b8",
  },
  [MaspParam.Spend]: {
    length: 49848572,
    sha256sum:
      "62b3c60ca54bd99eb390198e949660624612f7db7942db84595fa9f1b4a29fd8",
  },
  [MaspParam.Convert]: {
    length: 22570940,
    sha256sum:
      "8e049c905e0e46f27662c7577a4e3480c0047ee1171f7f6d9c5b0de757bf71f1",
  },
};

const validateMaspParamBytes = async ({
  param,
  bytes,
}: MaspParamBytes): Promise<Uint8Array> => {
  const { length, sha256sum } = MASP_PARAM_ATTR[param];

  // Reject if invalid length (incomplete download or invalid)
  console.info(`Validating data length for ${param}, expecting ${length}...`);

  if (length !== bytes.length) {
    return Promise.reject(
      `[${param}]: Invalid data length! Expected ${length}, received ${bytes.length}!`
    );
  }

  // Reject if invalid hash (otherwise invalid data)
  console.info(`Validating sha256sum for ${param}, expecting ${sha256sum}...`);
  const hash = await sha256Hash(bytes);

  if (hash !== sha256sum) {
    return Promise.reject(
      `[${param}]: Invalid sha256sum! Expected ${sha256sum}, received ${hash}!`
    );
  }

  return bytes;
};

export async function hasMaspParams(): Promise<boolean> {
  return (
    (await has(MaspParam.Spend)) &&
    (await has(MaspParam.Output)) &&
    (await has(MaspParam.Convert))
  );
}

export async function fetchAndStoreMaspParams(
  url?: string
): Promise<[void, void, void]> {
  return Promise.all([
    fetchAndStore(MaspParam.Spend, url),
    fetchAndStore(MaspParam.Output, url),
    fetchAndStore(MaspParam.Convert, url),
  ]);
}

export async function getMaspParams(): Promise<[unknown, unknown, unknown]> {
  return Promise.all([
    get(MaspParam.Spend),
    get(MaspParam.Output),
    get(MaspParam.Convert),
  ]);
}

export async function fetchAndStore(
  param: MaspParam,
  url?: string
): Promise<void> {
  return await fetchParams(param, url)
    .then((data) => set(param, data))
    .catch((e) => {
      return Promise.reject(`Encountered errors fetching ${param}: ${e}`);
    });
}

export async function fetchParams(
  param: MaspParam,
  url: string = MASP_MPC_RELEASE_URL
): Promise<Uint8Array> {
  return fetch(`${url}${param}`)
    .then((response) => response.arrayBuffer())
    .then((ab) => {
      const bytes = new Uint8Array(ab);
      return validateMaspParamBytes({ param, bytes });
    });
}

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PREFIX);
    request.onerror = (event) => {
      event.stopPropagation();
      reject(event.target);
    };

    request.onupgradeneeded = (event) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = (event.target as any).result;

      db.createObjectStore(PREFIX, { keyPath: "key" });
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

export async function get(key: string): Promise<unknown> {
  const tx = (await getDB()).transaction(PREFIX, "readonly");
  const store = tx.objectStore(PREFIX);

  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onerror = (event) => {
      event.stopPropagation();

      reject(event.target);
    };
    request.onsuccess = () => {
      if (!request.result) {
        resolve(undefined);
      } else {
        resolve(request.result.data);
      }
    };
  });
}

export async function has(key: string): Promise<boolean> {
  const tx = (await getDB()).transaction(PREFIX, "readonly");
  const store = tx.objectStore(PREFIX);

  return new Promise((resolve, reject) => {
    const request = store.openCursor(key);
    request.onerror = (event) => {
      event.stopPropagation();

      reject(event.target);
    };
    request.onsuccess = (e) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cursor = (e.target as any).result;
      resolve(!!cursor);
    };
  });
}

export async function set(key: string, data: unknown): Promise<void> {
  const tx = (await getDB()).transaction(PREFIX, "readwrite");
  const store = tx.objectStore(PREFIX);

  return new Promise((resolve, reject) => {
    const request = store.put({
      key,
      data,
    });
    request.onerror = (event) => {
      event.stopPropagation();

      reject(event.target);
    };
    request.onsuccess = () => {
      resolve();
    };
  });
}
