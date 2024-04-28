import { TransactionBlock } from '@mysten/sui.js/transactions';
import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';

// 骰子 Shared Object ID
const dice_shared_object_id = "0x9a1586f13af7fc4af8cb5978b12b769c8a260cf9409cf6c3d76761108adef4fe";
// 智能合約 Package ID
const contract_package_id = "0x31599f857ee6721afa26ece8ab992ba51af7c732390900d3a4834908606be223";
// 智能合約 module 名稱
const contract_module_name = "dice_demo";
// 智能合約 呼叫方法 名稱
const contract_method_name = "roll_dice";
// Sui Devnet Random Object ID
const sui_random_object_id = "0x8";
// 幫忙付 Gas Fee 的 Owner 地址
const gas_owner = "0xe20abce08a16e397ec368979b03bb6323d42605b38c6bd9b6a983c6ebcc45e11";
// 幫忙付 Gas Fee 的 Owner 註記詞
const word_list = import.meta.env.VITE_SPONSORED_WORD_LIST;

const suiClient = new SuiClient({
  url: getFullnodeUrl('devnet'),
});

/**
 * 取得 呼叫擲骰子方法的 贊助交易區塊
 * @param address // 用戶的錢包地址
 * @returns 
 */
export async function getRollDiceSponsoredTransactionBlock(address: string) {

  // 產生一個新的交易區塊
  const sponsoredTxb = new TransactionBlock();
  // 設定 交易者(用戶的錢包地址)
  sponsoredTxb.setSender(address);
  // 設定 支付 Gas Fee 的 Owner(贊助商地址)
  sponsoredTxb.setGasOwner(gas_owner);

  // 取得贊助商的錢包 Coin Data
  let coinData = await suiClient.getCoins({
    owner: gas_owner,
  });

  let coins = coinData.data;

  if (coins) {
    // 如果 Coin 存在
    // 抓取第一個 Coin
    let coin = coins[0];

    // Gas Payment 物件
    let payment = {
      digest: coin.digest,
      objectId: coin.coinObjectId,
      version: coin.version
    };

    // 設定 Gas Payment
    sponsoredTxb.setGasPayment([payment]);

    // 呼叫智能合約 擲骰子方法
    sponsoredTxb.moveCall({
      // target 要帶入 PageckId::moduleName::methodName
      // ex: 0x31599f857ee6721afa26ece8ab992ba51af7c732390900d3a4834908606be223::dice_demo::roll_dice
      target: `${contract_package_id}::${contract_module_name}::${contract_method_name}`,
      // 傳遞2個參數，第1個為 Sui Devnet上的Random Object ID (0x8)，第2個為 骰子的Shared Object ID
      arguments: [sponsoredTxb.object(sui_random_object_id), sponsoredTxb.object(dice_shared_object_id)],
    });

    // 回傳這個贊助交易區塊
    return sponsoredTxb;
  }
}

/**
 * 執行 呼叫擲骰子方法的 贊助交易區塊
 * @param txb // 由 getRollDiceSponsoredTransactionBlock 取得的贊助交易區塊
 * @param userSignature // 用戶對交易區塊的簽名
 * @param transactionBlockBytes // 用戶所簽名的交易區塊 Bytes
 */
export async function executeRollDiceSponsoredTransactionBlock(txb: TransactionBlock, userSignature: string, transactionBlockBytes: string) {

  // 取得 交易區塊的 Bytes
  let txBuild = await txb.build({ client: suiClient });
  // 取得贊助商的密鑰 By 註記詞
  let sponsoredKeypair = Ed25519Keypair.deriveKeypair(word_list);
  // 使用贊助商的密鑰 對 交易區塊 進行簽名，並產生簽章
  let sponsoredKSign = await sponsoredKeypair.signTransactionBlock(txBuild);

  console.log("贊助商簽名 : "+ sponsoredKSign.signature);
  console.log("贊助商簽名交易區塊 : "+ sponsoredKSign.bytes);
  console.log("用戶簽名 : "+ userSignature);
  console.log("用戶簽名交易區塊 : "+ transactionBlockBytes);

  // 執行 贊助交易區塊 上鏈
  suiClient.executeTransactionBlock({
    // 贊助交易區塊 Bytes 字串
    transactionBlock: transactionBlockBytes,
    // 簽名者 [用戶的簽名, 贊助商的簽名]
    signature: [userSignature, sponsoredKSign.signature],
    // 選項(可放可不放)，可以顯示一些想要看的資料
    options: { showEffects: true, showEvents: true, showObjectChanges: true },
  }).then(result => {
    console.log(JSON.stringify(result));
  });
}