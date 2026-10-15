// Optional local QA capture using the installed, trusted system FFmpeg.
// The normal CI capture uses Playwright's own recorder on the public site.
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
const output=process.env.CAPTURE_OUTPUT||'reports/local-visual';
const site=process.env.SITE_URL||'http://127.0.0.1:4173/fencingpskov/';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
let activeTimer;
let activeProcess;
try {
 for(const [name,width,height] of [['desktop',1440,900],['mobile',390,844]]) {
  const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:name==='mobile',hasTouch:name==='mobile'});
  const page=await ctx.newPage();await page.goto(site);await page.locator('.hero-photo').evaluate(img=>img.decode());await page.evaluate(()=>document.fonts.ready);
  const cdp=await ctx.newCDPSession(page);
  const proc=spawn('/usr/bin/ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate','25','-vcodec','mjpeg','-i','pipe:0','-an','-c:v','libvpx-vp9','-deadline','realtime','-cpu-used','8','-crf','32','-b:v','0','-threads','2','-pix_fmt','yuv420p',`${output}/${name}-scroll.webm`],{stdio:['pipe','ignore','pipe']});
  activeProcess=proc;
  proc.stdin.on('error',()=>{});
  let ffmpegError='';proc.stderr.on('data',chunk=>ffmpegError+=chunk);
  const finished=new Promise((resolve,reject)=>{proc.on('error',reject);proc.on('exit',code=>code===0?resolve():reject(new Error(ffmpegError)));});
  finished.catch(()=>{});
  let jpeg;
  cdp.on('Page.screencastFrame',event=>{jpeg=Buffer.from(event.data,'base64');cdp.send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(()=>{});});
  await cdp.send('Page.startScreencast',{format:'jpeg',quality:85,maxWidth:width,maxHeight:height,everyNthFrame:1});
  const timer=setInterval(()=>{if(jpeg&&!proc.stdin.destroyed)proc.stdin.write(jpeg);},40);
  activeTimer=timer;
  await page.waitForTimeout(1800);await page.screenshot({path:`${output}/${name}-hero.png`});
  const targets=await page.evaluate(()=>['.opening','.duel-scene','.product-showcase','.beginnings','.mentors-scene','.heritage-section','.visual-gallery','.federation-news','.signup-section'].map(selector=>({selector,top:document.querySelector(selector).getBoundingClientRect().top+scrollY})));
  const scrolling=page.evaluate(()=>new Promise(resolve=>{
   const total=document.documentElement.scrollHeight-innerHeight;let last=performance.now();window.capturePaused=false;
   const tick=now=>{const delta=Math.min(40,now-last);last=now;if(!window.capturePaused)scrollTo({top:Math.min(total,scrollY+delta*.45),behavior:'instant'});if(scrollY>=total-1)resolve();else requestAnimationFrame(tick);};requestAnimationFrame(tick);
  }));
  let done=false;scrolling.then(()=>done=true);
  const captured=new Set();
  while(!done){
   await page.waitForTimeout(100);const y=await page.evaluate(()=>scrollY);
   for(const target of targets)if(!captured.has(target.selector)&&y>=target.top-80){
    captured.add(target.selector);await page.evaluate(()=>window.capturePaused=true);await page.waitForTimeout(1200);await page.screenshot({path:`${output}/${name}-${target.selector.slice(1)}.png`});await page.evaluate(()=>window.capturePaused=false);
   }
  }
  await scrolling;await page.waitForTimeout(1300);clearInterval(timer);await cdp.send('Page.stopScreencast');proc.stdin.end();await finished;activeTimer=undefined;activeProcess=undefined;
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(500);await page.screenshot({path:`${output}/${name}-full.png`,fullPage:true});
  await ctx.close();console.log(`${name}: continuous scroll capture complete`);
 }
 await writeFile(`${output}/origin.json`,JSON.stringify({url:site,note:'Local production capture; public dist files verified separately by SHA-256.',checkedAt:new Date().toISOString()},null,2));
}finally{if(activeTimer)clearInterval(activeTimer);if(activeProcess&&activeProcess.exitCode===null)activeProcess.kill('SIGTERM');await browser.close();}
