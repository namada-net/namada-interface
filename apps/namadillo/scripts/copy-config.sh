#!/bin/sh

DIST_DIR="dist"

cat > "$DIST_DIR/config.toml" <<EOL
indexer_url = "https://indexer.mainnet.siuuu.click"
rpc_url = "https://rpc.mainnet.siuuu.click"
masp_indexer_url = "https://masp.mainnet.siuuu.click"
EOL

echo "config.toml created in $DIST_DIR"
