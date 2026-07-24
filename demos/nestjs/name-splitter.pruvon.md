# Splitting Names (NestJS, Markdown)

Same spec as [name-splitter.pruvon.html](name-splitter.pruvon.html). Exercises
`NameSplitterService`, resolved through Nest's dependency injection
(`NestFactory.createApplicationContext`) — no HTTP call involved.

## First Name

```pruvon:firstName
| Full Name | First Name |
|---|---|
| Jane Smith | Jane |
| Ada Lovelace | Ada |
```

## Last Name

```pruvon:lastName
| Full Name | Last Name |
|---|---|
| Jane Smith | Smith |
| Ada Lovelace | Lovelace |
```
