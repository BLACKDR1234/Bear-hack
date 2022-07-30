"reach 0.1";

const Shared = {

  finalOutcome: Fun([Bool], Null),
  informTimeout: Fun([], Null)
};

export const main = Reach.App(() => {
  const Alice = Participant('Alice', {
    ...Shared,
    funds: Fun([], UInt),
    aliceButton: Fun([], Bool),
    deadline: UInt,
    
  });
  const Bob = Participant('Bob', {
    ...Shared,
    acceptFunds: Fun([UInt], Bool),
  });
  init();

  const informTimeout = () => {
    each([Alice, Bob], () => {
      interact.informTimeout();
    });
  };
  const result = (state, t, end, deposit) => {
    if (t >= end && state){
      transfer(deposit).to(Alice)
      each([Alice, Bob], () => {
        interact.finalOutcome(true);
      });
    }
    else{
      transfer(deposit).to(Bob)
      each([Alice, Bob], () => {
        interact.finalOutcome(false);
      });
    }
    transfer(balance()).to(Alice)
  };

  Alice.only(() => {
    const deposit = declassify(interact.funds());
 
  })
  Alice.publish(deposit);
  commit();
  Alice.pay(deposit);
  commit();

  Bob.only(() => {
    const acceptedTerms = declassify(interact.acceptFunds(deposit));
  })
  Bob.publish(acceptedTerms); 
  const deadline = 3;
  const end1 = lastConsensusTime() + deadline
  var [state,t, end] = [false,lastConsensusTime(), end1 ];
  invariant(balance() == deposit);
  while ( t <= end ) {
    commit();
    Alice.only(() => {
     const aliceButton = declassify(interact.aliceButton());
    });

    Alice.publish(aliceButton)
      .timeout(relativeTime(end), () => closeTo(Bob, informTimeout));
    commit();
    Bob.publish();
    [state,t ,end] = [aliceButton,lastConsensusTime()+1, end1];
    continue;
  }
  const p = result( state, t, end,   deposit);
  commit();
});