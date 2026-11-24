export class UI{constructor(){this.scene=null;this.name="PLAYER"}bind(){this.el={menu:document.getElementById("menu"),hud:document.getElementById("hud"),result:document.getElementById("result"),hp:document.getElementById("hpText"),hpBar:document.getElementById("hpBar"),armor:document.getElementById("armorText"),armorBar:document.getElementById("armorBar"),ammo:document.getElementById("ammo"),weapon:document.getElementById("weaponName"),alive:document.getElementById("alive"),compass:document.getElementById("compass"),zoneD:document.getElementById("zoneDistance"),zoneS:document.getElementById("zoneStatus"),reload:document.getElementById("reloadText"),toast:document.getElementById("toast"),feed:document.getElementById("killfeed"),resultTitle:document.getElementById("resultTitle"),resultText:document.getElementById("resultText"),resultKills:document.getElementById("resultKills"),resultPlace:document.getElementById("resultPlace"),resultTime:document.getElementById("resultTime"),mobile:document.getElementById("mobileControls"),scope:document.getElementById("scopeOverlay"),scopeLabel:document.getElementById("scopeLabel"),weaponBar:document.getElementById("weaponBar")}}
 start(name){
  this.name=name||"PLAYER";
  this.el.menu.classList.add("hidden");
  this.el.hud.classList.remove("hidden");
  if(this.el.mobile){
    const touchDevice=matchMedia("(pointer:coarse)").matches||navigator.maxTouchPoints>0||matchMedia("(max-width:700px)").matches;
    if(touchDevice){
      this.el.mobile.classList.remove("hidden");
      this.el.mobile.style.setProperty("display","block","important");
      this.el.mobile.style.setProperty("visibility","visible","important");
      this.el.mobile.style.setProperty("opacity","1","important");
      this.el.mobile.style.setProperty("pointer-events","auto","important");
      document.body.classList.add("la-touch-device");
    }else{
      this.el.mobile.classList.add("hidden");
      this.el.mobile.style.removeProperty("display");
      this.el.mobile.style.removeProperty("visibility");
      this.el.mobile.style.removeProperty("opacity");
      this.el.mobile.style.removeProperty("pointer-events");
      document.body.classList.remove("la-touch-device");
    }
  }
}
 hp(v){this.el.hp.textContent=Math.ceil(v);this.el.hpBar.style.width=Math.max(0,v)+"%"}armor(v){this.el.armor.textContent=Math.ceil(v);this.el.armorBar.style.width=Math.max(0,v)+"%"}weapon(w,reloading=false){this.el.weapon.textContent=w.name;this.el.weaponType=w.type;this.el.weaponName=w.name;this.el.weaponSlots=this.el.weaponBar?.querySelectorAll(".weapon-slot");this.el.weaponSlots?.forEach((s,i)=>s.classList.toggle("active",i===this.weaponIndex));this.el.ammo.textContent=`${w.ammo} / ${w.reserve}`;this.el.reload.textContent=reloading?"RELOADING…":""}scope(active,w){if(!this.el.scope)return;this.el.scope.classList.toggle("hidden",!active);document.body.classList.toggle("ads-active",active);if(active&&this.el.scopeLabel)this.el.scopeLabel.textContent=(w?.scope||"OPTIC")+" // "+(w?.id==="sniper"?"6X":w?.id==="dmr"?"4X":"1X")}
  setWeaponIndex(i){this.weaponIndex=i;this.el.weaponBar?.querySelectorAll(".weapon-slot").forEach((s,n)=>s.classList.toggle("active",n===i))}
  setReload(v){this.el.reload.textContent=v?"RELOADING…":""}alive(n){this.el.alive.textContent=n}compass(yaw){if(!this.el.compass)return;const deg=((yaw*180/Math.PI)%360+360)%360;const dirs=["N","NE","E","SE","S","SW","W","NW"];const index=Math.round(deg/45)%8;this.el.compass.textContent=dirs[index]+"  "+String(Math.round(deg)).padStart(3,"0")+"°"}zone(s,d){this.el.zoneS.textContent=s;this.el.zoneD.textContent=d}toast(t){this.el.toast.textContent=t;this.el.toast.style.opacity="1";clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>this.el.toast.style.opacity="0",1100)}hit(){const x=document.getElementById("hitMarker");x.style.opacity="1";setTimeout(()=>x.style.opacity="0",80)}damage(){const x=document.getElementById("damageFlash");x.style.opacity=".22";setTimeout(()=>x.style.opacity="0",100)}killStreak(n){
  const el=document.getElementById("killStreak");
  if(!el)return;
  el.querySelector("b").textContent=n;
  el.classList.toggle("hot",n>=2);
  el.style.opacity="1";
  clearTimeout(this.streakTimer);
  this.streakTimer=setTimeout(()=>el.style.opacity="0",2200);
}
killFeed(a,b){const d=document.createElement("div");d.textContent=`${a}  ›  ${b}`;this.el.feed.prepend(d);while(this.el.feed.children.length>4)this.el.feed.lastChild.remove()}setMatchAlive(n){this.alive(n)}showResult(win,kills,time,place){this.el.hud.classList.add("hidden");this.el.mobile.classList.add("hidden");this.el.result.classList.remove("hidden");this.el.resultTitle.textContent=win?"YOU ARE THE LAST ALIVE":"YOU WERE ELIMINATED";this.el.resultText.textContent=win?"MATCH VICTORY":"THE DISTRICT CLAIMED YOU";this.el.resultKills.textContent=kills;this.el.resultPlace.textContent="#"+place;this.el.resultTime.textContent=time}lobby(){this.scope(false);this.el.result.classList.add("hidden");this.el.menu.classList.remove("hidden")}}
