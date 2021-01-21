const fetch = require('node-fetch');
const MerkleTree = require('./src/merkleTree');

// Verifying that the last block's root is the same as the root we generate from the transactions
fetch(`https://blockchain.info/q/latesthash?cors=true`)
  .then((res) => res.text())
  .then((block) => fetch(`https://blockchain.info/rawblock/${block}`))
  .then((res) => res.json())
  .then((data) => {
    return {
      hashes: data.tx.map((t) => t.hash),
      root: data.mrkl_root,
    };
  })
  .then((block) => {
    const merkleTree = new MerkleTree(block.hashes);
    const merkleRoot = merkleTree.getRoot();
    console.log(
      'Expecting same roots -> Roots are ' +
        (merkleRoot === block.root ? 'the same' : 'different')
    );

    // Generating a proof for a random transaction
    const randomId = Math.floor(Math.random() * block.hashes.length);
    const proof = merkleTree.getPath(block.hashes[randomId]);
    const randomTx = block.hashes[randomId];
    console.log('Is the proof valid?', merkleTree.verifyProof(proof, randomTx));
  })
  .catch(console.log);
