# Next Epoch Implementation

## Overview
This document describes the implementation of the `getNextEpoch` function in the Namada JavaScript SDK, which provides information about the next epoch including timing and block height details.

## Usage

```typescript
import { Sdk } from "@namada/sdk/web";
import { NextEpochInfo } from "@namada/sdk";

// Initialize SDK
const sdk = new Sdk(/* ... */);

// Get next epoch information
const nextEpochInfo: NextEpochInfo = await sdk.rpc.getNextEpoch();

console.log(`Next epoch: ${nextEpochInfo.nextEpoch}`);
console.log(`Min block height: ${nextEpochInfo.minBlockHeight}`);
console.log(`Time until next epoch: ${nextEpochInfo.minTimeUntilNextEpoch} seconds`);
```

## Return Type

```typescript
type NextEpochInfo = {
  nextEpoch: bigint;           // The next epoch number
  minBlockHeight: number;      // Minimum block height for the next epoch
  minTimeUntilNextEpoch: number; // Time in seconds until the next epoch
};
```

## Implementation Status

### ✅ Completed (JavaScript/TypeScript Layer)
- [x] TypeScript type definitions (`NextEpochInfo`, `BlockHeader`)
- [x] High-level SDK implementation in `rpc.ts`
- [x] Error handling and data transformation
- [x] Import/export statements
- [x] Type safety and runtime method existence checks
- [x] Graceful error messages when Rust methods are not yet implemented
- [x] Build verification - TypeScript compilation passes

### ⏳ Pending (Rust WASM Layer)
The following Rust methods need to be implemented in the Namada SDK's WASM layer:

#### `query_next_epoch_info()`
**Location:** Should be added to the `Query` struct in the Rust WASM bindings

**Expected Return Format:**
```rust
// Expected JSON structure from Rust
{
  "next_epoch": u64,
  "min_block_height": u64, 
  "next_epoch_time": "RFC3339 timestamp string",
  // ... other relevant fields
}
```

**Rust Implementation Notes:**
- Should call `rpc::query_next_epoch_info` from the Rust Namada SDK
- Return serialized JSON that matches the expected format above
- Handle RPC errors appropriately

#### `query_block_header(height?: number)`
**Location:** Should be added to the `Query` struct in the Rust WASM bindings

**Expected Return Format:**
```rust
// Expected JSON structure from Rust
{
  "height": u64,
  "time": "RFC3339 timestamp string", 
  "hash": "block hash string",
  "proposer_address": "validator address string"
}
```

**Rust Implementation Notes:**
- Should call `rpc::query_block_header` from the Rust Namada SDK
- If `height` is `null`, query the latest block
- Return serialized JSON that matches the expected format above

## Integration Points

### JavaScript SDK Files Modified
1. `packages/sdk/src/rpc/types.ts` - Added type definitions
2. `packages/sdk/src/rpc/rpc.ts` - Added main implementation

### Rust Files That Need Updates
1. **WASM Query Struct** - Add the two new query methods
2. **RPC Integration** - Connect to the actual Rust SDK RPC calls
3. **Serialization** - Ensure proper JSON serialization of return types

## Error Handling

The implementation includes comprehensive error handling:
- Network/RPC failures are caught and re-thrown with descriptive messages
- Invalid timestamps are handled gracefully
- Negative time calculations are clamped to 0

## Testing Recommendations

Once the Rust implementation is complete, test:
1. **Basic functionality** - Verify correct epoch and timing information
2. **Edge cases** - Test around epoch boundaries
3. **Error scenarios** - Test network failures and invalid responses
4. **Performance** - Verify the combined RPC calls don't cause significant delays 