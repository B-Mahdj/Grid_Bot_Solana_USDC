import { Connection, GetProgramAccountsFilter, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Wallet } from "@project-serum/anchor";

export async function getTokenAccounts(wallet: string, solanaConnection: Connection): Promise<number> {
    var tokenBalanceUSDC: number = 0;
    const filters:GetProgramAccountsFilter[] = [
        {
          dataSize: 165,    //size of account (bytes)
        },
        {
          memcmp: {
            offset: 32,     //location of our query in the account (bytes)
            bytes: wallet,  //our search criteria, a base58 encoded string
          },            
        }];
    const accounts = await solanaConnection.getParsedProgramAccounts(
        TOKEN_PROGRAM_ID, 
        {filters: filters}
    );
    console.log(`Found ${accounts.length} token account(s) for wallet ${wallet}.`);
    accounts.forEach((account, i) => {
        //Parse the account data
        const parsedAccountInfo:any = account.account.data;
        const mintAddress:string = parsedAccountInfo["parsed"]["info"]["mint"];
        const tokenBalance: number = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];
        //Log results
        console.log(`Token Account No. ${i + 1}: ${account.pubkey.toString()}`);
        console.log(`--Token Mint: ${mintAddress}`);
        console.log(`--Token Balance: ${tokenBalance}`);
        console.log(mintAddress);
        if(mintAddress === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v") {
          tokenBalanceUSDC = tokenBalance;
        }
    });
    return tokenBalanceUSDC;
}


export async function getAmountSolToSell(wallet:Wallet, solanaConnection: Connection): Promise<number> {
  const publicKey = new PublicKey(wallet.publicKey);
  var balance =  await solanaConnection.getBalance(publicKey);
  var amountSolToSell = (balance / LAMPORTS_PER_SOL) * +process.env.PERCENTAGE_OF_BALANCE_TO_SELL;
  if(amountSolToSell < +process.env.MIN_AMOUNT_SOL_TO_SELL) {
    return 0;
  }
  else {
    return amountSolToSell;
  }
}


export async function getAmountOfUSDCToSell(wallet:Wallet, solanaConnection: Connection): Promise<number> {
  var usdcBalance = await getTokenAccounts(wallet.publicKey.toString(),solanaConnection);
  console.log("Usdc Balance", usdcBalance);
  var amountOfUSDCToSell = usdcBalance * +process.env.PERCENTAGE_OF_USDC_TO_SELL;
  if(amountOfUSDCToSell < +process.env.MIN_AMOUNT_USDC_TO_SELL) {
    return 0;
  }
  else {
    return amountOfUSDCToSell;
  }
}