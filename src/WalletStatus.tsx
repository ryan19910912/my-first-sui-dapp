import { useCurrentAccount, useSignTransactionBlock } from "@mysten/dapp-kit";
import { Button, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { OwnedObjects } from "./OwnedObjects";
import { getRollDiceSponsoredTransactionBlock, executeRollDiceSponsoredTransactionBlock } from "./SponsoredTransaction";

export function WalletStatus() {
  const account = useCurrentAccount();
  const { mutate: signTransactionBlock } = useSignTransactionBlock();
  return (
    <Container my="2">
      <Heading mb="2">Wallet Status</Heading>
      {account ? (
        <Flex direction="column">
          <Text>Wallet connected</Text>
          <Text>Address: {account.address}</Text>

          <Button
            // 發送贊助交易按鈕
            onClick={() => {
              // 取得 擲骰子贊助交易區塊
              getRollDiceSponsoredTransactionBlock(account.address).then(txb => {
                if (txb) {
                  // 發送交易區塊給用戶簽名
                  signTransactionBlock(
                    {
                      transactionBlock: txb,
                      chain: 'sui:devnet',
                    },
                    {
                      onSuccess: (result) => {
                        console.log('sign transaction block', result);
                        // 成功後執行該贊助交易區塊，並進行上鏈
                        executeRollDiceSponsoredTransactionBlock(txb, result.signature, result.transactionBlockBytes);
                      },
                    },
                  );
                } else {
                  alert("Get Roll Dice Transaction Block Fail");
                }
              });
            }}
          >
            Sign and execute transaction block
          </Button>
        </Flex>
      ) : (
        <Text>Wallet not connected</Text>
      )}
      <OwnedObjects />
    </Container>
  );
}
