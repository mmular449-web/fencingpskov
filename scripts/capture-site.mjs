import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import assert from 'node:assert/strict';
const site = process.env.SITE_URL || 'http://127.0.0.1:4173/fencingpskov/';
const output = process.env.CAPTURE_OUTPUT || 'reports/visual';
await mkdir(output, {recursive:true});
const browser = await chromium.launch({
 executablePath: process.env.CHROMIUM_PATH || (!process.env.CI && existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
 args: ['--no-sandbox'],
});
const report = {url:site,checkedAt:new Date().toISOString(),tlsVerification:true,routes:[],responsive:[],captures:[]};
try {
 const checking = await browser.newContext({reducedMotion:'reduce'});
 const page = await checking.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const routes=['','federation/','epee/','children/','coaches/','news/','competitions/','gallery/','documents/','contacts/','sources/'];
 for(const route of routes) {
  const response=await page.goto(new URL(route,site).href);
  assert.equal(response.status(),200,route);
  await page.locator('h1').waitFor();
  assert.equal(await page.locator('h1').count(),1);
  for(const image of await page.locator('img:not(dialog img)').all()) {
   await image.scrollIntoViewIfNeeded();
   await image.evaluate(img=>img.decode());
   assert.ok(await image.evaluate(img=>img.complete&&img.naturalWidth>0));
  }
  report.routes.push({route:route||'/',status:response.status(),images:await page.locator('img:not(dialog img)').count()});
 }
 for(const width of [320,375,390,430,768,1024,1440]) {
  await page.setViewportSize({width,height:900});
  for(const route of routes) {
   await page.goto(new URL(route,site).href);
   await page.locator('h1').waitFor();await page.evaluate(()=>document.fonts.ready);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}px ${route}`);
  }
  report.responsive.push({width,routes:11,overflow:false});
 }
 assert.deepEqual(errors,[]);
 await checking.close();
 for(const [name,width,height] of [['desktop',1440,900],['mobile',390,844]]) {
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:name==='mobile',hasTouch:name==='mobile',reducedMotion:'no-preference',recordVideo:{dir:`${output}/raw`,size:{width,height}}});
  const tour=await context.newPage();const video=tour.video();const tourErrors=[];
  tour.on('pageerror',e=>tourErrors.push(e.message));tour.on('console',m=>{if(m.type()==='error')tourErrors.push(m.text());});
  await tour.goto(site);await tour.locator('.hero-photo').waitFor();await tour.locator('.hero-photo').evaluate(img=>img.decode());await tour.evaluate(()=>document.fonts.ready);await tour.waitForTimeout(1800);
  await tour.screenshot({path:`${output}/${name}-hero.png`});
  const sections=['.opening','.duel-scene','.product-showcase','.beginnings','.mentors-scene','.heritage-section','.visual-gallery','.federation-news','.signup-section'];
  const targets=await tour.evaluate(selectors=>selectors.map(selector=>({selector,top:document.querySelector(selector).getBoundingClientRect().top+scrollY})),sections);
  const captured=new Set();
  const total=await tour.evaluate(()=>document.documentElement.scrollHeight-innerHeight);
  for(let top=0;top<=total+45;top+=45) {
   await tour.evaluate(y=>scrollTo({top:y,behavior:'instant'}),Math.min(top,total));
   await tour.waitForTimeout(100);
   for(const target of targets) {
    if(!captured.has(target.selector)&&top>=target.top-80) {
     captured.add(target.selector);await tour.waitForTimeout(900);
     await tour.screenshot({path:`${output}/${name}-${target.selector.slice(1)}.png`});
    }
   }
  }
  await tour.waitForTimeout(1300);
  assert.deepEqual(tourErrors,[]);
  // Full-page captures use the normal motion mode after every scene has appeared.
  await tour.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await tour.waitForTimeout(800);
  await tour.screenshot({path:`${output}/${name}-full.png`,fullPage:true});
  // Close before saving so the WebM is complete and seekable.
  await context.close();await video.saveAs(`${output}/${name}-scroll.webm`);await video.delete();
  report.captures.push({name,width,height,video:`${name}-scroll.webm`,screenshots:captured.size+2,consoleErrors:tourErrors});
 }
 await writeFile(`${output}/verification.json`,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
} finally {await browser.close();}
