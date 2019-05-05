#!/usr/bin/env node

const ethUtil = require('ethereumjs-util')
const ethers = require('ethers')
const { Tx, Outpoint, Input, Output } = require('leap-core')

const provider = new ethers.providers.JsonRpcProvider(process.env['RPC_URL'] || 'https://testnet-node1.leapdao.org')

const TOKEN_PLACEHOLDER = '1111111111111111111111111111111111111111'
const SENDER_PLACEHOLDER = '2222222222222222222222222222222222222222'
const RECEIVER_PLACEHOLDER = '3333333333333333333333333333333333333333'
const CHALLENGE_NST_PLACEHOLDER = '4444444444444444444444444444444444444444'
const CHALLENGE_NST_ID_PLACEHOLDER = '123456789'
const ARBITRATOR_PLACEHOLDER = '5555555555555555555555555555555555555555'
const CHALLENGE_PERIOD_END_PLACEHOLDER = '99999'
const PLASMA_BRIDGE_PLACEHOLDER = '6666666666666666666666666666666666666666'

const BRIDGE_ADDR = '0xEB13cc8F0904398d01D7faD8B98bff1FA2977470'

async function main() {
  let arbitrableTxCondition
  try {
    arbitrableTxCondition = require('./../build/contracts/ArbitrableTxCondition.json')
  } catch (e) {
    console.error('Please run `npm run compile:contracts` first. 😉')
    return
  }

  if (process.argv.length < 8) {
    console.info(process.argv.length)
    console.log(
      'Usage: <token address> <nst address> <nst ID> <sender address> <receiver address> <arbitrator address>\n' +
      'Example:' +
      '\n\t0xD2D0F8a6ADfF16C2098101087f9548465EC96C98 0x1111111111111111111111111111111111111111 0 0x1111111111111111111111111111111111111111 0x1111111111111111111111111111111111111111 0x1111111111111111111111111111111111111111' +
      '\nEnvironment Variables:' +
      '\n\tRPC_URL'
    )

    process.exit(0)
  }

  const tokenAddr = process.argv[2]
  const nstAddr = process.argv[3]
  const nstID = process.argv[4]
  const senderAddr = process.argv[5]
  const receiverAddr = process.argv[6]
  const arbitratorAddr = process.argv[7]

  abi = new ethers.utils.Interface(arbitrableTxCondition.abi)
  codeBuf = arbitrableTxCondition.deployedBytecode
    .replace(TOKEN_PLACEHOLDER, tokenAddr.replace('0x', '').toLowerCase())
    .replace(SENDER_PLACEHOLDER, senderAddr.replace('0x', '').toLowerCase())
    .replace(RECEIVER_PLACEHOLDER, receiverAddr.replace('0x', '').toLowerCase())
    .replace(CHALLENGE_NST_PLACEHOLDER, nstAddr.replace('0x', '').toLowerCase())
    .replace(CHALLENGE_NST_ID_PLACEHOLDER, nstID)
    .replace(ARBITRATOR_PLACEHOLDER, arbitratorAddr.replace('0x', '').toLowerCase())
    .replace(CHALLENGE_PERIOD_END_PLACEHOLDER, (Date.now()/1000) + 60)
    .replace(PLASMA_BRIDGE_PLACEHOLDER, BRIDGE_ADDR.replace('0x','').toLowerCase())

  const codeHash = ethUtil.ripemd160(codeBuf)
  const condAddr = '0x' + codeHash.toString('hex')
  console.info(`Send tokens and the NST to ${condAddr}`)

  // TODO: Demo happy case and challenge case.
}

function onException (e) {
  console.error(e)
  process.exit(1)
}

process.on('uncaughtException', onException)
process.on('unhandledRejection', onException)
main()
