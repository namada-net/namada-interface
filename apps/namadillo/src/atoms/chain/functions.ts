import { ModelParameters } from "@namada/indexer-client";
import { singleUnitDurationFromInterval } from "@namada/utils/helpers";

export const calculateUnbondingPeriod = (
  parameters: ModelParameters
): string => {
  const unbondingPeriodInEpochs =
    Number(parameters.unbondingLength) +
    Number(parameters.pipelineLength) +
    Number(parameters.cubicSlashingWindowLength);
  const minEpochDuration = Number(parameters.minDuration);
  const maxBlockTime = Number(parameters.maxBlockTime);
  const epochSwitchBlocksDelay = Number(parameters.epochSwitchBlocksDelay);

  const realMinEpochDuration =
    minEpochDuration + maxBlockTime * epochSwitchBlocksDelay;

  return singleUnitDurationFromInterval(
    0,
    unbondingPeriodInEpochs * realMinEpochDuration
  );
};
