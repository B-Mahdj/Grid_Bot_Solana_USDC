import axios from 'axios';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
require('dotenv').config();
const slippage = +process.env.SLIPPAGE;
const DECIMALS_PER_USDC = +process.env.DECIMALS_PER_USDC;

export async function getSolanaPriceFor1SOL(): Promise<number> {
    var amount = LAMPORTS_PER_SOL;
    amount = parseInt(amount.toString());
    try { 
        const { data } = await (
            await axios.get(
                `https://quote-api.jup.ag/v1/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=${amount}&slippage=${slippage}`
            )
        ).data;
        const routes = data;
        return routes[0].outAmountWithSlippage / DECIMALS_PER_USDC;
    }
    catch (error) {
        console.log(error);
    }
}


export async function getSolanaPriceAndBestRouteToSellSol(amount:number): Promise<[number, [any]]> {
    amount = amount * LAMPORTS_PER_SOL;
    amount = parseInt(amount.toString());
    try {
        const { data } = await (
            await axios.get(
                `https://quote-api.jup.ag/v1/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=${amount}&slippage=${slippage}&onlyDirectRoutes=true`
            )
        ).data;
        const routes = data;
        return [(routes[0].outAmountWithSlippage / DECIMALS_PER_USDC), routes[0]];
    }
    catch (error) {
        console.log(error);
    }
}

export async function getSolanaPriceAndBestRouteToBuySol(amount:number): Promise<[number, [any]]> {
    amount = amount * DECIMALS_PER_USDC;
    amount = parseInt(amount.toString());
    try{
        const { data } = await (
            await axios.get(
                `https://quote-api.jup.ag/v1/quote?inputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&outputMint=So11111111111111111111111111111111111111112&amount=${amount}&slippage=${slippage}&onlyDirectRoutes=true`
            )
        ).data;
        const routes = data;
        return [(routes[0].outAmountWithSlippage / LAMPORTS_PER_SOL), routes[0]];
    } catch(e){
        console.log(e);
    }
}