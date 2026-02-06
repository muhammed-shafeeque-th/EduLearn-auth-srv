import { Metadata } from '@grpc/grpc-js';
import { Context, context, propagation } from '@opentelemetry/api';

export function parseMetadata<Response extends Record<string, any>>(
  metadata: Metadata,
  config: { [K in keyof Response]: { header: string; multi?: boolean } },
): { headers: Partial<Response>; extractedContext: Context } {
  const headers = {} as Response;

  for (const [responseKey, { header, multi }] of Object.entries(config)) {
    const key = responseKey as keyof Response;
    const values = metadata.get(header as string);
    try {
      if (!values || values.length == 0 || values[0] === 'undefined') continue;
      else if (multi) {
        headers[key] = values.map((val) => JSON.parse(val.toString())) as Response[keyof Response];
      } else {
        headers[key] = JSON.parse(values[0].toString());
      }
    } catch (error) {
      console.error(error);
      // throw error;
    }
  }
  const extractedContext = propagation.extract(context.active(), headers);

  return { headers, extractedContext };
}
