
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
  const player = accounts[1];
  const playerPriv = '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501201';
  let token;
  let originalByteCode;

  before(async () => {
    token = await SimpleToken.new();
    originalByteCode = GameCondition._json.bytecode;
  });

  afterEach(() => {
    GameCondition._json.bytecode = originalByteCode;
  });

  it('should allow player to win', async () => {
    const cards = '0x0000000000000000000000000105040603070208010901050206030704080409';

    // replace token address placeholder to real token address
    let tmp = GameCondition._json.bytecode;
    // token address
    tmp = replaceAll(tmp, '1234111111111111111111111111111111111111', token.address);
    // cards
    tmp = replaceAll(tmp, '2345222222222222222222222222222222222222222222222222222222222222', cards);
    // house
    tmp = replaceAll(tmp, '3456333333333333333333333333333333333333', house);
    GameCondition._json.bytecode = tmp;

    const condition = await GameCondition.new();
    // initialize contract
    await token.transfer(condition.address, 1000);
    await token.transfer(player, 1000);
    await token.approve(condition.address, 1000, {from: player});
    const permutation = '0x0000000000000000000000000000000000000000000002060307040801050409';
    const hash = ethUtil.hashPersonalMessage(Buffer.from(permutation.replace('0x', ''), 'hex'));
    const sig = ethUtil.ecsign(
      hash,
      Buffer.from(playerPriv.replace('0x', ''), 'hex'),
    );
    const tx = await condition.fulfill(permutation, `0x${sig.r.toString('hex')}`, `0x${sig.s.toString('hex')}`, sig.v).should.be.fulfilled;
    // check transaction for events
    assert.equal(tx.receipt.rawLogs[2].address, token.address);
    assert.equal(tx.receipt.rawLogs.length, 3);
    
    assert.equal(tx.receipt.rawLogs[2].topics[1], '0x000000000000000000000000' + condition.address.replace('0x', '').toLowerCase());
    assert.equal(tx.receipt.rawLogs[2].topics[2], '0x000000000000000000000000' + player.replace('0x', '').toLowerCase());
    const remain = await token.balanceOf(condition.address);
    assert.equal(remain.toNumber(), 0);
  });

  it('should allow tied game', async () => {
    const cards = '0x0000000000000000000000000105040603070208010901050406030702080109';

    // replace token address placeholder to real token address
    let tmp = GameCondition._json.bytecode;
    // token address
    tmp = replaceAll(tmp, '1234111111111111111111111111111111111111', token.address);
    // cards
    tmp = replaceAll(tmp, '2345222222222222222222222222222222222222222222222222222222222222', cards);
    // house
    tmp = replaceAll(tmp, '3456333333333333333333333333333333333333', house);
    GameCondition._json.bytecode = tmp;

    const condition = await GameCondition.new();
    // initialize contract
    await token.transfer(condition.address, 1000);
    await token.transfer(player, 1000);
    await token.approve(condition.address, 1000, {from: player});
    const permutation = '0x0000000000000000000000000000000000000000000001050406030702080109';
    const hash = ethUtil.hashPersonalMessage(Buffer.from(permutation.replace('0x', ''), 'hex'));
    const sig = ethUtil.ecsign(
      hash,
      Buffer.from(playerPriv.replace('0x', ''), 'hex'),
    );
    const tx = await condition.fulfill(permutation, `0x${sig.r.toString('hex')}`, `0x${sig.s.toString('hex')}`, sig.v).should.be.fulfilled;
    // check transaction for events
    assert.equal(tx.receipt.rawLogs[2].address, token.address);
    assert.equal(tx.receipt.rawLogs.length, 4);
    
    assert.equal(tx.receipt.rawLogs[2].topics[1], '0x000000000000000000000000' + condition.address.replace('0x', '').toLowerCase());
    assert.equal(tx.receipt.rawLogs[2].topics[2], '0x000000000000000000000000' + house.replace('0x', '').toLowerCase());
    assert.equal(tx.receipt.rawLogs[3].topics[2], '0x000000000000000000000000' + player.replace('0x', '').toLowerCase());
    const remain = await token.balanceOf(condition.address);
    assert.equal(remain.toNumber(), 0);
  });

  it('should allow house to win', async () => {
    const cards = '0x0000000000000000000000000105040603070208010901050206030701080109';

    // replace token address placeholder to real token address
    let tmp = GameCondition._json.bytecode;
    // token address
    tmp = replaceAll(tmp, '1234111111111111111111111111111111111111', token.address);
    // cards
    tmp = replaceAll(tmp, '2345222222222222222222222222222222222222222222222222222222222222', cards);
    // house
    tmp = replaceAll(tmp, '3456333333333333333333333333333333333333', house);
    GameCondition._json.bytecode = tmp;

    const condition = await GameCondition.new();
    // initialize contract
    await token.transfer(condition.address, 1000);
    await token.transfer(player, 1000);
    await token.approve(condition.address, 1000, {from: player});
    const permutation = '0x0000000000000000000000000000000000000000000002060307010801050109';
    const hash = ethUtil.hashPersonalMessage(Buffer.from(permutation.replace('0x', ''), 'hex'));
    const sig = ethUtil.ecsign(
      hash,
      Buffer.from(playerPriv.replace('0x', ''), 'hex'),
    );
    const tx = await condition.fulfill(permutation, `0x${sig.r.toString('hex')}`, `0x${sig.s.toString('hex')}`, sig.v).should.be.fulfilled;
    // check transaction for events
    assert.equal(tx.receipt.rawLogs[2].address, token.address);
    assert.equal(tx.receipt.rawLogs.length, 3);
    
    assert.equal(tx.receipt.rawLogs[2].topics[1], '0x000000000000000000000000' + condition.address.replace('0x', '').toLowerCase());
    assert.equal(tx.receipt.rawLogs[2].topics[2], '0x000000000000000000000000' + house.replace('0x', '').toLowerCase());
    const remain = await token.balanceOf(condition.address);
    assert.equal(remain.toNumber(), 0);
  });

});
