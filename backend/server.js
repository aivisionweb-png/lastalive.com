const express=require("express");
const http=require("http");
const cors=require("cors");
const {Server}=require("socket.io");

const app=express();
app.use(cors());
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:"*",methods:["GET","POST"]}});

const rooms=new Map();
const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const code=()=>{let x="";do{x="";for(let i=0;i<6;i++)x+=alphabet[Math.floor(Math.random()*alphabet.length)]}while(rooms.has(x));return x};

function publicPlayers(room){
  return [...room.players.values()].map(p=>({
    id:p.id,name:p.name,x:p.x,y:p.y,z:p.z,hp:p.hp,armor:p.armor,
    alive:p.alive,yaw:p.yaw,pitch:p.pitch,host:p.id===room.host,lastSeen:p.lastSeen
  }));
}
function broadcast(room){
  io.to(room.id).emit("state",{players:publicPlayers(room),zone:room.zone,phase:room.phase});
}

io.on("connection",socket=>{
  socket.on("create-room",({name})=>{
    const id=code();
    const room={id,host:socket.id,players:new Map(),zone:1050,phase:0,running:false,timer:null,broadcastTimer:null};
    room.players.set(socket.id,{id:socket.id,name:String(name||"PLAYER").slice(0,14),x:0,y:0,z:120,hp:100,armor:75,alive:true,yaw:0,pitch:0,lastSeen:Date.now()});
    rooms.set(id,room);
    socket.join(id);
    socket.roomId=id;
    socket.emit("room",{room:id,players:publicPlayers(room)});
    broadcast(room);
  });

  socket.on("player-state",d=>{
    const room=rooms.get(socket.roomId);
    const p=room?.players.get(socket.id);
    if(!p)return;
    const num=(v,fallback)=>Number.isFinite(Number(v))?Number(v):fallback;
    p.x=Math.max(-1180,Math.min(1180,num(d?.x,p.x)));
    p.y=Math.max(0,Math.min(20,num(d?.y,p.y)));
    p.z=Math.max(-1180,Math.min(1180,num(d?.z,p.z)));
    p.yaw=num(d?.yaw,p.yaw);
    p.pitch=num(d?.pitch,p.pitch);
    p.hp=Math.max(0,Math.min(100,num(d?.hp,p.hp)));
    p.armor=Math.max(0,Math.min(100,num(d?.armor,p.armor)));
    p.alive=p.hp>0;
    p.lastSeen=Date.now();
  });

  socket.on("input",d=>{
    const room=rooms.get(socket.roomId);
    const p=room?.players.get(socket.id);
    if(!p||!room.running)return;
    // Legacy input endpoint retained for compatibility; client movement is authoritative locally.
    p.lastSeen=Date.now();
  });

  socket.on("start",roomId=>{
    const room=rooms.get(roomId);
    if(!room||room.host!==socket.id)return;
    room.running=true;
  });

  socket.on("disconnect",()=>{
    const room=rooms.get(socket.roomId);
    if(!room)return;
    const oldHost=room.host===socket.id;
    room.players.delete(socket.id);
    socket.to(room.id).emit("player-left",{id:socket.id});
    if(oldHost)room.host=room.players.keys().next().value;
    if(!room.players.size){
      clearInterval(room.timer);clearInterval(room.broadcastTimer);rooms.delete(room.id);
    }
  });
});

setInterval(()=>{
  const now=Date.now();
  for(const room of rooms.values()){
    // Keep a player in the match until an explicit death/disconnect. Do not
    // make a survivor disappear just because one state packet was late.
    for(const p of room.players.values()){
      if(now-p.lastSeen>12000){
        // Connection may be temporarily stalled; keep the avatar for 12s.
        p.alive=true;
      }
    }
    broadcast(room);
  }
},50);

app.get("/",(_,res)=>res.json({status:"online",game:"LAST ALIVE",rooms:rooms.size}));
server.listen(process.env.PORT||3000,()=>console.log("LAST ALIVE server online"));
