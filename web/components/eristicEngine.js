/* eslint-disable */
// @ts-nocheck
// Eristic cosmic-goddess scroll engine. Vanilla WebGL via Three.js (passed in).
// initEristic(THREE) wires everything and returns a cleanup() function.
export function initEristic(THREE) {
  let rafId = 0;
  let _stopped = false;
  const _listeners = [];
  const on = (t, e, fn, opts) => { t.addEventListener(e, fn, opts); _listeners.push([t, e, fn]); };

"use strict";
var EMBEDDED_IMG = window.__ERISTIC_IMG__ || "/eristicgod.jpg";

var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var MOBILE  = Math.min(innerWidth, innerHeight) < 700;
var DENSITY = REDUCED ? 0.5 : (MOBILE ? 0.6 : 1);

// image-space anchors (u right 0..1, v UP from bottom 0..1)
var A = {
  earth:  { u:0.50, v:0.175, r:0.072 },
  handL:  { u:0.32, v:0.205 },
  handR:  { u:0.68, v:0.205 },
  face:   { u:0.50, v:0.455 },
  eyeL:   { u:0.468, v:0.462 },
  eyeR:   { u:0.532, v:0.462 },
  stars:  { v0:0.66, v1:0.97 }   // existing constellation band (upper)
};
try { var sv=JSON.parse(localStorage.getItem('eristic.A')); if(sv) A=sv; }catch(e){}
function saveA(){ try{ localStorage.setItem('eristic.A', JSON.stringify(A)); }catch(e){} }

function clamp01(x){ return x<0?0:x>1?1:x; }
function lerp(a,b,t){ return a+(b-a)*t; }
function easeInOutCubic(t){ return t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2; }
function easeOutCubic(t){ return 1-Math.pow(1-t,3); }
function sstep(a,b,x){ var t=clamp01((x-a)/(b-a)); return t*t*(3-2*t); }
function band(c,w,x){ return clamp01(1-Math.abs(x-c)/w); } // triangular focus window
function rand(a,b){ return a+Math.random()*(b-a); }

var canvas = document.getElementById('gl');
var renderer = new THREE.WebGLRenderer({ canvas:canvas, antialias:true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x050208, 1);
var scene = new THREE.Scene();
var W = innerWidth, H = innerHeight;
var camera = new THREE.OrthographicCamera(0, W, H, 0, -1000, 1000);

var pointVS = ['attribute float aSize;','attribute float aAlpha;','attribute vec3 aColor;','varying float vA; varying vec3 vC;','void main(){','vA=aAlpha; vC=aColor;','gl_PointSize=aSize;','gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);','}'].join('\n');
var pointFS = ['varying float vA; varying vec3 vC;','void main(){','vec2 p=gl_PointCoord-0.5;','float d=length(p)*2.0;','float a=smoothstep(1.0,0.0,d); a*=a;','gl_FragColor=vec4(vC, a*vA);','}'].join('\n');
function makePoints(n){
  var g=new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n*3),3));
  g.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(n),1));
  g.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(n),1));
  g.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(n*3),3));
  var m=new THREE.ShaderMaterial({vertexShader:pointVS,fragmentShader:pointFS,transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending});
  var pts=new THREE.Points(g,m); pts.frustumCulled=false; return pts;
}

// ---- Background shader: cover-fit, living cam, palm-weave warp, hair-wind, eye glow, vortex glow
var bgUniforms = {
  uMap:{value:null}, uHas:{value:0}, uScale:{value:new THREE.Vector2(1,1)},
  uZoom:{value:1}, uDrift:{value:new THREE.Vector2(0,0)}, uAspect:{value:1}, uTime:{value:0},
  uEarth:{value:new THREE.Vector2(A.earth.u,A.earth.v)},
  uHandL:{value:new THREE.Vector2(A.handL.u,A.handL.v)},
  uHandR:{value:new THREE.Vector2(A.handR.u,A.handR.v)},
  uFace:{value:new THREE.Vector2(A.face.u,A.face.v)},
  uEyeL:{value:new THREE.Vector2(A.eyeL.u,A.eyeL.v)},
  uEyeR:{value:new THREE.Vector2(A.eyeR.u,A.eyeR.v)},
  uWeave:{value:0}, uHair:{value:0}, uEye:{value:0}, uVortex:{value:0}
};
var bgMat = new THREE.ShaderMaterial({
  uniforms:bgUniforms, depthWrite:false, depthTest:false,
  vertexShader:['varying vec2 vUv;','void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }'].join('\n'),
  fragmentShader:[
    'uniform sampler2D uMap; uniform float uHas;',
    'uniform vec2 uScale; uniform float uZoom; uniform vec2 uDrift; uniform float uAspect; uniform float uTime;',
    'uniform vec2 uEarth,uHandL,uHandR,uFace,uEyeL,uEyeR;',
    'uniform float uWeave,uHair,uEye,uVortex;',
    'varying vec2 vUv;',
    'float g(vec2 uv,vec2 c,float s){ vec2 d=vec2((uv.x-c.x)*uAspect,uv.y-c.y); return exp(-dot(d,d)/(s*s)); }',
    'void main(){',
    ' vec2 uv=(vUv-0.5)*(uScale/uZoom)+0.5+uDrift;',
    // palm weave: hands sweep gently toward the earth, dragging the cloth/space with them
    ' float sweep=sin(uTime*0.9)*0.5+0.5;',
    ' float wl=g(uv,uHandL,0.12)*uWeave;',
    ' float wr=g(uv,uHandR,0.12)*uWeave;',
    ' vec2 toE_L=uEarth-uHandL, toE_R=uEarth-uHandR;',
    ' uv-=toE_L*wl*0.10*(0.6+0.4*sweep);',
    ' uv-=toE_R*wr*0.10*(0.6+0.4*sweep);',
    // hair-wind: lateral shimmer through the hair band (mid region), stronger with uHair
    ' float hairband=g(uv,uFace,0.34)*uHair;',
    ' uv.x+=sin(uv.y*22.0+uTime*1.4)*0.0042*hairband;',
    ' uv.y+=cos(uv.x*18.0+uTime*1.05)*0.0022*hairband;',
    // wind streaks trailing off the hands during weave
    ' float windY=smoothstep(0.10,0.30,uv.y)*uWeave;',
    ' uv.x+=sin(uv.y*40.0 - uTime*3.0)*0.0030*windY*(g(uv,uHandL,0.22)+g(uv,uHandR,0.22));',
    ' vec3 col=vec3(0.02,0.008,0.035);',
    ' if(uHas>0.5) col=texture2D(uMap,uv).rgb;',
    // eye glow: small, sharp twin cores at the eyes (no big blob)
    ' float eyeCore=(g(vUv,uEyeL,0.0055)+g(vUv,uEyeR,0.0055));',
    ' float eyeHalo=(g(vUv,uEyeL,0.014)+g(vUv,uEyeR,0.014));',
    ' col+=vec3(0.85,0.97,1.0)*eyeCore*uEye*1.2;',
    ' col+=vec3(0.45,0.7,1.0)*eyeHalo*uEye*0.30;',
    // vortex/earth light cast
    ' float vd=g(vUv,uEarth,0.10);',
    ' col+=vec3(0.55,0.25,0.8)*vd*uVortex*0.5;',
    ' col+=vec3(0.9,0.5,1.0)*g(vUv,uEarth,0.04)*uVortex*0.4;',
    // vignette
    ' float v=length(vUv-0.5);',
    ' col*=1.0-0.40*pow(v*1.32,2.2);',
    ' gl_FragColor=vec4(col,1.0);',
    '}'
  ].join('\n')
});
var bgMesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1), bgMat); scene.add(bgMesh);

var imgAspect=912/1156;
function fitCover(){
  var sA=W/H;
  if (sA>imgAspect) bgUniforms.uScale.value.set(1, imgAspect/sA);
  else bgUniforms.uScale.value.set(sA/imgAspect, 1);
  bgUniforms.uAspect.value=imgAspect;
}
function uvToWorld(u,v){
  var s=bgUniforms.uScale.value, z=bgUniforms.uZoom.value, d=bgUniforms.uDrift.value;
  return { x:((u-0.5-d.x)*z/s.x+0.5)*W, y:((v-0.5-d.y)*z/s.y+0.5)*H };
}
function worldToUv(x,y){
  var s=bgUniforms.uScale.value, z=bgUniforms.uZoom.value, d=bgUniforms.uDrift.value;
  return { u:(x/W-0.5)*s.x/z+0.5+d.x, v:(y/H-0.5)*s.y/z+0.5+d.y };
}
function earthWorld(){ return uvToWorld(A.earth.u,A.earth.v); }
function earthRpx(){ return A.earth.r*H*bgUniforms.uZoom.value/bgUniforms.uScale.value.y; }

new THREE.TextureLoader().load(EMBEDDED_IMG, function(tex){
  tex.minFilter=THREE.LinearFilter; imgAspect=tex.image.width/tex.image.height;
  bgUniforms.uMap.value=tex; bgUniforms.uHas.value=1; fitCover();
});

// ---- background star field (parallax) - leaves the existing painted stars alone, adds depth
var starLayers=[];
function buildStars(){
  starLayers.forEach(function(L){ scene.remove(L.pts); L.pts.geometry.dispose(); }); starLayers=[];
  var defs=[ {n:Math.round(120*DENSITY),speed:0.2,size:[1.0,1.7],a:[0.12,0.32]},
             {n:Math.round(80*DENSITY), speed:0.5,size:[1.3,2.2],a:[0.15,0.4]} ];
  defs.forEach(function(def){
    var pts=makePoints(def.n), data=[];
    var pos=pts.geometry.attributes.position.array, siz=pts.geometry.attributes.aSize.array, col=pts.geometry.attributes.aColor.array;
    for (var i=0;i<def.n;i++){
      var d={x:Math.random()*W,y:Math.random()*H,size:rand(def.size[0],def.size[1]),base:rand(def.a[0],def.a[1]),tw:rand(0.5,2.2),ph:rand(0,6.28)};
      data.push(d); pos[i*3]=d.x; pos[i*3+1]=d.y; pos[i*3+2]=0; siz[i]=d.size;
      col[i*3]=0.8; col[i*3+1]=0.82; col[i*3+2]=1;
    }
    scene.add(pts); starLayers.push({pts:pts,data:data,speed:def.speed});
  });
}
var dust=null,dustData=[];
function buildDust(){
  if(dust){scene.remove(dust);dust.geometry.dispose();}
  var n=Math.round(90*DENSITY); dust=makePoints(n); dustData=[];
  var col=dust.geometry.attributes.aColor.array;
  for(var i=0;i<n;i++){ dustData.push({x:Math.random()*W,y:Math.random()*H,vx:rand(-4,4),vy:rand(2,8),size:rand(1.5,3.2),a:rand(0.03,0.12),ph:rand(0,6.28)}); col[i*3]=0.7;col[i*3+1]=0.55;col[i*3+2]=0.95; }
  scene.add(dust);
}

// ---- vortex around the earth (rings, spiral, trails)
var vortex=new THREE.Group(); scene.add(vortex);
var glow=makePoints(2);
(function(){var c=glow.geometry.attributes.aColor.array; c[0]=0.85;c[1]=0.5;c[2]=1.0; c[3]=0.45;c[4]=0.2;c[5]=0.7;})();
vortex.add(glow);
var RING_N=Math.round(90*DENSITY), ringGroup=new THREE.Group(), ring=makePoints(RING_N), ringData=[];
(function(){var col=ring.geometry.attributes.aColor.array;
  for(var i=0;i<RING_N;i++){var a=(i/RING_N)*Math.PI*2; ringData.push({a:a,jr:rand(-0.06,0.06),jz:rand(0,6.28),s:rand(2.5,5)});
    var pk=Math.random()<0.5; col[i*3]=pk?1:0.72; col[i*3+1]=pk?0.45:0.35; col[i*3+2]=pk?0.85:1;}})();
ringGroup.add(ring); ringGroup.scale.y=0.42; vortex.add(ringGroup);
var SPI_N=Math.round(120*DENSITY), spiral=makePoints(SPI_N), spiData=[];
(function(){var col=spiral.geometry.attributes.aColor.array;
  for(var i=0;i<SPI_N;i++){spiData.push({a:rand(0,6.28),life:rand(0,1),speed:rand(0.6,1.6),curl:rand(0.6,1.4),size:rand(2,4.5),tilt:rand(0.38,0.6)});
    var pk=Math.random()<0.55; col[i*3]=pk?1:0.65; col[i*3+1]=pk?0.5:0.3; col[i*3+2]=pk?0.9:1;}})();
vortex.add(spiral);
var trailGroup=new THREE.Group(), trails=[];
(function(){var ARCS=6,SEGS=40;
  for(var t=0;t<ARCS;t++){var g=new THREE.BufferGeometry();
    var pa=new Float32Array((SEGS+1)*3), ca=new Float32Array((SEGS+1)*3);
    var span=rand(1.4,2.4), rr=rand(1.25,2.1), tilt=rand(0.32,0.58);
    var hue=Math.random()<0.5?[1,0.45,0.85]:[0.6,0.3,1];
    for(var i=0;i<=SEGS;i++){var f=i/SEGS,a=f*span; pa[i*3]=Math.cos(a)*rr; pa[i*3+1]=Math.sin(a)*rr*tilt; pa[i*3+2]=0;
      var fd=Math.pow(f,1.6); ca[i*3]=hue[0]*fd; ca[i*3+1]=hue[1]*fd; ca[i*3+2]=hue[2]*fd;}
    g.setAttribute('position',new THREE.BufferAttribute(pa,3)); g.setAttribute('color',new THREE.BufferAttribute(ca,3));
    var m=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false});
    var ln=new THREE.Line(g,m); ln.userData.speed=rand(0.25,0.9)*(Math.random()<0.5?-1:1); ln.userData.rot=rand(0,6.28);
    trails.push(ln); trailGroup.add(ln);}})();
vortex.add(trailGroup);

// ---- ERISTIC constellation in the UPPER star band
var LETTERS={
  E:[[[0.95,1],[0,1],[0,0],[0.95,0]],[[0,0.5],[0.78,0.5]]],
  R:[[[0,0],[0,1],[0.72,1],[0.92,0.84],[0.92,0.62],[0.68,0.5],[0,0.5]],[[0.42,0.5],[0.95,0]]],
  I:[[[0.5,1],[0.5,0]]],
  S:[[[0.9,0.87],[0.55,1],[0.16,0.9],[0.08,0.66],[0.36,0.52],[0.66,0.47],[0.9,0.31],[0.84,0.09],[0.45,0],[0.1,0.12]]],
  T:[[[0,1],[1,1]],[[0.5,1],[0.5,0]]],
  C:[[[0.92,0.85],[0.55,1],[0.16,0.8],[0.07,0.5],[0.16,0.2],[0.55,0],[0.92,0.16]]]
};
var WORD='ERISTIC';
var cNodes=null,cLines=null,nodeData=[],segData=[];
function sampleStroke(st,ox,oy,lw,lh,step){var pts=[];
  for(var i=0;i<st.length-1;i++){var ax=ox+st[i][0]*lw,ay=oy+st[i][1]*lh,bx=ox+st[i+1][0]*lw,by=oy+st[i+1][1]*lh;
    var len=Math.hypot(bx-ax,by-ay),n=Math.max(1,Math.round(len/step));
    for(var k=0;k<n;k++){var f=k/n; pts.push([lerp(ax,bx,f),lerp(ay,by,f)]);}}
  var last=st[st.length-1]; pts.push([ox+last[0]*lw,oy+last[1]*lh]); return pts;}
function buildConstellation(){
  if(cNodes){scene.remove(cNodes);cNodes.geometry.dispose();}
  if(cLines){scene.remove(cLines);cLines.geometry.dispose();}
  nodeData=[];segData=[];
  var lw=Math.min(W*0.072,76), lh=lw*1.25, track=lw*0.6;
  var totalW=WORD.length*lw+(WORD.length-1)*track;
  if(totalW>W*0.9){var k=(W*0.9)/totalW; lw*=k;lh*=k;track*=k;totalW*=k;}
  var x0=(W-totalW)/2;
  // place the word inside the upper painted-star band, in world px
  var bandMidUv=(A.stars.v0+A.stars.v1)/2;
  var wc=uvToWorld(0.5, bandMidUv);
  var yC=wc.y-lh/2, step=lh*0.26;
  for(var li=0;li<WORD.length;li++){
    var strokes=LETTERS[WORD[li]], ox=x0+li*(lw+track);
    for(var s=0;s<strokes.length;s++){
      var pts=sampleStroke(strokes[s],ox,yC,lw,lh,step), first=nodeData.length;
      for(var p=0;p<pts.length;p++){
        var tx=pts[p][0],ty=pts[p][1];
        // scatter origin: drift from random nearby sky positions in the band
        var sx=tx+rand(-W*0.16,W*0.16), sy=ty+rand(-H*0.10,H*0.13);
        var mx=(sx+tx)/2,my=(sy+ty)/2, ang=Math.atan2(ty-sy,tx-sx)+Math.PI/2, amp=rand(30,100)*(Math.random()<0.5?-1:1);
        nodeData.push({sx:sx,sy:sy,tx:tx,ty:ty,cx:mx+Math.cos(ang)*amp,cy:my+Math.sin(ang)*amp,
          delay:li*0.05+(p/pts.length)*0.05+rand(0,0.02),size:rand(2.4,4.4),tw:rand(1,3),ph:rand(0,6.28),t:0,x:sx,y:sy});
        if(p>0) segData.push([first+p-1,first+p]);
      }
    }
  }
  cNodes=makePoints(nodeData.length);
  var col=cNodes.geometry.attributes.aColor.array;
  for(var i=0;i<nodeData.length;i++){var warm=Math.random()<0.2; col[i*3]=warm?1:0.86; col[i*3+1]=warm?0.8:0.85; col[i*3+2]=warm?0.9:1;}
  scene.add(cNodes);
  var lg=new THREE.BufferGeometry();
  lg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(segData.length*6),3));
  lg.setAttribute('color',new THREE.BufferAttribute(new Float32Array(segData.length*6),3));
  var lm=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false});
  cLines=new THREE.LineSegments(lg,lm); cLines.frustumCulled=false; scene.add(cLines);
}

// ---- scroll
var progress=0,target=0,scrollVel=0;
function readScroll(){var max=document.body.scrollHeight-innerHeight; target=max>0?clamp01(scrollY/max):0;}
on(window,'scroll',readScroll,{passive:true}); readScroll();
var mouse={x:-9999,y:-9999};
on(window,'pointermove',function(e){mouse.x=e.clientX;mouse.y=H-e.clientY;});
on(window,'pointerleave',function(){mouse.x=-9999;mouse.y=-9999;});

// ---- calibration (press C, click a region cycles target)
var calib=false, calibTarget='earth', toastT=0;
function toast(m){var el=document.getElementById('toast'); el.textContent=m; el.style.opacity=1; toastT=2.6;}
on(window,'keydown',function(e){
  if(e.key==='c'||e.key==='C'){calib=!calib; toast(calib?'Calibrate ON — click to set ['+calibTarget+']. Keys: e=earth f=face l/r=hands 1=eyeL 2=eyeR':'Calibrate OFF');}
  if(!calib) return;
  var map={e:'earth',f:'face',l:'handL',r:'handR'}; map['1']='eyeL'; map['2']='eyeR';
  if(map[e.key]){calibTarget=map[e.key]; toast('Target: '+calibTarget);}
});
on(canvas,'click',function(e){
  if(!calib) return;
  var uv=worldToUv(e.clientX,H-e.clientY);
  A[calibTarget].u=uv.u; A[calibTarget].v=uv.v;
  bgUniforms['u'+calibTarget.charAt(0).toUpperCase()+calibTarget.slice(1)] &&
    bgUniforms['u'+calibTarget.charAt(0).toUpperCase()+calibTarget.slice(1)].value.set(uv.u,uv.v);
  saveA(); buildConstellation();
  toast(calibTarget+' = u'+uv.u.toFixed(3)+' v'+uv.v.toFixed(3));
});

var cap0=document.getElementById('cap0'),cap1=document.getElementById('cap1'),cap2=document.getElementById('cap2'),cap3=document.getElementById('cap3'),cta=document.getElementById('cta'),hint=document.getElementById('hint');
function setCap(el,o,y){el.style.opacity=o.toFixed(3); el.style.transform='translate(-50%,'+y.toFixed(1)+'px)';}

function resize(){
  W=innerWidth;H=innerHeight; renderer.setSize(W,H,false);
  camera.right=W;camera.top=H;camera.updateProjectionMatrix();
  bgMesh.scale.set(W,H,1); bgMesh.position.set(W/2,H/2,0);
  fitCover(); buildStars(); buildDust(); buildConstellation();
}
on(window,'resize',resize);
buildStars(); buildDust(); buildConstellation();
bgMesh.scale.set(W,H,1); bgMesh.position.set(W/2,H/2,0); renderer.setSize(W,H,false);

var clock=new THREE.Clock();
function frame(){
  if (_stopped) return;
  rafId = requestAnimationFrame(frame);
  var dt=Math.min(clock.getDelta(),0.05), now=clock.elapsedTime;
  var prev=progress; progress+=(target-progress)*Math.min(1,dt*4.5); scrollVel=scrollVel*0.9+(progress-prev)*60;
  var p=progress;

  // ---- focus model: as you scroll 0..1, the "active region" travels DOWN the image
  // p=0 -> looking at top (stars), p=1 -> looking at bottom (earth/hands)
  // focusV is the image-v currently centered (1 at top of scroll, 0 at bottom)
  var focusV = 1 - p;
  // region activations via triangular windows on focusV
  var starsMid=(A.stars.v0+A.stars.v1)/2;
  var actStars = sstep(0.55,0.78, p) * (1 - sstep(0.92,1.0,p)*0.7); // upper band, scroll-in then settle
  var actFace  = band(A.face.v, 0.16, focusV);
  var actHands = band(A.earth.v+0.03, 0.14, focusV);
  var actEarth = band(A.earth.v, 0.13, focusV);

  // living camera + region focus — pan stays INSIDE the image so no edge bars ever show.
  bgUniforms.uTime.value=now;
  var zoom=lerp(1.04,1.10,easeInOutCubic(p));
  bgUniforms.uZoom.value=zoom;
  var sc=bgUniforms.uScale.value;
  var slackX=Math.max(0,(1 - sc.x/zoom))*0.5;
  var slackY=Math.max(0,(1 - sc.y/zoom))*0.5;
  var panV=lerp(slackY, -slackY, p);
  var ambX=Math.sin(now*0.16)*0.0025, ambY=Math.cos(now*0.12)*0.003;
  var dx=Math.max(-slackX,Math.min(slackX, ambX));
  var dy=Math.max(-slackY,Math.min(slackY, panV+ambY));
  bgUniforms.uDrift.value.set(dx, dy);

  bgUniforms.uEye.value   = easeOutCubic(actFace);
  bgUniforms.uHair.value  = Math.max(actFace, actHands*0.5);
  bgUniforms.uWeave.value = easeInOutCubic(actHands);
  bgUniforms.uVortex.value= easeInOutCubic(actEarth);

  // vortex placement
  var ew=earthWorld(), eR=earthRpx();
  vortex.position.set(ew.x, ew.y, 0);
  var vV=bgUniforms.uVortex.value;
  var speed=lerp(0.3,2.0,vV)+Math.abs(scrollVel)*1.6;

  var pulse=1+0.05*vV*(0.6+0.4*Math.sin(now*1.4));
  var gp=glow.geometry.attributes.position.array, gs=glow.geometry.attributes.aSize.array, ga=glow.geometry.attributes.aAlpha.array;
  gp[0]=0;gp[1]=0;gp[3]=0;gp[4]=0; gs[0]=eR*2.4*pulse; gs[1]=eR*6.2*pulse; ga[0]=0.5*vV; ga[1]=0.26*vV;
  glow.geometry.attributes.position.needsUpdate=true; glow.geometry.attributes.aSize.needsUpdate=true; glow.geometry.attributes.aAlpha.needsUpdate=true;

  var rp=ring.geometry.attributes.position.array, rs=ring.geometry.attributes.aSize.array, ra=ring.geometry.attributes.aAlpha.array;
  for(var i=0;i<RING_N;i++){var d=ringData[i]; d.a+=dt*speed*0.9; var rr=eR*(1.3+d.jr)+Math.sin(now*2+d.jz)*eR*0.05;
    rp[i*3]=Math.cos(d.a)*rr; rp[i*3+1]=Math.sin(d.a)*rr; rp[i*3+2]=1; rs[i]=d.s*(0.8+0.3*Math.sin(now*3+d.jz)); ra[i]=0.85*vV;}
  ring.geometry.attributes.position.needsUpdate=true; ring.geometry.attributes.aSize.needsUpdate=true; ring.geometry.attributes.aAlpha.needsUpdate=true;

  var sp=spiral.geometry.attributes.position.array, ss=spiral.geometry.attributes.aSize.array, sa=spiral.geometry.attributes.aAlpha.array;
  var activeSpi=Math.round(SPI_N*(0.25+0.75*vV));
  for(var j=0;j<SPI_N;j++){var s=spiData[j]; s.life+=dt*s.speed*0.28*(0.6+vV); if(s.life>1)s.life-=1; s.a+=dt*speed*s.curl*0.5;
    var pr=s.life, rad=eR*(1.05+pr*2.3), turb=Math.sin(now*1.7+j)*eR*0.06*pr;
    sp[j*3]=Math.cos(s.a+pr*3)*(rad+turb); sp[j*3+1]=Math.sin(s.a+pr*3)*(rad+turb)*s.tilt; sp[j*3+2]=2;
    ss[j]=s.size*(1-pr*0.5); sa[j]=(j<activeSpi?1:0)*Math.sin(pr*Math.PI)*0.8*vV;}
  spiral.geometry.attributes.position.needsUpdate=true; spiral.geometry.attributes.aSize.needsUpdate=true; spiral.geometry.attributes.aAlpha.needsUpdate=true;

  for(var t=0;t<trails.length;t++){var ln=trails[t]; ln.userData.rot+=dt*ln.userData.speed*(0.4+vV); ln.rotation.z=ln.userData.rot; ln.scale.set(eR,eR,1); ln.material.opacity=0.5*vV;}

  // background depth stars
  for(var li2=0;li2<starLayers.length;li2++){var L=starLayers[li2],data=L.data;
    var pos=L.pts.geometry.attributes.position.array, siz=L.pts.geometry.attributes.aSize.array, alp=L.pts.geometry.attributes.aAlpha.array;
    var par=(p-0.5)*40*L.speed;
    for(var k=0;k<data.length;k++){var d2=data[k]; var yy=((d2.y+par)%H+H)%H; pos[k*3]=d2.x; pos[k*3+1]=yy; pos[k*3+2]=0;
      siz[k]=d2.size*(0.8+0.3*Math.sin(now*d2.tw+d2.ph)); var tw=0.7+0.3*Math.sin(now*d2.tw+d2.ph);
      var flick=(Math.random()<0.003)?rand(1.3,2):1; alp[k]=clamp01(d2.base*tw*flick);}
    L.pts.geometry.attributes.position.needsUpdate=true; L.pts.geometry.attributes.aSize.needsUpdate=true; L.pts.geometry.attributes.aAlpha.needsUpdate=true;}

  var dp=dust.geometry.attributes.position.array, dsz=dust.geometry.attributes.aSize.array, dal=dust.geometry.attributes.aAlpha.array;
  for(var m2=0;m2<dustData.length;m2++){var du=dustData[m2]; du.x+=du.vx*dt; du.y+=du.vy*dt;
    if(mouse.x>-9000){var ddx=du.x-mouse.x,ddy=du.y-mouse.y,dd=Math.hypot(ddx,ddy); if(dd<110&&dd>0.1){var f=(110-dd)/110*28; du.x+=ddx/dd*f*dt; du.y+=ddy/dd*f*dt;}}
    if(du.y>H+10)du.y=-10; if(du.x<-10)du.x=W+10; if(du.x>W+10)du.x=-10;
    dp[m2*3]=du.x; dp[m2*3+1]=du.y; dp[m2*3+2]=0; dsz[m2]=du.size; dal[m2]=du.a*(0.6+0.4*Math.sin(now*0.6+du.ph));}
  dust.geometry.attributes.position.needsUpdate=true; dust.geometry.attributes.aSize.needsUpdate=true; dust.geometry.attributes.aAlpha.needsUpdate=true;

  // ERISTIC constellation - forms over the upper painted stars as you scroll over them
  var form=easeInOutCubic(actStars);
  var dissolve=sstep(0.93,1.0,p); // gentle fade only at very end if scrolled fully past
  var np=cNodes.geometry.attributes.position.array, ns=cNodes.geometry.attributes.aSize.array, na=cNodes.geometry.attributes.aAlpha.array;
  for(var n=0;n<nodeData.length;n++){var nd=nodeData[n];
    var local=clamp01((form-nd.delay)/(1-nd.delay)); var tt=easeInOutCubic(local); nd.t=tt; var o=1-tt;
    var bx=o*o*nd.sx+2*o*tt*nd.cx+tt*tt*nd.tx, by=o*o*nd.sy+2*o*tt*nd.cy+tt*tt*nd.ty;
    nd.x=bx; nd.y=by; np[n*3]=nd.x; np[n*3+1]=nd.y; np[n*3+2]=5;
    var tw=0.7+0.3*Math.sin(now*nd.tw+nd.ph), flick=(Math.random()<0.01)?1.6:1;
    ns[n]=nd.size*(0.8+tt*0.5)*tw*flick; na[n]=clamp01(tt*(1-dissolve*0.7))*tw;}
  cNodes.geometry.attributes.position.needsUpdate=true; cNodes.geometry.attributes.aSize.needsUpdate=true; cNodes.geometry.attributes.aAlpha.needsUpdate=true;

  var lp=cLines.geometry.attributes.position.array, lc=cLines.geometry.attributes.color.array;
  for(var s2=0;s2<segData.length;s2++){var ia=segData[s2][0],ib=segData[s2][1];
    lp[s2*6]=np[ia*3];lp[s2*6+1]=np[ia*3+1];lp[s2*6+2]=5; lp[s2*6+3]=np[ib*3];lp[s2*6+4]=np[ib*3+1];lp[s2*6+5]=5;
    var conn=Math.min(nodeData[ia].t,nodeData[ib].t), lf=clamp01((conn-0.6)/0.4)*(1-dissolve); var c=lf*0.55;
    lc[s2*6]=c*0.75;lc[s2*6+1]=c*0.6;lc[s2*6+2]=c; lc[s2*6+3]=c*0.75;lc[s2*6+4]=c*0.6;lc[s2*6+5]=c;}
  cLines.geometry.attributes.position.needsUpdate=true; cLines.geometry.attributes.color.needsUpdate=true;

  // captions tied to regions
  setCap(cap0, (1-sstep(0.10,0.20,p))*sstep(0.0,0.04,p>0?1:0)*0 + (1-sstep(0.12,0.22,p)), -8*sstep(0.12,0.22,p));
  setCap(cap1, actFace, -8*(1-actFace));
  setCap(cap2, actHands*(1-sstep(0.95,1.0,p)), -8*(1-actHands));
  var o3=sstep(0.95,1.0,p);
  setCap(cap3, o3, -10*(1-o3));
  cta.style.opacity=Math.max(actHands*0.0,o3).toFixed(3); cta.style.transform='translate(-50%,'+(12*(1-Math.max(o3,actEarth))).toFixed(1)+'px)';
  cta.style.opacity=Math.max(actEarth, o3).toFixed(3);
  cta.style.pointerEvents=(Math.max(actEarth,o3)>0.5)?'auto':'none';
  hint.style.opacity=(1-sstep(0.0,0.05,p)).toFixed(3);

  if(toastT>0){toastT-=dt; if(toastT<=0) document.getElementById('toast').style.opacity=0;}
  renderer.render(scene,camera);
}
frame();

  return function cleanup() {
    _stopped = true;
    cancelAnimationFrame(rafId);
    _listeners.forEach(([t, e, fn]) => t.removeEventListener(e, fn));
    try { renderer.dispose(); } catch (e) {}
  };
}
