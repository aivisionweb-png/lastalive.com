export class MultiplayerAvatars {
  constructor(T,scene,network,player){
    this.T=T;this.scene=scene;this.network=network;this.player=player;this.avatars=new Map();
  }

  make(p){
    const T=this.T,g=new T.Group();

    const shirt=new T.MeshStandardMaterial({color:0x315c55,roughness:.68,metalness:.05});
    const dark=new T.MeshStandardMaterial({color:0x12191b,roughness:.62,metalness:.18});
    const skin=new T.MeshStandardMaterial({color:0xb8795b,roughness:.86});
    const accent=new T.MeshStandardMaterial({color:0x35d9ff,roughness:.32,metalness:.3,emissive:0x0a4a55,emissiveIntensity:.45});

    const body=new T.Mesh(new T.CapsuleGeometry(.35,.9,7,10),shirt);
    body.position.y=1.02;g.add(body);

    const vest=new T.Mesh(new T.BoxGeometry(.7,.55,.46),dark);
    vest.position.set(0,1.12,-.01);g.add(vest);

    const head=new T.Mesh(new T.SphereGeometry(.255,16,12),skin);
    head.position.y=1.86;g.add(head);

    const helmet=new T.Mesh(new T.SphereGeometry(.29,16,10),dark);
    helmet.scale.y=.58;helmet.position.y=2.06;g.add(helmet);

    const visor=new T.Mesh(new T.BoxGeometry(.38,.06,.06),accent);
    visor.position.set(0,2.02,-.27);g.add(visor);

    for(const x of [-.2,.2]){
      const arm=new T.Mesh(new T.CapsuleGeometry(.105,.55,6,9),shirt);
      arm.position.set(x,1.02,0);arm.rotation.z=x>0?-0.15:0.15;g.add(arm);
      const leg=new T.Mesh(new T.CapsuleGeometry(.125,.62,6,9),dark);
      leg.position.set(x,.43,0);g.add(leg);
      const foot=new T.Mesh(new T.BoxGeometry(.2,.14,.42),dark);
      foot.position.set(x,.1,-.08);g.add(foot);
    }

    const glow=new T.Mesh(new T.TorusGeometry(.5,.022,8,24),
      new T.MeshBasicMaterial({color:0x35d9ff,transparent:true,opacity:.5,depthWrite:false}));
    glow.rotation.x=Math.PI/2;glow.position.y=.04;g.add(glow);

    g.userData.remote=true;
    g.userData.name=p.name||"PLAYER";
    g.userData.target={x:Number(p.x)||0,z:Number(p.z)||0,yaw:Number(p.yaw)||0};
    g.userData.glow=glow;
    g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    this.scene.add(g);
    return g;
  }

  update(dt=0.016){
    const seen=new Set();
    const me=this.player.object.position;
    for(const [id,p] of this.network.remotePlayers){
      if(id===this.network.socket?.id)continue;
      seen.add(id);
      let g=this.avatars.get(id);
      if(!g){g=this.make(p);this.avatars.set(id,g);}
      const target=g.userData.target;
      target.x=Number.isFinite(Number(p.x))?Number(p.x):target.x;
      target.z=Number.isFinite(Number(p.z))?Number(p.z):target.z;
      target.yaw=Number.isFinite(Number(p.yaw))?Number(p.yaw):target.yaw;

      // Never make a connected survivor disappear because of a single stale packet.
      g.userData.dead=p.alive===false;
      if(g.userData.dead){g.visible=false;continue;}
      g.visible=true;

      const dx=target.x-g.position.x,dz=target.z-g.position.z;
      const blend=Math.min(1,dt*12);
      g.position.x+=dx*blend;g.position.z+=dz*blend;
      let delta=target.yaw-g.rotation.y;
      while(delta>Math.PI)delta-=Math.PI*2;
      while(delta<-Math.PI)delta+=Math.PI*2;
      g.rotation.y+=delta*blend;

      const d=Math.hypot(g.position.x-me.x,g.position.z-me.z);
      const s=Math.max(.7,Math.min(1.15,1-d/2200));
      g.scale.setScalar(s);
      if(g.userData.glow)g.userData.glow.material.opacity=d>900?.28:.5;
    }
    for(const [id,g] of this.avatars){
      if(!seen.has(id)){g.removeFromParent();this.avatars.delete(id);}
    }
  }
}