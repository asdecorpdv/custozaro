// One remote write per mutation; failed writes remain recoverable per account.
let cloudBusy=false, cloudDirty=false, cloudPending=false, cloudBase=null, cloudNotice='';
const cloudToast=toast;
const cloudNode=id=>document.getElementById(id);
const cloudCopy=value=>JSON.parse(JSON.stringify(value));
const cloudContent=value=>{const copy=cloudCopy(value);delete copy.view;delete copy.selectedProduct;const sort=x=>Array.isArray(x)?x.map(sort):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,sort(x[k])])):x;return JSON.stringify(sort(copy))};
const cloudKey=()=> 'forgecost_pending_'+ForgeServices.auth.current().userId;
function cloudStatus(message){cloudNode('cloudStatus').textContent=message;cloudNode('cloudRetry').hidden=!cloudPending;}
function cloudLock(value){cloudBusy=value;cloudNode('appShell').inert=value;}
function cloudRemember(){try{localStorage.setItem(cloudKey(),JSON.stringify({base:cloudBase,data:state}));return true}catch{cloudToast('Não foi possível guardar a cópia local. Exporte um backup antes de sair.');return false}}
function cloudClear(){try{localStorage.removeItem(cloudKey())}catch{}cloudPending=false;cloudBase=cloudCopy(state);cloudStatus('Salvo no Supabase');}
saveWorkspace=function(){cloudDirty=true;return true};
toast=function(message){if(cloudBusy)cloudNotice=message;else cloudToast(message)};
async function cloudCommit(){cloudPending=true;cloudRemember();cloudStatus('Salvando no Supabase…');await ForgeServices.repository.save(ForgeServices.auth.current(),cloudCopy(state));cloudClear();cloudToast('Alterações salvas no Supabase.');}
for(const name of ['saveProduct','delProduct','saveInput','delInput','saveComp','delComp','saveLabor','resetData','saveProcess','deleteProcess','importBackup','importLegacy']){
  const original=window[name];if(typeof original!=='function')continue;
  window[name]=async function(...args){
    if(cloudBusy)return;
    if(cloudPending){cloudToast('Há alterações pendentes. Use Tentar salvar ou exporte um backup.');return}
    cloudDirty=false;cloudNotice='';cloudLock(true);
    try{await original(...args);if(cloudDirty)await cloudCommit();else if(cloudNotice)cloudToast(cloudNotice)}
    catch(error){if(cloudDirty){cloudPending=true;cloudRemember()}cloudStatus(cloudPending?'Alterações pendentes — ainda não confirmadas no Supabase':'Falha ao salvar');cloudToast(error.message+' Exporte um backup para preservar os dados.');}
    finally{cloudLock(false)}
  };
}
async function retryCloud(){
  if(cloudBusy||!cloudPending)return;cloudLock(true);
  try{
    const remote=await ForgeServices.repository.load(ForgeServices.auth.current(),DEFAULT_STATE);
    if(cloudContent(remote)===cloudContent(state)){cloudClear();cloudToast('Salvamento confirmado no Supabase.');return}
    if(!cloudBase||cloudContent(remote)!==cloudContent(cloudBase))throw Error('O banco mudou em outra sessão. Exporte o backup pendente antes de conciliar os dados.');
    await cloudCommit();
  }catch(error){cloudStatus('Alterações pendentes — tente novamente');cloudToast(error.message)}finally{cloudLock(false)}
}
async function refreshCloud(){
  if(cloudBusy)return;if(cloudPending)return cloudToast('Exporte ou salve as alterações pendentes antes de atualizar.');cloudLock(true);
  try{state=await ForgeServices.repository.load(ForgeServices.auth.current(),DEFAULT_STATE);cloudBase=cloudCopy(state);state.view='dashboard';state.selectedProduct=null;render();cloudStatus('Dados carregados do Supabase')}
  catch(error){cloudToast(error.message)}finally{cloudLock(false)}
}
async function cloudLogin(event){
  event.preventDefault();const button=event.currentTarget.querySelector('[type=submit]');button.disabled=true;cloudNode('loginError').textContent='';
  try{
    const session=await ForgeServices.auth.signIn(cloudNode('email').value,cloudNode('password').value);
    state=await ForgeServices.repository.load(session,DEFAULT_STATE);cloudBase=cloudCopy(state);cloudPending=false;
    let pending=null,pendingProblem=false;try{pending=JSON.parse(localStorage.getItem(cloudKey())||'null')}catch{pendingProblem=true}
    if(pending){
      try{
        ForgeServices.repository.validate(pending.data);
        if(cloudContent(pending.data)===cloudContent(state)){try{localStorage.removeItem(cloudKey())}catch{}}
        else{cloudBase=pending.base;state=pending.data;cloudPending=true;}
      }catch{pendingProblem=true}
    }
    state.view='dashboard';state.selectedProduct=null;cloudNode('sessionEmail').textContent=session.email;
    cloudNode('loginScreen').hidden=true;cloudNode('appShell').hidden=false;render();
    cloudStatus(cloudPending?'Cópia pendente recuperada — use Tentar salvar':pendingProblem?'Dados carregados; havia uma cópia local pendente inválida':'Dados carregados do Supabase');
    if(pendingProblem&&!cloudPending)cloudToast('Login concluído. A cópia local pendente não pôde ser restaurada; seus dados do Supabase foram carregados.');
  }catch(error){cloudNode('loginError').textContent=error.message}
  finally{button.disabled=false;cloudNode('password').value=''}
}
async function cloudLogout(){
  if(cloudBusy)return;if(cloudPending)return cloudToast('Há dados pendentes. Salve ou exporte um backup antes de sair.');
  cloudLock(true);try{await ForgeServices.auth.signOut()}catch(error){cloudToast(error.message)}finally{location.reload()}
}
const cloudSettings=settings;
settings=function(){return cloudSettings().replace('As edições ficam salvas neste navegador.','As edições são enviadas ao Supabase. Confira a confirmação de salvamento no topo.').replace('LocalStorage','Supabase / PostgreSQL').replace('Os dados pertencem ao workspace demo deste e-mail, neste navegador. Esta separação local não oferece segurança multiusuário.','Os cadastros pertencem à sua conta. Alterações pendentes ficam em uma cópia local de recuperação.').replace('A V2 original permanece intacta. Para transferir entre endereços ou navegadores, exporte o localStorage forgecost_v2 como JSON e importe aqui.','Exporte um backup antes de importar ou substituir dados. A importação será enviada à sua conta no Supabase.')};
const cloudBar=document.createElement('div');cloudBar.className='toolbar';cloudBar.style.cssText='padding:12px;flex-wrap:wrap;border-bottom:1px solid #687786';
cloudBar.innerHTML='<span id="cloudStatus" role="status" aria-live="polite">Entre para acessar o Supabase</span><button class="btn" id="cloudRetry" hidden>Tentar salvar</button><button class="btn" id="cloudRefresh">Atualizar dados</button><button class="btn" id="cloudExport">Exportar backup</button>';
cloudNode('content').before(cloudBar);
cloudNode('cloudRetry').onclick=retryCloud;cloudNode('cloudRefresh').onclick=refreshCloud;cloudNode('cloudExport').onclick=exportBackup;
cloudNode('loginForm').onsubmit=cloudLogin;cloudNode('logoutBtn').onclick=cloudLogout;
for(const element of document.querySelectorAll('#sidebar *, header *, #loginScreen *')){
  if(element.children.length)continue;
  const replacements={'Demonstração local':'Conta Supabase','Dados neste navegador':'Dados por usuário','Workspace demo local':'Workspace pessoal','Use qualquer e-mail válido e uma senha fictícia. A senha não é verificada nem armazenada. Não há autenticação real ou servidor conectado.':'Entre com o e-mail e a senha cadastrados no Supabase.'};
  if(replacements[element.textContent.trim()])element.textContent=replacements[element.textContent.trim()];
}
window.addEventListener('beforeunload',event=>{if(cloudPending||cloudBusy){event.preventDefault();event.returnValue=''}});
