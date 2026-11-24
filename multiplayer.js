export class MultiplayerAvatars {
  constructor(T,scene,network,player){
    this.T=T;this.scene=scene;this.network=network;this.player=player;this.avatars=new Map();
  }
  make(p){
    const T=this.T,g=new T.Group();
    const mat=new T.MeshStandardMaterial({color:0x355d55,roughness:.75});
    const body=new T.Mesh(new T.CapsuleGeometry(.35,.9,6,8),mat);body.position.y=1;g.add(body);
    const head=new T.Mesh(new T.SphereGeometry(.25,12,8),new T.MeshStandardMaterial({color:0xb8795b,roughness:.9}));head.position.y=1.82;g.add(head);
    const glow=new T.Mesh(new T.TorusGeometry(.58,.035,8,20),new T.MeshBasicMaterial({color:0x4de1bd,transparent:true,opacity:.9,depthWrite:false}));glow.rotation.x=Math.PI/2;glow.position.y=.05;g.add(glow);
    g.userData.remote=true;g.userData.name=p.name||"PLAYER";this.scene.add(g);return g;
  }
  update(){
    const seen=new Set();
    for(const [id,p] of this.network.remotePlayers){
      if(id===this.network.socket?.id)continue;
      seen.add(id);let g=this.avatars.get(id);if(!g){g=this.make(p);this.avatars.set(id,g);}
      g.visible=p.alive!==false;g.position.set(Number(p.x)||0,0,Number(p.z)||0);g.rotation.y=Number(p.yaw)||0;
    }
    for(const [id,g] of this.avatars){if(!seen.has(id)){g.removeFromParent();this.avatars.delete(id);}}
  }
}