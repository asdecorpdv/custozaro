/* Auth tokens are managed by Firebase Auth. Firestore stores one workspace per user. */
window.ForgeServicesReady=(async()=>{
  const [{initializeApp},{getAuth,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut:firebaseSignOut},{getFirestore,doc,getDoc,runTransaction,serverTimestamp}]=await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js')
  ]);
  const app=initializeApp(window.FORGE_FIREBASE),auth=getAuth(app),db=getFirestore(app);
  let session=null,revision=0;
  const workspaceRef=userId=>doc(db,'workspaces',userId);
  const copy=value=>JSON.parse(JSON.stringify(value));
  function fail(error){
    const code=error?.code||'';
    if(code==='auth/invalid-credential'||code==='auth/user-not-found'||code==='auth/wrong-password'||code==='auth/email-already-in-use')return Error('E-mail ou senha inválidos. Entre novamente.');
    if(code==='auth/weak-password')return Error('A senha precisa ter pelo menos 6 caracteres.');
    if(code==='auth/too-many-requests')return Error('Muitas tentativas de login. Aguarde alguns minutos e tente novamente.');
    if(code==='permission-denied')return Error('Sem permissão para acessar este workspace. Verifique o login.');
    if(code==='unavailable'||code==='deadline-exceeded')return Error('O Firebase demorou para responder. Tente novamente em alguns minutos.');
    return Error(error?.message||'Não foi possível conectar ao Firebase. Tente novamente.');
  }
  function validate(d){
    if(!d||!Array.isArray(d.products)||!Array.isArray(d.inputs)||!Array.isArray(d.categories)||!Array.isArray(d.history)||!d.laborSettings)throw Error('Backup inválido.');
    if(!Number.isFinite(d.laborSettings.salary)||d.laborSettings.salary<0||!Number.isFinite(d.laborSettings.hours)||d.laborSettings.hours<=0)throw Error('Parâmetros de mão de obra inválidos.');
    const ok=n=>Number.isSafeInteger(n)&&n>0;
    if(d.products.some(p=>!ok(p.id)||typeof p.name!=='string'||typeof p.code!=='string'||!Array.isArray(p.components)||!Array.isArray(p.labor))||d.inputs.some(i=>!ok(i.id)||typeof i.name!=='string'||typeof i.code!=='string'||!(i.purchaseQty>0)||!Number.isFinite(i.cost)||i.cost<0))throw Error('Cadastros inválidos.');
    const ids=new Set(d.inputs.map(i=>i.id));
    if(ids.size!==d.inputs.length||new Set(d.products.map(p=>p.id)).size!==d.products.length)throw Error('IDs duplicados.');
    for(const p of d.products){
      if(p.components.some(c=>!ids.has(c.inputId)||!Number.isFinite(c.qty)||c.qty<=0||!Number.isFinite(c.waste)||c.waste<0||!Number.isFinite(c.cost)||c.cost<0))throw Error('Composição inválida.');
      if(p.labor.some(x=>typeof x.name!=='string'||!Number.isFinite(x.time)||x.time<=0))throw Error('Processo inválido.');
    }
    if(d.categories.some(c=>typeof c!=='string'))throw Error('Categorias inválidas.');
    return d;
  }
  window.ForgeServices={
    auth:{
      current:()=>session,
      async signIn(email,password){
        try{
          const normalized=email.trim();
          let credential;
          try{credential=await signInWithEmailAndPassword(auth,normalized,password)}
          catch(error){
            if(error?.code!=='auth/invalid-credential'&&error?.code!=='auth/user-not-found')throw error;
            credential=await createUserWithEmailAndPassword(auth,normalized,password);
          }
          const user=credential.user;
          session={userId:user.uid,tenantId:user.uid,email:user.email,mode:'firebase'};
          revision=0;
          return session;
        }catch(error){throw fail(error)}
      },
      async signOut(){
        try{await firebaseSignOut(auth)}catch(error){throw fail(error)}
        finally{session=null;revision=0;}
      }
    },
    repository:{
      validate,
      async load(s,defaults){
        try{
          if(s?.userId!==session?.userId)throw Error('Sessão incompatível.');
          const snapshot=await getDoc(workspaceRef(s.userId));
          if(snapshot.exists()){
            const saved=snapshot.data();
            revision=Number.isSafeInteger(saved.version)?saved.version:0;
            return validate(saved.data);
          }
          revision=0;
          const fresh=copy(defaults);
          fresh.products=[];fresh.inputs=[];fresh.history=[];fresh.view='dashboard';fresh.selectedProduct=null;
          return fresh;
        }catch(error){throw fail(error)}
      },
      async save(s,data){
        try{
          if(s?.userId!==session?.userId)throw Error('Sessão incompatível.');
          const clean=validate(data);
          const next=await runTransaction(db,async transaction=>{
            const ref=workspaceRef(s.userId),snapshot=await transaction.get(ref);
            const current=snapshot.exists()?snapshot.data().version||0:0;
            if(current!==revision){const e=Error('Os dados mudaram em outra janela. Use Atualizar dados antes de editar novamente.');e.code='40001';throw e}
            const version=current+1;
            transaction.set(ref,{data:clean,version,email:s.email,updatedAt:serverTimestamp()},{merge:false});
            return version;
          });
          revision=next;
          return {version:revision};
        }catch(error){if(error?.code==='40001')throw error;throw fail(error)}
      },
      legacy(){
        const raw=localStorage.getItem('forgecost_v2');
        return raw?validate(JSON.parse(raw)):null;
      }
    }
  };
})();
