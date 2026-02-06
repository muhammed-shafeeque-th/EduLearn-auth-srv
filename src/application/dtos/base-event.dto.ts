import { BaseEvent } from '@/domain/events/types/base-event';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export default class BaseEventDto<T = any> implements BaseEvent<any> {
  @IsString()
  @IsNotEmpty({ message: 'eventId is required' })
  eventId!: string;

  @IsString()
  @IsNotEmpty({ message: 'eventType is required' })
  eventType!: string;

  @IsNumber()
  @IsNotEmpty({ message: 'timestamp is required' })
  timestamp!: number;

  payload: T;

  traceId?: string | undefined;
}

export type GenericEventDto<TPayload> = BaseEventDto<TPayload>;
