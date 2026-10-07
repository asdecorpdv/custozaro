(function(root){
  'use strict';
  function create(options){
    let latest=null,confirmed=null,running=null,timer=null,error=null,failures=0,disposed=false;
    const copy=v=>JSON.parse(JSON.stringify(v));
    const equal=(a,b)=>options.signature(a)===options.signature(b);
    const cancel=()=>{if(timer!==null){options.clearTimeout(timer);timer=null;}};
    const pending=()=>latest!==null;
    const notify=()=>options.status({pending:pending(),saving:!!running,error,failures});
    function remember(){if(latest!==null)options.remember({base:confirmed,data:latest});}
    function schedule(delay){cancel();if(!disposed&&latest!==null)timer=options.setTimeout(()=>{timer=null;void drain();},delay);}
    function enqueue(data){
      if(disposed)return;
      const snapshot=copy(data);
      if(latest!==null&&equal(latest,snapshot))return;
      if(!running&&confirmed!==null&&equal(confirmed,snapshot)){latest=null;error=null;cancel();options.clear();notify();return;}
      latest=snapshot;error=null;failures=0;remember();notify();schedule(options.delay??600);
    }
    async function drain(){
      cancel();if(disposed)return false;if(running)return running;
      if(latest===null)return true;
      running=Promise.resolve().then(async()=>{
        while(latest!==null&&!disposed){
          const sent=copy(latest);
          try{await options.save(sent);}
          catch(e){error=e;failures++;remember();return false;}
          if(disposed)return false;
          confirmed=sent;error=null;failures=0;
          if(equal(latest,sent)){latest=null;options.clear();}else remember();
        }
        return true;
      });
      notify();const success=await running;running=null;notify();
      if(!success&&latest!==null&&!disposed&&options.retryable(error))schedule([1000,2000,5000,10000,30000,60000][Math.min(failures-1,5)]);
      return success;
    }
    function reset(base){if(running)throw Error('Aguarde o salvamento terminar.');cancel();latest=null;confirmed=copy(base);error=null;failures=0;notify();}
    function dispose(){disposed=true;cancel();}
    return {enqueue,flush:drain,reset,dispose,pending,busy:()=>!!running};
  }
  const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ForgeCloudAutosave=api;
})(typeof globalThis!=='undefined'?globalThis:this);
