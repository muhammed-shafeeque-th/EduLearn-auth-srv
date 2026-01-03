import { ValidationError } from '@/shared/errors/validation.error';
import { plainToInstance } from 'class-transformer';
import { validate, ValidatorOptions, ValidationError as InvalidError } from 'class-validator';

// Overload signatures
async function validateDto<T extends object>(instance: T): Promise<void>;
async function validateDto<T extends object>(dtoClass: new () => T, payload: object): Promise<void>;

// Implementation
async function validateDto<T extends object>(
  dtoOrInstance: T | (new () => T),
  payload?: object,
): Promise<void> {
  let errors: InvalidError[];

  if (payload) {
    // Case: dto class + payload
    const instance = plainToInstance(dtoOrInstance as new () => T, payload);
    errors = await validate(instance, validatorOptions);
  } else {
    // Case: instance only
    errors = await validate(dtoOrInstance as T, validatorOptions);
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

// Common validator options (best practice: avoid duplication)
const validatorOptions: ValidatorOptions = {
  whitelist: true, // remove unknown fields
  forbidNonWhitelisted: false, // throw if unknown fields
  forbidUnknownValues: false,
};

export { validateDto };
