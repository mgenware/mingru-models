# dd-models (WIP)

[![MEAN Module](https://img.shields.io/badge/MEAN%20Module-TypeScript-blue.svg?style=flat-square)](https://github.com/mgenware/MEAN-Module)
[![Build Status](https://img.shields.io/travis/mgenware/dd-models.svg?style=flat-square&label=Build+Status)](https://travis-ci.org/mgenware/dd-models)
[![npm version](https://img.shields.io/npm/v/dd-models.svg?style=flat-square)](https://npmjs.com/package/dd-models)
[![Node.js Version](http://img.shields.io/node/v/dd-models.svg?style=flat-square)](https://nodejs.org/en/)

Redefining database models using TypeScript.

**Note that dd-models only helps you to define database models in a strong-typed way, it has nothing to do with how you gonna use these models, usually, you use other libraries to consume models defined by dd-models**, examples:

* [mingru](https://github.com/mgenware/mingru) converts dd-models to Go code

## Installation

```sh
yarn install dd-models
```

# Quick Start

## Defining Models

### Table Type and Table Object

You create a model with the following steps:

1. Create a class inheriting from `dd.Table`: this class is called a table type, and the `dd.Table` class is the base class required for representing a table in dd-models.
2. Add table columns as instance properties of the table type.
3. Export a table object created from table type via `dd.table`.

Here's an example user table with 2 columns, `id` and `name` (`user.ts`):

```ts
import * as dd from 'dd-models';

class User extends dd.Table {
  id = dd.pk();
  name = dd.varChar(100);
}

export default dd.table(User);
```

You may wonder why the two-step process, why not export the table type directly? well, there are several reasons:

* Exporting the class would require user to define columns as `static` properties.
* When calling `dd.table`, dd-models will look through all columns and do some validation as well as preprocessing work like setting up foreign keys, which is definitely suited for an object.

### Columns

#### Column Helper Methods

Columns are `dd.Column` objects, you can create a column using `new dd.Column()` but you seldom need to do this since dd-models comes with a set of helper methods to create commonly used column types.

For example:

```ts
id = dd.pk(); // `id` is a primary key, data type defaults to unsigned `BIGINT`
age = dd.int(); // `age` is `INT`
name = dd.varChar(100); // `name` is `VARCHAR(100)`
```

You can also set a default value for a column:

```ts
age = dd.int(18); // `age` defaults to 18
name = dd.varChar(100, 'Liu'); // `name` defaults to "Liu"
```

Below is a full list of helper methods:

```ts
function varChar(length: number, defaultValue?: string): Column;
function char(length: number, defaultValue?: string): Column;
function int(defaultValue?: number): Column;
function unsignedInt(defaultValue?: number): Column;
function bigInt(defaultValue?: number): Column;
function unsignedBigInt(defaultValue?: number): Column;
function smallInt(defaultValue?: number): Column;
function unsignedSmallInt(defaultValue?: number): Column;
function tinyInt(defaultValue?: number): Column;
function unsignedTinyInt(defaultValue?: number): Column;
function float(defaultValue?: number): Column;
function double(defaultValue?: number): Column;
function unique(col: Column): Column;
function pk(column?: Column): Column;
function setName(name: string, column: Column): Column;
function text(defaultValue?: string): Column;
function bool(defaultValue?: boolean): Column;
function datetime(): Column;
function date(): Column;
function time(): Column;
```

Starting with dd-models 0.5.0, all column helper methods are **`NOT NULL`** by default, to create nullable (`NULL`) column, use the extra `nullable` property, e.g.:

```ts
name = dd.varChar(100);     // `name` is NOT NULL
sig = dd.text().nullable;   // `sig` is NULL
```

#### Column Object

You can create column objects manually if column helper methods don't fit your needs, a column object consists of a bunch of properties describing different traits of a column.

```ts
class ColumnProps {
    pk: boolean;
    nullable: boolean;
    unsigned: boolean;
    unique: boolean;
    length: number;
    default: unknown;
}

class Column extends ColumnBase {
    types: Set<string>;
    props: ColumnProps;
}
```

### Joins

Joins can be created by simply assigning a foreign column to the target column, for example, let's say `post` table has a foreign key to `user` table at `user_id` column, here is what `user` looks like (`user.ts`):

```ts
import * as dd from 'dd-models';

class User extends dd.Table {
  id = dd.pk();
  name = dd.varChar(100);
}

export default dd.table(User);
```

To create a join to `user` table, inside `post` table (`post.ts`), you need to import `user` table, and set `user.id` to the `user_id` column:

```ts
import * as dd from 'dd-models';
import user from './user';

class Post extends dd.Table {
  id = dd.pk();
  user_id = user.id; // `post.user_id` now references `user.id`
}

export default dd.table(Post);
```

## Actions

Each table can create its own set of actions, dd-models now supports the following types of actions:

* `select`: selects a row
* `selectAll`: selects all rows
* `selectField`: selects a single field from a row
* `update`: updates rows
* `updateOne`: ensures only one row gets updated
* `insert`: inserts a row
* `insertOne`: ensures only one row gets inserted
* `delete`: deletes rows
* `deleteOne`: ensures only one row gets deleted

Actions are created from a table action container, which can be obtained via `dd.actions`. Each action must be associated with a name, and actions are usually defined in a separate file with a suffix `TA` (table actions), for example, let's say you have a `user` table, you want to add two actions, you need to create a new file `userTA.ts` and import the user model:

```ts
import * as dd from 'dd-models';
import user from './user';

// Create the table action container
const userTA = dd.actions(user);

// Add a SELECT action
// Select a user profile by ID
// 'UserProfile' is the action name
userTA.select('UserProfile', user.id, user.name).byID();

// Add a UPDATE action
// Update a row
// 'UserProfile' is the action name
userTA
  .update('UserProfile')
  .setInputs(user.name, user.sig)
  .byID();

// Add a DELETE action
// Delete a row by ID
// 'ByID' is the action name
userTA.deleteOne('ByID').byID();

// Export the actions
export default userTA;
```

Note that action name will have function name included and you don't need to type it, in the example above, a `select` with a name `UserProfile` would become `SelectUserProfile`, an `update` with a name `UserProfile` would become `UpdateUserProfile`, and a `deleteOne` with a name `ByID` would be `DeleteByID`.

Belows are dd-model supported action methods:

```ts
select(name: string, ...columns: ColumnBase[]): SelectAction;
selectAll(name: string, ...columns: ColumnBase[]): SelectAction;
selectField(name: string, column: ColumnBase): SelectAction;
update(name: string): UpdateAction;
updateOne(name: string): UpdateAction;
insert(name: string): InsertAction;
insertOne(name: string): InsertAction;
delete(name: string): DeleteAction;
deleteOne(name: string): DeleteAction;
```

## Advanced Topics

### JoinedColumn

Imagine the following join:

```ts
post.user_id.join(user).name;
```

It returns a `JoinedColumn`, which contains:

```ts
class JoinedColumn extends ColumnBase {
    joinPath: string;
    localColumn: ColumnBase;
    remoteColumn: ColumnBase;
    selectedColumn: ColumnBase;
}
```

An anatomy of a `JoinedColumn`:

```
post.user_id.join(user).name;
----------------------------- JoinedColumn
        |
        -- Local column
                          |
                          -- Target column

Remote column: auto detected if local column is a foreign column.
```

Multiple joins are also allowed:

```
cmt.post_id.join(post).user_id.join(user).name
|                          |
----------------------------
                          JC
                           | Local column        |
                           -----------------------
                                                JC
```

* First joined column:
  * Local column: `cmt.post_id`
  * Remote column: `post.id`
  * Selected column: `post.user_id`
* Second joined column:
  * Local column: first joined column
  * Remote column: `user.id`
  * Selected column: `user.name`

### Reuse a Joined Table

Suppose we need to select post author's name and URL from a comment of the post. We can do:

```ts
const cols = [
  comment.post_id.join(post).user_id.join(user).name,
  comment.post_id.join(post).user_id.join(user).url,
];
```

This contains too much duplicate code, we can reuse the joined intermediate table like this:

```ts
const joinedUser = comment.post_id.join(post).user_id.join(user);
const cols = [
  joinedUser.name,
  joinedUser.url,
];
```

---------
Working in progress...
