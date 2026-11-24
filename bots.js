export class BotManager {
  constructor(
    T,
    config,
    map,
    player,
    combat,
    ui
  ) {
    this.T = T;
    this.c = config;
    this.map = map;
    this.player = player;
    this.combat = combat;
    this.ui = ui;

    this.bots = [];

    this.onAllDead = null;

    this.spawn();
  }

  make(index) {
    const T=this.T;
    const group=new T.Group();

    /* Character roster: distinct outfits so enemies no longer look like clones. */
    const outfits=[
      {shirt:0x243b53,vest:0x101820,accent:0x35d9ff, pants:0x15191d},
      {shirt:0x5a2630,vest:0x241116,accent:0xff5268, pants:0x17171a},
      {shirt:0x4b5430,vest:0x202719,accent:0xd6d65a, pants:0x252820},
      {shirt:0x46335b,vest:0x21172c,accent:0xc084ff, pants:0x18151e},
      {shirt:0x7a5635,vest:0x2b2016,accent:0xffb45e, pants:0x201a16},
      {shirt:0x28584c,vest:0x12251f,accent:0x4de1bd, pants:0x17211e},
      {shirt:0x353b43,vest:0x12151a,accent:0xffffff, pants:0x111317},
      {shirt:0x7a3030,vest:0x241014,accent:0xff9b45, pants:0x171214}
    ];
    const o=outfits[index%outfits.length];

    const mat=(color,rough=.72,metal=0)=>new T.MeshStandardMaterial({color,roughness:rough,metalness:metal});
    const shirt=mat(o.shirt,.78);
    const vest=mat(o.vest,.62,.18);
    const pants=mat(o.pants,.86);
    const skin=mat([0xb9795b,0xc98d6d,0x9d674f,0xd5a07d][index%4],.9);
    const boot=mat(0x0b0e11,.9,.08);
    const accent=mat(o.accent,.4,.3);

    /* Legs + boots */
    for(const x of [-.19,.19]){
      const leg=new T.Mesh(new T.CapsuleGeometry(.13,.62,6,9),pants);
      leg.position.set(x,.43,0); group.add(leg);

      const bootMesh=new T.Mesh(new T.BoxGeometry(.22,.16,.46),boot);
      bootMesh.position.set(x,.11,-.1); group.add(bootMesh);
    }

    /* Torso */
    const body=new T.Mesh(new T.CapsuleGeometry(.36,.82,7,10),shirt);
    body.position.y=1.08; group.add(body);

    /* Tactical vest / jacket */
    const vestMesh=new T.Mesh(new T.BoxGeometry(.78,.62,.5),vest);
    vestMesh.position.set(0,1.13,-.01); group.add(vestMesh);

    /* Shoulder pads */
    for(const x of [-.43,.43]){
      const shoulder=new T.Mesh(new T.SphereGeometry(.15,10,7),vest);
      shoulder.scale.set(1,.72,1); shoulder.position.set(x,1.35,0); group.add(shoulder);
    }

    /* Neck + head */
    const neck=new T.Mesh(new T.CylinderGeometry(.11,.11,.16,10),skin);
    neck.position.y=1.63; group.add(neck);

    const head=new T.Mesh(new T.SphereGeometry(.27,16,12),skin);
    head.position.y=1.88;
    head.userData.head=true;
    group.add(head);

    /* Different helmet / cap styles */
    const helmetType=index%4;
    if(helmetType===0 || helmetType===1){
      const helmet=new T.Mesh(new T.SphereGeometry(.31,16,10),vest);
      helmet.scale.y=.58; helmet.position.y=2.08; group.add(helmet);

      const visor=new T.Mesh(new T.BoxGeometry(.42,.075,.07),accent);
      visor.position.set(0,2.03,-.27); group.add(visor);
    }else if(helmetType===2){
      const cap=new T.Mesh(new T.SphereGeometry(.3,14,9),vest);
      cap.scale.set(1,.48,1); cap.position.set(0,2.05,0); group.add(cap);

      const brim=new T.Mesh(new T.BoxGeometry(.38,.07,.22),accent);
      brim.position.set(0,2.02,-.27); group.add(brim);
    }else{
      const band=new T.Mesh(new T.TorusGeometry(.28,.055,6,18),accent);
      band.rotation.x=Math.PI/2; band.position.y=2.0; group.add(band);
    }

    /* Arms + hands */
    for(const x of [-.22,.22]){
      const arm=new T.Mesh(new T.CapsuleGeometry(.11,.55,6,9),shirt);
      arm.position.set(x,1.04,0);
      arm.rotation.z=x>0?-0.16:0.16;
      group.add(arm);

      const glove=new T.Mesh(new T.SphereGeometry(.115,10,8),index%3===0?skin:boot);
      glove.position.set(x*.98,.72,-.05); group.add(glove);
    }

    /* Backpack */
    const pack=new T.Mesh(new T.BoxGeometry(.48,.72,.24),vest);
    pack.position.set(0,1.15,.3); group.add(pack);

    /* Outfit accent stripe */
    const stripe=new T.Mesh(new T.BoxGeometry(.48,.08,.515),accent);
    stripe.position.set(0,1.28,-.26); group.add(stripe);

    /* Weapon */
    const gun=new T.Mesh(
      new T.BoxGeometry(.13,.13,1.1),
      mat(0x0a0d0f,.3,.7)
    );
    gun.position.set(.4,1.1,-.55);
    gun.rotation.z=-.08;
    group.add(gun);

    /* High-visibility enemy beacon */
    const glowMat=new T.MeshBasicMaterial({
      color:0xff234f,transparent:true,opacity:.9,
      depthWrite:false,blending:T.AdditiveBlending
    });
    const ring=new T.Mesh(new T.TorusGeometry(.62,.045,8,24),glowMat);
    ring.rotation.x=Math.PI/2; ring.position.y=.06; group.add(ring);

    const beacon=new T.Mesh(new T.CylinderGeometry(.035,.035,3.4,8),glowMat);
    beacon.position.y=1.8; group.add(beacon);

    const beaconTop=new T.Mesh(new T.SphereGeometry(.11,8,8),glowMat);
    beaconTop.position.y=3.5; group.add(beaconTop);

    group.userData.enemyGlow={ring,beacon,beaconTop};

    const labelCanvas=document.createElement("canvas");
    labelCanvas.width=256; labelCanvas.height=64;
    const lctx=labelCanvas.getContext("2d");
    lctx.fillStyle="rgba(120,8,20,.86)"; lctx.fillRect(4,8,248,48);
    lctx.strokeStyle="#ff5268"; lctx.lineWidth=3; lctx.strokeRect(4,8,248,48);
    lctx.font="900 26px Arial"; lctx.textAlign="center"; lctx.textBaseline="middle";
    lctx.fillStyle="#fff"; lctx.fillText("ENEMY",128,32);
    const label=new T.Sprite(new T.SpriteMaterial({
      map:new T.CanvasTexture(labelCanvas),
      transparent:true,depthTest:false,depthWrite:false
    }));
    label.scale.set(1.65,.42,1); label.position.y=3.9; label.renderOrder=20; group.add(label);

    group.traverse(obj=>{
      obj.castShadow=true;
      obj.receiveShadow=true;
    });

    const data={
      alive:true,
      hp:100,
      armor:40+Math.random()*60,
      cool:.3+Math.random(),
      roam:Math.random()*Math.PI*2,
      outfitIndex:index%outfits.length,
      object:group,
      hit:(damage,attacker=null)=>this.hit(data,damage,attacker)
    };

    group.userData.bot=data;
    group.userData.botName="ENEMY "+String(index+1).padStart(2,"0");
    return data;
  }

  spawnOne() {
    const index =
      this.bots.length;

    const bot =
      this.make(index);

    let position;

    let attempts = 0;

    do {
      const angle =
        Math.random() *
        Math.PI *
        2;

      const near = index < 12;

      const radius = near
        ? 180 + Math.random() * 320
        : 420 + Math.random() * 650;

      position =
        new this.T.Vector3(
          Math.cos(angle) *
            radius,
          0,
          Math.sin(angle) *
            radius
        );

      attempts++;

      if (
        attempts > 180
      ) {
        position.set(
          (Math.random() -
            0.5) *
            1900,
          0,
          (Math.random() -
            0.5) *
            1900
        );

        break;
      }
    } while (
      !this.map.validSpawn(
        position,
        this.player.object.position,
        120
      )
    );

    bot.object.position.copy(
      position
    );

    this.bots.push(bot);

    this.map.root.add(
      bot.object
    );

    return bot;
  }

  spawn() {
    for (
      let i = 0;
      i <
      this.c.world.botCount;
      i++
    ) {
      this.spawnOne();
    }
  }

  relocateAroundPlayer() {
    const center=this.player.object.position.clone();
    center.y=0;

    this.bots.forEach((bot,index)=>{
      const angle=(index/this.bots.length)*Math.PI*2 + Math.random()*.5;
      const radius=index<16 ? 55+Math.random()*180 : 220+Math.random()*650;
      const pos=new this.T.Vector3(
        center.x+Math.cos(angle)*radius,
        0,
        center.z+Math.sin(angle)*radius
      );

      bot.object.position.copy(pos);
      bot.object.visible=true;
      bot.alive=true;
      bot.hp=100;
      bot.armor=50;
    });
  }


  hit(bot, damage, attacker=null) {
    if (!bot.alive) return;
    const absorbed=Math.min(bot.armor,damage*.55);
    bot.armor-=absorbed;
    bot.hp-=damage-absorbed;
    if(bot.hp<=0){
      bot.hp=0; bot.alive=false; bot.object.visible=false;
      if(attacker?.object?.userData?.bot){
        attacker.kills=(attacker.kills||0)+1;
        this.ui.killFeed(attacker.object.userData.botName||"ENEMY",bot.object.userData.botName||"ENEMY");
      }else{
        this.player.kills++;
        this.ui.killStreak?.(this.player.kills);
        this.ui.killFeed("YOU",bot.object.userData.botName||"ENEMY");
        this.ui.toast("ENEMY ELIMINATED");
      }
      if(this.alive()===0) this.onAllDead?.();
    }
  }

  findTarget(bot){
    const candidates=[];
    if(this.player.alive){
      const d=Math.hypot(this.player.object.position.x-bot.object.position.x,this.player.object.position.z-bot.object.position.z);
      if(d<260) candidates.push({type:"player",target:this.player,d});
    }
    for(const other of this.bots){
      if(other===bot||!other.alive||!other.object.visible) continue;
      const d=Math.hypot(other.object.position.x-bot.object.position.x,other.object.position.z-bot.object.position.z);
      if(d<this.c.bots.detect) candidates.push({type:"bot",target:other,d});
    }
    if(!candidates.length) return null;
    candidates.sort((a,b)=>a.d-b.d);
    // Prevent every survivor from tunneling the human: nearby bots fight each other first.
    const botChoices=candidates.filter(c=>c.type==="bot");
    if(botChoices.length && (!candidates.some(c=>c.type==="player") || botChoices[0].d<candidates.find(c=>c.type==="player")?.d*.9+18)) return botChoices[0];
    return candidates[0];
  }

    enemyTracer(bot,target=this.player) {
    const T=this.T;
    const start=bot.object.position.clone();
    start.y=1.25;

    const end=this.player.object.position.clone();
    end.y=1.45;

    const dir=end.clone().sub(start);
    const len=dir.length();
    if(len<0.01)return;

    const flash=new T.Mesh(
      new T.SphereGeometry(.11,7,7),
      new T.MeshBasicMaterial({
        color:0xff3d57,
        transparent:true,
        opacity:.95,
        depthWrite:false
      })
    );
    flash.position.copy(start);
    this.map.root.add(flash);

    const tracer=new T.Mesh(
      new T.CylinderGeometry(.012,.012,len,4),
      new T.MeshBasicMaterial({
        color:0xff5168,
        transparent:true,
        opacity:.7,
        depthWrite:false,
        blending:T.AdditiveBlending
      })
    );
    tracer.position.copy(start).add(end).multiplyScalar(.5);
    tracer.quaternion.setFromUnitVectors(
      new T.Vector3(0,1,0),
      dir.normalize()
    );
    this.map.root.add(tracer);

    setTimeout(()=>{
      flash.removeFromParent();
      tracer.removeFromParent();
    },70);
  }

  alive() {
    return this.bots.filter(
      b => b.alive
    ).length;
  }

  update(dt) {
    if(this.player.__combatLocked) return;
    for(const bot of this.bots){
      if(!bot.alive) continue;
      const glow=bot.object.userData.enemyGlow;
      if(glow){
        const pulse=.72+Math.sin(performance.now()*.006+bot.roam)*.18;
        glow.ring.material.opacity=pulse;
        glow.beacon.material.opacity=pulse*.72;
        glow.beaconTop.material.opacity=pulse;
        glow.ring.scale.setScalar(1+Math.sin(performance.now()*.004+bot.roam)*.08);
      }
      bot.roam+=dt*(.3+Math.random()*.1);
      bot.targetTimer=(bot.targetTimer||0)-dt;
      if(!bot.target||!bot.target.alive||bot.targetTimer<=0){
        const picked=this.findTarget(bot);
        bot.target=picked?.target||null;
        bot.targetType=picked?.type||null;
        bot.targetTimer=.45+Math.random()*.55;
      }
      const target=bot.target;
      if(target?.alive){
        const tx=target.object.position.x, tz=target.object.position.z;
        const dx=tx-bot.object.position.x, dz=tz-bot.object.position.z;
        const distance=Math.hypot(dx,dz);
        if(distance<this.c.bots.detect){
          const angle=Math.atan2(dx,dz);
          bot.object.rotation.y=angle;
          if(distance>this.c.bots.minRange){
            const speed=this.c.bots.speed*(distance>100?1.15:1);
            bot.object.position.x+=Math.sin(angle)*speed*dt;
            bot.object.position.z+=Math.cos(angle)*speed*dt;
            this.map.resolve(bot.object.position,.4);
          }
          bot.cool-=dt;
          if(distance<this.c.bots.shootRange && bot.cool<=0){
            bot.cool=.65+Math.random()*1.1;
            this.enemyTracer(bot,target);
            if(Math.random()<this.c.bots.accuracy){
              const damage=6+Math.random()*8;
              if(bot.targetType==="bot") target.hit(damage,bot);
              else { this.player.damage(damage); this.ui.damage(); }
            }
          }
          continue;
        }
      }
      if(Math.random()<dt*.12) bot.roam+=Math.PI*(Math.random()-.5);
      bot.object.position.x+=Math.sin(bot.roam)*this.c.bots.speed*.18*dt;
      bot.object.position.z+=Math.cos(bot.roam)*this.c.bots.speed*.18*dt;
      this.map.resolve(bot.object.position,.4);
    }
  }
}
