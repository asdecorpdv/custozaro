window.ForgeServicesReady.then(()=>{
let cloudBusy=false,cloudSaveState={pending:false,saving:false,error:null};
const cloudToast=typeof window.toast==='function'?window.toast:message=>{const el=document.getElementById('toast');el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),4000)};
const cloudNode=id=>document.getElementById(id);
const cloudContent=value=>{const copy=JSON.parse(JSON.stringify(value));delete copy.view;delete copy.selectedProduct;const sort=x=>Array.isArray(x)?x.map(sort):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,sort(x[k])])):x;return JSON.stringify(sort(copy))};
const cloudKey=()=> 'forgecost_pending_'+ForgeServices.auth.current().userId;
function cloudLock(value){cloudBusy=value;cloudNode('appShell').inert=value;}
function cloudStatus(message){cloudNode('cloudStatus').textContent=message;cloudNode('cloudRetry').hidden=!cloudSaveState.error;}
function retryable(error){return !['permission-denied','unauthenticated','invalid-argument'].includes(error?.code)&&!/(inválid|incompatível|duplicad|Sem permissão)/i.test(error?.message||'');}
const autosave=ForgeCloudAutosave.create({
  delay:600,setTimeout:(fn,ms)=>setTimeout(fn,ms),clearTimeout:id=>clearTimeout(id),signature:cloudContent,
  save:data=>ForgeServices.repository.save(ForgeServices.auth.current(),data),
  remember:record=>{try{localStorage.setItem(cloudKey(),JSON.stringify(record));}catch{cloudToast('Não foi possível guardar a cópia local. Exporte um backup antes de sair.');}},
  clear:()=>{try{localStorage.removeItem(cloudKey());}catch{}},retryable,
  status:info=>{cloudSaveState=info;cloudStatus(info.error?'Alterações preservadas neste navegador — '+info.error.message+(retryable(info.error)?' Nova tentativa automática em instantes.':' Confira o erro antes de tentar novamente.'):info.saving?'Salvando no Firebase…':info.pending?'Alterações na fila de salvamento…':'Salvo no Firebase');}
});
saveWorkspace=function(){if(!ForgeServices.auth.current())return false;autosave.enqueue(state);return true};
toast=function(message){cloudToast(message)};
// Every persist() schedules a save, including mutations outside this list.
for(const name of ['saveProduct','duplicateProduct','delProduct','saveInput','delInput','saveComp','delComp','saveLabor','saveShopeeSettings','saveShopeeProduct','setPdvDefaults','resetData','saveProcess','deleteProcess','importBackup','importLegacy']){
  const original=window[name];if(typeof original!=='function')continue;
  window[name]=async function(...args){if(cloudBusy)return;const focus=name==='setPdvDefaults'?document.activeElement?.id:null;try{await original(...args);}catch(error){cloudToast(error.message);}finally{if(focus)cloudNode(focus)?.focus();}};
}
async function retryCloud(){if(cloudBusy)return;await autosave.flush();}
async function refreshCloud(){
  if(cloudBusy)return;cloudLock(true);
  try{if(!await autosave.flush())return;state=await ForgeServices.repository.load(ForgeServices.auth.current(),DEFAULT_STATE);autosave.reset(state);state.view='dashboard';state.selectedProduct=null;render();cloudStatus('Dados carregados do Firebase');}
  catch(error){cloudToast(error.message);}finally{cloudLock(false);}
}
async function cloudLogin(event){
  event.preventDefault();const button=event.currentTarget.querySelector('[type=submit]');button.disabled=true;cloudNode('loginError').textContent='';
  try{
    const session=await ForgeServices.auth.signIn(cloudNode('email').value,cloudNode('password').value);
    state=await ForgeServices.repository.load(session,DEFAULT_STATE);autosave.reset(state);
    let pending=null,pendingProblem=false;try{pending=JSON.parse(localStorage.getItem(cloudKey())||'null');}catch{pendingProblem=true;}
    if(pending){try{ForgeServices.repository.validate(pending.data);if(cloudContent(pending.data)===cloudContent(state)){try{localStorage.removeItem(cloudKey());}catch{}}else{state=pending.data;autosave.enqueue(state);}}catch{pendingProblem=true;}}
    state.view='dashboard';state.selectedProduct=null;cloudNode('sessionEmail').textContent=session.email;cloudNode('loginScreen').hidden=true;cloudNode('appShell').hidden=false;render();
    if(!autosave.pending())cloudStatus(pendingProblem?'Dados carregados; havia uma cópia local pendente inválida':'Dados carregados do Firebase');
    if(pendingProblem)cloudToast('A cópia local pendente não pôde ser restaurada; seus dados do Firebase foram carregados.');
  }catch(error){cloudNode('loginError').textContent=error.message;}
  finally{button.disabled=false;cloudNode('password').value='';}
}
async function cloudLogout(){
  if(cloudBusy)return;cloudLock(true);
  try{if(!await autosave.flush()){cloudToast('Há dados pendentes. Aguarde a conexão ou exporte um backup antes de sair.');return;}await ForgeServices.auth.signOut();autosave.dispose();location.reload();}
  catch(error){cloudToast(error.message);}finally{cloudLock(false);}
}
const cloudSettings=settings;
settings=function(){return cloudSettings().replace('As edições ficam salvas neste navegador.','As alterações são salvas automaticamente no Firebase. Confira o estado no topo.').replace('LocalStorage','Firebase / Firestore').replace('Os dados pertencem ao workspace demo deste e-mail, neste navegador. Esta separação local não oferece segurança multiusuário.','Os cadastros pertencem à sua conta. Alterações pendentes ficam em uma cópia local de recuperação.').replace('A V2 original permanece intacta. Para transferir entre endereços ou navegadores, exporte o localStorage forgecost_v2 como JSON e importe aqui.','Exporte um backup antes de importar ou substituir dados. A importação será enviada à sua conta no Firebase.');};
const cloudBar=document.createElement('div');cloudBar.className='toolbar';cloudBar.style.cssText='padding:12px;flex-wrap:wrap;border-bottom:1px solid #687786';
cloudBar.innerHTML='<span id="cloudStatus" role="status" aria-live="polite">Entre para acessar o Firebase</span><button class="btn" id="cloudRetry" hidden>Tentar salvar agora</button><button class="btn" id="cloudRefresh">Atualizar dados</button><button class="btn" id="cloudExport">Exportar backup</button>';
cloudNode('content').before(cloudBar);
cloudNode('cloudRetry').onclick=retryCloud;cloudNode('cloudRefresh').onclick=refreshCloud;cloudNode('cloudExport').onclick=exportBackup;cloudNode('loginForm').onsubmit=cloudLogin;cloudNode('logoutBtn').onclick=cloudLogout;
for(const element of document.querySelectorAll('#sidebar *, header *, #loginScreen *')){
  if(element.children.length)continue;
  const replacements={'Demonstração local':'Conta Firebase','Dados neste navegador':'Dados por usuário','Workspace demo local':'Workspace pessoal','Use qualquer e-mail válido e uma senha fictícia. A senha não é verificada nem armazenada. Não há autenticação real ou servidor conectado.':'Entre com seu e-mail e senha. No primeiro acesso, a conta é criada no Firebase.'};
  if(replacements[element.textContent.trim()])element.textContent=replacements[element.textContent.trim()];
}
window.addEventListener('online',()=>{if(autosave.pending())void autosave.flush();});
window.addEventListener('beforeunload',event=>{if(autosave.pending()||autosave.busy()){event.preventDefault();event.returnValue='';}});
}).catch(error=>{const loginError=document.getElementById('loginError');if(loginError)loginError.textContent=error?.message||'Não foi possível carregar a integração Firebase.';});
