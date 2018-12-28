// @flow

import mongoose from 'mongoose';
import DB from '../../__fixtures__/db';
import DiffModel from '../DiffModel';
import { Post, type PostDoc } from '../../__fixtures__/Post';

jest.mock('../../__fixtures__/db.js');
jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

describe('Diff', () => {
  DB.init();

  it('create diff model', () => {
    expect(() => {
      // $FlowFixMe
      DiffModel(null, {});
    }).toThrowErrorMatchingInlineSnapshot(`"'mongooseConection' is required"`);

    expect(() => {
      // $FlowFixMe
      DiffModel({}, null);
    }).toThrowErrorMatchingInlineSnapshot(`"'collectionName' is required"`);
  });

  it('createDiff()', async () => {
    const Diff = DiffModel(DB.data, 'diffs');
    // $FlowFixMe
    const docId = mongoose.Types.ObjectId();
    const changes: any = [
      { k: 'E', p: ['details', 'with', '2'], l: 'elements', r: 'more' },
      { k: 'A', p: ['details', 'with'], i: 3, it: { k: 'N', r: 'elements' } },
    ];

    const diff1 = await Diff.createDiff(docId, 1, changes);
    const diff2 = await Diff.createDiff(docId, 2, [changes[0]]);

    expect(diff1.v).toBe(1);
    expect(diff2.v).toBe(2);

    expect(diff1.c).toMatchInlineSnapshot(`
CoreMongooseArray [
  Object {
    "k": "E",
    "l": "elements",
    "p": Array [
      "details",
      "with",
      "2",
    ],
    "r": "more",
  },
  Object {
    "i": 3,
    "it": Object {
      "k": "N",
      "r": "elements",
    },
    "k": "A",
    "p": Array [
      "details",
      "with",
    ],
  },
]
`);

    expect(diff2.c).toMatchInlineSnapshot(`
CoreMongooseArray [
  Object {
    "k": "E",
    "l": "elements",
    "p": Array [
      "details",
      "with",
      "2",
    ],
    "r": "more",
  },
]
`);
  });

  it('findAfterVersion()', async () => {
    const Diff = DiffModel(DB.data, 'diffs');
    // $FlowFixMe
    const docId = mongoose.Types.ObjectId();
    const changes: any = [
      { k: 'E', p: ['details', 'with', '2'], l: 'elements', r: 'more' },
      { k: 'A', p: ['details', 'with'], i: 3, it: { k: 'N', r: 'elements' } },
    ];

    await Diff.createDiff(docId, 1, changes);
    await Diff.createDiff(docId, 2, [changes[0]]);

    const tillV1 = await Diff.findAfterVersion(docId, 1);
    const tillV2 = await Diff.findAfterVersion(docId, 2);
    expect(tillV1[0].c).toMatchInlineSnapshot(`
CoreMongooseArray [
  Object {
    "k": "E",
    "l": "elements",
    "p": Array [
      "details",
      "with",
      "2",
    ],
    "r": "more",
  },
]
`);
    expect(tillV1[1].c).toMatchInlineSnapshot(`
CoreMongooseArray [
  Object {
    "k": "E",
    "l": "elements",
    "p": Array [
      "details",
      "with",
      "2",
    ],
    "r": "more",
  },
  Object {
    "i": 3,
    "it": Object {
      "k": "N",
      "r": "elements",
    },
    "k": "A",
    "p": Array [
      "details",
      "with",
    ],
  },
]
`);

    expect(tillV2[0].c).toMatchInlineSnapshot(`
CoreMongooseArray [
  Object {
    "k": "E",
    "l": "elements",
    "p": Array [
      "details",
      "with",
      "2",
    ],
    "r": "more",
  },
]
`);
  });

  it('revertToVersion()', async () => {
    await Post.create({ title: 'test', subjects: [{ name: 'test' }] });
    const post: PostDoc = (await Post.findOne({ title: 'test' }).exec(): any);
    post.title = 'updated';
    post.subjects = [{ name: 'math' }, { name: 'air' }];
    await post.save();

    const Diff = Post.diffModel();
    const revertedDoc = await Diff.revertToVersion(post, 1);

    expect(revertedDoc.__v).toBe(1);
    expect(revertedDoc.title).toBe('test');
    expect(revertedDoc.subjects).toMatchInlineSnapshot(`
CoreMongooseArray [
  Object {
    "name": "test",
  },
]
`);
  });

  it('mergeDiffs()', async () => {
    await Post.create({ title: 'test', subjects: [{ name: 'test' }] });
    const post: PostDoc = (await Post.findOne({ title: 'test' }).exec(): any);
    post.title = 'updated';
    post.subjects = [{ name: 'math' }, { name: 'air' }];
    await post.save();

    const Diff = Post.diffModel();
    const a = await Diff.mergeDiffs(post, false);
    expect(a).toBe();
  });
});
