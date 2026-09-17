const state = {
  view:"dashboard",
  selectedProduct:null,
  products:[
    {id:1,code:"PRD-001",sku:"MESA-120",name:"Mesa Industrial 120cm",category:"Mobiliário",status:"Ativo",
     components:[
      {cat:"Material",input:"Tubo 20x20",unit:"M",qty:4.8,waste:5,cost:8.5},
      {cat:"Material",input:"Chapa de aço",unit:"KG",qty:7,waste:3,cost:12.4},
      {cat:"Material",input:"Tampo de madeira",unit:"UN",qty:1,waste:0,cost:48},
      {cat:"Fixadores",input:"Parafuso M6",unit:"UN",qty:12,waste:2,cost:0.38},
      {cat:"Acabamento",input:"Tinta preta",unit:"L",qty:.32,waste:5,cost:31}
     ],
     labor:[["Corte",.5],["Solda",1.5],["Lixamento",.5],["Pintura",.5],["Montagem",1]]
    },
    {id:2,code:"PRD-002",sku:"BANCO-IND",name:"Banco Industrial X",category:"Mobiliário",status:"Ativo",
     components:[
      {cat:"Material",input:"Tubo 20x20",unit:"M",qty:3.2,waste:5,cost:8.5},
      {cat:"Material",input:"Tampo de madeira",unit:"UN",qty:1,waste:0,cost:34},
      {cat:"Fixadores",input:"Parafuso M6",unit:"UN",qty:8,waste:2,cost:.38},
      {cat:"Acabamento",input:"Tinta preta",unit:"L",qty:.22,waste:5,cost:31}
     ],labor:[["Corte",.35],["Solda",.8],["Lixamento",.35],["Pintura",.4],["Montagem",.6]]
    },
    {id:3,code:"PRD-003",sku:"EST-03",name:"Estante Modular 3 Níveis",category:"Mobiliário",status:"Em desenvolvimento",components:[],labor:[]}
  ],
  inputs:[
    {id:1,code:"INS-001",name:"Tubo 20x20",cat:"Metal",unit:"M",cost:8.5,status:"Ativo"},
    {id:2,code:"INS-002",name:"Chapa de aço",cat:"Metal",unit:"KG",cost:12.4,status:"Ativo"},
    {id:3,code:"INS-003",name:"Tampo de madeira",cat:"Madeira",unit:"UN",cost:48,status:"Ativo"},
    {id:4,code:"INS-004",name:"Parafuso M6",cat:"Fixadores",unit:"UN",cost:.38,status:"Ativo"},
    {id:5,code:"INS-005",name:"Tinta preta",cat:"Acabamento",unit:"L",cost:31,status:"Ativo"}
  ],
  categories:["Metal","Madeira","Fixadores","Acabamento","Embalagem"],
  laborSettings:{salary:2600,hours:220},
  history:[
    {date:"17/09/2026 09:42",action:"Alteração de custo",detail:"Tubo 20x20 • R$ 8,20 → R$ 8,50",user:"Administrador"},
    {date:"16/09/2026 16:18",action:"Ficha técnica atualizada",detail:"Mesa Industrial 120cm • v1.2",user:"Administrador"},
    {date:"15/09/2026 14:07",action:"Produto cadastrado",detail:"Estante Modular 3 Níveis • PRD-003",user:"Administrador"}
  ]
};

const money = n => (Number(n)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const laborRate = () => state.laborSettings.salary/state.laborSettings.hours;
function compCost(c){ return c.qty*(1+c.waste/100)*c.cost }
function productCost(p){
  const cats={Material:0,Acabamento:0,Embalagem:0,Fixadores:0,Outros:0};
  p.components.forEach(c=>cats[c.cat]=(cats[c.cat]||0)+compCost(c));
  const labor=(p.labor||[]).reduce((a,x)=>a+x[1],0)*laborRate();
  return {...cats,labor,total:Object.values(cats).reduce((a,b)=>a+b,0)+labor};
}
function fmtDate(){return new Date().toLocaleDateString("pt-BR")+" "+new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}
function toast(t){const el=document.getElementById("toast");el.textContent=t;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2200)}
function statusTag(s){return `<span class="tag ${s==="Ativo"?"good":s==="Em desenvolvimento"?"warn":"muted"}">${s}</span>`}

function shellHead(eyebrow,title,sub,action){
 return `<div class="page-head"><div><div class="eyebrow">${eyebrow}</div><h1 class="page-title">${title}</h1><p class="page-subtitle">${sub}</p></div>${action?`<div class="actions">${action}</div>`:""}</div>`
}
function productRows(products){
 return products.map(p=>{const c=productCost(p);return `<tr>
  <td><b class="product-name">${p.name}</b><span class="sub">${p.code} • ${p.sku}</span></td>
  <td>${money(c.Material)}</td><td>${money(c.Acabamento)}</td><td>${money(c.Embalagem)}</td><td>${money(c.labor)}</td><td>${money(c.Fixadores+c.Outros)}</td>
  <td class="money">${money(c.total)}</td><td><button class="btn small" onclick="openProduct(${p.id})">Abrir</button></td>
 </tr>`}).join("")
}
function dashboard(){
 const avg=state.products.reduce((a,p)=>a+productCost(p).total,0)/(state.products.length||1);
 return shellHead("VISÃO OPERACIONAL","Dashboard","Controle de fabricação, composição e custo em um único ambiente.",
 `<button class="btn" onclick="openModal('input')">+ Insumo</button><button class="btn primary" onclick="openModal('product')">+ Produto</button>`) +
 `<div class="metrics">
  <div class="metric"><div class="metric-label">Produtos cadastrados</div><div class="metric-value">${state.products.length}</div><div class="metric-note">base atual</div></div>
  <div class="metric"><div class="metric-label">Com ficha técnica</div><div class="metric-value">${state.products.filter(p=>p.components.length).length}</div><div class="metric-note good">composição ativa</div></div>
  <div class="metric"><div class="metric-label">Sem ficha</div><div class="metric-value">${state.products.filter(p=>!p.components.length).length}</div><div class="metric-note">requer atenção</div></div>
  <div class="metric"><div class="metric-label">Insumos cadastrados</div><div class="metric-value">${state.inputs.length}</div><div class="metric-note">custos unitários</div></div>
  <div class="metric"><div class="metric-label">Custo médio</div><div class="metric-value">${money(avg)}</div><div class="metric-note">por unidade produzida</div></div>
 </div>
 <div class="grid-2">
  <section class="panel"><div class="panel-head"><h3>CUSTOS DE FABRICAÇÃO</h3><span>${state.products.length} produtos</span></div>
   <div class="table-wrap"><table class="data-table"><thead><tr><th>Produto</th><th>Materiais</th><th>Acab.</th><th>Embal.</th><th>Mão de obra</th><th>Outros</th><th>Total</th><th></th></tr></thead><tbody>${productRows(state.products)}</tbody></table></div>
  </section>
  <section class="panel"><div class="panel-head"><h3>COMPOSIÇÃO DO CUSTO</h3><span>base atual</span></div>
   <div class="breakdown">${costBreakdown()}</div>
  </section>
 </div>`
}
function costBreakdown(){
 const sums={Material:0,Acabamento:0,Embalagem:0,Fixadores:0,Outros:0,labor:0};
 state.products.forEach(p=>{const c=productCost(p);Object.keys(sums).forEach(k=>sums[k]+=c[k]||0)});
 const total=Object.values(sums).reduce((a,b)=>a+b,0)||1;
 return Object.entries(sums).map(([k,v])=>`<div class="breakdown-row"><div class="breakdown-top"><span>${k==="labor"?"Mão de obra":k}</span><b>${money(v)}</b></div><div class="progress"><i style="width:${Math.min(100,v/total*100)}%"></i></div></div>`).join("")
}
function products(){
 return shellHead("CADASTRO","Produtos","Catálogo de itens fabricados e status de suas fichas técnicas.",
 `<button class="btn primary" onclick="openModal('product')">+ Novo produto</button>`) +
 `<div class="toolbar"><input class="search" id="productSearch" placeholder="Pesquisar por nome, código ou SKU..." oninput="filterProducts()"><select class="select" id="productStatus" onchange="filterProducts()"><option value="">Todos os status</option><option>Ativo</option><option>Em desenvolvimento</option><option>Inativo</option></select></div>
 <section class="panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>Produto</th><th>Categoria</th><th>Status</th><th>Ficha</th><th>Custo fabricação</th><th></th></tr></thead><tbody id="productTable">${state.products.map(p=>`<tr data-search="${(p.name+p.code+p.sku).toLowerCase()}" data-status="${p.status}"><td><b class="product-name">${p.name}</b><span class="sub">${p.code} • ${p.sku}</span></td><td>${p.category}</td><td>${statusTag(p.status)}</td><td>${p.components.length?'<span class="tag good">Completa</span>':'<span class="tag warn">Sem composição</span>'}</td><td class="money">${money(productCost(p).total)}</td><td><button class="btn small" onclick="openProduct(${p.id})">Abrir ficha</button></td></tr>`).join("")}</tbody></table></div></section>`
}
function filterProducts(){const q=(document.getElementById("productSearch").value||"").toLowerCase(),s=document.getElementById("productStatus").value;document.querySelectorAll("#productTable tr").forEach(r=>r.style.display=(r.dataset.search.includes(q)&&(!s||r.dataset.status===s))?"":"none")}
function inputs(){
 return shellHead("INSUMOS","Cadastro de insumos","Custos unitários, unidades e categorias utilizados pelas fichas técnicas.",
 `<button class="btn primary" onclick="openModal('input')">+ Novo insumo</button>`) +
 `<div class="toolbar"><input class="search" id="inputSearch" placeholder="Pesquisar insumo ou código..." oninput="filterInputs()"><select class="select"><option>Todas as categorias</option>${state.categories.map(x=>`<option>${x}</option>`).join("")}</select></div>
 <section class="panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>Insumo</th><th>Categoria</th><th>Unidade</th><th>Custo unitário</th><th>Status</th><th>Uso</th></tr></thead><tbody id="inputTable">${state.inputs.map(i=>{const used=state.products.filter(p=>p.components.some(c=>c.input===i.name)).length;return `<tr data-search="${(i.name+i.code).toLowerCase()}"><td><b class="product-name">${i.name}</b><span class="sub">${i.code}</span></td><td>${i.cat}</td><td>${i.unit}</td><td class="money">${money(i.cost)}</td><td>${statusTag(i.status)}</td><td>${used} produto(s)</td></tr>`}).join("")}</tbody></table></div></section>`
}
function filterInputs(){const q=(document.getElementById("inputSearch").value||"").toLowerCase();document.querySelectorAll("#inputTable tr").forEach(r=>r.style.display=r.dataset.search.includes(q)?"":"none")}
function categories(){
 return shellHead("ESTRUTURA","Categorias","Organize insumos e componentes sem depender de categorias hardcoded.",
 `<button class="btn primary" onclick="openModal('category')">+ Nova categoria</button>`) +
 `<div class="grid-3">${state.categories.map((c,i)=>`<section class="panel"><div class="panel-head"><h3>${c}</h3><span>CAT-${String(i+1).padStart(3,"0")}</span></div><div class="kpi-list"><div class="kpi-row"><span>Insumos</span><b>${state.inputs.filter(x=>x.cat===c).length}</b></div><div class="kpi-row"><span>Status</span><b>${statusTag("Ativo")}</b></div></div></section>`).join("")}</div>`
}
function labor(){
 const rate=laborRate();
 return shellHead("CONFIGURAÇÃO","Mão de obra","Parâmetros de custo-hora e processos produtivos por produto.",
 `<button class="btn primary" onclick="openModal('labor')">Editar parâmetros</button>`) +
 `<div class="grid-3">
 <section class="panel"><div class="panel-head"><h3>SALÁRIO BASE</h3></div><div class="breakdown"><div class="metric-value">${money(state.laborSettings.salary)}</div><p class="page-subtitle">valor mensal configurado</p></div></section>
 <section class="panel"><div class="panel-head"><h3>HORAS MENSAIS</h3></div><div class="breakdown"><div class="metric-value">${state.laborSettings.hours} h</div><p class="page-subtitle">base de cálculo</p></div></section>
 <section class="panel"><div class="panel-head"><h3>CUSTO / HORA</h3></div><div class="breakdown"><div class="metric-value">${money(rate)}</div><p class="page-subtitle">precisão preservada internamente</p></div></section></div>
 <section class="panel" style="margin-top:12px"><div class="panel-head"><h3>PROCESSOS POR PRODUTO</h3><span>tempo por unidade</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Produto</th><th>Processos</th><th>Horas</th><th>Custo de mão de obra</th></tr></thead><tbody>${state.products.map(p=>{const h=(p.labor||[]).reduce((a,x)=>a+x[1],0);return `<tr><td class="product-name">${p.name}</td><td>${(p.labor||[]).length}</td><td>${h.toFixed(2)} h</td><td class="money">${money(h*rate)}</td></tr>`}).join("")}</tbody></table></div></section>`
}
function costs(){
 return shellHead("ANÁLISE","Custos dos produtos","Consulta rápida do custo industrial por categoria e mão de obra.",
 `<button class="btn" onclick="toast('Relatório preparado para exportação futura')">Exportar</button>`) +
 `<div class="toolbar"><input class="search" placeholder="Pesquisar produto..."><select class="select"><option>Ordenar: custo</option><option>Ordenar: nome</option><option>Ordenar: código</option></select></div>
 <section class="panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>Produto</th><th>Materiais</th><th>Acabamento</th><th>Embalagem</th><th>Mão de obra</th><th>Outros</th><th>Custo</th></tr></thead><tbody>${productRows(state.products)}</tbody></table></div></section>`
}
function history(){
 return shellHead("AUDITORIA","Histórico","Rastreabilidade de alterações de custos, fichas e cadastros.",
 `<button class="btn" onclick="toast('Filtros disponíveis na próxima etapa')">Filtrar</button>`) +
 `<section class="panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>Data</th><th>Ação</th><th>Detalhe</th><th>Usuário</th></tr></thead><tbody>${state.history.map(h=>`<tr><td>${h.date}</td><td><span class="tag">${h.action}</span></td><td>${h.detail}</td><td>${h.user}</td></tr>`).join("")}</tbody></table></div></section>`
}
function reports(){
 return shellHead("ANÁLISES","Relatórios","Visões operacionais preparadas para exportações PDF, XLSX e CSV.",
 `<button class="btn primary" onclick="toast('Exportação será habilitada na camada de produção')">Gerar relatório</button>`) +
 `<div class="grid-3"><section class="panel"><div class="panel-head"><h3>CUSTO POR PRODUTO</h3></div><div class="chart">${state.products.map(p=>`<div class="bar" style="height:${Math.max(18,Math.min(100,productCost(p).total/3))}%"><span>${p.code}</span></div>`).join("")}</div></section>
 <section class="panel"><div class="panel-head"><h3>COBERTURA DE FICHAS</h3></div><div class="breakdown"><div class="metric-value">${Math.round(state.products.filter(p=>p.components.length).length/state.products.length*100)||0}%</div><p class="page-subtitle">produtos com composição</p><div class="progress" style="margin-top:18px"><i style="width:${state.products.filter(p=>p.components.length).length/state.products.length*100||0}%"></i></div></div></section>
 <section class="panel"><div class="panel-head"><h3>INSUMOS COM IMPACTO</h3></div><div class="kpi-list">${state.inputs.slice(0,5).map(i=>`<div class="kpi-row"><span>${i.name}</span><b>${state.products.filter(p=>p.components.some(c=>c.input===i.name)).length} prod.</b></div>`).join("")}</div></section></div>`
}
function settings(){
 return shellHead("SISTEMA","Configurações","Parâmetros gerais, permissões e regras da aplicação.",
 `<button class="btn primary" onclick="openModal('labor')">Editar mão de obra</button>`) +
 `<div class="grid-2"><section class="panel"><div class="panel-head"><h3>REGRAS FINANCEIRAS</h3></div><div class="kpi-list"><div class="kpi-row"><span>Precisão monetária</span><b>DECIMAL(14,6)</b></div><div class="kpi-row"><span>Custo final manual</span><b>Bloqueado</b></div><div class="kpi-row"><span>Recálculo</span><b>Automático</b></div><div class="kpi-row"><span>Histórico</span><b>Preservado</b></div></div></section>
 <section class="panel"><div class="panel-head"><h3>PERMISSÕES</h3></div><div class="kpi-list"><div class="kpi-row"><span>Administrador</span><b>Acesso total</b></div><div class="kpi-row"><span>Gestor</span><b>Produtos + custos</b></div><div class="kpi-row"><span>Operacional</span><b>Consulta + ficha</b></div><div class="kpi-row"><span>Consulta</span><b>Somente leitura</b></div></div></section></div>`
}
function bom(){
 return shellHead("ENGENHARIA","Fichas Técnicas / BOM","Lista de produtos e integridade das suas composições.",
 `<button class="btn primary" onclick="openModal('product')">+ Produto</button>`) +
 `<div class="alert">A ficha técnica é a fonte da formação de custo. Custos são derivados de quantidade, perda, valor unitário e processos.</div>
 <section class="panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>Produto</th><th>Componentes</th><th>Processos</th><th>Status da ficha</th><th>Custo</th><th></th></tr></thead><tbody>${state.products.map(p=>{const complete=p.components.length>0;return `<tr><td class="product-name">${p.name}<span class="sub">${p.code}</span></td><td>${p.components.length}</td><td>${p.labor?.length||0}</td><td>${complete?'<span class="tag good">Completa</span>':'<span class="tag warn">Sem composição</span>'}</td><td class="money">${money(productCost(p).total)}</td><td><button class="btn small" onclick="openProduct(${p.id})">Ver ficha</button></td></tr>`}).join("")}</tbody></table></div></section>`
}
function openProduct(id){
 state.selectedProduct=id; const p=state.products.find(x=>x.id===id); if(!p)return;
 state.view="product"; render();
}
function productDetail(){
 const p=state.products.find(x=>x.id===state.selectedProduct); const c=productCost(p);
 return `<button class="inline-link" onclick="navigate('products')">← Voltar para produtos</button>
 <div class="detail-head" style="margin-top:14px"><div class="product-icon">${p.code.slice(-3)}</div><div class="detail-title"><h2>${p.name}</h2><p>${p.code} • ${p.sku} • ${p.category} • ${statusTag(p.status)}</p></div><div class="cost-hero"><span>Custo de fabricação</span><b>${money(c.total)}</b></div></div>
 <div class="tabs"><button class="tab active">VISÃO GERAL</button><button class="tab" onclick="showBomTab()">FICHA TÉCNICA</button><button class="tab" onclick="showLaborTab()">MÃO DE OBRA</button><button class="tab" onclick="showCostTab()">CUSTOS</button><button class="tab">HISTÓRICO</button><button class="tab">INFORMAÇÕES</button></div>
 <div id="productTabContent">${overviewProduct(p,c)}</div>`
}
function overviewProduct(p,c){
 const total=c.total||1;
 return `<div class="summary-grid">${[["Materiais",c.Material],["Acabamento",c.Acabamento],["Embalagem",c.Embalagem],["Mão de obra",c.labor],["Outros",c.Fixadores+c.Outros]].map(x=>`<div class="summary-item"><small>${x[0]}</small><b>${money(x[1])}</b></div>`).join("")}</div>
 <div class="grid-2"><section class="panel"><div class="panel-head"><h3>COMPOSIÇÃO ATUAL</h3><button class="btn small" onclick="addComponent(${p.id})">+ Componente</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Categoria</th><th>Insumo</th><th>Qtd.</th><th>Perda</th><th>Custo</th></tr></thead><tbody>${p.components.map(c=>`<tr><td>${c.cat}</td><td class="product-name">${c.input}</td><td>${c.qty} ${c.unit}</td><td>${c.waste}%</td><td class="money">${money(compCost(c))}</td></tr>`).join("")||`<tr><td colspan="5"><div class="empty"><b>Sem composição</b>Adicione o primeiro componente.</div></td></tr>`}</tbody></table></div></section>
 <section class="panel"><div class="panel-head"><h3>FORMAÇÃO DO CUSTO</h3></div><div class="breakdown">${[["Materiais",c.Material],["Acabamento",c.Acabamento],["Embalagem",c.Embalagem],["Fixadores / outros",c.Fixadores+c.Outros],["Mão de obra",c.labor]].map(x=>`<div class="breakdown-row"><div class="breakdown-top"><span>${x[0]}</span><b>${money(x[1])}</b></div><div class="progress"><i style="width:${Math.min(100,x[1]/total*100)}%"></i></div></div>`).join("")}</div></section></div>`
}
function showBomTab(){const p=state.products.find(x=>x.id===state.selectedProduct);document.getElementById("productTabContent").innerHTML=overviewProduct(p,productCost(p))}
function showLaborTab(){const p=state.products.find(x=>x.id===state.selectedProduct);document.getElementById("productTabContent").innerHTML=`<section class="panel"><div class="panel-head"><h3>PROCESSOS DE PRODUÇÃO</h3><button class="btn small" onclick="addLabor(${p.id})">+ Processo</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Processo</th><th>Tempo</th><th>Custo/hora</th><th>Custo</th></tr></thead><tbody>${(p.labor||[]).map(x=>`<tr><td class="product-name">${x[0]}</td><td>${x[1].toFixed(2)} h</td><td>${money(laborRate())}</td><td class="money">${money(x[1]*laborRate())}</td></tr>`).join("")}</tbody></table></div></section>`}
function showCostTab(){const p=state.products.find(x=>x.id===state.selectedProduct),c=productCost(p);document.getElementById("productTabContent").innerHTML=`<section class="panel"><div class="panel-head"><h3>CUSTO CALCULADO</h3><span>sem edição manual</span></div><div class="breakdown">${Object.entries({Materiais:c.Material,Acabamento:c.Acabamento,Embalagem:c.Embalagem,"Fixadores / Outros":c.Fixadores+c.Outros,"Mão de obra":c.labor}).map(([k,v])=>`<div class="kpi-row"><span>${k}</span><b>${money(v)}</b></div>`).join("")}<div class="kpi-row" style="padding-top:20px"><span style="color:#fff">CUSTO TOTAL DE FABRICAÇÃO</span><b style="font-size:20px">${money(c.total)}</b></div></div></section>`}
function addComponent(id){openModal("component",id)}
function addLabor(id){openModal("process",id)}

function openModal(type, productId){
 const mb=document.getElementById("modalBackdrop"),m=document.getElementById("modal");let title="",body="",foot="";
 if(type==="product"){title="Novo produto";body=`<div class="form-grid"><div class="field"><label>Nome</label><input id="f_name" placeholder="Nome do produto"></div><div class="field"><label>Código interno</label><input id="f_code" placeholder="PRD-004"></div><div class="field"><label>SKU</label><input id="f_sku" placeholder="SKU"></div><div class="field"><label>Categoria</label><input id="f_cat" placeholder="Mobiliário"></div><div class="field full"><label>Status</label><select id="f_status"><option>Ativo</option><option>Em desenvolvimento</option><option>Inativo</option></select></div></div>`;foot=`<button class="btn" onclick="closeModal()">Cancelar</button><button class="btn primary" onclick="saveProduct()">Cadastrar produto</button>`}
 if(type==="input"){title="Novo insumo";body=`<div class="form-grid"><div class="field"><label>Nome</label><input id="f_name" placeholder="Ex.: Tubo 25x25"></div><div class="field"><label>Código</label><input id="f_code" placeholder="INS-006"></div><div class="field"><label>Categoria</label><select id="f_cat">${state.categories.map(x=>`<option>${x}</option>`).join("")}</select></div><div class="field"><label>Unidade</label><select id="f_unit">${["UN","KG","G","TON","M","CM","MM","M²","M³","L","ML","H","MIN"].map(x=>`<option>${x}</option>`).join("")}</select></div><div class="field"><label>Custo unitário</label><input id="f_cost" type="number" step="0.000001" placeholder="0,000000"></div></div>`;foot=`<button class="btn" onclick="closeModal()">Cancelar</button><button class="btn primary" onclick="saveInput()">Cadastrar insumo</button>`}
 if(type==="category"){title="Nova categoria";body=`<div class="field"><label>Nome da categoria</label><input id="f_name" placeholder="Ex.: Terceirização"></div>`;foot=`<button class="btn" onclick="closeModal()">Cancelar</button><button class="btn primary" onclick="saveCategory()">Criar categoria</button>`}
 if(type==="labor"){title="Parâmetros de mão de obra";body=`<div class="form-grid"><div class="field"><label>Salário base mensal</label><input id="f_salary" type="number" step=".01" value="${state.laborSettings.salary}"></div><div class="field"><label>Horas mensais</label><input id="f_hours" type="number" step=".01" value="${state.laborSettings.hours}"></div></div><p class="page-subtitle" style="margin-top:14px">Custo/hora calculado automaticamente: <b style="color:#fff">${money(laborRate())}/h</b></p>`;foot=`<button class="btn" onclick="closeModal()">Cancelar</button><button class="btn primary" onclick="saveLabor()">Salvar parâmetros</button>`}
 if(type==="component"){const p=state.products.find(x=>x.id===productId);title="Adicionar componente";body=`<div class="form-grid"><div class="field"><label>Categoria</label><select id="f_cat">${["Material","Acabamento","Embalagem","Fixadores","Outros"].map(x=>`<option>${x}</option>`).join("")}</select></div><div class="field"><label>Insumo</label><select id="f_input">${state.inputs.map(i=>`<option value="${i.id}">${i.name} — ${money(i.cost)}/${i.unit}</option>`).join("")}</select></div><div class="field"><label>Quantidade</label><input id="f_qty" type="number" step=".000001" value="1"></div><div class="field"><label>Perda %</label><input id="f_waste" type="number" step=".01" value="0"></div><div class="field full"><label>Observação</label><input id="f_note" placeholder="Opcional"></div></div>`;foot=`<button class="btn" onclick="closeModal()">Cancelar</button><button class="btn primary" onclick="saveComponent(${productId})">Adicionar</button>`}
 if(type==="process"){title="Adicionar processo";body=`<div class="form-grid"><div class="field"><label>Processo</label><input id="f_process" placeholder="Ex.: Corte"></div><div class="field"><label>Tempo por unidade (h)</label><input id="f_time" type="number" step=".01" value=".5"></div></div>`;foot=`<button class="btn" onclick="closeModal()">Cancelar</button><button class="btn primary" onclick="saveProcess(${productId})">Adicionar processo</button>`}
 m.innerHTML=`<div class="modal-head"><h3>${title}</h3><button class="close" onclick="closeModal()">×</button></div><div class="modal-body">${body}</div><div class="modal-foot">${foot}</div>`;mb.classList.add("open")
}
function closeModal(){document.getElementById("modalBackdrop").classList.remove("open")}
function saveProduct(){const p={id:Date.now(),code:val("f_code"),sku:val("f_sku"),name:val("f_name"),category:val("f_cat"),status:val("f_status"),components:[],labor:[]};if(!p.name||!p.code){toast("Preencha nome e código");return}state.products.push(p);state.history.unshift({date:fmtDate(),action:"Produto cadastrado",detail:`${p.name} • ${p.code}`,user:"Administrador"});closeModal();toast("Produto cadastrado");render()}
function saveInput(){const i={id:Date.now(),code:val("f_code"),name:val("f_name"),cat:val("f_cat"),unit:val("f_unit"),cost:Number(val("f_cost")),status:"Ativo"};if(!i.name||!i.code||i.cost<0){toast("Preencha os campos corretamente");return}state.inputs.push(i);state.history.unshift({date:fmtDate(),action:"Insumo cadastrado",detail:`${i.name} • ${i.code}`,user:"Administrador"});closeModal();toast("Insumo cadastrado");render()}
function saveCategory(){const n=val("f_name");if(!n){toast("Informe o nome");return}state.categories.push(n);closeModal();toast("Categoria criada");render()}
function saveLabor(){const salary=Number(val("f_salary")),hours=Number(val("f_hours"));if(salary<0||hours<=0){toast("Valores inválidos");return}state.laborSettings={salary,hours};state.history.unshift({date:fmtDate(),action:"Parâmetro de mão de obra alterado",detail:`Custo/hora recalculado • ${money(salary/hours)}`,user:"Administrador"});closeModal();toast("Parâmetros atualizados");render()}
function saveComponent(id){const p=state.products.find(x=>x.id===id),i=state.inputs.find(x=>x.id===Number(val("f_input")));const qty=Number(val("f_qty")),waste=Number(val("f_waste"));if(!p||!i||qty<0||waste<0){toast("Dados inválidos");return}p.components.push({cat:val("f_cat"),input:i.name,unit:i.unit,qty,waste,cost:i.cost});state.history.unshift({date:fmtDate(),action:"Ficha técnica atualizada",detail:`${p.name} • + ${i.name}`,user:"Administrador"});closeModal();toast("Componente adicionado");render()}
function saveProcess(id){const p=state.products.find(x=>x.id===id),t=Number(val("f_time")),n=val("f_process");if(!p||!n||t<0){toast("Dados inválidos");return}p.labor=p.labor||[];p.labor.push([n,t]);state.history.unshift({date:fmtDate(),action:"Processo atualizado",detail:`${p.name} • ${n} • ${t}h`,user:"Administrador"});closeModal();toast("Processo adicionado");render()}
function val(id){return document.getElementById(id)?.value||""}

function navigate(v){state.view=v;state.selectedProduct=null;render()}
function render(){
 const names={dashboard:"Dashboard",products:"Produtos",bom:"Fichas Técnicas",inputs:"Insumos",categories:"Categorias",labor:"Mão de Obra",costs:"Custos",history:"Histórico",reports:"Relatórios",settings:"Configurações",product:"Produto"};
 document.getElementById("breadcrumb").textContent=names[state.view]||"Dashboard";
 document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.view===state.view));
 const views={dashboard,products,bom,inputs,categories,labor,costs,history,reports,settings,product:productDetail};
 document.getElementById("content").innerHTML=(views[state.view]||dashboard)();
}
document.addEventListener("click",e=>{const n=e.target.closest(".nav-item");if(n)navigate(n.dataset.view)});
document.getElementById("mobileMenu").onclick=()=>document.getElementById("sidebar").classList.toggle("open");
document.getElementById("modalBackdrop").addEventListener("click",e=>{if(e.target.id==="modalBackdrop")closeModal()});
document.getElementById("globalSearchBtn").onclick=()=>openGlobalSearch();
function openGlobalSearch(){openModal("search")}
const oldOpenModal=openModal;
openModal=function(type,id){if(type!=="search")return oldOpenModal(type,id);const m=document.getElementById("modal");document.getElementById("modalBackdrop").classList.add("open");m.innerHTML=`<div class="modal-head"><h3>Pesquisa global</h3><button class="close" onclick="closeModal()">×</button></div><div class="modal-body"><div class="field"><label>Pesquisar produtos, insumos, códigos ou categorias</label><input id="globalInput" autofocus placeholder="Digite para pesquisar..."></div><div id="globalResults" style="margin-top:18px"></div></div>`;document.getElementById("globalInput").oninput=globalSearch}
function globalSearch(){const q=val("globalInput").toLowerCase();const ps=state.products.filter(p=>(p.name+p.code+p.sku).toLowerCase().includes(q));const ins=state.inputs.filter(i=>(i.name+i.code+i.cat).toLowerCase().includes(q));document.getElementById("globalResults").innerHTML=(ps.length?`<div class="eyebrow">PRODUTOS</div>`+ps.map(p=>`<div class="kpi-row"><span>${p.name} • ${p.code}</span><button class="btn small" onclick="closeModal();openProduct(${p.id})">Abrir</button></div>`).join(""):"")+(ins.length?`<div class="eyebrow" style="margin-top:18px">INSUMOS</div>`+ins.map(i=>`<div class="kpi-row"><span>${i.name} • ${i.code}</span><b>${money(i.cost)}/${i.unit}</b></div>`).join(""):"")||`<div class="empty"><b>Nenhum resultado</b>Tente outro termo.</div>`}
render();
