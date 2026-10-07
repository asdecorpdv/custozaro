(function(root){
  'use strict';
  const defaults={cost:0,price:0,units:1,margin:40,nf:12,extraRate:0,adsRate:0,adsMode:'none',affiliate:0,advance:0,packaging:0,freight:0,other:0,returnFee:0,discountRate:0,discount:0,period:'oct2026',seller:'standard'};
  const round=n=>Math.round((n+Number.EPSILON)*100)/100;
  function validate(input){
    const s={...defaults,...input};
    for(const k of Object.keys(defaults).filter(k=>typeof defaults[k]==='number')){s[k]=Number(s[k]);if(!Number.isFinite(s[k])||s[k]<0)throw Error('Informe valores positivos e números válidos.');}
    for(const k of ['margin','nf','extraRate','adsRate','affiliate','advance','discountRate'])if(s[k]>=100)throw Error('Percentuais devem ser menores que 100%.');
    if(!Number.isInteger(s.units)||s.units<1)throw Error('Quantidade do kit deve ser um inteiro maior que zero.');
    if(!['oct2026','sep2026'].includes(s.period)||!['standard','cpfHigh'].includes(s.seller)||!['none','reserve','spend'].includes(s.adsMode))throw Error('Selecione uma regra válida.');
    return s;
  }
  function fee(price,s){
    if(s.seller==='cpfHigh'&&price<12)throw Error('CPF acima de 450 pedidos: confirme a cobrança regressiva abaixo de R$ 12 no extrato antes de simular.');
    let rate=price<80?20:14, fixed=price<80?(s.period==='oct2026'?4.5:4):price<100?16:price<200?20:26;
    if(price<(s.period==='oct2026'?9:8))fixed=price/2;
    if(s.seller==='cpfHigh')fixed+=3;
    return {rate,fixed};
  }
  function calculate(input,catalogue){
    const s=validate(input),price=round(Math.max(0,(catalogue===undefined?s.price:catalogue)*(1-s.discountRate/100)-s.discount));
    const tier=fee(price,s),commission=round(price*tier.rate/100),fixed=round(tier.fixed),extra=round(price*s.extraRate/100),affiliate=round(price*s.affiliate/100);
    const ads=s.adsMode==='none'?0:round(price*s.adsRate/100),reserve=s.adsMode==='reserve'?ads:0,marketing=s.adsMode==='spend'?ads:0;
    const beforeAdvance=round(price-commission-fixed-extra-affiliate-reserve),advance=round(Math.max(0,beforeAdvance)*s.advance/100);
    const repasse=round(beforeAdvance-advance-s.returnFee-s.freight),nf=round(price*s.nf/100),production=round(s.cost*s.units),cost=round(production+s.packaging+s.other),profit=round(repasse-nf-cost-marketing);
    return {price,tier,commission,fixed,extra,affiliate,ads,reserve,marketing,advance,repasse,nf,production,cost,profit,margin:price?profit/price*100:0};
  }
  // Examine each cent across the fee boundaries: deductions jump at 80, 100 and 200.
  // Within a band use the unrounded linear model, then verify the rounding neighborhood.
  function suggest(input,target){
    const s=validate(input),m=target===undefined?s.margin:target;
    const bands=[[s.seller==='cpfHigh'?12:0,s.period==='oct2026'?9:8,true],[s.seller==='cpfHigh'?12:(s.period==='oct2026'?9:8),80,false],[80,100,false],[100,200,false],[200,Infinity,false]];
    let best=null;
    for(const [low,high,half] of bands){
      if(low>=high)continue;
      const f=fee(Math.max(low,0),s),a=s.advance/100,ad=s.adsMode==='none'?0:s.adsRate/100;
      const walletRate=(1-f.rate/100-s.extraRate/100-s.affiliate/100-(s.adsMode==='reserve'?ad:0)-(half?.5:0));
      const coefficient=walletRate*(1-a)-s.nf/100-(s.adsMode==='spend'?ad:0)-m/100;
      const constant=(half?(s.seller==='cpfHigh'?3:0):f.fixed)*(1-a)+s.returnFee+s.freight+s.cost*s.units+s.packaging+s.other;
      if(coefficient<=0)continue;
      const effective=Math.max(low,constant/coefficient),raw=(effective+s.discount)/(1-s.discountRate/100);
      const lower=Math.max(1,Math.floor((low+s.discount)/(1-s.discountRate/100)*100)-2,Math.floor(raw*100)-Math.ceil(12/coefficient));
      const upper=Math.ceil(raw*100)+Math.ceil(12/coefficient)+3;
      for(let cents=lower;cents<=upper;cents++){
        if(best!==null&&cents/100>=best)break;
        let r;try{r=calculate(s,cents/100);}catch{continue;}
        if(r.price<low||r.price>=high||r.price<=0)continue;
        if(r.profit+1e-9>=r.price*m/100){best=cents/100;break;}
      }
    }
    return best;
  }
  const api={defaults,validate,fee,calculate,suggest};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.ForgeShopee=api;
})(typeof globalThis!=='undefined'?globalThis:this);
