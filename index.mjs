import { loadStdlib } from "@reach-sh/stdlib";
import * as backend from './build/index.main.mjs';
import { ask, yesno } from '@reach-sh/stdlib/ask.mjs';

const stdlib = loadStdlib(process.env);
const fmt = (x) => stdlib.formatCurrency(x, 4);


const accAlice = await stdlib.newTestAccount(stdlib.parseCurrency(20000));
const accBob = await stdlib.newTestAccount(stdlib.parseCurrency(1000));
console.log('Hello Alice and Bob');
console.log('Launching');

const ctcAlice = accAlice.contract(backend);
const ctcBob = accBob.contract(backend, ctcAlice.getInfo())

const getBalance = async (who) => fmt(await stdlib.balanceOf(who));

console.log(`Alice balance is: ${await getBalance(accAlice)}`)
console.log(`Bob balance is: ${await getBalance(accBob)}`)

const Shared = () =>({
  finalOutcome: (aliceSwitch) => {
    if(aliceSwitch){
      console.log(`COUNTDOWN OVER `)
      console.log(`Alice gets back her funds `)
    }
    else {
      console.log(`COUNTDOWN OVER `)
      console.log(`Alice lost her funds `)
    }
  },
  informTimeout: () => {
    console.log(`${who} observed a timeout`);
  },
});


console.log('Starting backend....');
await Promise.all([
  backend.Alice(ctcAlice, {
    ...Shared('Alice'),
    funds: async () =>{
      const fundsAmt = await ask(
        `Alice How much do you want to put in the vault?`, stdlib.parseCurrency
      )
      return fundsAmt;
    },
    aliceButton: async () =>{
      const choice = await ask(`Alice are you there?`, yesno );
      if(choice){
        console.log('Alice is here');
      }
      else console.log('Alice isnt here ');
    return choice;
    }

  }),
  backend.Bob(ctcBob, {
    ...Shared('Bob'),
    acceptFunds: async (t) =>{
      const vaultTerms = parseInt(t);
      const terms = await ask(`Bob do you accept the terms of ${fmt(vaultTerms)} tokens? : `, yesno);
      if(terms){
        return terms;
      }
      else process.exit();
    }
  })
]);

console.log(`Alice balance is: ${await getBalance(accAlice)}`);
console.log(`Bob balance is: ${await getBalance(accBob)}`);

console.log('GoodBye');
process.exit();