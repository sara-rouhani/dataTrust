'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

class MyWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.txIndex = 0;
        this.txIndex2 = 0;
    }
    
    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);
        this.txIndex++;
        let assetNumber = 'new' + this.workerIndex + 'Asset' + this.txIndex.toString();
        
            const request = {
                contractId: this.roundArguments.contractId,
                contractFunction: 'newCreatData',
                invokerIdentity: 'User1',
                contractArguments: [assetNumber,'150', 'Org3MSP'],
                readOnly: false
            };

            await this.sutAdapter.sendRequests(request);
      
    }
    
    async submitTransaction() {
        this.txIndex2++;
        let assetNumber = 'new' + this.workerIndex + 'Asset' + this.txIndex2.toString();
        const myArgs = {
            contractId: this.roundArguments.contractId,
            contractFunction: 'updateData',
            invokerIdentity: 'User1',
            contractArguments: [assetNumber,'160'],
            readOnly: false
        };

        await this.sutAdapter.sendRequests(myArgs);
    }
    
    
}

function createWorkloadModule() {
    return new MyWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;