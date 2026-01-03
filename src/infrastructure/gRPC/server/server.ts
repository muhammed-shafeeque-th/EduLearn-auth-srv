import { LoggingService } from '@/infrastructure/observability/logging/logging.service';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

interface GrpcServerConfig {
  protoPath: string;
  packageName: string;
  serviceName: string;
  interceptors?: grpc.Interceptor[];
  middlewares?: Array<
    (
      call: grpc.ServerUnaryCall<any, any>,
      callback: grpc.sendUnaryData<any>,
      next: () => void,
    ) => void
  >;
  port: number;
  host?: string;
  keepAliveTimeoutMs?: number;
  maxReceiveMessageLength?: number;
  maxSendMessageLength?: number;
}

export class GrpcServer<T extends grpc.UntypedServiceImplementation> {
  private server: grpc.Server;
  private proto: any;
  private config: GrpcServerConfig;
  private logger = LoggingService.getInstance();

  public constructor(config: GrpcServerConfig, controllers: T) {
    this.config = {
      host: '0.0.0.0',
      keepAliveTimeoutMs: 10000,
      maxReceiveMessageLength: 1024 * 1024 * 10,
      maxSendMessageLength: 1024 * 1024 * 10,
      ...config,
    };

    this.server = new grpc.Server({
      'grpc.keepalive_time_ms': 20000,
      'grpc.keepalive_timeout_ms': this.config.keepAliveTimeoutMs,
      'grpc.max_receive_message_length': this.config.maxReceiveMessageLength,
      'grpc.max_send_message_length': this.config.maxSendMessageLength,
      'grpc.default_compression_algorithm': grpc.compressionAlgorithms.gzip,
    });

    this.loadProto();
    this.registerService(controllers);
  }

  private loadProto(): void {
    const packageDefinition = protoLoader.loadSync(this.config.protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
    this.proto = protoDescriptor[this.config.packageName];
  }

  private registerService(controllers: T): void {
    const serviceDefinition = this.proto[this.config.serviceName].service;

    // Wrap middlewares around the service methods
    // const wrappedControllers = this.wrapMiddlewares(controllers);

    this.server.addService(serviceDefinition, controllers);
  }

  // private wrapMiddlewares(controllers: T): T {
  //   const wrappedControllers: any = {};
  //   for (const methodName of Object.keys(controllers)) {
  //     const originalMethod = controllers[methodName] as GrpcUnaryHandler<any, any>;
  //     wrappedControllers[methodName] = (
  //       call: grpc.ServerUnaryCall<any, any>,
  //       callback: grpc.sendUnaryData<any>,
  //     ) => {
  //       let middlewareIdx = -1;

  //       const nextMiddleware = () => {
  //         middlewareIdx++;
  //         if (this.config.middlewares && middlewareIdx < this.config.middlewares.length) {
  //           this.config.middlewares[middlewareIdx](call, callback, nextMiddleware);
  //         } else {
  //           let interceptorIdx = -1;

  //           const nextInterceptor = () => {
  //             interceptorIdx++;
  //             if (this.config.interceptors && interceptorIdx < this.config.interceptors.length) {
  //               const interceptor = this.config.interceptors[interceptorIdx];
  //               interceptor(
  //                 {
  //                   method_definition: {
  //                     path: methodName,
  //                     requestStream: false,
  //                     responseStream: false,
  //                     requestSerialize: (value: any) => Buffer.from(JSON.stringify(value)),
  //                     responseDeserialize: (value: Buffer) => JSON.parse(value.toString()),
  //                   },
  //                 },
  //                 () => {
  //                   nextInterceptor();
  //                   return {
  //                     start: (metadata, listener, next) => next(metadata, listener),
  //                     sendMessage: (message, next) => next(message),
  //                     halfClose: (next) => next(),
  //                     cancel: (next) => next(),
  //                     cancelWithStatus: (status, message) => {}, // Implement as needed
  //                     getPeer: () => '', // Implement as needed
  //                     sendMessageWithContext: (context, message) => {}, // Implement as needed
  //                     startRead: () => {}, // Implement as needed
  //                   };
  //                 },
  //               );
  //             } else {
  //               originalMethod.call(controllers, call, callback);
  //             }
  //           };
  //           nextInterceptor();
  //         }
  //       };
  //       nextMiddleware();
  //     };
  //   }
  //   return wrappedControllers;
  // }

  public start(): void {
    const address = `${this.config.host}:${this.config.port}`;
    this.server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (err: Error | null) => {
      if (err) {
        this.logger.error(`Failed to bind gRPC server on ${address} `, { err });
        process.exit(1);
      }
      this.logger.info('rRPC server started on ' + address);
    });

    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  public async shutdown(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.tryShutdown((err) => {
        if (err) {
          this.logger.error('Failed to shutdown rRPC server ', { err });
          reject(err);
        } else {
          this.logger.info(`gRPC server shutdown successfully`);
          resolve();
        }
      });
    });
  }
}
