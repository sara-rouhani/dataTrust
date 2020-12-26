/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('User1');
        if (!identity) {
            console.log('An identity for the user "User1" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'User1', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('dataTrust');

        var currentTime= Date.now();

        console.log(currentTime);
        var i=0;
        var arr= new Array();
/*
        while(i<100){
            var currentTime= Date.now();
            let dataID= 'dataIDD'+i;
            console.log(dataID);
            let result = await contract.submitTransaction('newNew', 'data11', '200', 'Org1MSP');
           // var result=  await contract.submitTransaction('updateData', dataID, '190');   
            var currentTime3 = Date.now();
            var diff= currentTime3 - currentTime;
	     arr.push(diff);       
            console.log(result.toString());
                 i++;
            }


var stream = fs.createWriteStream('twoEndorsersdiff.txt');
stream.on('error', function(err) { conosle.log(err);});
arr.forEach(function(element) { stream.write(element + '\n'); });
stream.end();

*/

          
//   var result = await contract.submitTransaction('newwith1endorser', 'dataa1', '200');

// var result = await contract.submitTransaction('newwith2endorserOrg3Org2', 'dataa5', '200');
// var result = await contract.submitTransaction('newwith3endorser', 'dataa2', '200');
// var result=  await contract.submitTransaction('updateData', 'dataa2', '110');
 //let EP=  await contract.submitTransaction('getEP', 'data1'); 
  //  let EP=  await contract.submitTransaction('getEP', 'dataa7'); 
 let result =  await contract.submitTransaction('queryAll');

  // let result = await contract.submitTransaction('newNew', 'dataa6', '200', 'Org3MSP');
   // let result = await contract.submitTransaction('newtest');
    //let result = await contract.submitTransaction('listFuncAndPara');


    
//var result = await contract.submitTransaction('recordData', 'd4', 'Emma', '0.7' );
//var result = await contract.submitTransaction('readData', 'd1');
//var result = await contract.submitTransaction('allOwners1');
//var result = await contract.submitTransaction('queryDataByOnwer', 'sara');
//var result = await contract.submitTransaction('countOwnersData', null);
//var result = await contract.submitTransaction('minmax');
//var result = await contract.submitTransaction('reputation', 'Sara');

//var result = await contract.submitTransaction('endorsUser', 'Sara');
//var result = await contract.submitTransaction('getUserEndorsement', 'sara');
//var result = await contract.submitTransaction('getDataEndorsement', 'dataa7');
//var result = await contract.submitTransaction('endorsement', 'Ema','d1', 3,10 );

//var result = await contract.submitTransaction('ratedata', 'd1', 0.9);
//var result = await contract.submitTransaction('getDataRating', 'dataa7');
//var result = await contract.submitTransaction('getDelta', 'd1');

//var result = await contract.submitTransaction('getlambda', 'd1', 1);

//var result = await contract.submitTransaction('dataTrust', 'd1', 3, 10, 1);

//let resultstr=  JSON.parse(result.toString());
//console.log(resultstr.length);
//let unique = resultstr.filter((item, i, ar) => ar.indexOf(item) === i);
//console.log(unique)
  console.log(result.toString());
   //console.log(typeof result );

 //   let  jsondata=JSON.parse(result.toString());
 //    console.log(jsondata[5].Record.dataOwner);


       //console.log(EP.toString());
        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

main();
