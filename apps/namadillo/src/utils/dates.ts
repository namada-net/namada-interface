import { DateTime } from "luxon";

const secondsToDateTime = (seconds: bigint): DateTime =>
  DateTime.fromSeconds(Number(seconds));

const secondsToTimeString = (seconds: bigint): string =>
  secondsToDateTime(seconds).toLocaleString(DateTime.TIME_SIMPLE);

const secondsToDateString = (seconds: bigint): string =>
  secondsToDateTime(seconds).toLocaleString(DateTime.DATE_MED);

export const secondsToDateTimeString = (seconds: bigint): string =>
  `${secondsToDateString(seconds)}, ${secondsToTimeString(seconds)}`;

export const secondsToFullDateTimeString = (seconds: bigint): string =>
  secondsToDateTime(seconds).toLocaleString(DateTime.DATETIME_FULL);

export const secondsToTimeRemainingString = (
  startTimeInSeconds: bigint,
  endTimeInSeconds: bigint
): string =>
  secondsToDateTime(endTimeInSeconds)
    .diff(secondsToDateTime(startTimeInSeconds), ["days", "hours", "minutes"])
    .toHuman({ maximumFractionDigits: 0 });
