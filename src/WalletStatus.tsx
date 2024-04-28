import { useCurrentAccount, useSignTransactionBlock  } from "@mysten/dapp-kit";
import { Button, Container, Flex, Heading, Text } from "@radix-ui/themes";
import { OwnedObjects } from "./OwnedObjects";
import { getRollDiceSponsoredTransactionBlock, executeRollDiceSponsoredTransactionBlock } from "./SponsoredTransaction";

export function WalletStatus() {
  const account = useCurrentAccount();
  const { mutate: signTransactionBlock  } = useSignTransactionBlock ();
  return (
    <Container my="2">
      <Heading mb="2">Wallet Status</Heading>
      {account ? (
        <Flex direction="column">
          <Text>Wallet connected</Text>
          <Text>Address: {account.address}</Text>
          <Button
							onClick={() => {
                getRollDiceSponsoredTransactionBlock(account.address).then(txb => {
                  if (txb){
                    signTransactionBlock (
                      {
                        transactionBlock: txb,
                        chain: 'sui:devnet',
                      },
                      {
                        onSuccess: (result) => {
                          console.log('executed transaction block', result);
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
