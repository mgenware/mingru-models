# dd-models (WIP)

[![MEAN Module](https://img.shields.io/badge/MEAN%20Module-TypeScript-blue.svg?style=flat-square)](https://github.com/mgenware/MEAN-Module)
[![Build Status](https://img.shields.io/travis/mgenware/dd-models.svg?style=flat-square&label=Build+Status)](https://travis-ci.org/mgenware/dd-models)
[![npm version](https://img.shields.io/npm/v/dd-models.svg?style=flat-square)](https://npmjs.com/package/dd-models)
[![Node.js Version](http://img.shields.io/node/v/dd-models.svg?style=flat-square)](https://nodejs.org/en/)

Redefining database models using TypeScript.

**Note that dd-models only helps you define database models in a strong-typed way, it has nothing to do with how these models are going to be used, usually, you use other libraries to consume your models**, examples:

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

### Overview

Each table can create its own set of actions, and an action is created from a table action container, which can be obtained via `dd.actions`. Each action must be associated with a name, and actions are usually defined in a separate file with a suffix `TA` (table actions), for example, let's say you have a `user` table, you want to add two actions, you need to create a new file `userTA.ts` and import the user model:

```ts
// --- UserTA.ts ---
import * as dd from 'dd-models';
import user from './user';

// Create the table action container
const userTA = dd.actions(user);

// Add a SELECT action
// Select a user profile by ID
// 'UserProfile' is the action name
userTA.select('UserProfile', user.id, user.name).byID();

// Add an UPDATE action
// Update a row
// 'UserProfile' is the action name
userTA
  .updateOne('UserProfile')
  .setInputs(user.name, user.sig)
  .byID();

// Add a DELETE action
// Delete a row by ID
// 'ByID' is the action name
userTA.deleteOne('ByID').byID();

// Export the actions
export default userTA;
```

Note that action name will have function name included and you don't need to re-type it, in the example above, a `select` action with a name of `UserProfile` would become `SelectUserProfile`, an `updateOne` action with a name of `UserProfile` would become `UpdateUserProfile`, and a `deleteOne` action with a name of `ByID` would be `DeleteByID`.

### `SELECT` Actions

dd-models supports the following kinds of `SELECT` actions:

```ts
class TableActionCollection {
  // Selects a row
  select(name: string, ...columns: ColumnBase[]): SelectAction;

  // Selects all rows
  selectAll(name: string, ...columns: ColumnBase[]): SelectAction;

  // Selects a single field of a specific row
  selectField(name: string, column: ColumnBase): SelectAction;
}
```

The differences are implementation dependent, normally, they differ from return values:

* `select` returns an row object containing all selected columns
* `selectAll` returns an array of row objects each containing all selected columns
* `selectField` returns the single selected field


For example, in [mingru](https://github.com/mgenware/mingru), consider the following models and actions:

```ts
// ----------- user table model (user.ts) -----------
import * as dd from 'dd-models';

class User extends dd.Table {
  id = dd.pk();
  name = dd.varChar(100);
  sig = dd.text().nullable;
}

export default dd.table(User);

// ----------- user table actions (userTA.ts) -----------
const userTA = dd.actions(user);
// Select a user profile by ID
userTA.select('UserProfile', user.id, user.name, user.sig).byID();
// Select all user profiles
userTA.selectAll('AllUserProfiles', user.id, user.name, user.sig);
// Select the sig field by ID
userTA.selectField('Sig', user.sig).byID();

export default userTA;
```

It would generate the following Go code (only function headers shown for simplicity):

```go
// SelectUserProfile ...
func (da *TableTypeUser) SelectUserProfile(queryable sqlx.Queryable, userID uint64) (*SelectUserProfileResult, error)
// SelectAllUserProfiles ...
func (da *TableTypeUser) SelectAllUserProfiles(queryable sqlx.Queryable) ([]*SelectAllUserProfilesResult, error)
// SelectSig ...
func (da *TableTypeUser) SelectSig(queryable sqlx.Queryable, userID uint64) (*string, error)
```

## `WHERE` and Raw SQL Expressions

We haven't used any `WHERE` clause in the `SELECT` actions above, to add a `WHERE` clause, we have to construct a raw SQL expression using `dd.sql`, which uses TypeScript/JavaScript template string and enables us to write arbitrary SQL expressions.

You can pass a column object to template string, it will be converted to a column name in SQL, for example:

```ts
userTA
    .select('UserProfile', user.id, user.name, user.sig)
    .where(dd.sql`${user.id} = 1`);
```

[mingru](https://github.com/mgenware/mingru) translates this into:

```sql
SELECT `id`, `name`, `sig` FROM `user` WHERE `id` = 1
```

More complex queries:

```ts
userTA
    .select('UserProfile', user.id, user.name, user.sig)
    .where(dd.sql`${user.id} = 1 AND ${user.sig} <> 'haha'`);
```

[mingru](https://github.com/mgenware/mingru) translates it to:

```sql
SELECT `id`, `name`, `sig` FROM `user` WHERE `id` = 1 AND `sig` <> 'haha'
```

### Adding Input Parameters

Your actions often require user input parameters, e.g. to select a single profile from user table, we need a `userID` which can uniquely identify an user record. Use `dd.input`:

```ts
userTA
    .select('UserProfile', user.id, user.name, user.sig)
    .where(dd.sql`${user.id} = ${dd.input(user.id)}`);
```

[mingru](https://github.com/mgenware/mingru) translates to the following Go code:

```go
// SelectUserProfile ...
func (da *TableTypeUser) SelectUserProfile(queryable sqlx.Queryable, userID uint64) (*SelectUserProfileResult, error) {
	result := &SelectUserProfileResult{}
	err := queryable.QueryRow("SELECT `id`, `name`, `sig` FROM `user` WHERE `id` = ?", userID).Scan(&result.UserID, &result.UserName, &result.UserSig)
	if err != nil {
		return nil, err
	}
	return result, nil
}
```

The `userID` is in function arguments and passed to SQL query function.


### `UPDATE` Actions

dd-models supports the following kinds of `UPDATE` actions:

```ts
class TableActionCollection {
  // Update a row and checks rows affected to make sure one row must be updated
  // Implementations should throw an error if used without a WHERE clause
  updateOne(name: string): UpdateAction;

  // Update rows
  updateAll(name: string): UpdateAction;

  // (Not recommended, prefer `updateOne`) Update a row
  // Implementations should throw an error if used without a WHERE clause
  update(name: string): UpdateAction;
}
```

To set individual column values, use `UpdateAction.set(column, sql)`, e.g. set an `user.sig` to a random string:

```ts
userTA
  .updateOne('UserSig')
  .set(user.sig, dd.sql`'My signature'`)
  .byID();
```

Or, use user input as column value:

```ts
userTA
  .updateOne('UserSig')
  .set(user.sig, user.sig.toInputSQL())
  .byID();
```

Note that we are using `Column.toInputSQL` instead of `Column.toInput` in the example above, it's because the value of a column (the 2nd argument of `UpdateAction.set`) is an SQL object, `Column.toInput` returns an SQLInput object, while `Column.toInputSQL` will wrap the SQLInput object into an SQL object, so the following two lines are equivalent:

```ts
dd.sql`${user.name.toInput()}`;
user.name.toInputSQL();
```

To set multiple columns, just call `set` one by one:

```ts
userTA
  .updateOne('UserSig')
  .set(user.sig, user.sig.toInputSQL())
  .set(user.name, dd.sql`'Random name'`)
  .byID();
```

#### `setInputs`

Most of the time, you will be using `UPDATE` action with user inputs, so you probably always end up with this:

```ts
userTA
  .updateOne('ManyColumns')
  .set(user.sig, user.sig.toInputSQL())
  .set(user.name, user.name.toInputSQL())
  .set(user.age, user.age.toInputSQL())
  .set(user.gender, user.gender.toInputSQL())
  .byID();
```

To simplify this kind of code, `UpdateAction` also has method called `setInputs`, you can pass an array of columns, all of which are considered inputs, so the above code could be rewritten as:

```ts
userTA
  .updateOne('ManyColumns')
  .setInputs(user.sig, user.name, user.age, user.gender)
  .byID();
```

You can also mix this with the `set` method mentioned above:

```ts
userTA
  .updateOne('ManyColumns')
  .set(user.type, dd.sql`1`)
  .set(user.age, dd.sql`1`) 
  .setInputs(user.sig, user.name, user.age, user.gender)
  .set(user.age, dd.sql`18`)
  .byID();
```

Notice `user.age` has been set for three times in the code above, the latter always takes precedence, so `user.age` would be set a `18`.


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
