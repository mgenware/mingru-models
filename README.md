# dd-models (WIP)

[![MEAN Module](https://img.shields.io/badge/MEAN%20Module-TypeScript-blue.svg?style=flat-square)](https://github.com/mgenware/MEAN-Module)
[![Build Status](https://img.shields.io/travis/mgenware/dd-models.svg?style=flat-square&label=Build+Status)](https://travis-ci.org/mgenware/dd-models)
[![npm version](https://img.shields.io/npm/v/dd-models.svg?style=flat-square)](https://npmjs.com/package/dd-models)
[![Node.js Version](http://img.shields.io/node/v/dd-models.svg?style=flat-square)](https://nodejs.org/en/)

Redefining database models using TypeScript.

**All APIs are subject to change before 1.0.0**

**Note that dd-models only helps you define database models in a strong-typed way, it has nothing to do with how these models are going to be used, usually, you use other libraries to consume your models**, examples:

- [mingru](https://github.com/mgenware/mingru) converts dd-models to Go code

## Installation

```sh
yarn install dd-models
```

# Quick Start

## Defining Models

### Tables

To create a table:

1. Create a class inheriting from `dd.Table`.
2. Add table columns as instance properties.
3. Export a table object via `dd.table`.

For example, a table named `User` with 2 columns, `id` and `name`:

```ts
import * as dd from 'dd-models';

class User extends dd.Table {
  id = dd.pk();
  name = dd.varChar(100);
}

export default dd.table(User);
```

You may wonder why a two-step process, why not export the table type directly? well, there are several reasons:

- Exporting the class would require user to define columns as `static` properties.
- When calling `dd.table`, dd-models will look through all columns and do some validation as well as preprocessing work like setting up foreign keys, which is definitely suited for an object.

#### Table Name

By default, class name is used as table name, and dd-models automatially converts it to snake_case in SQL, for example, `class MyTable` would be `my_table`. Use the second parameter of `dd.table` to customize the name used in SQL.

```ts
class User extends dd.MyTable {}

export default dd.table(MyTable); // Table name is "my_table" in SQL
export default dd.table(MyTable, 'haha'); // Table name is "haha" in SQL
```

### Columns

#### Column Helper Methods

Columns are nothing but `dd.Column` objects, but we actually seldom need to manually create columns by `new dd.Column(...)`. Instead, we use column helper methods to create commonly used columns.

For example:

```ts
// `id` is a primary key, data type defaults to unsigned `BIGINT`
id = dd.pk();

// `age` is `INT`
age = dd.int();

// `name` is `VARCHAR(100)`
name = dd.varChar(100);

// Set primary key underlying data type to `INT`
id = dd.pk(dd.int());
```

In the code above, `dd.pk`, `dd.int` and `dd.varChar` are all column helper methods. You can also set a default value in most of the column helper methods:

```ts
// `dd.int` accepts an optional number as default value
age = dd.int(18); // `age` defaults to 18

// `dd.varChar` accepts an optional string as default value, the first param `100` indicates the `VARCHAR` length
name = dd.varChar(100, 'Liu'); // `name` defaults to "Liu"

// `dd.datetime` `dd.date`, and `dd.time` accept an optional boolean indicating if defaults to current date/time
datetime_updated = dd.datetime(true);
date_updated dd.date(true);
time_updated = dd.time(true);
```

Sometimes, we need to fully customize a default value, e.g. an SQL expression, then we can call `Column.setDefault` and pass an SQL expression (will be covered in [Raw SQL Expressions](#where-and-raw-sql-expressions) below):

```ts
// Set it to an custom SQL expression once inserted
age = dd.int(18).setDefault(dd.sql`FLOOR(RAND() * 401) + 100`);

// These two lines are equivalent
datetime_updated = dd.datetime(true);
datetime_updated = dd.datetime().setDefault(dd.sql`${dd.datetimeNow()}`);
```

Here is a full list of column creation helper methods:

```ts
// Primary key
function pk(column?: Column): Column;
// Foreign key
function fk(column: Column): Column;
// VARCHAR column
function varChar(length: number, defaultValue?: string): Column;
// CHAR column
function char(length: number, defaultValue?: string): Column;
// INT column
function int(defaultValue?: number): Column;
// unsigned INT column
function uInt(defaultValue?: number): Column;
// BIGINT column
function bigInt(defaultValue?: number): Column;
// unsigned BIGINT column
function uBigInt(defaultValue?: number): Column;
// SMALLINT column
function smallInt(defaultValue?: number): Column;
// unsigned SMALLINT column
function uSmallInt(defaultValue?: number): Column;
// TINYINT column
function tinyInt(defaultValue?: number): Column;
// unsigned TINYINT column
function uTinyInt(defaultValue?: number): Column;
// FLOAT column
function float(defaultValue?: number): Column;
// DOUBLE column
function double(defaultValue?: number): Column;
// Adds UNIQUE constraint to a column
function unique(col: Column): Column;
// TEXT column
function text(defaultValue?: string): Column;
// BOOL column
function bool(defaultValue?: boolean): Column;
// DATETIME column
function datetime(defaultsToNow?: boolean): Column;
// DATE column
function date(defaultsToNow?: boolean): Column;
// TIME column
function time(defaultsToNow?: boolean): Column;
```

NOTE: columns created by column helper methods are **`NOT NULL`** by default, to create nullable (`NULL`) column, use the extra `nullable` property:

```ts
name = dd.varChar(100); // `name` is NOT NULL
sig = dd.text().nullable; // `sig` is NULL
```

#### Column Name

By default, property name reflects the column name, if you need a different name from property name, use `Column.setDBName` method:

```ts
// Column name defaults to property name: "cmt_count"
cmt_count = dd.varChar(100);

// Column name is now "cmt_c"
cmt_count = dd.varChar(100).setDBName('cmt_c');
```

#### Column Objects

You can create column objects manually if column helper methods don't fit your needs, a column object consists of a bunch of properties describing different traits of a column.

```ts
class ColumnType {
  types: string[];
  pk: boolean;
  nullable: boolean;
  unsigned: boolean;
  unique: boolean;
  length: number;
  constructor(types: string | string[]);
}

class Column extends ColumnBase {
  type: ColumnType;
}
```

<TODO: Add example code>

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

Similar to defining a table, to define table actions, we need declare a class inheriting from `dd.TA` (**TA** stands for **t**able **a**ctions), and define actions as properties, finally export a single table actions object via `dd.ta`.

```ts
// Import the underlying table object
import user from './user';

// --- userTA.ts ---
export class UserTA extends dd.TA {
  // Selects all users
  selectAllUsers = dd.selectRows(user.id, user.name);
  // Selects a single user by ID
  selectUser = dd.select(user.id, user.name).byID();
  // Updates an user by ID
  updateUser = dd
    .updateOne()
    .setInputs(user.name, user.sig)
    .byID();
  // Delete an user by ID
  deleteUser = dd.deleteOne().byID();
}
// Export a table actions object
export default dd.ta(user, UserTA);
```

### `SELECT` Actions Basics

dd-models supports the following kinds of `SELECT` actions:

```ts
// Selects a row.
function select(...columns: ColumnBase[]): SelectAction;

// Selects rows.
function selectRows(...columns: ColumnBase[]): SelectAction;

// Selects a single field of a specific row.
function selectField(column: ColumnBase): SelectAction;
```

They differ from return values:

- `select` returns an row object containing all selected columns
- `selectRows` returns an array of row objects each containing all selected columns
- `selectField` returns the single selected field

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
import user from './user';

export class UserTA extends dd.TA {
  // Select a user profile by ID.
  selectUserProfile = dd.select(user.id, user.name, user.sig).byID();
  // Select all user profiles.
  selectAllUserProfiles = dd.selectRows(user.id, user.name, user.sig);
  // Select the sig field by ID.
  selectSig = dd.selectField(user.sig).byID();
}

export default dd.ta(user, UserTA);
```

It would generate the following Go code (only function headers shown for simplicity):

```go
// SelectUserProfile ...
func (da *TableTypeUser) SelectUserProfile(queryable dbx.Queryable, userID uint64) (*SelectUserProfileResult, error)
// SelectAllUserProfiles ...
func (da *TableTypeUser) SelectAllUserProfiles(queryable dbx.Queryable) ([]*SelectAllUserProfilesResult, error)
// SelectSig ...
func (da *TableTypeUser) SelectSig(queryable dbx.Queryable, userID uint64) (*string, error)
```

#### `SELECT *`

To select all columns of a table, simply call `select` or `selectRows` with no arguments.

### `WHERE` and Raw SQL Expressions

We haven't used any `WHERE` clause in the `SELECT` actions above, to add a `WHERE` clause, we have to construct a raw SQL expression using `dd.sql`, which uses TypeScript/JavaScript template string and enables us to write arbitrary SQL expressions.

You can pass a column object to template string, it will be converted to a column name in SQL, for example:

```ts
selectUserProfile = dd
  .select(user.id, user.name, user.sig)
  .where(dd.sql`${user.id} = 1`);
```

[mingru](https://github.com/mgenware/mingru) translates this into:

```sql
SELECT `id`, `name`, `sig` FROM `user` WHERE `id` = 1
```

More complex queries:

```ts
selectUserProfile = dd
  .select(user.id, user.name, user.sig)
  .where(dd.sql`${user.id} = 1 AND ${user.sig} <> 'haha'`);
```

[mingru](https://github.com/mgenware/mingru) translates this into:

```sql
SELECT `id`, `name`, `sig` FROM `user` WHERE `id` = 1 AND `sig` <> 'haha'
```

#### Input Parameters

Your actions often require user input parameters, e.g. to select a single profile from user table, we need a `id` parameter which can uniquely identify an user record. Use `dd.input` for this purpose:

```ts
selectUserProfile = dd
  .select(user.id, user.name, user.sig)
  .where(dd.sql`${user.id} = ${dd.input(user.id)}`);
```

[mingru](https://github.com/mgenware/mingru) translates this to the following Go code:

```go
func (da *TableTypeUser) SelectUserProfile(queryable dbx.Queryable, id uint64) (*UserTableSelectUserProfileResult, error) {
	result := &UserTableSelectUserProfileResult{}
	err := queryable.QueryRow("SELECT `id`, `name`, `sig` FROM `user` WHERE `id` = ?", id).Scan(&result.ID, &result.Name, &result.Sig)
	if err != nil {
		return nil, err
	}
	return result, nil
}
```

The `dd.input(user.id)` instructs builder to include a parameter named `id` and pass it to SQL query function. If you don't like the auto inferred name, can use the second optional `name` argument of `dd.input`:

```ts
selectUserProfile = dd
  .select(user.id, user.name, user.sig)
  .where(dd.sql`${user.id} = ${dd.input(user.id, 'uid')}`);
// Now input name is `uid` instead of `name`
```

The auto inferred name also differs on foreign column, it uses full column name on foreign column:

```ts
dd.input(post.id);
// Input name is id

dd.input(comment.post_id.join(post).title);
// Input name is postTitle instead of title because title comes from a joined table
```

#### SQL Expression Helpers

Writing `dd.input`s in `dd.sql` can be tedious, dd-models comes with a bunch of handy helpers to construct some commonly used expressions.

##### `Column.toInput(column, optionalName): SQLVariable`

Shortcut to `dd.input(column, optionalName)`:

```ts
selectUserProfile = dd
  .select(user.id, user.name, user.sig)
  .where(dd.sql`${user.id} = ${user.id.toInput()}`);
```

##### `Column.isEqualTo(sql): SQL`

```ts
selectUserProfile = dd
  .select(user.id, user.name, user.sig)
  .where(user.name.isEqualTo(dd.sql`"Admin"`));
```

Is equivalent to:

```ts
selectUserProfile = dd
  .select(user.id, user.name, user.sig)
  .where(dd.sql`${user.name} = "Admin"`);
```

##### `Column.isEqualToInput(optionalName): SQL`

```ts
selectUserProfile = dd
  .select(user.id, user.name, user.sig)
  .where(user.name.isEqualToInput());
```

Is equivalent to:

```ts
selectUserProfile = dd
  .select(user.id, user.name, user.sig)
  .where(dd.sql`${user.name} = ${dd.input(user.name)}`);
```

##### `Column.isNotEqualTo` and `Column.isNotEqualToInput`

Similar to `isEqualTo` and `isEqualToInput`, uses `<>`(not equal to operator) instead.

##### `.ByID()`

```ts
selectUserProfile = dd.select(user.id, user.name, user.sig).byID();
```

Is equivalent to 3 expressions listed below:

```ts
// 1
userTA
  .select('UserProfile', user.id, user.name, user.sig)
  .where(`${user.id} = ${user.id.toInput()}`);
// 2
userTA
  .select('UserProfile', user.id, user.name, user.sig)
  .where(user.id.isEqualTo(user.id.toInput()));
// 3
userTA
  .select('UserProfile', user.id, user.name, user.sig)
  .where(user.id.isEqualToInput());
```

#### Predefined System Calls

As raw SQL expressions enable you to write any SQL, you may do this for a `DATETIME` column to set it to current time when inserted:

```ts
updateLastLogin = dd
  .updateOne()
  .set(user.lastLogin, dd.sql`NOW()`)
  .byID();
```

As these system calls are commonly used, dd-models supports them as predefined system calls listed below:

```ts
enum SQLCallType {
  datetimeNow, // NOW() for DATETIME
  dateNow, // NOW() for DATE
  timeNow, // NOW() for TIME
  count, // COUNT()
  avg, // AVG()
  sum, // SUM()
  coalesce, // COALESCE()
  min, // MIN()
  max, // MAX()
}
```

All predefined system calls are under the root `dd` namespace:

```ts
// These three are equivalent
updateLastLogin = dd
  .updateOne()
  .set(user.lastLogin, dd.sql`NOW()`)
  .byID();

updateLastLogin = dd
  .updateOne()
  .set(user.lastLogin, dd.sql`${dd.datetimeNow()}`)
  .byID();

updateLastLogin = dd
  .updateOne()
  .set(user.lastLogin, dd.datetimeNow())
  .byID();
```

### More on `SELECT` Actions

#### `orderBy` and `orderByDesc`

```ts
selectUser = dd
  .select(user.name, user.age)
  .byID()
  .orderBy(user.name)
  .orderByDesc(user.age);
```

#### Alias via `as`

Can use `Column.as` to add the SQL `AS` alias to a selected column:

```ts
selectUser = dd.select(user.name, user.post_count.as('count'));
```

Generates the following SQL:

```sql
SELECT `name`, `post_count` AS `count` from user;
```

#### Pagination

##### `limit`

Pagination can be achieved by calling `limit` methods following `selectRows`:

```ts
selectUsersWithLimit = dd.selectRows(user.id, user.name);
```

Implementations should expose arguments to set the underlying SQL `LIMIT` and `OFFSET` values, here is the Go method signature generated by [mingru](https://github.com/mgenware/mingru) from the action above:

```go
func (da *TableTypeUser) SelectUsersWithLimit(queryable dbx.Queryable, limit int, offset int, max int) ([]*SelectUsersWithLimitResult, int, error)
```

##### `selectPage`

Pagination can also be done via `selectPage` method, the `selectPage` usually generates a method built upon the SQL `LIMIT` and `OFFSET` clauses but exposes higher level arguments thus provides more convenience:

```ts
selectPagedUsers = dd.selectPage(user.id, user.name);
```

[mingru](https://github.com/mgenware/mingru) converts the action above to the following Go func:

```go
func (da *TableTypeUser) SelectPagedUsers(queryable dbx.Queryable, page int, pageSize int) ([]*SelectPagedUsersResult, bool, error)
```

Notice the `limit` and `offset` arguments are gone, `page` and `pageSize` are exposed instead. Also the second return value changed from `rowsFetched`(`int`) to `hasNextPage`(`bool`).

### `UPDATE` Actions

dd-models supports the following kinds of `UPDATE` actions:

```ts
// Updates a row and checks rows affected to make sure only one row is updated.
// Implementations should throw an error if used without a WHERE clause.
function updateOne(): UpdateAction;

// Updates rows base on some conditions
// Implementations should throw an error if used without a WHERE clause.
function updateSome(): UpdateAction;

// Updates all rows.
function unsafeUpdateAll(): UpdateAction;
```

To set individual column values, use `UpdateAction.set(column, sql)`, e.g. set an `user.sig` to a random string:

```ts
updateUserSig = dd
  .updateOne()
  .set(user.sig, dd.sql`'My signature'`)
  .byID();
```

Or, use user input as column value:

```ts
updateUserSig = dd
  .updateOne()
  .set(user.sig, user.sig.toInput())
  .byID();
```

To set multiple columns, just call `set` one by one:

```ts
updateUserSig = dd
  .updateOne()
  .set(user.sig, user.sig.toInput())
  .set(user.name, dd.sql`'Random name'`)
  .byID();
```

#### `setInputs`

Most of the time, you will be using `UPDATE` action with user inputs, so you probably always end up with this:

```ts
updateManyColumns = dd
  .updateOne()
  .set(user.sig, user.sig.toInput())
  .set(user.name, user.name.toInput())
  .set(user.age, user.age.toInput())
  .set(user.gender, user.gender.toInput())
  .byID();
```

To simplify this, `UpdateAction` also has a method called `setInputs`, you can pass an array of columns, all of them will be considered inputs. The above code could be rewritten as using `setInputs`:

```ts
updateManyColumns = dd
  .updateOne()
  .setInputs(user.sig, user.name, user.age, user.gender)
  .byID();
```

You can also mix this with the `set` method mentioned above:

```ts
updateManyColumns = dd
  .updateOne()
  .set(user.type, dd.sql`1`)
  .setInputs(user.sig, user.name, user.gender)
  .set(user.age, dd.sql`18`)
  .byID();
```

`setInputs` can also be called with no arguments, in this case, all remaining columns (haven't been set yet) will be automatically set as inputs:

```ts
updateManyColumns = dd
  .updateOne()
  .setInputs(user.sig)
  .setInputs(); // All columns other than `user.sig` will be set as inputs
```

### `INSERT` actions

```ts
// Inserts a new row, and returns inserted ID.
function insertOne(): InsertAction;
// Inserts a new row.
function insert(): InsertAction;

// The unsafe version of `insertOne` and `insert` does not check if all columns are set.
// See the "Unsafe Insert` section below for details.
function unsafeInsertOne(): InsertAction;
function unsafeInsert(): InsertAction;
```

Example:

```ts
// Insert a new user
insertUser = dd
  .insertOne()
  .set(user.sig, dd.sql`''`)
  .set(user.name, user.name.toInput())
  .set(user.age, user.age.toInput());
```

#### `setInputs` and `setDefaults`

`INSERT` action can also use `setInputs` like in `UPDATE` action:

```ts
insertUser = dd
  .insertOne()
  .set(user.sig, dd.sql`''`) // Set sig column to an empty string
  .setInputs(user.name, user.age); // Set user.name and user.age as inputs

insertUser = dd
  .insertOne()
  .set(user.sig, dd.sql`''`) // Set sig column to an empty string
  .setInputs(); // Calling setInput with no args simply sets all other columns of this table as inputs
```

`setDefaults` is like `setInputs` except it set the target column to its default value instead of an input:

```ts
insertUser = dd
  .insertOne()
  .setInputs(user.name, user.age) // Set user.name and user.age as inputs
  .setDefaults(); // Set other columns to their default values
```

#### Unsafe Insert

By default, insert action throws an error when not all columns are set (not including `AUTO_INCREMENT` columns), even if columns have default values, you should always explicitly set them via `setDefaults`:

```ts
// Set all columns to their default values.
insertUser = dd.insertOne().setDefaults();

// Set all columns as inputs.
insertUser = dd.insertOne().setInputs();
```

To bypass this check, use the unsafe version instead, i.e. `unsafeInsertOne` and `unsafeInsert`.

### `DELETE` actions

```ts
// Deletes a row and checks rows affected to make sure only one row is updated.
// Implementations should throw an error if used without a WHERE clause.
function deleteOne(): DeleteAction;

// Deletes rows based on some conditions
// Implementations should throw an error if used without a WHERE clause.
function deleteSome(): DeleteAction;

// Delete all rows.
function unsafeDeleteAll(): DeleteAction;
```

Example:

```ts
// Delete an user by ID.
deleteByID = dd.deleteOne().byID();

// Delete all users by a specified name.
deleteByName = dd.deleteSome().where(user.name.isEqualToInput());

// Delete all users.
deleteAll = dd.unsafeDeleteAll();
```

## Advanced Topics

### Default Values

When set a default value to a column, two things happen:

- Default values are included in `CREATE TABLE` SQL.
- Default values are also explicitly set in `INSERT` and `UPDATE` actions.

Setting default values in `CREATE TABLE` also makes it hard to attach a dynamic value to a column, e.g. setting `NOW()` in a `DATETIME` column, in this case, you can use the `noDefaultOnCSQL` property to disable setting default value on generated `CREATE TABLE` SQL:

```ts
a = dd.int(1);
b = dd.int(1).noDefaultOnCSQL;
```

The generated `CREATE TABLE` SQL:

```sql
CREATE TABLE `user` (
	`a` INT NOT NULL DEFAULT 1,
	`b` INT NOT NULL
)
CHARACTER SET=utf8mb4
COLLATE=utf8mb4_unicode_ci
;
```

Note that the columns above have same generated `INSERT` and `UPDATE` code since default values are also explicitly set in `INSERT` and `UPDATE` actions.

### `JoinedTable`

Imagine the following join:

```ts
post.user_id.join(user).name;
```

It returns an object of `JoinedColumn`:

```ts
export declare class JoinedTable {
  srcColumn: Column;
  destTable: Table;
  destColumn: Column;
  keyPath: string;

  tableInputName(): string;
}
```

An anatomy of a `JoinedTable`:

```
post.user_id.join(user).name;
-----------------------------
     |        |     |      |
    srcColumn |  destTable |
     |        |     |      |
     |--- JoinedTable      |
              |            |
              -------- destColumn
```

Multiple joins are also allowed:

```
cmt.post_id.join(post).user_id.join(user).name
|                  |
--------------------
               JoinedTable
                   |                  |
                   --------------------
                                  JoinedTable
```

- For first joined table:
  - `srcColumn`: `cmt.post_id`
  - `destTable`: `post`
  - `destColumn`: `post.user_id`
- For second joined column:
  - `srcColumn`: `<first joined table>.user_id`
  - `destTable`: `user`
  - `destColumn`: `user.name`

### Reuse a Joined Table

Suppose we need to select post author's name and URL from a comment of the post. We can do:

```ts
const cols = [
  comment.post_id.join(post).user_id.join(user).name,
  comment.post_id.join(post).user_id.join(user).url,
];
```

The code above can be simplified as below:

```ts
const joinedUser = comment.post_id.join(post).user_id.join(user);
const cols = [joinedUser.name, joinedUser.url];
```

---

**Work in progress**
