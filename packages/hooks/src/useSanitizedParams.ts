import dompurify from "isomorphic-dompurify";
import { Params, useParams } from "react-router-dom";

type ParamsT<ParamsOrKey> = Readonly<
  [ParamsOrKey] extends [string] ? Params<ParamsOrKey> : Partial<ParamsOrKey>
>;

export function useSanitizedParams<
  ParamsOrKey extends string | Record<string, string | undefined> = string,
>(): ParamsT<ParamsOrKey> {
  const params = useParams<ParamsOrKey>();
  return Object.entries(params).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: typeof value === "string" ? dompurify.sanitize(value) : value,
    }),
    {} as ParamsT<ParamsOrKey>
  );
}
