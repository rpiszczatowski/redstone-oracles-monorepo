import { ethers } from 'ethers';
import { INumericDataPoint, NumericDataPoint, RedstonePayload } from 'redstone-protocol';
import { getDeviationPercentage, fetchDataPackages } from "./common";
import config from "../src/config";


let etherscanProvider = new ethers.providers.EtherscanProvider();

type Update = {
    timestamp: number;
    value: number;
    tx: string;
  };

const fetchUpdates = async(adapterAddress: string) => {
    const updates:Update[] = [];
    const history = await etherscanProvider.getHistory(adapterAddress);
    for(var i=1; i<history.length; i++) {
        const tx = history[i];
        const calldata = Uint8Array.from(Buffer.from(tx.data.substring(2), 'hex'));
        const payload = RedstonePayload.parse(calldata);
        const dataPoint:INumericDataPoint = (payload.signedDataPackages[0].dataPackage.dataPoints[0] as NumericDataPoint).toObj();
        updates.push({
            timestamp: tx.timestamp!,
            value: dataPoint.value,
            tx: tx.hash
        });
    }    

    return updates;
}  

const fetchPricesFromDb = async(tokenSymbol:string, start:number, end:number) => {
    const packages = await fetchDataPackages(config.mongoDbUrl, {
        startTimestamp: start,
        endTimestamp: end,
        dataServiceId: 'redstone-primary-prod',
        dataFeedId: tokenSymbol,
      });

    return packages;  
}

const checkDeviationsBetween = async(tokenSymbol: string, deviationThreshold: number, updateStart:Update, updateEnd:Update) => {
    const deviationBetweenUpdates = getDeviationPercentage(
        updateStart.value,
        updateEnd.value
    );
    if (deviationBetweenUpdates < deviationThreshold) {
        //console.log(updateEnd.tx + " Deviation: " + deviationBetweenUpdates);
    } else {
        //console.log("First on chain update: " + new Date(updateStart.timestamp*1000).toLocaleString());
        //console.log("TX: " + updateStart.tx);
        
        //console.log("Second on chain update: " + new Date(updateEnd.timestamp*1000).toLocaleString());
        console.log("TX: " + updateEnd.tx);
        

        const prices = await fetchPricesFromDb(tokenSymbol, (updateStart.timestamp)*1000, updateEnd.timestamp*1000);
        for(var i=0; i<prices.length; i++) {
            const price = prices[i];
            const value = price.dataPoints[0].value as number;
            const deviation = getDeviationPercentage(updateStart.value, value);
            
            if (deviation > deviationThreshold) {
                const delay = updateEnd.timestamp - price.timestampMilliseconds/1000;
                console.log("Delay of publishment: " + delay + " seconds");
                //console.log(new Date(price.timestampMilliseconds).toLocaleString() + " : " + deviation);        
            
                if (delay > 300) {
                    //console.log(new Date(price.timestampMilliseconds).toLocaleString() + " : " + deviation);
                }
                break;
            }
        }
    }

}

const checkUpdates = async (adapterAddress:string, tokenSymbol:string, deviationThreshold:number) => {
    const updates = await fetchUpdates(adapterAddress);
    //console.log("Fetched updates: " + updates.length);
    for(var i=0; i<updates.length-1; i++) {
        await checkDeviationsBetween(tokenSymbol, deviationThreshold, updates[i], updates[i+1]);
    }
}

//SWETH
checkUpdates('0x68ba9602b2aee30847412109d2ee89063bf08ec2', 'SWETH', 0.5);