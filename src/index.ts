type Pair<K, V> = K extends string ? { [Key in K]: V } : never;
type Flatten<T> = T extends infer U ? { [Key in keyof U]: U[Key] } : never;
type Dict<T = unknown> = Record<string, T>;
type Merge<K, V, State> = K extends string
  ? Omit<State, K> & Pair<K, V>
  : never;
type GetProperType<K, Schema, ForcedType> = K extends keyof ForcedType
  ? ForcedType[K]
  : K extends keyof Schema
  ? Schema[K]
  : never;
type BuilderFuncName<K> = K extends string ? `$${K}` : never;
type Builder<Schema, ForcedType = {}, State = {}> = {
  [K in keyof Schema as BuilderFuncName<K>]: <
    const V extends GetProperType<K, Schema, ForcedType>
  >(
    value: V
  ) => Builder<Schema, ForcedType, Merge<K, V, State>>;
} & {
  transform: <NewForcedType extends Partial<Schema>>() => Builder<
    Schema,
    NewForcedType,
    State
  >;
  build: () => Flatten<State>;
};

export interface Schemas {}

type SchemaNames = keyof Schemas;
type SchemaType<Name> = Name extends SchemaNames ? Schemas[Name] : never;
type SchemaKeys<Name> = Name extends SchemaNames
  ? (keyof Schemas[Name])[]
  : never;

type Constructor<T = unknown> = new (state?: Dict) => T;

class Base {
  readonly state: Dict;

  constructor(state?: Dict) {
    this.state = state ?? {};
  }

  transform() {
    return this;
  }

  build() {
    return this.state;
  }
}

const cache: Dict<Constructor> = {};

export const register = <
  Name extends SchemaNames,
  const Keys extends SchemaKeys<Name>
>(
  schemaName: Name,
  schemaKeys: Keys
) => {
  if (schemaName in cache) {
    throw new Error(`Schema "${schemaName}" already registered.`);
  }

  const Instance = class extends Base {};

  for (const schemaKey of schemaKeys) {
    Object.defineProperty(Instance.prototype, "$" + String(schemaKey), {
      value: function (this: Base, value: unknown) {
        return new Instance({
          ...this.state,
          [schemaKey]: value,
        });
      },
    });
  }

  cache[schemaName] = Instance;
};

export const get = <Name extends SchemaNames>(
  schemaName: Name
): Builder<SchemaType<Name>> => {
  const Instance = cache[schemaName];
  if (!Instance) {
    throw new Error(`Schema "${schemaName}" not registered.`);
  }

  return new Instance() as any;
};
