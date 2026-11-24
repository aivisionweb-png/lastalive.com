export class NetworkClient {
  constructor(config,ui){this.config=config;this.ui=ui;this.socket=null;this.connected=false;this.remotePlayers=new Map();this.lastSend=0;}
  connect(playerName){
    if(!this.config?.network?.enabled||typeof window.io!=="function")return false;
    if(this.socket){this.socket.disconnect();this.socket=null;}
    try{
      this.socket=window.io(this.config.network.url,{transports:["websocket","polling"],timeout:7000,reconnection:true,reconnectionAttempts:Infinity,reconnectionDelay:800});
      this.socket.on("connect",()=>{
        this.connected=true;
        this.ui?.toast?.("NETWORK ONLINE");
        this.socket.emit("create-room",{name:String(playerName||"PLAYER").slice(0,14)});
      });
      this.socket.on("disconnect",()=>{this.connected=false;});
      this.socket.on("connect_error",e=>{this.connected=false;console.warn("Network error:",e?.message);});
      this.socket.on("state",data=>{
        if(!data?.players)return;
        for(const p of data.players)if(p?.id)this.remotePlayers.set(p.id,p);
      });
      this.socket.on("player-left",d=>{if(d?.id)this.remotePlayers.delete(d.id);});
      return true;
    }catch(e){console.error("Network initialization failed:",e);return false;}
  }
  sendState(state){
    if(!this.connected||!this.socket)return;
    const now=performance.now();
    if(now-this.lastSend<50)return; // 20 Hz instead of flooding the server every render frame.
    this.lastSend=now;
    this.socket.emit("player-state",state);
  }
  sendInput(state){if(this.connected&&this.socket)this.socket.emit("input",state);}
  sendShot(data){if(this.connected&&this.socket)this.socket.emit("shoot",data);}
  disconnect(){this.socket?.disconnect();this.socket=null;this.connected=false;this.remotePlayers.clear();}
}