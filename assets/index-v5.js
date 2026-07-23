import{r as q,R as j,a as m}from"./react-vendor-v5.js";import Y from"htm";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))a(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const l of s.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&a(l)}).observe(document,{childList:!0,subtree:!0});function o(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function a(r){if(r.ep)return;r.ep=!0;const s=o(r);fetch(r.href,s)}})();var A,T=q;A=T.createRoot,T.hydrateRoot;const n=Y.bind(j.createElement),W="picedit.lang",D={zh:null,en:null};async function K(e){if(D[e])return D[e];const t=await fetch(`/assets/i18n/${e}.json`);return D[e]=await t.json(),D[e]}function X(){const e=localStorage.getItem(W);return e==="zh"||e==="en"?e:(navigator.language||"en").toLowerCase().startsWith("zh")?"zh":"en"}const F=j.createContext({lang:"en",t:e=>e,setLang:()=>{}});function _({children:e}){const[t,o]=m.useState(X()),[a,r]=m.useState(null);m.useEffect(()=>{K(t).then(r)},[t]);const s=m.useCallback(i=>{localStorage.setItem(W,i),document.documentElement.lang=i,o(i)},[]),l=m.useCallback(i=>{if(!a)return i;const u=i.split(".");let d=a;for(const R of u)if(d&&typeof d=="object"&&R in d)d=d[R];else return i;return typeof d=="string"?d:i},[a]);return a?n`<${F.Provider} value=${{lang:t,t:l,setLang:s}}>${e}<//>`:n`<div className="flex-1 flex items-center justify-center text-gray-400">Loading…</div>`}const z=()=>j.useContext(F),S={hexToRgb(e){const t=e.replace("#",""),o=t.length===3?t.split("").map(r=>r+r).join(""):t,a=parseInt(o,16);return[a>>16&255,a>>8&255,a&255]},async loadImageToCanvas(e){const t=URL.createObjectURL(e),o=new Image;await new Promise((u,d)=>{o.onload=u,o.onerror=d,o.src=t});const a=2048;let{naturalWidth:r,naturalHeight:s}=o;if(r>a||s>a){const u=Math.min(a/r,a/s);r=Math.round(r*u),s=Math.round(s*u)}const l=document.createElement("canvas");l.width=r,l.height=s;const i=l.getContext("2d",{willReadFrequently:!0});return i.drawImage(o,0,0,r,s),URL.revokeObjectURL(t),{canvas:l,ctx:i,width:r,height:s}},canvasToBlob(e,t="image/png",o=.92){return new Promise((a,r)=>{e.toBlob(s=>s?a(s):r(new Error("toBlob failed")),t,o)})},downloadBlob(e,t){const o=URL.createObjectURL(e),a=document.createElement("a");a.href=o,a.download=t,document.body.appendChild(a),a.click(),document.body.removeChild(a),setTimeout(()=>URL.revokeObjectURL(o),1e3)},cornerColor(e,t,o){const a=[[0,0],[t-1,0],[0,o-1],[t-1,o-1]];let r=0,s=0,l=0;for(const[i,u]of a){const d=e.getImageData(i,u,1,1).data;r+=d[0],s+=d[1],l+=d[2]}return[Math.round(r/4),Math.round(s/4),Math.round(l/4)]},async changeBackground(e,{mode:t,color:o,tolerance:a}){const r=e.getContext("2d",{willReadFrequently:!0}),{width:s,height:l}=e,u=r.getImageData(0,0,s,l).data,d=S.cornerColor(r,s,l),R=a/100*255*1.732,w=new Uint8Array(s*l),y=[];for(let c=0;c<s;c++)y.push(c),y.push(c+(l-1)*s);for(let c=1;c<l-1;c++)y.push(c*s),y.push(c*s+(s-1));for(;y.length;){const c=y.pop();if(w[c])continue;const v=c*4,k=u[v]-d[0],N=u[v+1]-d[1],h=u[v+2]-d[2];if(Math.sqrt(k*k+N*N+h*h)>R)continue;w[c]=1;const x=c%s,f=(c-x)/s;x>0&&y.push(c-1),x<s-1&&y.push(c+1),f>0&&y.push(c-s),f<l-1&&y.push(c+s)}const $=document.createElement("canvas");$.width=s,$.height=l;const L=$.getContext("2d"),g=L.createImageData(s,l),p=g.data;if(t==="transparent")for(let c=0;c<w.length;c++){const v=c*4;w[c]?p[v+3]=0:(p[v]=u[v],p[v+1]=u[v+1],p[v+2]=u[v+2],p[v+3]=255)}else{const[c,v,k]=S.hexToRgb(o||"#ffffff");for(let N=0;N<w.length;N++){const h=N*4;w[N]?(p[h]=c,p[h+1]=v,p[h+2]=k,p[h+3]=255):(p[h]=u[h],p[h+1]=u[h+1],p[h+2]=u[h+2],p[h+3]=255)}}return L.putImageData(g,0,0),await S.canvasToBlob($,"image/png",.95)},async removeWatermark(e,t,o="blur"){const{width:a,height:r}=e,s=e.getContext("2d",{willReadFrequently:!0}),l=s.getImageData(0,0,a,r),i=l.data,{x:u,y:d,width:R,height:w}=t,y=Math.max(0,u),$=Math.max(0,d),L=Math.min(a,u+R),g=Math.min(r,d+w);if(o==="fill"){let p=0,c=0,v=0,k=0;for(let N=$;N<g;N++)for(let h=y;h<L;h++)if(h===y||h===L-1||N===$||N===g-1){const f=(N*a+h)*4;p+=i[f],c+=i[f+1],v+=i[f+2],k++}p=Math.round(p/Math.max(1,k)),c=Math.round(c/Math.max(1,k)),v=Math.round(v/Math.max(1,k));for(let N=$;N<g;N++)for(let h=y;h<L;h++){const x=(N*a+h)*4;i[x]=p,i[x+1]=c,i[x+2]=v}}else for(let p=0;p<3;p++){const c=new Uint8ClampedArray(i);for(let v=$+1;v<g-1;v++)for(let k=y+1;k<L-1;k++){const N=(v*a+k)*4;for(let h=0;h<3;h++){let x=0;for(let f=-1;f<=1;f++)for(let U=-1;U<=1;U++){const b=((v+f)*a+(k+U))*4;x+=c[b+h]}i[N+h]=Math.round(x/9)}}}return s.putImageData(l,0,0),await S.canvasToBlob(e,"image/png",.95)},rotate(e,t){const o=t%180!==0,a=document.createElement("canvas");a.width=o?e.height:e.width,a.height=o?e.width:e.height;const r=a.getContext("2d");return r.translate(a.width/2,a.height/2),r.rotate(t*Math.PI/180),r.drawImage(e,-e.width/2,-e.height/2),a},flip(e,t){const o=document.createElement("canvas");o.width=e.width,o.height=e.height;const a=o.getContext("2d");return a.translate(t==="h"?o.width:0,t==="v"?o.height:0),a.scale(t==="h"?-1:1,t==="v"?-1:1),a.drawImage(e,0,0),o},resize(e,{width:t,height:o,keepRatio:a}){if(a){const l=e.width/e.height;t/o>l?t=Math.round(o*l):o=Math.round(t/l)}const r=document.createElement("canvas");r.width=t,r.height=o;const s=r.getContext("2d");return s.imageSmoothingQuality="high",s.drawImage(e,0,0,t,o),r},async aiCutout(e){const t=localStorage.getItem("picedit.removebg_key")||"";if(!t)throw new Error("Missing remove.bg API key");const o=new FormData;o.append("image_file",e),o.append("size","auto");const a=await fetch("https://api.remove.bg/v1.0/removebg",{method:"POST",headers:{"X-Api-Key":t},body:o});if(!a.ok)throw new Error(`remove.bg ${a.status}: ${await a.text()}`);return a.blob()},async compositeOnColor(e,t){const o=URL.createObjectURL(e),a=await new Promise((l,i)=>{const u=new Image;u.onload=()=>l(u),u.onerror=i,u.src=o});URL.revokeObjectURL(o);const r=document.createElement("canvas");r.width=a.naturalWidth,r.height=a.naturalHeight;const s=r.getContext("2d");return s.fillStyle=t,s.fillRect(0,0,r.width,r.height),s.drawImage(a,0,0),S.canvasToBlob(r,"image/png",.95)}},H=j.createContext({path:"/",navigate:()=>{}});function O(){return j.useContext(H)}function Q({children:e}){const[t,o]=m.useState(window.location.hash.replace(/^#/,"")||"/");m.useEffect(()=>{const r=()=>o(window.location.hash.replace(/^#/,"")||"/");return window.addEventListener("hashchange",r),()=>window.removeEventListener("hashchange",r)},[]);const a=m.useCallback(r=>{window.location.hash=r},[]);return n`<${H.Provider} value=${{path:t,navigate:a}}>${e}<//>`}function E({to:e,className:t,children:o}){const a=O(),r=a.path===e;return n`<a href=${"#"+e} onClick=${s=>{s.preventDefault(),a.navigate(e)}} className=${t} aria-current=${r?"page":void 0}>${o}</a>`}function M({size:e="banner"}){const{t}=z();return n`
    <div className=${`w-full bg-gray-50 border border-dashed border-gray-200 rounded-md flex items-center justify-center text-xs text-gray-400 ${{banner:"min-h-[90px]",sidebar:"min-h-[250px]",inline:"min-h-[120px]"}[e]}`}>
      <div className="text-center px-4">
        <div className="uppercase tracking-wider mb-1">${t("home.adNote")}</div>
        <div className="text-gray-300">${t("ad.placeholder")}</div>
      </div>
    </div>`}function J(){const{t:e,lang:t,setLang:o}=z(),a=O(),r=l=>`px-3 py-2 rounded-md text-sm font-medium transition-colors ${l?"text-primary-600 bg-primary-50":"text-gray-700 hover:text-primary-600 hover:bg-gray-50"}`,s=l=>a.path===l||l!=="/"&&a.path.startsWith(l);return n`
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <${E} to="/" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="PicEdit" className="w-8 h-8" />
            <span className="font-bold text-lg text-gray-900">${e("site.name")}</span>
          <//>
          <nav className="hidden md:flex items-center gap-1">
            <${E} to="/" className=${r(a.path==="/")}>${e("nav.home")}<//>
            <${E} to="/tools/bg-color" className=${r(s("/tools/bg-color"))}>${e("tools.bgColor.title")}<//>
            <${E} to="/tools/remove-watermark" className=${r(s("/tools/remove-watermark"))}>${e("tools.removeWatermark.title")}<//>
            <${E} to="/tools/edit" className=${r(s("/tools/edit"))}>${e("tools.edit.title")}<//>
            <${E} to="/tools/ai-cutout" className=${r(s("/tools/ai-cutout"))}>${e("tools.aiCutout.title")}<//>
            <${E} to="/about" className=${r(s("/about"))}>${e("nav.about")}<//>
          </nav>
          <select aria-label=${e("nav.language")} value=${t} onChange=${l=>o(l.target.value)}
            className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white hover:border-primary-500">
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
    </header>`}function V(){const{t:e}=z();return n`
    <footer className="border-t border-gray-100 bg-gray-50 mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="PicEdit" className="w-6 h-6" />
            <span className="text-sm text-gray-600">${e("footer.copyright")}</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <${E} to="/privacy" className="text-gray-600 hover:text-primary-600">${e("footer.privacy")}<//>
            <${E} to="/terms" className="text-gray-600 hover:text-primary-600">${e("footer.terms")}<//>
            <${E} to="/about" className="text-gray-600 hover:text-primary-600">${e("footer.contact")}<//>
          </nav>
        </div>
      </div>
    </footer>`}function Z(){return n`<div className="w-full bg-gray-50 border-b border-gray-100"><div className="max-w-6xl mx-auto px-4 sm:px-6 py-2"><${M} size="banner" /></div></div>`}function C({variant:e="primary",size:t="md",className:o="",children:a,...r}){const s={primary:"bg-primary-500 text-white hover:bg-primary-600 hover:shadow-md",secondary:"bg-white text-primary-600 border border-primary-500 hover:bg-primary-50",ghost:"text-gray-700 hover:bg-gray-100",danger:"bg-red-500 text-white hover:bg-red-600"}[e],l={sm:"text-sm px-3 py-1.5",md:"text-sm px-4 py-2",lg:"text-base px-6 py-3"}[t];return n`<button className=${`inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${s} ${l} ${o}`} ...${r}>${a}</button>`}function B({onLoad:e}){const{t}=z(),[o,a]=m.useState(!1),[r,s]=m.useState(null),l=m.useCallback(async i=>{if(s(null),!i.type.startsWith("image/")){s(t("uploader.invalidType"));return}if(i.size>10*1024*1024){s(t("uploader.tooLarge"));return}const{canvas:u,width:d,height:R}=await S.loadImageToCanvas(i);e({file:i,dataUrl:u.toDataURL("image/png"),width:d,height:R,size:i.size},u)},[e,t]);return n`
    <div onDragOver=${i=>{i.preventDefault(),a(!0)}} onDragLeave=${()=>a(!1)}
         onDrop=${i=>{i.preventDefault(),a(!1),i.dataTransfer.files[0]&&l(i.dataTransfer.files[0])}}
         onClick=${()=>document.getElementById("hi").click()}
         className=${`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer ${o?"border-primary-500 bg-primary-50":"border-gray-300 bg-white hover:border-primary-400"}`}>
      <input id="hi" type="file" accept="image/*" className="hidden" onChange=${i=>{i.target.files[0]&&l(i.target.files[0])}} />
      <div className="text-5xl mb-3">📁</div>
      <p className="text-base text-gray-700 font-medium">${t("uploader.title")}</p>
      <p className="text-sm text-gray-500 my-2">${t("uploader.or")}</p>
      <span className="inline-block px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium">${t("uploader.browse")}</span>
      <p className="text-xs text-gray-400 mt-3">${t("uploader.hint")}</p>
      ${r&&n`<p className="text-sm text-red-500 mt-3">${r}</p>`}
    </div>`}function P({src:e,checkerboard:t}){return n`<div className=${`rounded-lg overflow-hidden border border-gray-200 ${t?"bg-checkerboard":"bg-gray-50"}`}>
    <img src=${e} alt="preview" className="block max-w-full max-h-96 mx-auto object-contain" />
  </div>`}function G({value:e,onChange:t,presets:o}){return n`<div className="flex items-center gap-3">
    <input type="color" value=${e} onChange=${a=>t(a.target.value)} className="w-10 h-10 rounded-md border border-gray-200 cursor-pointer" />
    <input type="text" value=${e} onChange=${a=>t(a.target.value)} className="w-24 px-2 py-1.5 text-sm border border-gray-200 rounded-md font-mono" />
    ${o&&n`<div className="flex items-center gap-1">${o.map(a=>n`<button key=${a} onClick=${()=>t(a)} className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform" style=${{backgroundColor:a}}></button>`)}</div>`}
  </div>`}function ee(){const{t:e}=z(),t=[{id:"bg-color",icon:"🎨",title:e("tools.bgColor.title"),desc:e("tools.bgColor.desc"),path:"/tools/bg-color"},{id:"rm",icon:"🧽",title:e("tools.removeWatermark.title"),desc:e("tools.removeWatermark.desc"),path:"/tools/remove-watermark"},{id:"edit",icon:"✂️",title:e("tools.edit.title"),desc:e("tools.edit.desc"),path:"/tools/edit"},{id:"ai",icon:"🤖",title:e("tools.aiCutout.title"),desc:e("tools.aiCutout.desc"),path:"/tools/ai-cutout"}];return n`
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <section className="py-16 sm:py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-500/10 text-accent-500 text-xs font-medium mb-6">${e("home.trustBadge")}</div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">${e("home.heroTitle")}</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">${e("home.heroSubtitle")}</p>
        <div className="flex items-center justify-center gap-3">
          <a href="#tools"><${C} size="lg">${e("home.ctaPrimary")}<//></a>
          <${E} to="/about"><${C} size="lg" variant="ghost">${e("home.ctaSecondary")}<//><//>
        </div>
      </section>
      <section className="mb-12"><${M} size="inline" /></section>
      <section id="tools" className="pb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">${e("home.toolsTitle")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          ${t.map(o=>n`
            <${E} key=${o.id} to=${o.path} className="group block bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="text-4xl mb-3">${o.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">${o.title}</h3>
              <p className="text-sm text-gray-600">${o.desc}</p>
            <//>`)}
        </div>
      </section>
      <section className="py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">${e("home.featuresTitle")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${[{icon:"🔒",title:o=>o==="zh"?"隐私优先":"Privacy first",desc:o=>o==="zh"?"文件不上传服务器":"Files never leave your device"},{icon:"⚡",title:o=>o==="zh"?"快速处理":"Fast",desc:o=>o==="zh"?"浏览器本地运算，秒级完成":"Browser-local, sub-second results"},{icon:"🆓",title:o=>o==="zh"?"完全免费":"Free",desc:o=>o==="zh"?"无注册、无水印、无限制":"No signup, no watermark, no limits"}].map(o=>n`
            <div key=${o.icon} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm text-center">
              <div className="text-3xl mb-2">${o.icon}</div>
              <h3 className="font-semibold text-gray-900">${o.title(z().lang)}</h3>
              <p className="text-sm text-gray-600 mt-1">${o.desc(z().lang)}</p>
            </div>`)}
        </div>
      </section>
      <section className="py-12 border-t border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">${e("home.seoTitle")}</h2>
        <p className="text-gray-700 leading-relaxed">${e("home.seoContent")}</p>
      </section>
      <section className="py-8"><${M} size="banner" /></section>
    </div>`}function te(){const{t:e}=z(),[t,o]=m.useState(null),[a,r]=m.useState("#ffffff"),[s,l]=m.useState(35),[i,u]=m.useState(!1),[d,R]=m.useState(null),[w,y]=m.useState(!1),[$,L]=m.useState(null);async function g(){if(t){y(!0),L(null);try{const c=await S.changeBackground(t.canvas,{mode:i?"transparent":"color",color:i?void 0:a,tolerance:s});d&&URL.revokeObjectURL(d),R(URL.createObjectURL(c))}catch(c){L(String(c))}finally{y(!1)}}}async function p(){if(!t||!d)return;const c=await S.changeBackground(t.canvas,{mode:i?"transparent":"color",color:i?void 0:a,tolerance:s});S.downloadBlob(c,`picedit-bg-${Date.now()}.png`)}return n`
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">${e("tools.bgColor.title")}</h1>
        <p className="text-gray-600 mt-1">${e("tools.bgColor.desc")}</p>
      </header>
      <${M} size="inline" className="mb-6" />
      ${t?n`
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">${e("common.before")}</p>
              <${P} src=${t.img.dataUrl} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">${e("common.after")}</p>
              ${d?n`<${P} src=${d} checkerboard=${i} />`:n`
                <div className="rounded-lg border border-dashed border-gray-300 h-64 flex items-center justify-center text-gray-400 text-sm">
                  ${w?e("common.processing"):e("common.process")+" →"}
                </div>`}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <input type="checkbox" checked=${i} onChange=${c=>u(c.target.checked)} />
                ${e("bgColor.transparent")}
              </label>
              ${!i&&n`<div>
                <p className="text-xs text-gray-500 mb-1">${e("bgColor.presets")}</p>
                <${G} value=${a} onChange=${r} presets=${["#ffffff","#ff0000","#1e40af","#10b981","#000000"]} />
              </div>`}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">${e("bgColor.tolerance")}: ${s}</label>
              <input type="range" min=${5} max=${80} value=${s} onChange=${c=>l(Number(c.target.value))} className="w-full" />
              <p className="text-xs text-gray-400 mt-1">${e("bgColor.edgeHint")}</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <${C} onClick=${g} disabled=${w}>${e(w?"common.processing":"common.process")}<//>
              ${d&&n`<${C} variant="secondary" onClick=${p}>⬇️ ${e("common.download")}<//>`}
              <${C} variant="ghost" onClick=${()=>{o(null),R(null)}}>${e("common.reset")}<//>
            </div>
            ${$&&n`<p className="text-sm text-red-500">${$}</p>`}
          </div>
        </div>`:n`<${B} onLoad=${(c,v)=>o({img:c,canvas:v})} />`}
    </div>`}function ae(){const{t:e}=z(),[t,o]=m.useState(null),[a,r]=m.useState(null),[s,l]=m.useState(null),[i,u]=m.useState("blur"),[d,R]=m.useState(null),[w,y]=m.useState(!1),[$,L]=m.useState(null),g=m.useRef(null),p=m.useRef(null),c=x=>{if(!g.current)return;const f=g.current.getBoundingClientRect(),U=g.current.naturalWidth/f.width,b=g.current.naturalHeight/f.height;p.current={x:(x.clientX-f.left)*U,y:(x.clientY-f.top)*b},l(null)},v=x=>{if(!p.current||!g.current)return;const f=g.current.getBoundingClientRect(),U=g.current.naturalWidth/f.width,b=g.current.naturalHeight/f.height,I={x:(x.clientX-f.left)*U,y:(x.clientY-f.top)*b};l({x:Math.min(p.current.x,I.x),y:Math.min(p.current.y,I.y),width:Math.abs(I.x-p.current.x),height:Math.abs(I.y-p.current.y)})},k=()=>{s&&s.width>4&&s.height>4&&r(s),p.current=null};async function N(){if(!(!t||!a)){y(!0),L(null);try{const x=await S.removeWatermark(t.canvas,a,i);d&&URL.revokeObjectURL(d),R(URL.createObjectURL(x))}catch(x){L(String(x))}finally{y(!1)}}}async function h(){if(!t||!a)return;const x=await S.removeWatermark(t.canvas,a,i);S.downloadBlob(x,`picedit-clean-${Date.now()}.png`)}return n`
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">${e("tools.removeWatermark.title")}</h1>
        <p className="text-gray-600 mt-1">${e("tools.removeWatermark.desc")}</p>
      </header>
      <${M} size="inline" className="mb-6" />
      ${t?n`
        <div className="space-y-6">
          <p className="text-sm text-gray-600">${e("watermark.instruction")}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">${e("common.before")}</p>
              <div className="relative inline-block cursor-crosshair" onMouseDown=${c} onMouseMove=${v} onMouseUp=${k} onMouseLeave=${k}>
                <img ref=${g} src=${t.img.dataUrl} alt="" className="block max-w-full max-h-96" />
                ${(s||a)&&g.current&&(()=>{const x=g.current.getBoundingClientRect(),f=s||a,U=x.width/g.current.naturalWidth,b=x.height/g.current.naturalHeight;return n`<div className="absolute border-2 border-red-500 bg-red-500/10 pointer-events-none" style=${{left:f.x*U,top:f.y*b,width:f.width*U,height:f.height*b}}></div>`})()}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">${e("common.after")}</p>
              ${d?n`<${P} src=${d} />`:n`
                <div className="rounded-lg border border-dashed border-gray-300 h-64 flex items-center justify-center text-gray-400 text-sm">
                  ${w?e("common.processing"):e("common.process")+" →"}
                </div>`}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">${e("watermark.method")}</label>
              <div className="flex gap-2">
                <button onClick=${()=>u("blur")} className=${`px-3 py-1.5 rounded-md text-sm ${i==="blur"?"bg-primary-500 text-white":"bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>${e("watermark.blur")}</button>
                <button onClick=${()=>u("fill")} className=${`px-3 py-1.5 rounded-md text-sm ${i==="fill"?"bg-primary-500 text-white":"bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>${e("watermark.fill")}</button>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <${C} onClick=${N} disabled=${w||!a}>${e(w?"common.processing":"common.process")}<//>
              ${d&&n`<${C} variant="secondary" onClick=${h}>⬇️ ${e("common.download")}<//>`}
              <${C} variant="ghost" onClick=${()=>r(null)}>${e("watermark.clear")}<//>
              <${C} variant="ghost" onClick=${()=>{o(null),R(null),r(null)}}>${e("common.reset")}<//>
            </div>
            ${$&&n`<p className="text-sm text-red-500">${$}</p>`}
          </div>
        </div>`:n`<${B} onLoad=${(x,f)=>o({img:x,canvas:f})} />`}
    </div>`}function oe(){const{t:e}=z(),[t,o]=m.useState(null),[a,r]=m.useState(null),[s,l]=m.useState(null),[i,u]=m.useState(0),[d,R]=m.useState(0),[w,y]=m.useState(!0),[$,L]=m.useState("image/png"),[g,p]=m.useState(.92),[c,v]=m.useState(null),k=b=>{r(b),u(b.width),R(b.height),s&&URL.revokeObjectURL(s),l(b.toDataURL($,g))};function N(b,I){o({img:b,canvas:I}),k(I)}function h(){t&&k(S.resize(t.canvas,{width:i,height:d,keepRatio:w}))}function x(b){a&&k(S.rotate(a,b))}function f(b){a&&k(S.flip(a,b))}async function U(){if(a)try{S.downloadBlob(await S.canvasToBlob(a,$,g),`picedit-${Date.now()}.${$==="image/png"?"png":$==="image/jpeg"?"jpg":"webp"}`)}catch(b){v(String(b))}}return n`
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">${e("tools.edit.title")}</h1>
        <p className="text-gray-600 mt-1">${e("tools.edit.desc")}</p>
      </header>
      <${M} size="inline" className="mb-6" />
      ${t?n`
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><p className="text-sm font-medium text-gray-700 mb-2">${e("common.before")}</p><${P} src=${t.img.dataUrl} /></div>
            <div><p className="text-sm font-medium text-gray-700 mb-2">${e("common.after")}</p>${s&&n`<${P} src=${s} />`}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">${e("edit.resize")}</h3>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="text-sm">${e("edit.width")}<input type="number" value=${i} onChange=${b=>u(Number(b.target.value))} className="ml-2 w-20 px-2 py-1 border border-gray-200 rounded-md text-sm" /></label>
                <label className="text-sm">${e("edit.height")}<input type="number" value=${d} onChange=${b=>R(Number(b.target.value))} className="ml-2 w-20 px-2 py-1 border border-gray-200 rounded-md text-sm" /></label>
                <label className="text-sm flex items-center gap-1"><input type="checkbox" checked=${w} onChange=${b=>y(b.target.checked)} />${e("edit.keepRatio")}</label>
                <${C} onClick=${h}>${e("edit.resize")}<//>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">${e("edit.rotate")}</h3>
              <div className="flex gap-2 flex-wrap">
                <${C} onClick=${()=>x(90)} variant="secondary" size="sm">↻ 90°<//>
                <${C} onClick=${()=>x(-90)} variant="secondary" size="sm">↺ 90°<//>
                <${C} onClick=${()=>x(180)} variant="secondary" size="sm">↻ 180°<//>
                <${C} onClick=${()=>f("h")} variant="secondary" size="sm">${e("edit.flipH")}<//>
                <${C} onClick=${()=>f("v")} variant="secondary" size="sm">${e("edit.flipV")}<//>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">${e("edit.convert")}</h3>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="text-sm">${e("common.format")}
                  <select value=${$} onChange=${b=>L(b.target.value)} className="ml-2 px-2 py-1 border border-gray-200 rounded-md text-sm bg-white">
                    <option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option>
                  </select>
                </label>
                ${($==="image/jpeg"||$==="image/webp")&&n`<label className="text-sm">${e("common.quality")}<input type="range" min="0.3" max="1" step="0.05" value=${g} onChange=${b=>p(Number(b.target.value))} className="ml-2 align-middle" />${Math.round(g*100)}%</label>`}
                <${C} onClick=${U}>⬇️ ${e("common.download")}<//>
              </div>
            </div>
            <${C} variant="ghost" onClick=${()=>{o(null),r(null),l(null)}}>${e("common.reset")}<//>
            ${c&&n`<p className="text-sm text-red-500">${c}</p>`}
          </div>
        </div>`:n`<${B} onLoad=${N} />`}
    </div>`}function se(){const{t:e}=z(),[t,o]=m.useState(null),[a,r]=m.useState(null),[s,l]=m.useState(null),[i,u]=m.useState("#ffffff"),[d,R]=m.useState(!1),[w,y]=m.useState(null);async function $(){if(t){R(!0),y(null);try{const g=await S.aiCutout(t.file);a&&URL.revokeObjectURL(a),r(URL.createObjectURL(g));const p=await S.compositeOnColor(g,i);s&&URL.revokeObjectURL(s),l(URL.createObjectURL(p))}catch(g){y(String(g))}finally{R(!1)}}}function L(g,p){g&&fetch(g).then(c=>c.blob()).then(c=>S.downloadBlob(c,p))}return n`
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">${e("tools.aiCutout.title")}</h1>
        <p className="text-gray-600 mt-1">${e("tools.aiCutout.desc")}</p>
      </header>
      <${M} size="inline" className="mb-6" />
      ${t?n`
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><p className="text-sm font-medium text-gray-700 mb-2">${e("common.before")}</p><${P} src=${t.dataUrl} /></div>
            <div><p className="text-sm font-medium text-gray-700 mb-2">Cutout</p>${a?n`<${P} src=${a} checkerboard />`:n`<div className="rounded-lg border border-dashed border-gray-300 h-64 flex items-center justify-center text-gray-400 text-sm">${d?e("common.processing"):"—"}</div>`}</div>
            <div><p className="text-sm font-medium text-gray-700 mb-2">Composite</p>${s?n`<${P} src=${s} />`:n`<div className="rounded-lg border border-dashed border-gray-300 h-64 flex items-center justify-center text-gray-400 text-sm">${d?e("common.processing"):"—"}</div>`}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New background</label>
              <${G} value=${i} onChange=${u} presets=${["#ffffff","#ff0000","#1e40af","#10b981","#000000"]} />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <${C} onClick=${$} disabled=${d}>${e(d?"common.processing":"common.process")}<//>
              ${a&&n`<${C} variant="secondary" onClick=${()=>L(a,"cutout.png")}>⬇️ PNG<//>`}
              ${s&&n`<${C} variant="secondary" onClick=${()=>L(s,`cutout-${Date.now()}.png`)}>⬇️ Composite<//>`}
              <${C} variant="ghost" onClick=${()=>{o(null),r(null),l(null)}}>${e("common.reset")}<//>
            </div>
            ${w&&n`<p className="text-sm text-red-500">${w.message||w} — ${e("aiCutout.apiKeyMissing")}</p>`}
          </div>
        </div>`:n`<${B} onLoad=${g=>o(g)} />`}
    </div>`}function re(){const{t:e}=z(),t=z().lang;return n`
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">${e("nav.about")}</h1>
      <div className="prose prose-gray space-y-4 text-gray-700">
        <p><strong>PicEdit</strong> ${t==="zh"?'是一款完全免费的浏览器图片处理工具，专注于"换底色"、"去水印"、"一键抠图"等高频场景。':"is a free browser-based photo editor focused on background changes, watermark removal, and AI cutouts."}</p>
        <p>${t==="zh"?"与其他在线图片工具不同，PicEdit 默认情况下":"Unlike other online editors, PicEdit processes everything "}<strong>${t==="zh"?"所有处理都在你的浏览器本地完成":"locally in your browser"}</strong>${t==="zh"?"，你的图片文件永远不会上传到任何服务器。":". Your files never leave your device."}</p>
        <h2 className="text-xl font-semibold text-gray-900 mt-8">${t==="zh"?"核心特性":"Features"}</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>${t==="zh"?"🔒 文件不上传服务器（默认所有工具）":"🔒 Files never leave your device (default)"}</li>
          <li>${t==="zh"?"⚡ 浏览器本地运算，秒级响应":"⚡ Browser-local, sub-second results"}</li>
          <li>${t==="zh"?"🆓 完全免费，无水印、无注册":"🆓 Free forever, no signup, no watermark"}</li>
          <li>${t==="zh"?"🌐 中英双语支持":"🌐 English & Chinese UI"}</li>
          <li>${t==="zh"?"🤖 可选 AI 高精度抠图（remove.bg）":"🤖 Optional AI cutout via remove.bg"}</li>
        </ul>
      </div>
    </div>`}function ne(){return n`
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy / 隐私政策</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: 2026-07-04 / 最后更新：2026-07-04</p>
      <div className="prose prose-gray space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Data Processing</h2>
          <p>All image processing happens locally in your browser by default. Files are never uploaded to PicEdit or third-party servers, except when you explicitly use the "AI Cutout" feature, which sends your image to remove.bg.</p>
          <p className="mt-2"><strong>中文：</strong>PicEdit 的所有图片处理功能默认在用户浏览器本地完成。除非用户主动选择使用"AI 一键抠图"功能（其图片会上传至 remove.bg 服务），您的图片文件不会上传到 PicEdit 或任何第三方服务器。</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Cookies & LocalStorage</h2>
          <p>We use localStorage only to store your language preference and (optionally) your remove.bg API key. We do not use tracking cookies.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Third-Party Services</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>remove.bg</strong>: AI cutout service, used only when explicitly enabled.</li>
            <li><strong>Google AdSense</strong>: Advertising, may use cookies for personalization.</li>
            <li><strong>Google Fonts</strong>: Font delivery.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Advertising</h2>
          <p>This site displays ads via Google AdSense. Google may use cookies to serve personalized ads. You can opt out via <a href="https://www.google.com/settings/ads" className="text-primary-600 underline">Google Ads Settings</a>.</p>
        </section>
      </div>
    </div>`}function ie(){return n`
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service / 服务条款</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: 2026-07-04 / 最后更新：2026-07-04</p>
      <div className="prose prose-gray space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Service Description</h2>
          <p>PicEdit provides browser-based photo editing tools (background change, watermark removal, basic editing, AI cutout) "as is" without warranty of specific availability or result quality.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">2. User Conduct</h2>
          <p>You agree not to use this service to process infringing, illegal, or harmful content. For AI cutout, do not upload images of identifiable persons unless you have legal authorization.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Intellectual Property</h2>
          <p>You retain all rights to images you upload. We claim no rights over your content. Processed results are downloaded directly to your device and are not retained on our servers.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Disclaimer</h2>
          <p>The service is provided without any express or implied warranty. We are not liable for any damages arising from your use of the service.</p>
        </section>
      </div>
    </div>`}function le(){const{t:e}=z();return n`<div className="max-w-3xl mx-auto px-4 py-12 text-center"><h1 className="text-3xl font-bold mb-4">404</h1><p>${e("common.uploadFirst")}</p></div>`}function ce(){const e=O();let t;switch(e.path){case"/":t=n`<${ee} />`;break;case"/tools/bg-color":t=n`<${te} />`;break;case"/tools/remove-watermark":t=n`<${ae} />`;break;case"/tools/edit":t=n`<${oe} />`;break;case"/tools/ai-cutout":t=n`<${se} />`;break;case"/about":t=n`<${re} />`;break;case"/privacy":t=n`<${ne} />`;break;case"/terms":t=n`<${ie} />`;break;default:t=n`<${le} />`}return n`
    <${Z} />
    <${J} />
    <main className="flex-1">${t}</main>
    <${V} />`}function de(){return n`<${Q}><${_}><${ce} /><//><//>`}A(document.getElementById("root")).render(n`<${de} />`);
