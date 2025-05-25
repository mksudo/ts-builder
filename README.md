## Typescript Builder

A type safe builder for typescript projects

## Examples

1. Use declaration merging to declare builder schema

```ts
declare module "@mksudo/builder" {
  interface Schemas {
    expr: {
      key: string;
      operator: "=" | ">" | ">=" | "<" | "<=";
      value: string | number | boolean;
    };
  }
}
```

2. Register the builder, this will dynamically create a new class corresponding to the supplied schema key, and each method will be created with a `$` prefix (in order to hack the code suggestion order)

```ts
register("expr", ["key", "operator", "value"]);
```

3. Use the builder

- Builder instance can be retrieved using the `get` method, each builder from the method will be a new instance of the builder class.

```ts
const builder = get("expr");

// {key: "age", operator: "=", value: 18}
const expr = builder.$key("age").$operator("=").$value(18).build();
```

- Builder can be reused, and the values will be copied when the next builder method is called

```ts
const person = builder.$key("name").$operator("=");
// {key: "name", operator: "=", value: "peter"}
const person1 = person.$value("peter").build();
// {key: "name", operator: "=", value: "james"}
const person2 = person.$value("james").build();
```

- Type of each builder method can be overwritten using the `transform` method, which does nothing except refreshing the type of the builder

```ts
const restrictedBuilder = builder.transform<{ key: "population" }>();

// {key: "population", operator: ">", value: 1000}
const people = restrictedBuilder
  .$key("population")
  .$operator(">")
  .$value(1000)
  .build();
// invalid type: "age" is not assignable to parameter of type "population"
const invalid = restrictedBuilder.$key("age");
```
