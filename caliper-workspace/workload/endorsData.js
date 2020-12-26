/*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');
var dataList=[];

for (var i=1;i<500; i++){
    dataList.push('1' + 'data' + i.toString());
    console.log(dataList);
    }


/**
 * Workload module for the benchmark round.
 */
class CreateCarWorkload extends WorkloadModuleBase {
    /**
     * Initializes the workload module instance.
     */
    constructor() {
        super();
        this.txIndex = 0;
        
    }
    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);

        //await helper.createCar(this.sutAdapter, this.sutContext, this.roundArguments);
    }
    /**
     * Assemble TXs for the round.
     * @return {Promise<TxStatus[]>}
     */
    async submitTransaction() {
       // this.txIndex++;
       let assetNumber = dataList[Math.floor(Math.random() * dataList.length)];
        const myArgs = {
            contractId: 'dataTrust',
            contractFunction: 'endorsData',
            invokerIdentity: 'User1',
            contractArguments: [assetNumber],
            readOnly: false,
            timeout: 250
        };
        if (this.txIndex === this.roundArguments.assets) {
            this.txIndex = 0;
        }
        await this.sutAdapter.sendRequests(myArgs);
    }
}

/**
 * Create a new instance of the workload module.
 * @return {WorkloadModuleInterface}
 */
function createWorkloadModule() {
    return new CreateCarWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
