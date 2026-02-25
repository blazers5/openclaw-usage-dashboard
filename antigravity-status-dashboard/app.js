async function init(){
  const res = await fetch('./status.json');
  const data = await res.json();

  document.getElementById('updatedAt').textContent = `업데이트: ${data.updatedAt}`;

  const cards = [
    ['Model', data.system.model],
    ['Session', data.system.session],
    ['Context', data.system.context],
    ['Tokens', data.system.tokens],
    ['5h Usage', data.system.usage5h],
    ['Day Usage', data.system.usageDay]
  ];

  const wrap = document.getElementById('systemCards');
  cards.forEach(([k,v])=>{
    const d=document.createElement('div');
    d.className='card';
    d.innerHTML=`<div class='k'>${k}</div><div class='v'>${v}</div>`;
    wrap.appendChild(d);
  });

  const roles = document.getElementById('roles');
  data.roles.forEach(r=>{
    const d=document.createElement('div');
    d.className='role';
    d.innerHTML=`<b>${r.name}</b> · ${r.role}${r.id?` <span style='color:#9ca3af'>(${r.id})</span>`:''}`;
    roles.appendChild(d);
  });

  const projects = document.getElementById('projects');
  data.projects.forEach(p=>{
    const li=document.createElement('li');
    li.textContent=p;
    projects.appendChild(li);
  });
}

init();
