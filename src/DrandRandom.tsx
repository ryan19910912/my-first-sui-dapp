import { TransactionBlock } from '@mysten/sui.js/transactions';
import {
  fetchBeacon,
  HttpChainClient,
  HttpCachingChain,
} from 'drand-client'

// 獲獎者 Shared Object ID
const winner_shared_object_id = "0x47a5401cf3e63981383ceb49984ac0f7ed04788acc4b76f5051c905adefc0d84";
// 智能合約 Package ID
const contract_package_id = "0xc964346ca241df9e9b9f5a7995cc4ad470a0cc46747bde87a542cd36a9867bd7";
// 智能合約 module 名稱
const contract_module_name = "sui_drand_demo";
// 智能合約 呼叫方法 名稱
const contract_set_winner_method = "set_winner";
const contract_clear_winner_method = "clear_winner";
const winner_count = 5;
const lottery_count = 100;

/**
 * 設定獲獎者資訊
 */
export async function getWinnerInfoTransactionBlock() {

  // 產生一個新的交易區塊
  const txb = new TransactionBlock();

  // quicknet
  const chainHash = '52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971' // (quicknet)
  const publicKey = "83cf0f2896adee7eb8b5f01fcad3912212c437e0073e911fb90022d3e760183c8c4b450b6a0a6c3ac6a5776a2d1064510d1fec758c921cc22b0e17e63aaf4bcb5ed66304de9cf809bd274ca73bab4af5a6e9c76a4bc09e76eae8991ef5ece45a";

  // (default)
  // const chainHash = '8990e7a9aaed2ffed73dbd7092123d6f289930540d7651336225dc172e51b2ce';
  // const publicKey = "868f005eb8e6e4ca0a47c8a77ceaa5309a47978a7c71bc5cce96366b5d7a569937c529eeda66c7293784a9402801af31";

  const options = {
    disableBeaconVerification: false, // `true` disables checking of signatures on beacons - faster but insecure!!!
    noCache: false, // `true` disables caching when retrieving beacons for some providers
    chainVerificationParams: { chainHash, publicKey }  // these are optional, but recommended! They are compared for parity against the `/info` output of a given node
  }

  const chain = new HttpCachingChain(`https://api.drand.sh/${chainHash}`, options);
  const client = new HttpChainClient(chain, options)
  const theLatestBeacon = await fetchBeacon(client)

  const drand_round: number = theLatestBeacon.round;

  let run_count = winner_count;

  let randomRoundArray: number[] = [];

  while (run_count > 0) {

    let random_round = Math.floor(Math.random() * drand_round);

    // 如果重複了，則略過
    if (randomRoundArray.includes(random_round)) {
      continue
    }

    randomRoundArray.push(random_round);

    run_count = run_count - 1;
  }

  for (let round of randomRoundArray) {

    let randomnessBeacon = await client.get(round);

    const byteArray = hex16String2Vector(randomnessBeacon.signature);

    let args = [
      // 第1個為 Winner Shared Object Id
      txb.object(winner_shared_object_id),
      // 第2個為 最大值 ex:100
      txb.pure(lottery_count),
      // 第3個為 drand current round
      txb.pure(randomnessBeacon.round),
      // 第4個為 drand signature
      txb.pure(byteArray)
    ]

    // 呼叫智能合約 設定獲獎者
    txb.moveCall({
      // target 要帶入 PageckId::moduleName::methodName
      // ex: 0xd9326566facfff6e8250ce92b71bf91427cc197e052d0c8a162b6cd7cb9c3e83::sui_drand_demo::set_winner
      target: `${contract_package_id}::${contract_module_name}::${contract_set_winner_method}`,
      // 參數
      arguments: args,
    });
  }

  return txb;
}

// 取得 清除獲獎者資訊 交易區塊
export async function getClearWinnerInfoTransactionBlock() {
  // 產生一個新的交易區塊
  const txb = new TransactionBlock();

  let args = [
    // Winner Shared Object Id
    txb.object(winner_shared_object_id),
  ]

  // 呼叫智能合約 清除獲獎者資訊
  txb.moveCall({
    // target 要帶入 PageckId::moduleName::methodName
    // ex: 0xd9326566facfff6e8250ce92b71bf91427cc197e052d0c8a162b6cd7cb9c3e83::sui_drand_demo::clear_winner
    target: `${contract_package_id}::${contract_module_name}::${contract_clear_winner_method}`,
    // 參數
    arguments: args,
  });

  return txb;
}

function hex16String2Vector(str: string) {
  // 定義一個空數組來存儲結果
  let byteArray = [];

  // 將十六進制字符串每兩個字符分割並將其轉換為十進制數字，然後添加到數組中
  for (let i = 0; i < str.length; i += 2) {
    byteArray.push(parseInt(str.slice(i, i + 2), 16));
  }

  return byteArray;
}