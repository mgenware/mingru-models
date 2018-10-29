# dd-models

[![MEAN Module](https://img.shields.io/badge/MEAN%20Module-TypeScript-blue.svg?style=flat-square)](https://github.com/mgenware/MEAN-Module)
[![Build Status](https://img.shields.io/travis/mgenware/dd-models.svg?style=flat-square&label=Build+Status)](https://travis-ci.org/mgenware/dd-models)
[![npm version](https://img.shields.io/npm/v/dd-models.svg?style=flat-square)](https://npmjs.com/package/dd-models)
[![Node.js Version](http://img.shields.io/node/v/dd-models.svg?style=flat-square)](https://nodejs.org/en/)

Redefining database models using TypeScript.

**Working in progress**

## Defining a model
User
```ts
import * as dd from 'dd-models';

class User extends dd.Table {
  id = dd.pk();
  name = dd.varChar(100);
}

export default dd.table(User);
```

Post
```ts
import * as dd from 'dd-models';
import user from './user';

class Post extends dd.Table {
  id = dd.pk();
  name = dd.varChar(100);
  user_id = user.id;
}

export default dd.table(Post);
```

## JoinedColumn
Suppose the following join:
```typescript
post.user_id.join(user).name;
```

It returns a `JoinedColumn`:
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
  * Target column: `post.user_id`
* Second joined column:
  * Local column: first joined column
  * Remote column: `user.id`
  * Target column: `user.name`

### Reuse a joined table
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
