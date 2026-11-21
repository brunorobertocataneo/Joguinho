(()=>{'use strict';
const $=s=>document.querySelector(s),canvas=$('#game'),ctx=canvas.getContext('2d'),CW=1200,CH=720,T=performance.now(),TAU=Math.PI*2;
let vw=innerWidth,vh=innerHeight,dpr=Math.min(devicePixelRatio||1,2),scale=1,ox=0,oy=0,now=0,last=0,mode='map',selected=0,game=null,particles=[],sound=true,ac=null,toastUntil=0;
const images={};for(const w of ['pirate','alchemy','ninja'])for(const k of ['hero','enemy','bg','tiles']){let img=new Image();img.src='assets/'+k+'_'+w+'.png';images[k+'_'+w]=img;}
const assets=()=>Object.values(images).every(i=>i.complete&&i.naturalWidth);
let progress={completed:[false,false,false],best:[0,0,0],unlocked:0};
try{const p=JSON.parse(localStorage.getItem('universos_v3_progress'));if(p&&Array.isArray(p.completed))progress={...progress,...p}}catch(e){}
const worlds=[
 {title:'Mar dos Piratas',subtitle:'ONE PIECE',theme:'pirate',accent:'#f8be72',description:'Aventure-se em um porto tropical. Derrote os piratas com sua espada, recolha tesouros e alcance o navio!'},
 {title:'Círculo da Alquimia',subtitle:'FULLMETAL ALCHEMIST',theme:'alchemy',accent:'#a3dfd2',description:'Decifre os símbolos antigos e repita as sequências de transmutação para ativar o grande círculo alquímico.'},
 {title:'Vila dos Ninjas',subtitle:'NARUTO',theme:'ninja',accent:'#f7b7ae',description:'Entre em uma arena ninja! Use golpes e movimentos rápidos para derrotar os inimigos e proteger a vila.'}
];
const keys={left:false,right:false,up:false,down:false,jump:false,attack:false},pressed={jump:false,attack:false};
function save(){localStorage.setItem('universos_v3_progress',JSON.stringify(progress))}
function resize(){vw=innerWidth;vh=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.floor(vw*dpr);canvas.height=Math.floor(vh*dpr);scale=Math.max(vw/CW,vh/CH);ox=(vw-CW*scale)/2;oy=(vh-CH*scale)/2}addEventListener('resize',resize);resize();
function rng(i,j=0){const n=Math.sin(i*127.1+j*311.7)*43758.5453;return n-Math.floor(n)}
function lerp(a,b,v){return a+(b-a)*v}function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function r(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h)}function ellipse(x,y,rx,ry,col){ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill()}
function round(x,y,w,h,rad,col){ctx.fillStyle=col;ctx.beginPath();ctx.roundRect(x,y,w,h,rad);ctx.fill()}
function line(x,y,xx,yy,col,w=1){ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.stroke()}
function polygon(points,col){ctx.fillStyle=col;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fill()}
function text(s,x,y,size=20,col='#fff',align='center',family='Fredoka'){ctx.textAlign=align;ctx.textBaseline='middle';ctx.font='600 '+size+'px '+family;ctx.fillStyle=col;ctx.fillText(s,x,y)}
function glow(x,y,rad,color){const g=ctx.createRadialGradient(x,y,0,x,y,rad);g.addColorStop(0,color);g.addColorStop(1,'#ffffff00');ellipse(x,y,rad,rad,g)}
function gradient(x,y,w,h,a,b){let f=ctx.createLinearGradient(x,y,x,y+h);f.addColorStop(0,a);f.addColorStop(1,b);r(x,y,w,h,f)}
function noise(x,y,w,h,n=100,cols=['#ffffff22']){for(let i=0;i<n;i++){let xx=x+rng(i*11+Math.floor(x),Math.floor(y))*w,yy=y+rng(i*13+Math.floor(y),Math.floor(x))*h; r(xx,yy,(i%4)+2,(i%3)+2,cols[i%cols.length])}}
function star(x,y,size=12,color='#fff2ad',phase=0){let pts=[];for(let i=0;i<10;i++){let a=i*Math.PI/5-Math.PI/2+phase,rad=i%2?size*.49:size;pts.push([x+Math.cos(a)*rad,y+Math.sin(a)*rad])}polygon(pts,color)}
function cloud(x,y,s=1){ctx.save();ctx.globalAlpha=.82;ellipse(x,y,55*s,17*s,'#fff9ea');ellipse(x-24*s,y-10*s,28*s,24*s,'#fffdf5');ellipse(x+11*s,y-18*s,39*s,28*s,'#fffdf5');ellipse(x+39*s,y-5*s,25*s,18*s,'#fffdf5');ctx.restore()}
function particle(x,y,color,count=14,force=160){for(let i=0;i<count;i++){let a=Math.random()*TAU,v=(.3+Math.random())*force;particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-65,t:1,life:.6+Math.random()*.5,size:2+Math.random()*5,color})}}
function stepParticles(dt){for(let i=particles.length-1;i>=0;i--){let p=particles[i];p.t-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=200*dt;if(p.t<=0)particles.splice(i,1)}}
function drawParticles(offset=0){particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.t);r(p.x-offset,p.y,p.size,p.size,p.color);ctx.globalAlpha=1})}
function tone(f=540,d=.12){if(!sound)return;try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();let o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(.035,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+d)}catch(e){}}
function toast(msg){$('#toast').textContent=msg;$('#toast').classList.add('show');toastUntil=now+2.8}
function showModal({eyebrow='✦ UMA AVENTURA ESPECIAL ✦',art='✦',title,description,button='Continuar →',action,secondary=null}){
 $('#modaleyebrow').textContent=eyebrow;$('#modalillustration').textContent=art;$('#modaltitle').textContent=title;$('#modaldescription').innerHTML=description;
 $('#modalprimary').innerHTML=button;$('#modalprimary').onclick=()=>{hideModal();action?.()};
 $('#modalsecondary').classList.toggle('hidden',!secondary);if(secondary){$('#modalsecondary').textContent=secondary.label;$('#modalsecondary').onclick=()=>{hideModal();secondary.action?.()}}
 $('#modal').classList.remove('hidden')
}
function hideModal(){$('#modal').classList.add('hidden')}
function head(label,goal,score){$('#chapter').textContent=label;$('#goal').textContent=goal;$('#score').textContent=score}
function ui(){let playing=mode!=='map';$('#scenehud').classList.toggle('hidden',!playing);$('#controlhint').classList.toggle('hidden',!playing);$('#back').classList.toggle('hidden',!playing);$('#mapfooter').classList.toggle('hidden',playing);$('#touch').classList.toggle('hidden',!playing||innerWidth>800);$('#progress').textContent='✦ '+progress.completed.filter(Boolean).length+' / 3 mundos';}
function complete(score){let n=selected;progress.completed[n]=true;progress.best[n]=Math.max(score,progress.best[n]);progress.unlocked=Math.min(2,Math.max(progress.unlocked,n+1));save();tone(870,.4);particle(600,290,'#ffe29f',65,350);
showModal({eyebrow:'✦ CAPÍTULO CONCLUÍDO ✦',art:n===0?'🏆':n===1?'✨':'🌸',title:n===2?'Nossa aventura continua ♡':'Ilha conquistada!',description:'Você venceu <b>'+worlds[n].title+'</b> com <b>'+score+' pontos</b>.'+(n===2?'<br>O melhor tesouro de todos os universos é viver cada aventura ao seu lado. 💗':'<br>Uma nova ilha está disponível no mapa!'),button:n===2?'Voltar ao arquipélago →':'Conhecer a próxima ilha →',action:()=>{backMap();if(n<2)selectIsland(n+1)}})}
function backMap(){mode='map';game=null;particles=[];pressed.jump=pressed.attack=false;Object.keys(keys).forEach(k=>keys[k]=false);ui();}
const nodes=[{x:256,y:374},{x:608,y:344},{x:954,y:374}];
function drawSea(){gradient(0,0,CW,CH,'#a0ded6','#4e9db9');glow(890,62,450,'#fff5c54d');for(let j=0;j<44;j++){let x=((j*151+Math.sin(now*.25+j)*18)%1350)-75,y=42+(j*89)%650;ellipse(x,y,22+(j%5)*8,2,'#dbf5e172')}for(let j=0;j<28;j++){let x=((j*191+now*(3+j%2))%1390)-100,y=140+(j*61)%450;line(x,y,x+24+(j%4)*10,y,'#e8fff080',2)}noise(0,0,CW,CH,150,['#ffffff11','#103e4c0b']);}
function palm(x,y,s=1){ctx.save();ctx.translate(x,y);ctx.scale(s,s);line(0,0,5,-56,'#7d6542',9);line(1,-40,5,-56,'#c39655',3);for(let i=0;i<6;i++){let a=i*TAU/6;polygon([[5,-55],[5+Math.cos(a)*34,-55+Math.sin(a)*22],[5+Math.cos(a)*56,-55+Math.sin(a)*28],[5+Math.cos(a)*26,-55+Math.sin(a)*5]],i%2?'#3d8f69':'#65b97a')}ellipse(4,-56,6,6,'#a98251');ctx.restore()}
function pine(x,y,s=1,col='#478c70'){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ellipse(0,7,17,5,'#345c5277');r(-5,-34,10,40,'#6b5a50');polygon([[-33,-12],[0,-100],[33,-12]],'#2e705e');polygon([[-27,-38],[0,-115],[28,-38]],col);polygon([[-21,-63],[0,-124],[23,-63]],'#7fc69c');ctx.restore()}
function house(x,y,s=1){ctx.save();ctx.translate(x,y);ctx.scale(s,s);round(-26,-34,52,48,4,'#d9b598');r(-19,-19,12,13,'#9ad0cf');r(8,-19,12,13,'#9ad0cf');polygon([[-37,-33],[0,-68],[37,-33]],'#aa6264');r(-5,-4,12,18,'#8d6b60');ctx.restore()}
function ship(x,y,s=1){ctx.save();ctx.translate(x,y);ctx.scale(s,s);polygon([[-63,7],[59,7],[45,29],[-42,29]],'#78513c');polygon([[-52,8],[50,8],[40,20],[-39,20]],'#b7835b');r(-5,-92,8,101,'#775744');polygon([[6,-90],[8,4],[53,-4]],'#fff3d8');polygon([[-10,-80],[-11,-4],[-43,-9]],'#f5d4b3');r(-2,-95,50,4,'#97624e');ctx.restore()}
function island(x,y,kind,unlocked,active){let bob=Math.sin(now*.8+kind)*3;ctx.save();ctx.translate(x,y+bob);ctx.shadowColor='#1d567fa2';ctx.shadowBlur=38;ctx.shadowOffsetY=20;
ellipse(0,51,163,62,'#d7bc79');ctx.shadowColor='transparent';ellipse(0,32,169,60,'#ffe8ab');ellipse(0,23,157,55,kind===1?'#9eb399':kind===2?'#72b99e':'#72c59b');ellipse(-3,12,146,49,kind===1?'#bbcab0':kind===2?'#a3d4b1':'#a4d9a1');
noise(-110,-22,210,54,35,kind===1?['#6d9c8388','#c9d5b19b']:['#d1e5b6bb','#68b68bbb']);
if(kind===0){palm(-102,0,.77);palm(118,20,.48);ship(0,-26,.74);r(-6,-120,7,31,'#6c5b4c');polygon([[0,-120],[42,-107],[0,-91]],'#4b5367');}
if(kind===1){pine(-112,13,.62);pine(112,22,.58);house(-35,-4,.89);house(51,14,.55);glow(-10,-75,40,'#9be5d25b');ellipse(-10,-76,12,12,'#e9f5c8');}
if(kind===2){pine(-116,2,.55,'#db9ba6');pine(112,6,.52,'#eeafbf');for(let j=-1;j<=1;j++)house(j*48,1,j===0?.8:.55);for(let k=0;k<10;k++)ellipse((rng(k,1)-.5)*280,(rng(k,2)-.5)*50-10,3,3,'#f6cad0');}
ctx.restore();let col=!unlocked?'#e4e6db':active?'#fffce2':'#fff5df';
if(unlocked){glow(x,y-137,65,'#fff1b37f');ellipse(x,y-132+Math.sin(now*2+kind)*4,31,31,kind===0?'#f6c680':kind===1?'#c4e3d3':'#f6bec0');text(progress.completed[kind]?'✓':String(kind+1),x,y-130+Math.sin(now*2+kind)*4,32,'#52666d');}
else{ellipse(x,y-133,31,31,'#42566a');text('🔒',x,y-133,25)}
ctx.save();ctx.shadowColor='#155a7088';ctx.shadowBlur=18;ctx.shadowOffsetY=8;round(x-116,y+114,232,72,19,col);ctx.restore();text(worlds[kind].title,x,y+138,19,'#376a6f');text(!unlocked?'BLOQUEADO':progress.completed[kind]?'✓ CONCLUÍDO · REJOGAR':'CLIQUE PARA EXPLORAR',x,y+165,11,'#b08067','center','Nunito Sans')}
function map(){drawSea();for(let i=0;i<2;i++){const a=nodes[i],b=nodes[i+1];for(let j=0;j<18;j++){let q=j/17,x=lerp(a.x+110,b.x-110,q),y=lerp(a.y+24,b.y+24,q)-27*Math.sin(q*Math.PI);ellipse(x,y,3.5,3.5,'#fff6d6')}}
cloud(130+Math.sin(now*.16)*24,154,.8);cloud(1010+Math.sin(now*.1)*16,147,.65);cloud(590+Math.sin(now*.12)*18,197,.48);ship(1030,608,.55);ship(185,590,.35);
nodes.forEach((n,i)=>island(n.x,n.y,i,i<=progress.unlocked,i===selected));text('✦  O ARQUIPÉLAGO DAS AVENTURAS  ✦',600,126,24,'#fffef2');text('TRÊS ILHAS · TRÊS HISTÓRIAS · UM GRANDE FINAL',600,151,12,'#fff3e0','center','Nunito Sans');}
function selectIsland(i){if(i>progress.unlocked){toast('🔒 Complete a ilha anterior para desbloquear!');return}selected=i;let w=worlds[i];showModal({eyebrow:'✦ CAPÍTULO '+(i+1)+' DE 3 · '+w.subtitle+' ✦',art:['🏴‍☠️','⚗️','🍃'][i],title:w.title,description:w.description+'<br><b>'+['A/D movimentar · Espaço pular · J atacar','Observe os símbolos · Use 1–4 ou clique','WASD movimentar · J atacar · Espaço esquivar'][i]+'</b>',button:'Entrar na aventura →',action:()=>start(i),secondary:{label:'Voltar ao mapa',action:backMap}})}
function start(i){selected=i;particles=[];mode=['pirate','alchemy','ninja'][i];if(mode==='pirate')startPirate();if(mode==='alchemy')startAlchemy();if(mode==='ninja')startNinja();ui()}
function hud(score,goal){head('CAPÍTULO '+(selected+1)+' · '+worlds[selected].subtitle,goal,'✦ '+score+' pontos')}
function drawActor(x,y,type='pirate',f=0,scale=1){let im=images['hero_'+type];ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ellipse(0,5,22,7,'#1c3d4070');if(im&&im.complete&&im.naturalWidth){ctx.imageSmoothingEnabled=false;ctx.drawImage(im,(Math.floor(f)%4)*96,0,96,144,-25,-77,50,76)}else{round(-14,-58,28,58,5,'#e49b5e');ellipse(0,-66,13,15,'#ebc5a0')}ctx.restore()}
function enemySprite(x,y,type='pirate',f=0,s=1){let im=images['enemy_'+type];ctx.save();ctx.translate(x,y);ctx.scale(s,s);ellipse(0,3,22,7,'#17394b65');if(im&&im.complete&&im.naturalWidth){ctx.imageSmoothingEnabled=false;ctx.drawImage(im,(Math.floor(f)%4)*96,0,96,96,-28,-55,56,56)}else ellipse(0,-23,19,19,'#af716c');ctx.restore()}
function decorTree(x,y,kind='pirate',s=1){if(kind==='pirate')palm(x,y,s);else pine(x,y,s,kind==='ninja'?'#c77d96':'#5e9983')}
function drawPlatform(p,camera,kind){let x=p.x-camera,y=p.y;if(x+p.w<-50||x>CW+50)return;
ctx.save();ctx.shadowColor='#17384f6b';ctx.shadowBlur=15;ctx.shadowOffsetY=12;round(x,y,p.w,p.h,kind==='alchemy'?5:9,kind==='pirate'?'#856549':kind==='alchemy'?'#626b6c':'#8b6b68');ctx.restore();
let im=images['tiles_'+kind];if(im&&im.complete&&im.naturalWidth){ctx.save();ctx.beginPath();ctx.rect(x,y,p.w,p.h);ctx.clip();ctx.imageSmoothingEnabled=false;for(let xx=0;xx<p.w;xx+=32)for(let yy=0;yy<p.h;yy+=32){let v=(xx/32+yy/32)%3;ctx.drawImage(im,v*96,0,96,96,Math.floor(x+xx),Math.floor(y+yy),32,32)}ctx.restore()}
else{gradient(x,y,p.w,p.h,'#8ba581','#73634c')}
if(p.h>30)for(let i=14;i<p.w;i+=47){ellipse(x+i,y+3,2,2,kind==='pirate'?'#e9d391':kind==='ninja'?'#f5bad1':'#9dd7c3')}}
function background(kind,camera=0){let im=images['bg_'+kind];if(im&&im.complete&&im.naturalWidth)ctx.drawImage(im,0,0,CW,CH);else gradient(0,0,CW,CH,'#a7dad6','#79b0b1');
ctx.save();ctx.globalAlpha=.26;for(let i=0;i<8;i++){let x=((i*249-camera*.16)%1600+1600)%1600-200;cloud(x,110+(i%3)*55,.62)}ctx.restore();
if(kind==='pirate'){for(let i=0;i<6;i++)ship(((i*351-camera*.24)%1650+1650)%1650-150,531,.42)}
if(kind==='alchemy'){for(let i=0;i<7;i++){let x=((i*215-camera*.27)%1700+1700)%1700-140;ctx.save();ctx.globalAlpha=.28;ellipse(x,492,55,55,'#f6e9bc');ellipse(x,492,39,39,'#6d887f');ellipse(x,492,28,28,'#f1e2b3');ctx.restore()}}
if(kind==='ninja'){for(let i=0;i<12;i++){let x=((i*127-camera*.22)%1700+1700)%1700-120,yy=260+(i*57)%260;r(x+now*9%35,yy,4,3,'#f5c9c7')}}
}
function startPirate(){
 const platforms=[{x:-40,y:574,w:600,h:200},{x:620,y:574,w:495,h:200},{x:1170,y:574,w:540,h:200},{x:1770,y:574,w:680,h:200},{x:500,y:455,w:145,h:22},{x:990,y:433,w:160,h:22},{x:1470,y:439,w:150,h:22},{x:1940,y:421,w:148,h:22}];
 const enemies=[380,755,945,1275,1580,1890,2150].map((x,i)=>({x,y:574,base:x,min:x-75,max:x+75,dir:i%2?1:-1,hp:2,dead:false,hit:0}));
 game={kind:'pirate',x:95,y:480,vx:0,vy:0,ground:false,dir:1,camera:0,platforms,enemies,coins:[250,550,690,1070,1350,1530,2050,2250].map((x,i)=>({x,y:i%3?501:395,taken:false})),score:0,kills:0,hp:4,attack:0,inv:0,frame:0,cooldown:0,done:false};
 $('#controlhint').innerHTML='A / D ou ← → mover · Espaço pular · J / K atacar<br>Derrote 4 piratas e alcance o navio no fim';
 hud(0,'⚔ Derrote 4 piratas e alcance o navio');toast('⚔ Acerte os inimigos com J. Cada pirata tem 2 pontos de vida!')}
function updatePirate(dt){let s=game,p=s,dx=Number(keys.right)-Number(keys.left);p.vx=dx*275;p.dir=dx||p.dir;p.frame+=Math.abs(p.vx)*dt*.023;
 const prev=p.y+68;p.vy+=1250*dt;if(pressed.jump&&p.ground){p.vy=-615;p.ground=false;tone(320)}pressed.jump=false;
 p.x=clamp(p.x+p.vx*dt,25,2420);p.y+=p.vy*dt;p.ground=false;
 if(p.vy>=0)for(const pl of s.platforms)if(p.x+17>pl.x&&p.x-17<pl.x+pl.w&&prev<=pl.y+10&&p.y+68>=pl.y){p.y=pl.y-68;p.vy=0;p.ground=true}
 if(p.y>790){p.hp--;p.x=Math.max(70,p.x-160);p.y=420;p.vy=0;p.inv=1.3;toast('💗 Você caiu!');tone(160);if(p.hp<=0)failure();return}
 s.cooldown=Math.max(0,s.cooldown-dt);s.attack=Math.max(0,s.attack-dt);s.inv=Math.max(0,s.inv-dt);
 if(pressed.attack&&s.cooldown<=0){s.attack=.23;s.cooldown=.37;tone(560);particle(p.x+p.dir*45,p.y+32,'#f9e5b0',11);
 for(const e of s.enemies)if(!e.dead&&Math.abs(e.x-p.x)<87&&Math.abs(e.y-(p.y+68))<80&&Math.sign(e.x-p.x)===p.dir){e.hp--;e.hit=.2;if(e.hp<=0){e.dead=true;s.kills++;s.score+=120;particle(e.x,e.y-30,'#f7ce83',20);tone(840)}else{tone(400);s.score+=15}}}pressed.attack=false;
 for(const e of s.enemies){if(e.dead)continue;e.x+=e.dir*48*dt;if(e.x<e.min||e.x>e.max)e.dir*=-1;e.hit=Math.max(0,e.hit-dt);
 if(p.inv<=0&&Math.abs(e.x-p.x)<29&&Math.abs(e.y-(p.y+68))<70){p.hp--;p.inv=1.2;p.vy=-270;p.x-=p.dir*31;particle(p.x,p.y+20,'#f18a8d',15);tone(150);if(p.hp<=0){failure();return}}}
 for(const coin of s.coins)if(!coin.taken&&Math.hypot(coin.x-p.x,coin.y-(p.y+30))<40){coin.taken=true;s.score+=40;particle(coin.x,coin.y,'#ffe49c',15);tone(900)}
 s.camera=lerp(s.camera,clamp(p.x-380,0,1250),Math.min(1,dt*5));
 hud(s.score,'⚔ '+s.kills+'/4 piratas · ♥ '+s.hp+'/4');
 if(s.x>2250){if(s.kills>=4)complete(s.score+300);else if(!s.warned){s.warned=true;toast('Derrote pelo menos 4 piratas para embarcar!')}}else s.warned=false;
}
function drawPirate(){let s=game;background('pirate',s.camera);glow(840,250,380,'#fff7c81b');
 for(let i=0;i<10;i++){let x=((i*310-s.camera*.52)%1600+1600)%1600-140;decorTree(x,580,'pirate',.52+(i%3)*.12)}
 for(const p of s.platforms)drawPlatform(p,s.camera,'pirate');
 for(const coin of s.coins){if(coin.taken)continue;let x=coin.x-s.camera,y=coin.y+Math.sin(now*4+coin.x)*7;glow(x,y,35,'#ffe19964');ellipse(x,y,13,16,'#b87738');ellipse(x,y,10,13,'#ffe2a0');text('✦',x,y,16,'#a87038')}
 for(const e of s.enemies){if(e.dead)continue;enemySprite(e.x-s.camera,e.y,'pirate',now*5);if(e.hit>0)ellipse(e.x-s.camera,e.y-40,25,25,'#ffcab577');for(let j=0;j<e.hp;j++)ellipse(e.x-s.camera-10+j*12,e.y-68,4,4,'#ffada2')}
 ship(2322-s.camera,544,1.1);glow(2330-s.camera,480,120,'#fff5ac55');
 if(s.attack>0){let a=s.x-s.camera+s.dir*37,y=s.y+28;ctx.save();ctx.strokeStyle='#fff3d4';ctx.lineWidth=10;ctx.beginPath();ctx.arc(a,y,42,s.dir>0?-.9:2.4,s.dir>0?1.2:4.4);ctx.stroke();ctx.restore()}
 if(s.inv<=0||Math.floor(now*10)%2===0)drawActor(s.x-s.camera,s.y+68,'pirate',s.frame,1.15);
 drawParticles(s.camera)}
function startAlchemy(){game={kind:'alchemy',round:0,sequence:[],input:0,score:0,phase:'ready',timer:0,display:-1,tries:3,signals:['✦','◈','✧','✳'],colors:['#79c8c2','#e8bd70','#d98b95','#a998da'],burst:0};$('#controlhint').innerHTML='Observe a sequência luminosa · Clique nos símbolos<br>ou aperte 1, 2, 3, 4 para repetir o ritual';hud(0,'⚗ Complete 5 rituais de transmutação');toast('Observe a sequência e depois repita os símbolos!');setTimeout(()=>{if(mode==='alchemy')nextRound()},950)}
function nextRound(){let s=game;if(!s||mode!=='alchemy')return;s.round++;s.input=0;s.sequence.push(Math.floor(Math.random()*4));s.phase='watch';s.timer=0;s.display=-1;s.frame=0;toast('Ritual '+s.round+' / 5 — memorize os símbolos!')}
function choice(i){let s=game;if(!s||s.phase!=='input')return;s.burst=.35;tone(420+i*115);particle(350+(i%2)*500,327+Math.floor(i/2)*200,s.colors[i],16);
 if(s.sequence[s.input]!==i){s.tries--;tone(160);s.phase='penalty';s.timer=0;s.display=-1;toast('Símbolo incorreto! '+s.tries+' tentativas restantes.');if(s.tries<=0){failure();return}return}
 s.score+=65;s.input++;hud(s.score,'⚗ Ritual '+s.round+'/5 · ♥ '+s.tries+'/3');if(s.input>=s.sequence.length){s.phase='winround';s.timer=0;s.score+=150;particle(600,380,'#ffe1ac',35);tone(940);if(s.round===5){complete(s.score+400);return}toast('✨ Transmutação completa! +150 pontos')}}
function updateAlchemy(dt){let s=game;if(!s)return;s.timer+=dt;if(s.burst>0)s.burst-=dt;if(s.phase==='watch'){let interval=1.05,step=Math.floor(s.timer/interval);if(step>=s.sequence.length){s.phase='input';s.display=-1;s.timer=0;toast('Sua vez! Repita os símbolos na ordem.')}else{s.display=(s.timer%interval<.64)?s.sequence[step]:-1;}}
 if(s.phase==='winround'&&s.timer>1.3)nextRound();if(s.phase==='penalty'&&s.timer>1.2){s.phase='watch';s.timer=0;s.input=0}}
function drawAlchemy(){let s=game;background('alchemy');gradient(0,475,1200,245,'#7a7771','#4c565d');noise(0,475,1200,245,300,['#b49c8330','#312c3e1f','#e6d9ae24']);
glow(600,370,360,'#87e5d342');
ctx.save();ctx.translate(600,386);ctx.rotate(now*.055);ctx.strokeStyle='#d6efe0a6';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,252,0,TAU);ctx.stroke();ctx.strokeStyle='#ffe4b47a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,232,0,TAU);ctx.stroke();for(let i=0;i<8;i++){let a=i*TAU/8;star(Math.cos(a)*242,Math.sin(a)*242,13,'#f6e9c7',now*.2)}ctx.restore();
const positions=[[344,306],[856,306],[344,538],[856,538]];
s.signals.forEach((symbol,i)=>{let [x,y]=positions[i],active=s.display===i,hover=s.phase==='input';ctx.save();ctx.shadowColor=active?s.colors[i]:'#152d3677';ctx.shadowBlur=active?45:20;ctx.shadowOffsetY=active?0:10;ellipse(x,y,87,87,active?'#fff2c5':'#e8d6b2');ctx.restore();ellipse(x,y,77,77,'#42515f');ellipse(x,y,66,66,active?s.colors[i]:'#7e8b8c');ellipse(x,y,57,57,active?'#effff4':'#405665');ctx.save();ctx.translate(x,y);ctx.rotate(active?Math.sin(now*5)*.05:0);text(symbol,0,-4,70,active?'#5e8290':'#d7d0b2');ctx.restore();text(String(i+1),x,y+66,17,'#fff7de');if(active){glow(x,y,128,s.colors[i]+'9a');star(x+59,y-61,13,'#fffcda',now)}})
round(472,315,256,103,21,'#fbf0d9e7');text('CÍRCULO DE',600,344,18,'#9e8771');text('TRANSMUTAÇÃO',600,380,24,'#446e74');
text(s.phase==='watch'?'OBSERVE A SEQUÊNCIA':s.phase==='input'?'REPITA OS SÍMBOLOS':s.phase==='penalty'?'TENTE NOVAMENTE':'RITUAL CONCLUÍDO',600,212,24,'#fff9df');
text('ETAPA '+s.round+'/5  •  '+s.input+'/'+s.sequence.length+' SÍMBOLOS  •  ♥ '+s.tries,600,246,13,'#fef3de','center','Nunito Sans');
drawParticles();}
function alchemyClick(x,y){let positions=[[344,306],[856,306],[344,538],[856,538]];for(let i=0;i<4;i++)if(Math.hypot(x-positions[i][0],y-positions[i][1])<95){choice(i);return}}
function startNinja(){game={kind:'ninja',x:600,y:400,hp:5,score:0,kills:0,goal:12,inv:0,attack:0,dash:0,attackCooldown:0,dashCooldown:0,dir:1,spawn:0,frame:0,enemies:[],shurikens:[],time:0};$('#controlhint').innerHTML='W A S D / setas para mover · J ou K para atacar<br>Espaço: esquiva rápida · Derrote 12 ninjas';hud(0,'🍃 Derrote 12 ninjas na arena');toast('🍃 Arena Ninja! Elimine os inimigos e use a esquiva para escapar.')}
function updateNinja(dt){let s=game;s.time+=dt;s.spawn-=dt;s.inv=Math.max(0,s.inv-dt);s.attack=Math.max(0,s.attack-dt);s.attackCooldown=Math.max(0,s.attackCooldown-dt);s.dash=Math.max(0,s.dash-dt);s.dashCooldown=Math.max(0,s.dashCooldown-dt);
let dx=Number(keys.right)-Number(keys.left),dy=Number(keys.down)-Number(keys.up);let l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;if(dx)s.dir=dx>0?1:-1;
if(pressed.jump&&s.dashCooldown===0){s.dash=.22;s.dashCooldown=1.25;s.inv=.25;tone(430);particle(s.x,s.y,'#d1f8e8',16)}pressed.jump=false;
s.x=clamp(s.x+dx*(s.dash>0?710:260)*dt,100,1095);s.y=clamp(s.y+dy*(s.dash>0?710:260)*dt,206,643);s.frame+=(Math.abs(dx)+Math.abs(dy))*dt*7;
if(s.spawn<=0&&s.kills+s.enemies.length<s.goal+4){let a=Math.random()*TAU,r=340;s.enemies.push({x:clamp(s.x+Math.cos(a)*r,110,1070),y:clamp(s.y+Math.sin(a)*r,213,620),speed:72+Math.random()*22,hit:0,hp:1});s.spawn=1.25}
if(pressed.attack&&s.attackCooldown<=0){s.attack=.2;s.attackCooldown=.28;tone(650);particle(s.x+s.dir*32,s.y-28,'#ffe7b8',12);
for(const e of s.enemies){if(Math.hypot(e.x-s.x,e.y-s.y)<88){e.hp--;e.hit=.18;if(e.hp<=0){e.dead=true;s.kills++;s.score+=100;particle(e.x,e.y-22,'#f9d2ae',22);tone(800)}}}}pressed.attack=false;
for(const e of s.enemies){if(e.dead)continue;let a=Math.atan2(s.y-e.y,s.x-e.x);e.x+=Math.cos(a)*e.speed*dt;e.y+=Math.sin(a)*e.speed*dt;e.hit=Math.max(0,e.hit-dt);if(Math.hypot(e.x-s.x,e.y-s.y)<37&&s.inv<=0){s.hp--;s.inv=1.55;particle(s.x,s.y-20,'#ff9a9a',14);tone(170);if(s.hp<=0){failure();return}}}
s.enemies=s.enemies.filter(e=>!e.dead);
hud(s.score,'🍃 '+s.kills+'/12 ninjas · ♥ '+s.hp+'/5');if(s.kills>=s.goal)complete(s.score+450);}
function drawNinja(){let s=game;background('ninja');gradient(0,185,1200,535,'#92b19b','#526e68');
for(let i=0;i<45;i++){let x=(i*173)%1200,y=191+(i*67)%525;if(i%3===0){ellipse(x,y,49,18,'#355f5966');ellipse(x,y-16,34,24,i%2?'#669c7a':'#d2a0ab')}else{ellipse(x,y,3,3,'#f7c9bd')}}
ctx.save();ctx.shadowColor='#183b4599';ctx.shadowBlur=30;round(65,192,1065,468,25,'#386f65');ctx.restore();round(79,205,1037,444,23,'#87b298');round(97,220,1003,414,20,'#9ac6a0');noise(101,230,992,392,250,['#7da88a5c','#d1dba456','#f4c4b47b']);
ctx.save();ctx.globalAlpha=.26;ctx.strokeStyle='#f3e9c8';ctx.lineWidth=11;ctx.beginPath();ctx.ellipse(600,423,184,135,0,0,TAU);ctx.stroke();ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(600,423,151,103,0,0,TAU);ctx.stroke();for(let k=0;k<8;k++){let a=k*TAU/8;star(600+170*Math.cos(a),423+121*Math.sin(a),12,'#fbf2d4')}ctx.restore();
for(let k=0;k<15;k++){let x=150+k*68,y=260+(k%3)*140;ellipse(x,y,3,3,'#fbe5ae');if(k%4===0){ellipse(x+20,y+25,9,4,'#598b73');ellipse(x+18,y+23,5,2,'#d2e8bb')}}

for(let i=0;i<17;i++){let x=104+i*61;ellipse(x,225,8,8,'#db9dad');ellipse(x,627,8,8,'#db9dad')}
for(let i=0;i<8;i++){let y=241+i*51;ellipse(100,y,7,7,'#e3b3bb');ellipse(1097,y,7,7,'#e3b3bb')}
for(let i=0;i<4;i++){let x=160+i*280;decorTree(x,210,'ninja',.65);decorTree(x+76,645,'ninja',.6)}
ctx.save();ctx.globalAlpha=.3;for(let i=0;i<14;i++){let x=105+(i*111+now*17)%990,y=235+(i*83+now*13)%390;ellipse(x,y,6,3,'#e9acb6')}ctx.restore();
s.enemies.sort((a,b)=>a.y-b.y).forEach(e=>{enemySprite(e.x,e.y+12,'ninja',now*6,.95);if(e.hit>0)ellipse(e.x,e.y-26,24,27,'#ffccaa7f')});
if(s.attack>0){let a=s.x+s.dir*46;glow(a,s.y-23,80,'#fff7cc88');ctx.save();ctx.strokeStyle='#fff9e5';ctx.lineWidth=11;ctx.beginPath();ctx.arc(a,s.y-29,48,s.dir>0?-.9:2.3,s.dir>0?1.3:4.1);ctx.stroke();ctx.restore()}
if(s.inv<=0||Math.floor(now*11)%2===0)drawActor(s.x,s.y+13,'ninja',s.frame,1.12);
drawParticles()}
function failure(){let score=game?.score||0;const i=selected;showModal({eyebrow:'✦ TENTE NOVAMENTE ✦',art:'💗',title:'A aventura continua!',description:'Você conseguiu <b>'+score+' pontos</b>. O segredo é observar os inimigos, usar seus poderes e continuar tentando.',button:'Recomeçar a fase →',action:()=>start(i),secondary:{label:'Voltar ao mapa',action:backMap}})}
function clickCanvas(x,y){if(!$('#modal').classList.contains('hidden'))return;if(mode==='map'){nodes.forEach((n,i)=>{if(Math.hypot((x-n.x)/1.1,(y-n.y)/1.1)<160||Math.abs(x-n.x)<120&&y>n.y+102&&y<n.y+190)selectIsland(i)})}else if(mode==='alchemy')alchemyClick(x,y)}
function pointerPos(e){return{x:(e.clientX-ox)/scale,y:(e.clientY-oy)/scale}}
canvas.addEventListener('click',e=>{let p=pointerPos(e);clickCanvas(p.x,p.y)});
const bindings={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',Space:'jump',KeyJ:'attack',KeyK:'attack'};
addEventListener('keydown',e=>{if(bindings[e.code]){e.preventDefault();const k=bindings[e.code];keys[k]=true;if(k==='jump'&&!e.repeat)pressed.jump=true;if(k==='attack'&&!e.repeat)pressed.attack=true}
if(mode==='alchemy'&&/^[1-4]$/.test(e.key))choice(Number(e.key)-1);if(e.key==='Escape'&&mode!=='map'&&$('#modal').classList.contains('hidden'))backMap()});
addEventListener('keyup',e=>{if(bindings[e.code])keys[bindings[e.code]]=false});addEventListener('blur',()=>{Object.keys(keys).forEach(k=>keys[k]=false)});
document.querySelectorAll('[data-key]').forEach(b=>{let key=b.dataset.key;b.addEventListener('pointerdown',e=>{e.preventDefault();keys[key]=true;if(key==='jump')pressed.jump=true;if(key==='attack')pressed.attack=true;b.setPointerCapture(e.pointerId)});b.addEventListener('pointerup',()=>keys[key]=false);b.addEventListener('pointercancel',()=>keys[key]=false)});
$('#back').onclick=backMap;$('#audio').onclick=()=>{sound=!sound;$('#audio').textContent=sound?'♫':'♪̸';toast(sound?'Efeitos sonoros ativados':'Efeitos sonoros desativados')};
$('#help').onclick=()=>showModal({eyebrow:'✦ GUIA DOS UNIVERSOS ✦',art:'🧭',title:'Como jogar',description:'<b>Piratas:</b> A/D andar, Espaço pular, J atacar.<br><b>Alquimia:</b> observe a sequência e repita com os números 1–4 ou clicando.<br><b>Ninjas:</b> WASD movimentar, J atacar, Espaço esquivar.<br>Ganhe pontos, vença cada aventura e desbloqueie a próxima ilha.',button:'Entendi!',action:()=>{}});
showModal({eyebrow:'✦ UMA JORNADA POR TRÊS UNIVERSOS ✦',art:'🏝️',title:'Nossos Universos',description:'Um arquipélago mágico com três aventuras de verdade: um jogo de combate pirata, um desafio de alquimia e uma arena ninja. Cada ilha tem sua própria história, controles e objetivos.<br><b>Pronto para embarcar?</b>',button:'Começar a aventura →',action:()=>{toast('Clique na primeira ilha para começar!')}});
function frame(timestamp){let dt=Math.min(.042,(timestamp-last)/1000||0);last=timestamp;now+=dt;
ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,vw,vh);ctx.translate(ox,oy);ctx.scale(scale,scale);ctx.imageSmoothingEnabled=true;
if($('#modal').classList.contains('hidden')){if(mode==='pirate')updatePirate(dt);if(mode==='alchemy')updateAlchemy(dt);if(mode==='ninja')updateNinja(dt)}stepParticles(dt);
if(mode==='map')map();if(mode==='pirate'&&game)drawPirate();if(mode==='alchemy'&&game)drawAlchemy();if(mode==='ninja'&&game)drawNinja();
if(toastUntil<now)$('#toast').classList.remove('show');requestAnimationFrame(frame)}
ui();requestAnimationFrame(frame);
window.__gameDebug={start,backMap,complete,get:()=>({mode,score:game?.score,kills:game?.kills,phase:game?.phase,unlocked:progress.unlocked})};
})();