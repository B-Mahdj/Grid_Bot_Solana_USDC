import { Connection, GetProgramAccountsFilter, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Wallet } from "@project-serum/anchor";

export async function getUSDCBalance(wallet: string, solanaConnection: Connection): Promise<number> {
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
    accounts.forEach((account, i) => {
        //Parse the account data
        const parsedAccountInfo:any = account.account.data;
        const mintAddress:string = parsedAccountInfo["parsed"]["info"]["mint"];
        const tokenBalance: number = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];
        if(mintAddress === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v") {
          tokenBalanceUSDC = tokenBalance;
        }
    });
    return tokenBalanceUSDC;
}

export async function getWSolBalance(wallet: string, solanaConnection: Connection): Promise<number> {
  var tokenBalanceWSol: number = 0;
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
  accounts.forEach((account, i) => {
      //Parse the account data
      const parsedAccountInfo:any = account.account.data;
      const mintAddress:string = parsedAccountInfo["parsed"]["info"]["mint"];
      const tokenBalance: number = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];
      if(mintAddress === "So11111111111111111111111111111111111111112") {
        tokenBalanceWSol = tokenBalance;
      }
  });
  return tokenBalanceWSol;
}


export async function getAmountSolToSell(wallet:Wallet, solanaConnection: Connection): Promise<number> {
  var wsolBalance = await getWSolBalance(wallet.publicKey.toString(),solanaConnection);
  console.log("WSol Balance", wsolBalance);
  var amountSolToSell = wsolBalance * +process.env.PERCENTAGE_OF_BALANCE_TO_SELL;
  if(amountSolToSell > +process.env.MIN_AMOUNT_SOL_TO_SELL && amountSolToSell < +process.env.MAX_AMOUNT_SOL_TO_SELL) {
    return amountSolToSell;
  }
  else if (amountSolToSell > +process.env.MAX_AMOUNT_SOL_TO_SELL) {
    return +process.env.MAX_AMOUNT_SOL_TO_SELL;
  }
  else {
    return 0;
  }
}


export async function getAmountOfUSDCToSell(wallet:Wallet, solanaConnection: Connection): Promise<number> {
  var usdcBalance = await getUSDCBalance(wallet.publicKey.toString(),solanaConnection);
  console.log("Usdc Balance", usdcBalance);
  var amountOfUSDCToSell = usdcBalance * +process.env.PERCENTAGE_OF_USDC_TO_SELL;
  if(amountOfUSDCToSell > +process.env.MIN_AMOUNT_USDC_TO_SELL && amountOfUSDCToSell < +process.env.MAX_AMOUNT_USDC_TO_SELL) {
    return amountOfUSDCToSell;
  }
  else if (amountOfUSDCToSell > +process.env.MAX_AMOUNT_USDC_TO_SELL) {
    return +process.env.MAX_AMOUNT_SOL_TO_SELL;
  }
  else {
    return 0;
  }
}