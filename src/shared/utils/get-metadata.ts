import { Metadata } from '@grpc/grpc-js';
/**
 * Extracts selected values from gRPC Metadata using a mapping object.
 *
 * @template T - A mapping from your result keys to metadata keys.
 * @param meta - The gRPC Metadata object.
 * @param def - An object whose keys are the field names you want
 *              and whose values are the corresponding metadata keys to fetch.
 * @returns An object mapping the original keys to their found string values (if present).
 *
 */
export const getMetadataValues = <T extends Record<string, string>>(
  meta: Metadata,
  def: T,
): { [K in keyof T]?: string } => {
  if (!meta || typeof def !== 'object') return {};

  const result: { [K in keyof T]?: string } = {};

  for (const key in def) {
    if (!Object.prototype.hasOwnProperty.call(def, key)) continue;
    const metaKey = def[key];

    let value: string | undefined;

    if (typeof (meta as any).get === 'function') {
      const res = (meta as any).get(metaKey);
      if (Array.isArray(res) && res.length > 0) {
        value = String(res[0]);
      }
    }

    if (!value && typeof meta === 'object' && metaKey in meta) {
      value = String((meta as any)[metaKey]);
    }

    if (!value && typeof meta === 'object' && meta !== null && Object.keys(meta).length) {
      const keys = Object.keys(meta);
      const found = keys.find((k) => k.toLowerCase() === metaKey.toLowerCase());
      if (found) value = String((meta as any)[found]);
    }

    if (value) {
      result[key] = value;
    }
  }

  return result;
};
