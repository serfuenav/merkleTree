const MerkleTree = require('../src/merkleTree');
const { assert, expect } = require('chai');
const { sha256, txToInt256LE } = require('../src/helpers');

// Data from block 75000
const data = {
  tx: [
    '5277cf3790381c2cc2b071038d8c35b3b601207c92f8aec15978a5f01ecf8319',
    '182c2ed191a35ea496ce84c42d8beee6f9d82b9f063de2e45a54692bb043696a',
    '707e86e5e2356cb53a2edf0be391d56cfc998bcfa05a13a5772ef474c5eba105',
    '711e15a9a819de4d1269d71de9744dedf9b6c32bba36bb0196f003f6507d4bb4',
    '8c1e409484e30c205698647753cca07d826c34756773bd0432202487f28e2d54',
    'abfaf8e7ad6241ca5161e517baade1275cf6333d0d118d221f894813bacb4f78',
  ],
  mrkl_root: 'ed385c2dbc69aa24965909c7d9d11bbd99faa085cb4ec17865d9b557ffb3a68a',
};

const txIn256LE = data.tx.map(txToInt256LE);
const levels = [];
levels[0] = txIn256LE;
levels[1] = [
  sha256(sha256(Buffer.concat([txIn256LE[0], txIn256LE[1]]))),
  sha256(sha256(Buffer.concat([txIn256LE[2], txIn256LE[3]]))),
  sha256(sha256(Buffer.concat([txIn256LE[4], txIn256LE[5]]))),
  sha256(sha256(Buffer.concat([txIn256LE[4], txIn256LE[5]]))),
];
levels[2] = [
  sha256(sha256(Buffer.concat([levels[1][0], levels[1][1]]))),
  sha256(sha256(Buffer.concat([levels[1][2], levels[1][3]]))),
];

const getExpectedPathFromLeftChild = () => {
  const path = [];
  path.push({ data: levels[0][1], position: 'right' });
  path.push({ data: levels[1][1], position: 'right' });
  path.push({ data: levels[2][1], position: 'right' });
  return path;
};

const getExpectedPathFromRightChild = () => {
  const path = [];
  path.push({ data: levels[0][4], position: 'left' });
  path.push({ data: levels[1][3], position: 'right' });
  path.push({ data: levels[2][0], position: 'left' });
  return path;
};

describe('Positive test suite', () => {
  const underTest = new MerkleTree(data.tx);

  it('Should produce the same root', () => {
    assert.equal(underTest.getRoot(), data.mrkl_root);
  });

  it('Should produce the same levels ', () => {
    expect(underTest.getLevels()).to.eql(levels);
  });

  it('Should produce the same path for a given transaction - left child', () => {
    const expected = getExpectedPathFromLeftChild();
    const actual = underTest.getPath(data.tx[0]);

    expect(actual).to.eql(expected);
  });

  it('Should produce the same path for a given transaction - right child', () => {
    const expected = getExpectedPathFromRightChild();
    const actual = underTest.getPath(data.tx[5]);

    expect(actual).to.eql(expected);
  });

  it('Should verify a valid proof - left child', () => {
    const proof = getExpectedPathFromLeftChild();
    const actual = underTest.verifyProof(proof, data.tx[0]);
    assert.isTrue(actual);
  });

  it('Should verify a valid proof - right child', () => {
    const proof = getExpectedPathFromRightChild();
    const actual = underTest.verifyProof(proof, data.tx[5]);
    assert.isTrue(actual);
  });
});

// Swapping the first 2 transactions. This will produce a different tree
describe('Negative test', () => {
  const wrongData = {
    tx: [
      data.tx[1],
      data.tx[0],
      data.tx[2],
      data.tx[3],
      data.tx[4],
      data.tx[5],
    ],
  };

  const underTest = new MerkleTree(wrongData.tx);

  it('Should NOT have the same root', () => {
    assert.notEqual(underTest.getRoot(), data.mrkl_root);
  });

  it('Should NOT produce the same path for a given transaction - left child', () => {
    const expectedPath = getExpectedPathFromLeftChild();
    assert.notEqual(underTest.getPath(wrongData.tx[0]), expectedPath);
  });

  it('Should NOT produce the same path for a given transaction - right child', () => {
    const expectedPath = getExpectedPathFromRightChild();
    assert.notEqual(
      underTest.getPath(wrongData.tx[wrongData.tx.length - 1]),
      expectedPath
    );
  });
});
