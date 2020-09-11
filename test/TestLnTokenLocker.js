const LnTokenLocker = artifacts.require("LnTokenLocker");

const {CreateLina, exceptionEqual, exceptionNotEqual} = require ("./common.js");

const w3utils = require('web3-utils');
const { BN, toBN, toWei, fromWei, hexToAscii } = require('web3-utils');
const toUnit = amount => toBN(toWei(amount.toString(), 'ether'));

function rpcCallback(a,b,c,d) {
    //console.log("rpcCallback",a,b,c,d);
}

contract('test LnTokenLocker', async (accounts)=> {

    const ac0 = accounts[0];
    const ac1 = accounts[1];
    const ac2 = accounts[2];
    const ac3 = accounts[3];

    const admin = ac0;

    const oneDay = 3600*24;
    const oneYear = oneDay*365;
    const thirtyDay = oneDay*30;

    it('sendLockToken', async ()=> {
        const [lina, linaProxy] = await CreateLina(admin);
        const tl = await LnTokenLocker.new(lina.address, admin);

        await tl.sendLockToken(ac1, toUnit(360), 360);

        await exceptionEqual(
            tl.sendLockToken(ac1, toUnit(360), 360), "this address has locked"
        );

        await tl.sendLockToken(ac2, toUnit(360), 180);

        await exceptionEqual(
            tl.sendLockToken(ac2, toUnit(360), 360), "this address has locked"
        );

        await exceptionEqual(
            tl.sendLockToken(ac3, toUnit(0), 0), "amount can not zero"
        );

        await exceptionEqual(
            tl.sendLockToken(ac3, toUnit(1), 0), "lock days need more than zero"
        );
    });

    it('claimToken', async ()=> {
        const [lina, linaProxy] = await CreateLina(admin);
        const tl = await LnTokenLocker.new(lina.address, admin);

        await tl.sendLockToken(ac1, toUnit(360), 360);
        await tl.sendLockToken(ac2, toUnit(360), 180);

        // before claim
        let mintAmount = toUnit(10000);
        await lina.mint(tl.address, mintAmount);

        await exceptionEqual(
            tl.claimToken(toUnit(0), {from:ac1}), "Invalid parameter amount"
        );

        await exceptionEqual(
            tl.claimToken(toUnit(10), {from:ac3}), "No lock token to claim"
        );
        
        await exceptionEqual(
            tl.claimToken(toUnit(10), {from:ac1}), "need wait for one day at least"
        );

        //-----------------------
        await web3.currentProvider.send({method: "evm_increaseTime", params: [oneDay+1]}, rpcCallback);

        let v = await tl.claimToken(toUnit(10000), {from: ac1});
        //console.log("claimToken", v.tx);

        v = await tl.lockData(ac1);
        assert.equal(v.amount, toUnit(360).toString());
        assert.equal(v.lockDays, (360).toString());
        assert.equal(v.claimedAmount, toUnit(1).toString());
        
        v = await tl.claimToken(toUnit(10000), {from: ac2});
        //console.log("claimToken", v.tx);

        v = await tl.lockData(ac2);
        assert.equal(v.amount, toUnit(360).toString());
        assert.equal(v.lockDays, (180).toString());
        assert.equal(v.claimedAmount, toUnit(2).toString());

        //-----------------------
        web3.currentProvider.send({method: "evm_increaseTime", params: [2*oneDay+1]}, rpcCallback);

        //---
        v = await tl.claimToken(toUnit(10000), {from: ac1});

        v = await tl.lockData(ac1);
        assert.equal(v.amount, toUnit(360).toString());
        assert.equal(v.lockDays, (360).toString());
        assert.equal(v.claimedAmount, toUnit(3).toString());
        
        //---
        v = await tl.claimToken(toUnit(10000), {from: ac2});

        v = await tl.lockData(ac2);
        assert.equal(v.amount, toUnit(360).toString());
        assert.equal(v.lockDays, (180).toString());
        assert.equal(v.claimedAmount, toUnit(6).toString());

        //-----------------------
        web3.currentProvider.send({method: "evm_increaseTime", params: [oneYear+1]}, rpcCallback);

        //---
        v = await tl.claimToken(toUnit(10000), {from: ac1});

        v = await tl.lockData(ac1);
        assert.equal(v.amount, toUnit(360).toString());
        assert.equal(v.lockDays, (360).toString());
        assert.equal(v.claimedAmount, toUnit(360).toString());
        
        //---
        v = await tl.claimToken(toUnit(10000), {from: ac2});

        v = await tl.lockData(ac2);
        assert.equal(v.amount, toUnit(360).toString());
        assert.equal(v.lockDays, (180).toString());
        assert.equal(v.claimedAmount, toUnit(360).toString());

        await exceptionEqual(
            tl.claimToken(toUnit(10), {from:ac1}), "not available claim"
        );
        await exceptionEqual(
            tl.claimToken(toUnit(10), {from:ac2}), "not available claim"
        );
    });

});

