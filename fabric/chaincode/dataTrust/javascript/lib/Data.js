'use strict';

class Data {

    

    constructor(dataId, dataOwner, ownerConfidence) {
        this.dataId = dataId;
        this.dataOwner = dataOwner;
        this.ownerConfidence = ownerConfidence;
        this.endorsement=0;
        this.rating= [];
        this.lambda= 0;
        this.trust=null;
        this.type = 'Data';
        return this;
    }
}

module.exports = Data;
