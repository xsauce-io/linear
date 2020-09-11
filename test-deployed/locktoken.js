
const ethers = require('ethers')
const fs = require('fs');
const path = require('path');
const assert = require('assert')
const w3utils = require('web3-utils');
const { BN, toBN, toWei, fromWei, hexToAscii } = require('web3-utils');
const toUnit = amount => toBN(toWei(amount.toString(), 'ether'));

const privatekey = process.env.WALLET_PRIVATE_KEY;
const providerURL = "https://ropsten.infura.io/v3/" + process.env.INFURA_PROJECT_ID;

console.log(privatekey, providerURL)

const provider = new ethers.providers.JsonRpcProvider(providerURL);

const wallet = new ethers.Wallet(privatekey, provider)

function getAbi(tokenname) {
    var abiPath = path.join(__dirname, '../', "build/ropsten/" + tokenname + ".json");
    var fileconten = fs.readFileSync(abiPath)
    var abi = JSON.parse(fileconten).abi;
    return abi;
}

var abilocker = getAbi("LnTokenLocker");

const contractLocker = new ethers.Contract("0x31B62Dd1701B2b93f27F1aB7B37117fF43073f17", abilocker, provider);
let testaddress = "0x27f12994A218B1649FE185D19aAC00310aB198C5"

async function locktoken() {
    console.log("contract address " + contractLocker.address);
    console.log("wallet address", wallet.address);
    
    try {
        let estimateGas = await contractLocker.connect(wallet).estimateGas.sendLockToken(testaddress, toUnit(12345).toString(), "360");
        //var options = { gasPrice: 1000000000, gasLimit: 85000, nonce: 45, value: 0 }
        console.log("estimateGas", estimateGas.toNumber());

        var options = { gasLimit: estimateGas.toNumber()+100 };
        let ret = await contractLocker.connect(wallet).sendLockToken(testaddress, toUnit(12345).toString(), "360", options);
        console.log("mint ret :", ret)
    }
    catch(err) {
        console.log("mint err :", err)
    }
}

async function getdata() {
    let data = await contractLocker.lockData(testaddress);
    console.log("data", data);
}

//locktoken();
getdata();

