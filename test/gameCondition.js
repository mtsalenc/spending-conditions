
/**
 * Copyright (c) 2017-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License, version 2,
 * found in the LICENSE file in the root directory of this source tree.
 */

const chai = require('chai');
const ethUtil = require('ethereumjs-util');
const GameCondition = artifacts.require('./GameCondition.sol');
const SimpleToken = artifacts.require('./mocks/SimpleToken');

const should = chai
  .use(require('chai-as-promised'))
  .should();

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace.replace('0x', ''));
}


contract('GameCondition', (accounts) => {
  const house = accounts[0];
  const player = '0xF3beAC30C498D9E26865F34fCAa57dBB935b0D74';
  const playerPriv = '0x278a5de700e29faae8e40e366ec5012b5ec63d36ec77e8a2417154cc1d25383f';
  let token;
  let condition;

  beforeEach(async () => {
    token = await SimpleToken.new();
    const cards = '0x0000000000000000000000000105040603070208010901050206030704080409';

    // replace token address placeholder to real token address
    let tmp = GameCondition._json.bytecode;
    // token address
    tmp = replaceAll(tmp, '1234111111111111111111111111111111111111', token.address);
    // cards
    tmp = replaceAll(tmp, '2345222222222222222222222222222222222222222222222222222222222222', cards);
    // house
    tmp = replaceAll(tmp, '3456333333333333333333333333333333333333', house);
    // player
    tmp = replaceAll(tmp, '4567444444444444444444444444444444444444', player);
    GameCondition._json.bytecode = tmp;

    condition = await GameCondition.new();
    // initialize contract
    await token.transfer(condition.address, 1000);
  });

  it('should allow to have tied game', async () => {
    const permutation = '0x0000000000000000000000000000000000000000000004090206030704080105';
    const hash = Buffer.alloc(32);
    Buffer.from(permutation.replace('0x', ''), 'hex').copy(hash);
    const sig = ethUtil.ecsign(
      hash,
      Buffer.from(playerPriv.replace('0x', ''), 'hex'),
    );
    const tx = await condition.fulfill(permutation, `0x${sig.r.toString('hex')}`, `0x${sig.s.toString('hex')}`, sig.v).should.be.fulfilled;
    // check transaction for events
    assert.equal(tx.receipt.rawLogs[0].address, token.address);
    assert.equal(tx.receipt.rawLogs.length, 2);
    
    // bytes32 anyone? :P
    assert.equal(tx.receipt.rawLogs[0].topics[1], '0x000000000000000000000000' + condition.address.replace('0x', '').toLowerCase());
    assert.equal(tx.receipt.rawLogs[0].topics[2], '0x000000000000000000000000' + house.replace('0x', '').toLowerCase());
    const remain = await token.balanceOf(condition.address);
    assert.equal(remain.toNumber(), 0);
  });

});