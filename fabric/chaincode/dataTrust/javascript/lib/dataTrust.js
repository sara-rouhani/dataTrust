/*
Today is Aug 10th and it is in a good shape all functions are tested
it is ready for testing in caliper and catch the results.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';
const { Contract } = require('fabric-contract-api');
const { KeyEndorsementPolicy } = require('fabric-shim');
const Data= require('./Data.js');
class DataTrust extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
    
        console.info('============= END : Initialize Ledger ===========');
    }
    async dataAssetExists(ctx, dataID) {
        const buffer = await ctx.stub.getState(dataID);
        return (!!buffer && buffer.length > 0);
    }


    async recordData(ctx, dataID, dataOwner, ownerconfidence){
        const exists = await this.dataAssetExists(ctx, dataID);
        if (exists) {
            throw new Error(`The data asset ${dataID} already exists`);
        }
        
        const data= new Data(dataID, dataOwner, ownerconfidence);
        await ctx.stub.putState(dataID, Buffer.from(JSON.stringify(data)));
        console.info('============= END : Create data ===========');
    }


    async readData(ctx, dataID){
        const exists = await this.dataAssetExists(ctx, dataID);
        if (!exists) {
            throw new Error(`The data asset ${dataID} does not exist`);
        }
        const buffer = await ctx.stub.getState(dataID);
        const asset = JSON.parse(buffer.toString());
        return asset;
    }
    async queryDataByOnwer(ctx, dataOwner_) {
        console.info("Enter: queryDataByOwner");
        console.log("queryDataByOnwer, input parameter: ", dataOwner_, typeof dataOwner_);
        let response = null;

        let queryString = {
            selector: {
                type: 'Data',
                dataOwner: dataOwner_
            },
            use_index: ['_design/typeAndDataOwnerIndexDoc', 'typeAndAssetOwnerIndex']
        };
        console.log(queryString);
        console.log(typeof queryString);
        response = await this.queryWithQueryString(ctx, JSON.stringify(queryString));
        return response;
    }

    async countOwnersData(ctx, owner){
        console.log("counterOwnersData input parameter ", owner, owner)
        let dataownerData= await this.queryDataByOnwer(ctx,owner);
        let JsonData= JSON.parse(JSON.stringify(dataownerData));
         return JsonData.length;  
     }
 
    async queryWithQueryString(ctx, queryString) {
        console.info("Enter: queryWithQueryString");
        let resultsIterator = await ctx.stub.getQueryResult(queryString);

        let allResults = [];

        // eslint-disable-next-line no-constant-condition
        while (true) {
            let res = await resultsIterator.next();

            if (res.value && res.value.value.toString()) {
                let jsonRes = {};

                jsonRes.Key = res.value.key;

                try {
                    jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    jsonRes.Record = res.value.value.toString('utf8');
                }

                allResults.push(jsonRes);
            }
            if (res.done) {
                await resultsIterator.close();
                return allResults;
            }
        }
    }
    //this works
    async allOwners1(ctx){
        let alldata = await this.queryAll(ctx);
        let allDataJson= JSON.parse(alldata.toString());
        let allOwners=[]
        console.log(allDataJson);
        allDataJson.forEach(element => {
          if (element.Record.dataOwner != null) {  
          allOwners.push(element.Record.dataOwner);
        }});
    
        let unique = allOwners.filter((item, i, ar) => ar.indexOf(item) === i);
        return unique;
    }

    async minmax(ctx){
        let allOwners = await this.allOwners1(ctx);
        let allOwnersJSON= JSON.parse(JSON.stringify(allOwners));
        let numTX=[]
        for (var i=0; i<allOwners.length; i++){
            let owner= allOwnersJSON[i];
            let ownerString= owner.toString();
            console.log("ownerString:", ownerString, typeof ownerString);
            let response= await this.countOwnersData(ctx, ownerString);
            numTX.push(response);
        }
        let min = Math.min(...numTX);
        let max=  Math.max(...numTX);
        let minmax= [min,max]
       
        await ctx.stub.putState('minmaxID', Buffer.from(JSON.stringify(minmax)));
        console.info('============= END : Create data ===========');
        return minmax;
    }
   async reputation(ctx, user){
    let userTX= await this.countOwnersData(ctx,user);
    let buffer= await ctx.stub.getState('minmaxID');
    const minmax = JSON.parse(buffer.toString());
   // let minmax= await this.minmax(ctx);
    let min= minmax[0];
    let max=minmax[1];
    return (userTX-min)/(max-min);
   }
   /*
    async allOwners2(ctx){
        let alldata = await this.queryAll(ctx);
        let allDataJson= JSON.parse(alldata.toString());
        let allOwners=[]
        console.log(allDataJson);
        for (var i=0; allDataJson.length; i++)
        {
            allOwners.push (allDataJson[i].Record.dataOwner);
        }
        return allOwners;
    }
*/
    async queryAll(ctx) {
        const iterator = await ctx.stub.getStateByRange('','');

        const allResults=[];
        const allKeys=[];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }

                allResults.push({ Key, Record });
                allKeys.push(Key);
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    } 
    async endorsUser(ctx, user){
        const exists = await this.dataAssetExists(ctx, user);
        if (!exists) {
            await ctx.stub.putState(user,Buffer.from('1'));
            return
        }

        let buffer = await ctx.stub.getState(user);
        let endorsed=parseInt(buffer.toString());
        console.log(endorsed);
        console.log(typeof endorsed);
        endorsed =endorsed+1;
        await ctx.stub.putState(user,Buffer.from(endorsed.toString()));
    }
    //if user does not exist return 0 for user endorsement
    async getUserEndorsement(ctx, user){
        console.log("Enter: getUserEndorsement");
        let exists = await this.dataAssetExists(ctx, user);
        if (!exists) {
            response.err = `endorsement for user ${user} does not exist`;
            return response;
        }

        let buffer = await ctx.stub.getState(user);
        let response = JSON.parse(buffer.toString());

        return response;
    }
    async endorsData(ctx,dataID){
        console.log("Enter: endorsData");
        const buffer = await ctx.stub.getState(dataID);
        if (!buffer) {
            throw new Error(`The data asset ${dataID} does not exist`);
        }
        let dataParsed = JSON.parse(buffer.toString()); 
        console.log("dataParsed:", dataParsed);
        console.log("dataParsed.endorsement:", dataParsed.endorsement);
        dataParsed.endorsement+=1;
        await ctx.stub.putState(dataID, Buffer.from(JSON.stringify(dataParsed)));
    }

    async ratedata(ctx,dataID, rating){
        console.log("Enter: rateData");
        const buffer = await ctx.stub.getState(dataID);
        if (!buffer) {
            throw new Error(`The data asset ${dataID} does not exist`);
        }
        let dataParsed = JSON.parse(buffer.toString());
        dataParsed.rating.push(rating);
        await ctx.stub.putState(dataID, Buffer.from(JSON.stringify(dataParsed)));
    }
    async getDataRating(ctx, dataID){
        console.log("Enter: getDataRating");
        const buffer = await ctx.stub.getState(dataID);
        if (!buffer) {
            throw new Error(`The data asset ${dataID} does not exist`);
        }
        var dataParsed = JSON.parse(buffer.toString()); 
        var rateArray= dataParsed.rating;
        if (rateArray.length ==0){
            return 0;
        }
        var total=0
        for(var i = 0; i < rateArray.length; i++) {
            console.log ("typeof rateArray[i]:", typeof rateArray[i]);
            console.log("parseInt(rateArray[i])", parseInt(rateArray[i]));
            console.log("type parseInt(rateArray[i])", typeof parseInt(rateArray[i]));
            total += parseFloat(rateArray[i]);
        }
        console.log("total:",total);
        console.log("rateArray.length:",rateArray.length);
        return (total / rateArray.length);
    }
    async getDataEndorsement(ctx,dataID){
        console.log("Enter: getDataEndorsement");
        const buffer = await ctx.stub.getState(dataID);
        if (!buffer) {
            throw new Error(`The data asset ${dataID} does not exist`);
        }
        let dataParsed = JSON.parse(buffer.toString()); 
        return dataParsed.endorsement;
    }
    async endorsement(ctx, user, dataID, alpha, beta){
        let userEndors= await this.getUserEndorsement(ctx,user);
        let dataEndors= await this.getDataEndorsement(ctx,dataID);
        let power = (-1*(userEndors + alpha*(dataEndors)))/beta;
        console.log("power", power);
        return 1- Math.pow(Math.E, power);
    }
    async getDelta(ctx, dataID){
        console.log("Enter: getDataRating");
        const buffer = await ctx.stub.getState(dataID);
        if (!buffer) {
            throw new Error(`The data asset ${dataID} does not exist`);
        }
        var dataParsed = JSON.parse(buffer.toString()); 
        var rateArray= dataParsed.rating;
        if (rateArray.length ==0){
            return 0;
        }
        var total=0
        for(var i = 0; i < rateArray.length; i++) {
            console.log ("typeof rateArray[i]:", typeof rateArray[i]);
            console.log("parseInt(rateArray[i])", parseInt(rateArray[i]));
            console.log("type parseInt(rateArray[i])", typeof parseInt(rateArray[i]));
            total += parseFloat(rateArray[i]);
        }
        console.log("total:",total);
        console.log("rateArray.length:",rateArray.length);
        let rating = total / rateArray.length;
        let confidence = dataParsed.ownerConfidence;

        return rating-confidence;
    }
    
    async getlambda(ctx,dataID, phi){
        console.log("Enter: getDataRating");
        const buffer = await ctx.stub.getState(dataID);
        if (!buffer) {
            throw new Error(`The data asset ${dataID} does not exist`);
        }
        var dataParsed = JSON.parse(buffer.toString()); 
        var rateArray= dataParsed.rating;
        if (rateArray.length ==0){
            return 0;
        }
        var total=0
        for(var i = 0; i < rateArray.length; i++) {
            total += parseFloat(rateArray[i]);
        }
        console.log("total:",total);
        console.log("rateArray.length:",rateArray.length);
        var rating = total / rateArray.length;
        var confidence = dataParsed.ownerConfidence;
        var delta= rating - confidence;
        var lambdaOld = dataParsed.lambda;
       if (delta >= 0){
            var parameter2_1 = lambdaOld + phi*(1-delta);
            if (parameter2_1<=1){
                dataParsed.lambda=parameter2_1;
                await ctx.stub.putState(dataID, Buffer.from(JSON.stringify(dataParsed)));
                return parameter2_1;
            }
            else{
                dataParsed.lambda=1;
                await ctx.stub.putState(dataID, Buffer.from(JSON.stringify(dataParsed)));
                return 1;
            }
       }
       else{
            var parameter2_2 = lambdaOld + phi*delta;
            if (parameter2_2>=0) {
                dataParsed.lambda=parameter2_2;
                await ctx.stub.putState(dataID, Buffer.from(JSON.stringify(dataParsed)));
                return parameter2_2;
        }
            else {
                dataParsed.lambda=0;
                await ctx.stub.putState(dataID, Buffer.from(JSON.stringify(dataParsed)));
                return 0;
            }
       }
    }

    async dataTrust(ctx, dataId, alpha, beta, phi){
        const buffer = await ctx.stub.getState(dataId);
        let dataParsed = JSON.parse(buffer.toString()); 
        let owner= dataParsed.dataOwner;
        let reputation= await this.reputation(ctx,owner);
        let endorsement= await this.endorsement(ctx, owner, dataId, alpha, beta);
        let lambda= await this.getlambda(ctx, dataId, phi);
        console.log("dataParsed:", dataParsed);
        console.log("dataParsed.endorsement:", dataParsed.endorsement);
        //dataParsed.endorsement+=1;
        let dataTrust={
            "reputation": reputation,
            "endorsement": endorsement,
            "lambda": lambda
        }
        dataParsed.trust=dataTrust;
        await ctx.stub.putState(dataId, Buffer.from(JSON.stringify(dataParsed)));
        return dataTrust;
    }
    
    async newwith2endorser(ctx, dataID, dataValue) {
     await ctx.stub.putState(dataID, Buffer.from(dataValue));
     let ep = new KeyEndorsementPolicy();
     ep.addOrgs("MEMBER", "Org2MSP");
     ep.addOrgs("MEMBER", "Org1MSP");
    await ctx.stub.setStateValidationParameter(dataID, ep.getPolicy());
     
    var clientID= ctx.clientIdentity.getMSPID();
    return `Successfully added new data and this is org identity: ${clientID.toString()}`;
    }
    async with2endorserOrg3Org1(ctx, dataID, dataValue) {
        await ctx.stub.putState(dataID, Buffer.from(dataValue));
        let ep = new KeyEndorsementPolicy();
        ep.addOrgs("PEER", "Org3MSP");
        ep.addOrgs("MEMBER", "Org1MSP");
       await ctx.stub.setStateValidationParameter(dataID, ep.getPolicy());
        
       var clientID= ctx.clientIdentity.getMSPID();
       return `Successfully added new data and this is org identity: ${clientID.toString()}`;
       }
       async with2endorserOrg3Org2(ctx, dataID, dataValue) {
        await ctx.stub.putState(dataID, Buffer.from(dataValue));
        let ep = new KeyEndorsementPolicy();
        ep.addOrgs("PEER", "Org3MSP");
        ep.addOrgs("MEMBER", "Org2MSP");
       await ctx.stub.setStateValidationParameter(dataID, ep.getPolicy());
        
       var clientID= ctx.clientIdentity.getMSPID();
       return `Successfully added new data and this is org identity: ${clientID.toString()}`;
       }
    async with3endorser(ctx, dataID, dataValue) {
        await ctx.stub.putState(dataID, Buffer.from(dataValue));
        let ep = new KeyEndorsementPolicy();
        ep.addOrgs("MEMBER", "Org2MSP");
        ep.addOrgs("MEMBER", "Org1MSP");
        ep.addOrgs("PEER", "Org3MSP");
       await ctx.stub.setStateValidationParameter(dataID, ep.getPolicy());
        
       var clientID= ctx.clientIdentity.getMSPID();
       return `Successfully added new data and this is org identity: ${clientID.toString()}`;
       }

    async with1endorser(ctx, dataID, dataValue) {
        await ctx.stub.putState(dataID, Buffer.from(dataValue));
        let ep = new KeyEndorsementPolicy();
        
        ep.addOrgs("MEMBER", "Org1MSP");
       await ctx.stub.setStateValidationParameter(dataID, ep.getPolicy());
        
       var clientID= ctx.clientIdentity.getMSPID();
       return `Successfully added new data and this is org identity: ${clientID.toString()}`;
       }
async addEnorser(ctx, dataID, dataValue, EPOrg){
    await ctx.stub.putState(dataID, Buffer.from(dataValue));
    let ep = new KeyEndorsementPolicy();
    ep.addOrgs("ADMIN", EPOrg);
    await ctx.stub.setStateValidationParameter(dataID, ep.getPolicy());
  const buffer = ep.getPolicy();
  const bufferStr= buffer.toString();
  console.log(buffer);
    return "Successfully added new data and policy is" + bufferStr ;
}
    async getEP(ctx, key){
    const buffer= await ctx.stub.getStateValidationParameter(key);
       console.log(buffer);
       const policy= buffer.toString();
      return policy;
    }
    async updateData(ctx, dataID, newValue){
       try { await ctx.stub.putState(dataID, Buffer.from(newValue));
            return "successfully updated";
       }
    catch (err) {
        console.log(err);
        return err
    }
    }
    async queryAll(ctx) {
        const iterator = await ctx.stub.getStateByRange('','');

        const allResults=[];
        const allKeys=[];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }

                allResults.push({ Key, Record });
                allKeys.push(Key);
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    } 

    async queryFromConfirm(ctx, key){
      let bufferResp =  await ctx.stub.invokeChaincode('confirm', ['queryValue', key], ctx.stub.getChannelID());
      var jsonresp = JSON.stringify(bufferResp);
      var JSONresp = JSON.parse(jsonresp);
      const data = Buffer.from(JSONresp.payload.buffer.data);
      console.log(`this is dataaaa: ${data}`);
      console.log('data type is:', typeof data);
   
      return data.toString('utf8');
    }
    async listFuncAndPara(ctx){
        let ret = ctx.stub.getFunctionAndParameters();
        console.log(ret);
        return ret;
    }
   
}

module.exports = DataTrust;