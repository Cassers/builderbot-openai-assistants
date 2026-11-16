const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { join } = require('node:path');

async function main() {
  const [major, minor, patch] = process.versions.node.split('.').map(Number);
  const floors = { 22: [23, 5], 24: [22, 3], 26: [13, 1] };
  const floor = floors[major];
  assert(floor && (minor > floor[0] || (minor === floor[0] && patch >= floor[1])), 'Node security baseline is not met');
  const appRequire = createRequire(join(process.cwd(), 'package.json'));
  const providerRequire = createRequire(appRequire.resolve('@builderbot/provider-baileys'));
  let entry;
  for (const name of ['@whiskeysockets/baileys', 'baileys']) {
    try { entry = providerRequire.resolve(name); break; } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND') throw error;
    }
  }
  assert(entry, 'The provider must resolve its actual Baileys dependency');
  const signal = createRequire(entry)('libsignal');
  assert.equal(typeof signal.SessionCipher, 'function');
  assert.equal(typeof signal.SessionBuilder, 'function');
  const alice = await signal.keyhelper.generateIdentityKeyPair();
  const bob = await signal.keyhelper.generateIdentityKeyPair();
  const left = await signal.curve.calculateAgreement(bob.pubKey, alice.privKey);
  const right = await signal.curve.calculateAgreement(alice.pubKey, bob.privKey);
  assert.deepEqual(Buffer.from(left), Buffer.from(right));
  assert.equal(Buffer.from(left).length, 32);
  console.log(`Node ${process.versions.node}: provider resolution and Signal key agreement passed`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
