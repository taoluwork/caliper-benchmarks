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

const path = require('path');
const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

/**
 * Workload module for the benchmark round.
 */
class GenerateWorkload extends WorkloadModuleBase {
    /**
     * Initializes the workload module instance.
     */
    constructor() {
        super();
        this.index = 0;
        this.file = '';
        this.accountList = [];
    }

    /**
     * Generates simple workload
     * @return {Object} array of json objects
     */
    _generateWorkload() {
        let fromIndex = this.index % this.accountList.length;
        let toIndex = (this.index + Math.floor(this.accountList.length / 2)) % this.accountList.length;
        let value = Math.floor(Math.random() * 100);
        let args = {
            'transaction_type': 'userTransfer(string,string,uint256)',
            'from': this.accountList[fromIndex].accountID,
            'to': this.accountList[toIndex].accountID,
            'num': value
        };

        this.index++;
        this.accountList[fromIndex].balance -= value;
        this.accountList[toIndex].balance += value;
        return args;
    }

    /**
     * Initialize the workload module with the given parameters.
     * @param {number} workerIndex The 0-based index of the worker instantiating the workload module.
     * @param {number} totalWorkers The total number of workers participating in the round.
     * @param {number} roundIndex The 0-based index of the currently executing round.
     * @param {Object} roundArguments The user-provided arguments for the round from the benchmark configuration file.
     * @param {BlockchainInterface} sutAdapter The adapter of the underlying SUT.
     * @param {Object} sutContext The custom context object provided by the SUT adapter.
     * @async
     */
    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);

        const addUser = require('./addUser');
        this.accountList = addUser.accountList;
        this.file = path.join(__dirname, `.${this.workerIndex}.transactions`);
    }

    /**
     * Assemble TXs for the round.
     * @return {Promise<TxStatus[]>}
     */
    async submitTransaction() {
        let workload = this._generateWorkload();
        return this.sutAdapter.bcObj.generateRawTransaction('dagtransfer', workload, this.file);
    }
}

/**
 * Create a new instance of the workload module.
 * @return {WorkloadModuleInterface}
 */
function createWorkloadModule() {
    return new GenerateWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
