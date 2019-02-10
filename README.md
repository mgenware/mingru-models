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

Each column creation helper may have its own way of setting a default value:

```ts
// `dd.int` accepts an optional number as default value
age = dd.int(18); // `age` defaults to 18

// `dd.varChar` accepts an optional string as default value
name = dd.varChar(100, 'Liu'); // `name` defaults to "Liu"

// `dd.datetime` `dd.date`, and `dd.time` accept an optional boolean indicating if defaults to current date/time
datetime_updated = dd.datetime(true);
date_updated dd.date(true);
time_updated = dd.time(true);
```

Note that to fully customized a default value, you can call `Column.setDefault`, you can pass an SQL expression (covered in [Raw SQL Expressions](#where-and-raw-sql-expressions) below):

```ts
// Set it to an custom SQL expression once inserted
age = dd.int(18).setDefault(dd.sql`FLOOR(RAND() * 401) + 100`)

// These two lines are equivalent
datetime_updated = dd.datetime(true);
datetime_updated = dd.datetime().setDefault(dd.sql`${dd.datetimeNow()}`);
```

Here is a full list of column creation helper methods:

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
function text(defaultValue?: string): Column;
function bool(defaultValue?: boolean): Column;
function datetime(): Column;
function date(): Column;
function time(): Column;
```

NOTE: Starting with dd-models 0.5.0, all column helper methods are **`NOT NULL`** by default, to create nullable (`NULL`) column, use the extra `nullable` property, e.g.:

```ts
name = dd.varChar(100);     // `name` is NOT NULL
sig = dd.text().nullable;   // `sig` is NULL
```

#### Column Name
By default, property name reflects the column name, if you need a different name from property name, can use `Column.setDBName`:

```ts
// Column name defaults to property name: "cmt_count"
cmt_count = dd.varChar(100);

// Column name is now "cmt_c"
cmt_count = dd.varChar(100).setDBName('cmt_c');
```

#### Column Objects

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
// Action name is 'SelectProfile'
userTA.select('Profile', user.id, user.name).byID();

// Add an UPDATE action
// Update a row
// Action name is 'UpdateProfile'
userTA
  .updateOne('UserProfile')
  .setInputs(user.name, user.sig)
  .byID();

// Add a DELETE action
// Delete a row by ID
// Action name is 'DeleteByID'
userTA.deleteOne('ByID').byID();

// Export the actions
export default userTA;
```

Note that action name will have action type included and you don't need to re-type it in the `name` argument, like the example above, a `select` action with a name of `Profile` would have a action name as `SelectProfile`, similarly, a `delete` action with a name of `ByID` would set the action name to `DeleteByID` automatically.

### `SELECT` Actions Basics

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

### `WHERE` and Raw SQL Expressions

We haven't used any `WHERE` clause in the `SELECT` actions above, to add a `WHERE` clause, we have to construct a raw SQL expression using `dd.sql`, which uses TypeScript/JavaScript template string and enables us to write arbitrary SQL expressions.

You can pass a column object to template string, it will be converted to a column name in SQL, for example:

```ts
userTA.select('UserProfile', user.id, user.name, user.sig)
  .where(dd.sql`${user.id} = 1`);
```

[mingru](https://github.com/mgenware/mingru) translates this into:

```sql
SELECT `id`, `name`, `sig` FROM `user` WHERE `id` = 1
```

More complex queries:

```ts
userTA.select('UserProfile', user.id, user.name, user.sig)
  .where(dd.sql`${user.id} = 1 AND ${user.sig} <> 'haha'`);
```

[mingru](https://github.com/mgenware/mingru) translates it to:

```sql
SELECT `id`, `name`, `sig` FROM `user` WHERE `id` = 1 AND `sig` <> 'haha'
```

#### Input Parameters

Your actions often require user input parameters, e.g. to select a single profile from user table, we need a `userID` which can uniquely identify an user record. Use `dd.input`:

```ts
userTA.select('UserProfile', user.id, user.name, user.sig)
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

	return result, nil
}
```

The `userID` is included in function arguments and passed to SQL query function. If you don't like to automatically inferred name, can use the second optional `name` parameter:

```ts
userTA.select('UserProfile', user.id, user.name, user.sig)
  .where(dd.sql`${user.id} = ${dd.input(user.id, 'uid')}`);
```

This way `uid` instead of inferred `userID` would be used in generated code.

#### SQL Expression Helpers

Writing `dd.input`s in `dd.sql` can be tedious, dd-models comes with some handy helpers to quick construct some commonly used expressions.

##### `Column.toInput(column, optionalName): SQLInput`

Shortcut to `dd.input(column, optionalName)`:

```ts
userTA.select('UserProfile', user.id, user.name, user.sig)
  .where(dd.sql`${user.id} = ${user.id.toInput()}`);
```

##### `Column.isEqualTo(sql): SQL`

```ts
userTA.select('Admin', user.id, user.name, user.sig)
  .where(user.name.isEqualTo(dd.sql`"Admin"`));
```

Is equivalent to:

```ts
userTA.select('Admin', user.id, user.name, user.sig)
  .where(dd.sql`${user.name} = "Admin"`);
```

##### `Column.isEqualToInput(optionalName): SQL`

```ts
userTA.select('Admin', user.id, user.name, user.sig)
  .where(user.name.isEqualToInput());
```

Is equivalent to:

```ts
userTA.select('Admin', user.id, user.name, user.sig)
  .where(dd.sql`${user.name} = ${dd.input(user.name)}`);
```

##### `Column.isNotEqualTo` and `Column.isNotEqualToInput`

Similar to `isEqualTo` and `isEqualToInput`, uses `<>`(not equal to operator) instead.

##### `.ByID()`

```ts
userTA.select('UserProfile', user.id, user.name, user.sig).byID();
```

Is equivalent to 2 expressions listed below:

```ts
// 1
userTA.select('UserProfile', user.id, user.name, user.sig)
  .where(`${user.id} = ${user.id.toInput()}`);
// 2
userTA.select('UserProfile', user.id, user.name, user.sig)
  .where(user.id.isEqualTo(user.id.toInput()));
// 3
userTA.select('UserProfile', user.id, user.name, user.sig)
  .where(user.id.isEqualToInput());
```

#### Predefined System Calls
As raw SQL expressions enable you to write any SQL, you may do this for a `DATETIME` column to set it to current time when inserted:

```ts
userTA.update('LastLogin')
  .set(user.lastLogin, dd.sql`NOW()`)
```

While these system calls are commonly used, dd-models supports them as predefined system calls listed below:

```ts
enum SQLCallType {
  datetimeNow, // NOW() for DATETIME
  dateNow, // NOW() for DATE
  timeNow, // NOW() for TIME
  count, // COUNT()
  avg, // AVG()
  sum, // SUM()
  coalese, // COALESE()
}
```

All predefined system calls are under the root `dd` namespace:

```ts
// These three are equivalent
userTA.update('LastLogin')
  .set(user.lastLogin, dd.sql`NOW()`);

userTA.update('LastLogin')
  .set(user.lastLogin, dd.sql`${dd.datetimeNow()}`)

userTA.update('LastLogin')
  .set(user.lastLogin, dd.datetimeNow())
```

### More on `SELECT` Actions

#### `orderBy` and `orderByDesc`

```ts
userTA.select('t', user.name, user.age)
  .byID()
  .orderBy(user.name)
  .orderByDesc(user.age);
```

#### Alias via `as`
Can use `Column.as` to add the SQL `AS` alias to a selected column:
```ts
userTA.select('t', user.name, user.post_count.as('count'));
```

Generates the following SQL:

```sql
SELECT `name`, `post_count` AS `count` from user;
```

### `UPDATE` Actions

dd-models supports the following kinds of `UPDATE` actions:

```ts
class TableActionCollection {
  // Updates a row and checks rows affected to make sure only one row is updated
  // Implementations should throw an error if used without a WHERE clause
  updateOne(name: string): UpdateAction;

  // Updates rows
  updateAll(name: string): UpdateAction;

  // (Not recommended, prefer `updateOne`) Updates rows
  // Implementations should throw an error if used without a WHERE clause
  update(name: string): UpdateAction;
}
```

To set individual column values, use `UpdateAction.set(column, sql)`, e.g. set an `user.sig` to a random string:

```ts
userTA.updateOne('UserSig')
  .set(user.sig, dd.sql`'My signature'`)
  .byID();
```

Or, use user input as column value:

```ts
userTA.updateOne('UserSig')
  .set(user.sig, user.sig.toInput())
  .byID();
```

To set multiple columns, just call `set` one by one:

```ts
userTA
  .updateOne('UserSig')
  .set(user.sig, user.sig.toInput())
  .set(user.name, dd.sql`'Random name'`)
  .byID();
```

#### `setInputs`

Most of the time, you will be using `UPDATE` action with user inputs, so you probably always end up with this:

```ts
userTA
  .updateOne('ManyColumns')
  .set(user.sig, user.sig.toInput())
  .set(user.name, user.name.toInput())
  .set(user.age, user.age.toInput())
  .set(user.gender, user.gender.toInput())
  .byID();
```

To simplify this, `UpdateAction` also has a method called `setInputs`, you can pass an array of columns, all them will be considered inputs. The above code could be rewritten as using `setInputs`:

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

### `INSERT` actions

```ts
class TableActionCollection {
  // Inserts a new row, and returns inserted ID
  insertOne(name: string): InsertAction;
  // Inserts a new row
  insert(name: string): InsertAction;

  // Inserts a new row, and returns inserted ID. Use column default value for unset columns
  insertOneWithDefaults(name: string): InsertAction;
  // Inserts a new row. Use column default value for unset columns
  insertWithDefaults(name: string): InsertAction;
}
```

Example:

```ts
// Insert a new user
userTA
  .insertOne('User')
  .set(user.sig, dd.sql`''`)
  .set(user.name, user.name.toInput())
  .set(user.age, user.age.toInput());
```

`INSERT` action can also use `setInputs` like in `UPDATE` action:

```ts
// Insert a new user
userTA
  .insertOne('User')
  .set(user.sig, dd.sql`''`)
  .setInputs(user.name, user.age);
```

#### `insertOneWithDefaults` and `insertWithDefaults`

`insertOneWithDefaults` and `insertWithDefaults` suffix will auto use column's default value it has been set, example:

```ts
// Insert a new user
userTA
  .insertOneWithDefaults('User')
  .set(user.sig, dd.sql`''`)
  .setInputs(user.name);

// user.sig = ''
// user.name = <input>
// the remaining columns of user will have be set as their defaults
```

### `DELETE` actions
```ts
class TableActionCollection {
  // Deletes a row and checks rows affected to make sure only one row is updated
  // Implementations should throw an error if used without a WHERE clause
  deleteOne(name: string): DeleteAction;

  // Deletes rows
  deleteAll(name: string): DeleteAction;

  // (Not recommended, prefer `deleteOne`) Delete rows
  // Implementations should throw an error if used without a WHERE clause
  delete(name: string): DeleteAction {
    return this.addAction(new DeleteAction(name, this.table, false, false));
  }
}
```

Like `SELECT` and `UPDATE` actions, `DELETE` action should have a `WHERE` clause unless you need to delete all rows using `deleteAll`.

```ts
// Delete an user by ID
userTA.deleteOne('ByID').byID();

// Delete all users by a specified name
userTA.delete('ByName').where(user.name.isEqualToInput());

// Delete all users
userTA.deleteAll('All');
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
