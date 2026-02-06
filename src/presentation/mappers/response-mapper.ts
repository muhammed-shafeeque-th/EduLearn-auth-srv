type TransformFn<T, R> = (value: T) => R;

interface MappingConfig<Entity, Response> {
  fields: Partial<Record<keyof Response, keyof Entity | TransformFn<any, any>>>;
  nested?: Partial<Record<keyof Response, ResponseMapper<any, any>>>;
}

export class ResponseMapper<Entity, Response> {
  private config: MappingConfig<Entity, Response>;

  public constructor(config: MappingConfig<Entity, Response>) {
    this.config = config;
  }

  public toResponse(entity: Entity): Response {
    const response = {} as Response;

    // Map fields based on configuration
    for (const [responseKey, entityKeyOrTransform] of Object.entries(this.config.fields)) {
      const key = responseKey as keyof Response;
      if (typeof entityKeyOrTransform === 'function') {
        // Handle transformations
        response[key] = entityKeyOrTransform(entity);
      } else {
        // Direct mapping
        let value = entity[entityKeyOrTransform as keyof Entity];
        if (value === undefined || value === null) {
          if (typeof entityKeyOrTransform === 'string') {
            const getterMethod = `get${entityKeyOrTransform[0].toUpperCase() + entityKeyOrTransform.slice(1)}`;
            value = (entity as any)[getterMethod]?.();
          }
        }
        if (value !== undefined && value !== null) {
          response[key] = value as any;
        }
      }
    }

    // Handle nested objects
    if (this.config.nested) {
      for (const [nestedKey, nestedMapper] of Object.entries(this.config.nested)) {
        const key = nestedKey as keyof Response;
        const nestedEntity = entity[nestedKey as keyof Entity];
        if (nestedEntity) {
          response[key] = (nestedMapper as ResponseMapper<any, any>).toResponse(
            nestedEntity as any,
          ) as any;
        }
      }
    }

    return response;
  }

  public toResponseList(entities: Entity[]): Response[] {
    return entities.map((entity) => this.toResponse(entity));
  }
}
