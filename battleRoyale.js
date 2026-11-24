export class BattleRoyaleSystem {
  constructor(T, scene, player, map, ui, input, config) {
    this.T=T; this.scene=scene; this.player=player; this.map=map; this.ui=ui; this.input=input; this.c=config;
    this.dropActive=false; this.dropTime=0; this.dropDuration=12; this.started=false; this.dropState="idle"; this.plane=null; this.dropLine=null; this.parachute=null;
    this.medkits=2; this.gloo=3; this.grenades=2; this.airdrops=[]; this.airdropTimer=22;
    this.vehicle=null; this.inVehicle=false; this.vehicleSpeed=0; this.vehicleCooldown=0;
    this.keys={use:false,gloo:false,grenade:false,vehicle:false,medkit:false};
    this.bindKeys(); this.bindMobile(); this.buildVehicle();
  }

  bindMobile(){
    const map={gloo:"gloo",grenade:"grenade",medkit:"medkit",vehicle:"vehicle"};
    for(const [id,key] of Object.entries(map)){
      document.getElementById(id+"Btn")?.addEventListener("pointerdown",e=>{e.preventDefault();this.keys[key]=true;});
    }
  }

  bindKeys(){
    addEventListener("keydown",e=>{
      if(e.code==="KeyE") this.keys.use=true;
      if(e.code==="KeyG") this.keys.gloo=true;
      if(e.code==="KeyF") this.keys.grenade=true;
      if(e.code==="KeyV") this.keys.vehicle=true;
      if(e.code==="KeyH") this.keys.medkit=true;
    });
  }

  buildVehicle(){
    const T=this.T, g=new T.Group();
    const mat=new T.MeshStandardMaterial({color:0x1b2421,metalness:.7,roughness:.3});
    const glow=new T.MeshBasicMaterial({color:0x49e1b0,transparent:true,opacity:.75});
    const body=new T.Mesh(new T.BoxGeometry(2.1,.55,3.2),mat); body.position.y=.65; g.add(body);
    const cabin=new T.Mesh(new T.BoxGeometry(1.5,.65,1.35),mat); cabin.position.set(0,1.08,.15); g.add(cabin);
    for(const x of [-.92,.92]) for(const z of [-1.05,1.05]){
      const w=new T.Mesh(new T.CylinderGeometry(.34,.34,.28,14),new T.MeshStandardMaterial({color:0x090b0b,roughness:.75}));
      w.rotation.z=Math.PI/2; w.position.set(x,.38,z); g.add(w);
    }
    const lamp=new T.Mesh(new T.BoxGeometry(.55,.12,.05),glow); lamp.position.set(0,.9,-1.62); g.add(lamp);
    g.visible=false; this.scene.add(g); this.vehicle=g;
  }

  buildDropAircraft(){
    const T=this.T;
    this.plane=new T.Group();
    const body=new T.Mesh(new T.BoxGeometry(7,1.25,18),new T.MeshStandardMaterial({color:0x18232c,metalness:.7,roughness:.3}));
    body.position.y=0; this.plane.add(body);
    const nose=new T.Mesh(new T.ConeGeometry(1.1,4,6),new T.MeshStandardMaterial({color:0x2c3d48,metalness:.7,roughness:.28}));
    nose.rotation.x=-Math.PI/2; nose.position.z=-11; this.plane.add(nose);
    for(const s of [-1,1]){
      const wing=new T.Mesh(new T.BoxGeometry(15,.22,3.2),new T.MeshStandardMaterial({color:0x10191f,metalness:.6,roughness:.34}));
      wing.position.set(0,0,s*2.7); wing.rotation.y=s*.08; this.plane.add(wing);
      const engine=new T.Mesh(new T.CylinderGeometry(.55,.72,2.2,12),new T.MeshStandardMaterial({color:0x090d10,metalness:.9,roughness:.2}));
      engine.rotation.z=Math.PI/2; engine.position.set(s*3.1,-.35,-1.4); this.plane.add(engine);
    }
    this.plane.traverse(o=>{o.castShadow=false;o.receiveShadow=false});
    this.plane.visible=false; this.map.root.add(this.plane);
  }

  start(){
    this.started=true; this.dropActive=true; this.dropTime=0; this.dropState="plane";
    this.player.__combatLocked=true;
    const T=this.T;
    const x=(Math.random()-.5)*(this.c.world.size*.65);
    const z=(Math.random()-.5)*(this.c.world.size*.65);
    this.dropStart=new T.Vector3(x,170,z);
    this.dropDir=new T.Vector3(Math.cos(Math.random()*Math.PI*2),0,Math.sin(Math.random()*Math.PI*2)).normalize();
    this.dropTarget=this.player.object.position.clone();
    this.player.object.position.copy(this.dropStart);
    this.player.grounded=false; this.player.vy=0;
    this.plane.position.copy(this.dropStart);
    this.plane.position.addScaledVector(this.dropDir,-22);
    this.plane.position.y=170;
    this.plane.lookAt(this.plane.position.clone().add(this.dropDir));
    this.plane.visible=true;
    this.player.character.visible=false;
    this.ui.toast("TRANSPORT INBOUND · PREPARE TO DROP");
  }


  endDrop(){
    this.dropActive=false; this.dropState="landed";
    if(this.plane) this.plane.visible=false;
    if(this.parachute){this.parachute.removeFromParent();this.parachute=null;}
    this.ui.toast("TOUCHDOWN · MATCH LIVE");
    this.player.object.position.y=0;
    this.player.vy=0;
    this.player.grounded=true;
    this.player.__combatLocked=false;
    this.ui.toast("LANDING CONFIRMED");
  }

  spawnAirdrop(){
    const T=this.T, angle=Math.random()*Math.PI*2, r=250+Math.random()*700;
    const g=new T.Group(); const crate=new T.Mesh(new T.BoxGeometry(1.8,1.3,1.8),new T.MeshStandardMaterial({color:0x25322c,metalness:.35,roughness:.6}));
    crate.position.y=.7; g.add(crate);
    const beacon=new T.Mesh(new T.CylinderGeometry(.035,.035,14,8),new T.MeshBasicMaterial({color:0xff4b5d,transparent:true,opacity:.7,depthWrite:false}));
    beacon.position.y=7; g.add(beacon);
    const light=new T.PointLight(0xff314c,8,26); light.position.y=4; g.add(light);
    g.position.set(Math.cos(angle)*r,0,Math.sin(angle)*r); this.map.root.add(g);
    this.airdrops.push({object:g,opened:false,phase:Math.random()*10});
  }

  openAirdrop(drop){
    if(drop.opened)return;
    drop.opened=true;
    this.medkits=Math.min(5,this.medkits+1); this.gloo=Math.min(8,this.gloo+2);
    this.grenades=Math.min(5,this.grenades+2);
    this.ui.toast("AIRDROP LOOT · MEDKIT + GLOO + GRENADE");
    drop.object.visible=false;
  }

  deployGloo(){
    if(this.gloo<=0){this.ui.toast("NO GLOO WALLS");return;}
    const T=this.T, g=new T.Group();
    const wall=new T.Mesh(new T.BoxGeometry(4.8,2.6,.35),new T.MeshStandardMaterial({color:0x4f6c64,metalness:.15,roughness:.65,transparent:true,opacity:.94}));
    wall.position.y=1.3; g.add(wall);
    const glow=new T.Mesh(new T.BoxGeometry(4.5,2.45,.08),new T.MeshBasicMaterial({color:0x62e6c2,transparent:true,opacity:.22}));
    glow.position.set(0,1.3,-.2); g.add(glow);
    const forward=new T.Vector3(-Math.sin(this.player.yaw),0,-Math.cos(this.player.yaw));
    g.position.copy(this.player.object.position).addScaledVector(forward,3);
    g.rotation.y=this.player.yaw; this.map.root.add(g); this.gloo--;
    this.ui.toast("GLOO WALL DEPLOYED");
    setTimeout(()=>g.removeFromParent(),30000);
  }

  throwGrenade(){
    if(this.grenades<=0){this.ui.toast("NO GRENADES");return;}
    const T=this.T, grenade=new T.Mesh(new T.SphereGeometry(.13,10,8),new T.MeshStandardMaterial({color:0x26332e,emissive:0xff493e,emissiveIntensity:.35}));
    const forward=new T.Vector3(-Math.sin(this.player.yaw),.35,-Math.cos(this.player.yaw));
    grenade.position.copy(this.player.object.position).add(new T.Vector3(0,1.35,0)).addScaledVector(forward,1);
    this.map.root.add(grenade); this.grenades--;
    let life=0; const start=grenade.position.clone();
    const timer=setInterval(()=>{
      life+=.05; grenade.position.copy(start).addScaledVector(forward,Math.min(18,life*15)); grenade.position.y=Math.max(.15,1.35+forward.y*life*15-4.8*life*life);
      if(life>.8){clearInterval(timer); grenade.removeFromParent(); this.explode(grenade.position.clone());}
    },50);
  }

  explode(pos){
    const radius=6;
    for(const b of this.player?.__bots||[]){
      if(!b?.alive)continue;
      if(b.object.position.distanceTo(pos)<radius)b.hit(45);
    }
    this.ui.toast("FRAG GRENADE");
  }

  useMedkit(){
    if(this.medkits<=0){this.ui.toast("NO MEDKITS");return;}
    if(this.player.hp>=100){this.ui.toast("HP ALREADY FULL");return;}
    this.medkits--; this.player.hp=Math.min(100,this.player.hp+55); this.ui.toast("MEDKIT USED · +55 HP");
  }

  vehicleAction(){
    if(this.vehicleCooldown>0)return;
    const d=this.player.object.position.distanceTo(this.vehicle.position);
    if(!this.inVehicle && d<6){this.inVehicle=true;this.vehicle.visible=true;this.ui.toast("VEHICLE ENTERED · V TO EXIT");}
    else if(this.inVehicle){this.inVehicle=false;this.ui.toast("VEHICLE EXITED");}
  }

  update(dt, bots){
    this.player.__bots=bots?.bots||[];
    if(!this.started)return;
    if(this.input.consumeGloo?.()) this.deployGloo();
    if(this.input.consumeGrenade?.()) this.throwGrenade();
    if(this.input.consumeAirdrop?.()) this.callAirdrop();
    const counts=document.getElementById("brCounts");
    if(counts) counts.textContent=`MED \${this.medkits}  ·  GLOO \${this.gloo}  ·  FRAG \${this.grenades}  ·  V \${this.inVehicle?"DRIVE":"ENTER"}`;
    if(this.dropActive){
      this.dropTime+=dt;
      const axis=this.input.axis();
      this.player.object.position.y=Math.max(0,85-this.dropTime*12);
      const forward=new this.T.Vector3(-Math.sin(this.player.yaw),0,-Math.cos(this.player.yaw));
      const right=new this.T.Vector3(Math.cos(this.player.yaw),0,-Math.sin(this.player.yaw));
      this.player.object.position.addScaledVector(forward,axis.y*dt*18);
      this.player.object.position.addScaledVector(right,axis.x*dt*18);
      this.player.object.position.x=Math.max(-this.c.world.size/2+20,Math.min(this.c.world.size/2-20,this.player.object.position.x));
      this.player.object.position.z=Math.max(-this.c.world.size/2+20,Math.min(this.c.world.size/2-20,this.player.object.position.z));
      if(this.dropTime>this.dropDuration||this.player.object.position.y<=0)this.endDrop();
    }
    if(this.keys.gloo){this.keys.gloo=false;this.deployGloo();}
    if(this.keys.grenade){this.keys.grenade=false;this.throwGrenade();}
    if(this.keys.medkit){this.keys.medkit=false;this.useMedkit();}
    if(this.keys.vehicle){this.keys.vehicle=false;this.vehicleAction();}
    for(const d of this.airdrops){
      if(!d.object.visible)continue;
      d.phase+=dt; d.object.rotation.y+=dt*.25; d.object.children[2].intensity=6+Math.sin(d.phase*4)*3;
      if(d.object.position.distanceTo(this.player.object.position)<4)this.openAirdrop(d);
    }
    this.airdropTimer-=dt;
    if(this.airdropTimer<=0){this.spawnAirdrop();this.airdropTimer=38+Math.random()*25;this.ui.toast("AIRDROP INCOMING");}
    if(this.inVehicle){
      const axis=this.input.axis(); const speed=24;
      const forward=new this.T.Vector3(-Math.sin(this.player.yaw),0,-Math.cos(this.player.yaw));
      const right=new this.T.Vector3(Math.cos(this.player.yaw),0,-Math.sin(this.player.yaw));
      this.player.object.position.addScaledVector(forward,axis.y*speed*dt);
      this.player.object.position.addScaledVector(right,axis.x*speed*.75*dt);
      this.player.object.position.x=Math.max(-this.c.world.size/2+20,Math.min(this.c.world.size/2-20,this.player.object.position.x));
      this.player.object.position.z=Math.max(-this.c.world.size/2+20,Math.min(this.c.world.size/2-20,this.player.object.position.z));
      this.vehicle.position.copy(this.player.object.position); this.vehicle.rotation.y=this.player.yaw; this.vehicle.visible=true;
    } else this.vehicle.visible=false;
  }
  update(dt,bots){
    const T=this.T;
    this.player.__bots=bots?.bots||[];
    if(!this.started)return;
    const counts=document.getElementById("brCounts");
    if(counts) counts.textContent=`MED ${this.medkits}  ·  GLOO ${this.gloo}  ·  FRAG ${this.grenades}  ·  V ${this.inVehicle?"DRIVE":"ENTER"}`;
    if(this.dropActive){
      this.dropTime+=dt;
      if(this.dropState==="plane"){
        this.plane.position.addScaledVector(this.dropDir,dt*55);
        this.plane.lookAt(this.plane.position.clone().add(this.dropDir));
        if(this.dropTime>4.2){
          this.dropState="jump";
          this.player.object.position.copy(this.plane.position);
          this.player.object.position.y-=1.8;
          this.ui.toast("JUMP NOW · DESCEND INTO DISTRICT 09");
        }
      } else {
        const axis=this.input.axis();
        const forward=new T.Vector3(-Math.sin(this.player.yaw),0,-Math.cos(this.player.yaw));
        const right=new T.Vector3(Math.cos(this.player.yaw),0,-Math.sin(this.player.yaw));
        this.player.object.position.y=Math.max(0,168-(this.dropTime-4.2)*18);
        this.player.object.position.addScaledVector(forward,axis.y*dt*28);
        this.player.object.position.addScaledVector(right,axis.x*dt*28);
        this.player.object.position.x=Math.max(-this.c.world.size/2+20,Math.min(this.c.world.size/2-20,this.player.object.position.x));
        this.player.object.position.z=Math.max(-this.c.world.size/2+20,Math.min(this.c.world.size/2-20,this.player.object.position.z));
        this.player.character.visible=false;
        if(this.player.object.position.y<115 && !this.parachute){
          this.parachute=new T.Mesh(new T.CircleGeometry(3.8,24),new T.MeshBasicMaterial({color:0xe6edf2,transparent:true,opacity:.88,side:T.DoubleSide}));
          this.parachute.rotation.x=-Math.PI/2; this.parachute.position.copy(this.player.object.position); this.parachute.position.y+=5;
          this.map.root.add(this.parachute);
          this.ui.toast("PARACHUTE DEPLOYED");
        }
        if(this.parachute){
          this.parachute.position.copy(this.player.object.position); this.parachute.position.y+=5;
          this.parachute.rotation.z=this.player.yaw;
        }
        if(this.player.object.position.y<=0 || this.dropTime>12) this.endDrop();
      }
    }
    

  bindMobile(){
    const map={gloo:"gloo",grenade:"grenade",medkit:"medkit",vehicle:"vehicle"};
    for(const [id,key] of Object.entries(map)){
      document.getElementById(id+"Btn")?.addEventListener("pointerdown",e=>{e.preventDefault();this.keys[key]=true;});
    }
  }

  bindKeys(){
    addEventListener("keydown",e=>{
      if(e.code==="KeyE") this.keys.use=true;
      if(e.code==="KeyG") this.keys.gloo=true;
      if(e.code==="KeyF") this.keys.grenade=true;
      if(e.code==="KeyV") this.keys.vehicle=true;
      if(e.code==="KeyH") this.keys.medkit=true;
    });
  }

  buildVehicle(){
    const T=this.T, g=new T.Group();
    const mat=new T.MeshStandardMaterial({color:0x1b2421,metalness:.7,roughness:.3});
    const glow=new T.MeshBasicMaterial({color:0x49e1b0,transparent:true,opacity:.75});
    const body=new T.Mesh(new T.BoxGeometry(2.1,.55,3.2),mat); body.position.y=.65; g.add(body);
    const cabin=new T.Mesh(new T.BoxGeometry(1.5,.65,1.35),mat); cabin.position.set(0,1.08,.15); g.add(cabin);
    for(const x of [-.92,.92]) for(const z of [-1.05,1.05]){
      const w=new T.Mesh(new T.CylinderGeometry(.34,.34,.28,14),new T.MeshStandardMaterial({color:0x090b0b,roughness:.75}));
      w.rotation.z=Math.PI/2; w.position.set(x,.38,z); g.add(w);
    }
    const lamp=new T.Mesh(new T.BoxGeometry(.55,.12,.05),glow); lamp.position.set(0,.9,-1.62); g.add(lamp);
    g.visible=false; this.scene.add(g); this.vehicle=g;
  }

  buildDropAircraft(){
    const T=this.T;
    this.plane=new T.Group();
    const body=new T.Mesh(new T.BoxGeometry(7,1.25,18),new T.MeshStandardMaterial({color:0x18232c,metalness:.7,roughness:.3}));
    body.position.y=0; this.plane.add(body);
    const nose=new T.Mesh(new T.ConeGeometry(1.1,4,6),new T.MeshStandardMaterial({color:0x2c3d48,metalness:.7,roughness:.28}));
    nose.rotation.x=-Math.PI/2; nose.position.z=-11; this.plane.add(nose);
    for(const s of [-1,1]){
      const wing=new T.Mesh(new T.BoxGeometry(15,.22,3.2),new T.MeshStandardMaterial({color:0x10191f,metalness:.6,roughness:.34}));
      wing.position.set(0,0,s*2.7); wing.rotation.y=s*.08; this.plane.add(wing);
      const engine=new T.Mesh(new T.CylinderGeometry(.55,.72,2.2,12),new T.MeshStandardMaterial({color:0x090d10,metalness:.9,roughness:.2}));
      engine.rotation.z=Math.PI/2; engine.position.set(s*3.1,-.35,-1.4); this.plane.add(engine);
    }
    this.plane.traverse(o=>{o.castShadow=false;o.receiveShadow=false});
    this.plane.visible=false; this.map.root.add(this.plane);
  }

  start(){
    this.started=true; this.dropActive=true; this.dropTime=0; this.dropState="plane";
    this.player.__combatLocked=true;
    const T=this.T;
    const x=(Math.random()-.5)*(this.c.world.size*.65);
    const z=(Math.random()-.5)*(this.c.world.size*.65);
    this.dropStart=new T.Vector3(x,170,z);
    this.dropDir=new T.Vector3(Math.cos(Math.random()*Math.PI*2),0,Math.sin(Math.random()*Math.PI*2)).normalize();
    this.dropTarget=this.player.object.position.clone();
    this.player.object.position.copy(this.dropStart);
    this.player.grounded=false; this.player.vy=0;
    this.plane.position.copy(this.dropStart);
    this.plane.position.addScaledVector(this.dropDir,-22);
    this.plane.position.y=170;
    this.plane.lookAt(this.plane.position.clone().add(this.dropDir));
    this.plane.visible=true;
    this.player.character.visible=false;
    this.ui.toast("TRANSPORT INBOUND · PREPARE TO DROP");
  }


  endDrop(){
    this.dropActive=false;
    this.player.object.position.y=0;
    this.player.vy=0;
    this.player.grounded=true;
    this.player.__combatLocked=false;
    this.ui.toast("LANDING CONFIRMED");
  }

  spawnAirdrop(){
    const T=this.T, angle=Math.random()*Math.PI*2, r=250+Math.random()*700;
    const g=new T.Group(); const crate=new T.Mesh(new T.BoxGeometry(1.8,1.3,1.8),new T.MeshStandardMaterial({color:0x25322c,metalness:.35,roughness:.6}));
    crate.position.y=.7; g.add(crate);
    const beacon=new T.Mesh(new T.CylinderGeometry(.035,.035,14,8),new T.MeshBasicMaterial({color:0xff4b5d,transparent:true,opacity:.7,depthWrite:false}));
    beacon.position.y=7; g.add(beacon);
    const light=new T.PointLight(0xff314c,8,26); light.position.y=4; g.add(light);
    g.position.set(Math.cos(angle)*r,0,Math.sin(angle)*r); this.map.root.add(g);
    this.airdrops.push({object:g,opened:false,phase:Math.random()*10});
  }

  openAirdrop(drop){
    if(drop.opened)return;
    drop.opened=true;
    this.medkits=Math.min(5,this.medkits+1); this.gloo=Math.min(8,this.gloo+2);
    this.grenades=Math.min(5,this.grenades+2);
    this.ui.toast("AIRDROP LOOT · MEDKIT + GLOO + GRENADE");
    drop.object.visible=false;
  }

  deployGloo(){
    if(this.gloo<=0){this.ui.toast("NO GLOO WALLS");return;}
    const T=this.T, g=new T.Group();
    const wall=new T.Mesh(new T.BoxGeometry(4.8,2.6,.35),new T.MeshStandardMaterial({color:0x4f6c64,metalness:.15,roughness:.65,transparent:true,opacity:.94}));
    wall.position.y=1.3; g.add(wall);
    const glow=new T.Mesh(new T.BoxGeometry(4.5,2.45,.08),new T.MeshBasicMaterial({color:0x62e6c2,transparent:true,opacity:.22}));
    glow.position.set(0,1.3,-.2); g.add(glow);
    const forward=new T.Vector3(-Math.sin(this.player.yaw),0,-Math.cos(this.player.yaw));
    g.position.copy(this.player.object.position).addScaledVector(forward,3);
    g.rotation.y=this.player.yaw; this.map.root.add(g); this.gloo--;
    this.ui.toast("GLOO WALL DEPLOYED");
    setTimeout(()=>g.removeFromParent(),30000);
  }

  throwGrenade(){
    if(this.grenades<=0){this.ui.toast("NO GRENADES");return;}
    const T=this.T, grenade=new T.Mesh(new T.SphereGeometry(.13,10,8),new T.MeshStandardMaterial({color:0x26332e,emissive:0xff493e,emissiveIntensity:.35}));
    const forward=new T.Vector3(-Math.sin(this.player.yaw),.35,-Math.cos(this.player.yaw));
    grenade.position.copy(this.player.object.position).add(new T.Vector3(0,1.35,0)).addScaledVector(forward,1);
    this.map.root.add(grenade); this.grenades--;
    let life=0; const start=grenade.position.clone();
    const timer=setInterval(()=>{
      life+=.05; grenade.position.copy(start).addScaledVector(forward,Math.min(18,life*15)); grenade.position.y=Math.max(.15,1.35+forward.y*life*15-4.8*life*life);
      if(life>.8){clearInterval(timer); grenade.removeFromParent(); this.explode(grenade.position.clone());}
    },50);
  }

  explode(pos){
    const radius=6;
    for(const b of this.player?.__bots||[]){
      if(!b?.alive)continue;
      if(b.object.position.distanceTo(pos)<radius)b.hit(45);
    }
    this.ui.toast("FRAG GRENADE");
  }

  useMedkit(){
    if(this.medkits<=0){this.ui.toast("NO MEDKITS");return;}
    if(this.player.hp>=100){this.ui.toast("HP ALREADY FULL");return;}
    this.medkits--; this.player.hp=Math.min(100,this.player.hp+55); this.ui.toast("MEDKIT USED · +55 HP");
  }

  vehicleAction(){
    if(this.vehicleCooldown>0)return;
    const d=this.player.object.position.distanceTo(this.vehicle.position);
    if(!this.inVehicle && d<6){this.inVehicle=true;this.vehicle.visible=true;this.ui.toast("VEHICLE ENTERED · V TO EXIT");}
    else if(this.inVehicle){this.inVehicle=false;this.ui.toast("VEHICLE EXITED");}
  }

  update(dt, bots){
    this.player.__bots=bots?.bots||[];
    if(!this.started)return;
    const counts=document.getElementById("brCounts");
    if(counts) counts.textContent=`MED \${this.medkits}  ·  GLOO \${this.gloo}  ·  FRAG \${this.grenades}  ·  V \${this.inVehicle?"DRIVE":"ENTER"}`;
    if(this.dropActive){
      this.dropTime+=dt;
      const axis=this.input.axis();
      this.player.object.position.y=Math.max(0,85-this.dropTime*12);
      const forward=new this.T.Vector3(-Math.sin(this.player.yaw),0,-Math.cos(this.player.yaw));
      const right=new this.T.Vector3(Math.cos(this.player.yaw),0,-Math.sin(this.player.yaw));
      this.player.object.position.addScaledVector(forward,axis.y*dt*18);
      this.player.object.position.addScaledVector(right,axis.x*dt*18);
      this.player.object.position.x=Math.max(-this.c.world.size/2+20,Math.min(this.c.world.size/2-20,this.player.object.position.x));
      this.player.object.position.z=Math.max(-this.c.world.size/2+20,Math.min(this.c.world.size/2-20,this.player.object.position.z));
      if(this.dropTime>this.dropDuration||this.player.object.position.y<=0)this.endDrop();
    }
    if(this.keys.gloo){this.keys.gloo=false;this.deployGloo();}
    if(this.keys.grenade){this.keys.grenade=false;this.throwGrenade();}
    if(this.keys.medkit){this.keys.medkit=false;this.useMedkit();}
    if(this.keys.vehicle){this.keys.vehicle=false;this.vehicleAction();}
    for(const d of this.airdrops){
      if(!d.object.visible)continue;
      d.phase+=dt; d.object.rotation.y+=dt*.25; d.object.children[2].intensity=6+Math.sin(d.phase*4)*3;
      if(d.object.position.distanceTo(this.player.object.position)<4)this.openAirdrop(d);
    }
    this.airdropTimer-=dt;
    if(this.airdropTimer<=0){this.spawnAirdrop();this.airdropTimer=38+Math.random()*25;this.ui.toast("AIRDROP INCOMING");}
    if(this.inVehicle){
      const axis=this.input.axis(); const speed=24;
      const forward=new this.T.Vector3(-Math.sin(this.player.yaw),0,-Math.cos(this.player.yaw));
      const right=new this.T.Vector3(Math.cos(this.player.yaw),0,-Math.sin(this.player.yaw));
      this.player.object.position.addScaledVector(forward,axis.y*speed*dt);
      this.player.object.position.addScaledVector(right,axis.x*speed*.75*dt);
      this.player.object.position.x=Math.max(-this.c.world.size/2+20,Math.min(this.c.world.size/2-20,this.player.object.position.x));
      this.player.object.position.z=Math.max(-this.c.world.size/2+20,Math.min(this.c.world.size/2-20,this.player.object.position.z));
      this.vehicle.position.copy(this.player.object.position); this.vehicle.rotation.y=this.player.yaw; this.vehicle.visible=true;
    } else this.vehicle.visible=false;
  }
}