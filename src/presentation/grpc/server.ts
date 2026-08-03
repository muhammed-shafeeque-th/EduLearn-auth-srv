import { TYPES } from '@/shared/constants/identifiers';
import { AuthServiceServer } from '../../infrastructure/gRPC/generated/auth_service';
import { GrpcServer } from '@/infrastructure/gRPC/server/server';
import { ILoggerService } from '@/application/adaptors/logger.service';
import { inject, injectable } from 'inversify';
import { getEnvs, getProtoPath } from '@edulearn/core';
import GrpcAuthController from './grpc.controller';

const { GRPC_PORT } = getEnvs({ GRPC_PORT: 5001 });

@injectable()
export class GrpcAppServer {
  private server: GrpcServer<AuthServiceServer>;

  public constructor(
    @inject(TYPES.LoggerService) private readonly _logger: ILoggerService,
    @inject(TYPES.IGrpcAppController) private readonly _controllers: GrpcAuthController,
  ) {}

  public initialize(): void {
    try {
      this._logger.info(`gRPC server starting...`);
      this.server = new GrpcServer<AuthServiceServer>(
        {
          protoPath: getProtoPath('auth', 'auth_service.proto'),
          packageName: 'auth_service',
          serviceName: 'AuthService',
          port: Number(GRPC_PORT),
        },
        this._controllers as unknown as AuthServiceServer,
      );

      this.server.start();
      this._logger.info(`gRPC AuthService server started at port ${GRPC_PORT}`);
    } catch (error) {
      this._logger.error('Error while starting gRPC server ', { error });
      throw error;
    }
  }

  public shutdown() {
    this.server.shutdown();
  }
}
