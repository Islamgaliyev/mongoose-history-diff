# mongoose-history-diff :rocket: :fire:

[![travis build](https://img.shields.io/travis/FrankAst/mongoose-history-diff.svg)](https://travis-ci.org/FrankAst/mongoose-history-diff)
[![codecov coverage](https://img.shields.io/codecov/c/github/FrankAst/mongoose-history-diff.svg)](https://codecov.io/github/FrankAst/mongoose-history-diff)
[![](https://img.shields.io/npm/v/mongoose-history-diff.svg)](https://www.npmjs.com/package/@frankast/mongoose-history-diff)
[![npm](https://img.shields.io/npm/dt/mongoose-history-diff.svg)](http://www.npmtrends.com/mongoose-history-diff)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Greenkeeper badge](https://badges.greenkeeper.io/FrankAst/mongoose-history-diff.svg)](https://greenkeeper.io/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)


This is a [mongoose](https://mongoosejs.com/) plugin for tracking history and differences of your docs.

## Installation

```bash
yarn add mongoose-history-diff
```

```bash
npm i mongoose-history-diff
```

## Usage

### Add plugin to your schema:
 ```js
import DiffPlugin from 'mongoose-history-diff';
 ```
 ```js
 PostSchema.plugin(DiffPlugin, {
     orderIndependent: true,
     diffCollectionName: 'my_diffs', 
 });
 ```
 `orderIndependent` option define whether the order of array elements is important or not. If `true` then it won't create a new diff. By default **false**.

 `diffCollectionName` option define the name of collection with diffs. If not provided `${parent_collection_name}_diffs` will be used.

### Exclude fields

 You can exclude document fields from tracking by adding `{ track_diff: false }` property to your field definition inside the schema:

 ```js
 export const PostSchema: MongooseSchema<PostDoc> = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    text: {
        type: String,
        track_diff: false,
    },
    authors: [
      {
        name: { type: String }
        lname: { type: String }, track_diff: false },
      },
    ],
  {
    timestamps: true,
    collection: 'post',
  }
);
 ```

 The **_id** field is excluded from the tracking by default.


## Track diffs

After adding, the plugin will create a diff document with the following shape in a separate collection on every changing of your  documents.

```js
{
    _id: '5c33240bd7cce8cba92030aa',
    dId: '5c25abc9c9a367742cd5341b',
    c : [ 
        {
            p : [ 
                'lastname'
            ],
            k : 'E',
            l : 'borodaev',
            r : 'Borodayev'
        }
    ],
    v: 4,
    createdAt: '2019-01-07T10:03:55.933Z',
    updatedAt: '2019-01-07T10:03:55.933Z',
}
```

**Important!** Plugin creates diffs on a `preSave` mongoose hook. That's why all methods which directly operates with MongoDB won't call creating diff.

Diffs are represented as one or more change records. Change records have the following structure:

* `k` - indicates the kind of change; will be one of the following:
  * `N` - indicates a newly added property/element
  * `D` - indicates a property/element was deleted
  * `E` - indicates a property/element was edited
  * `A` - indicates a change occurred within an array
* `p` - the property path
* `l` - the value that was (undefined if `k === 'N'`)
* `r` - the value that become (undefined if `k === 'D'`)
* `i` - when `k === 'A'`, indicates the array index where the change occurred
* `it` - when `k === 'A'`, contains a nested change record indicating the change that occurred at the array index

Under the hood, the plugin uses refactored and simplified algorithm of `deep-diff` package, that is why this plugin has similar structure of changes. You can explore that [repo](https://github.com/flitbit/diff) too if you are interested in.


## Methods

Also, the plugin will add a static `diffModel` method that returns the model of diff collection.

```js
const Diff = Post.diffModel();
```

This model contains several static methods as well:
* `findByDocId(_id: ObjectId)` - finds all diffs by parent doc `_id`
* `findAfterVersion(_id: ObjectId, v: number)` - finds all diffs by parent doc `_id` after specific version
* `findBeforeVersion(_id: ObjectId, v: number)` - finds all diffs docs by parent doc `_id` before specific version
* `revertToVersion(doc: Object, v: number)` - reverts changes of specific doc to a specific version.
* `mergeDiffs(doc: MongooseDocument)` - return all diffs between current doc state and initial doc state.

## Contribution

Feel free to submit a pull request. Also, be sure all tests have passed otherwise pull request won't be merged.

## License

[MIT](https://github.com/FrankAst/mongoose-history-diff/blob/master/LICENSE.md)