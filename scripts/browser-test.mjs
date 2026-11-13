import { launchBrowser } from './cdp.mjs';
import assert from 'node:assert/strict';
import { mkdir,writeFile,readFile } from 'node:fs/promises';
const browser=await launchBrowser();
const {send,evaluate,until,click,fill,pause}=browser;
const results=[];
const originalWorker=await readFile('sw.js','utf8');
async function test(name,fn){try{await fn();results.push({name,pass:true});console.log(`PASS ${name}`);}catch(err){results.push({name,pass:false,error:err.message});console.error(`FAIL ${name}: ${err.message}`);throw err;}}
const persisted=()=>until(`document.querySelector('#save-state')?.textContent.includes('Saved on this device')`);
const route=async action=>{await click(`[data-action="${action}"]`);await pause(150);};
async function screenshot(file,width,height){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});await pause(150);await evaluate('window.scrollTo(0,0)');const result=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(file,Buffer.from(result.data,'base64'));}
try {
  await send('Page.navigate',{url:'http://127.0.0.1:4173/'});
  await test('first launch creates a local profile',async()=>{await until(`!!document.querySelector('#profile-form')`);await until(`Array.from(document.querySelectorAll('.avatar-options img')).length===9 && Array.from(document.querySelectorAll('.avatar-options img')).every(img=>img.complete && img.naturalWidth>0)`);await click('input[name=avatar][value=character-9]');await screenshot('.impeccable/review/avatar-picker-mobile.png',390,1000);await fill('[name=name]','Alex');await fill('[name=audience]','teens');await click('#profile-form [type=submit]');await until(`!!document.querySelector('#books')`);assert.match(await evaluate('document.body.innerText'),/Welcome back, Alex/);assert.equal(await evaluate(`document.querySelector('#header .avatar img').getAttribute('src')`),'./assets/avatars/character-9.webp');});
  await test('all bundled files are ready offline',async()=>{await until(`document.querySelector('.offline-status').textContent.includes('Ready offline')`,20000);});
  await mkdir('.impeccable/review',{recursive:true});
  await screenshot('.impeccable/review/desktop.png',1440,1000);
  await screenshot('.impeccable/review/mobile.png',390,844);
  await test('no horizontal overflow at phone, tablet and laptop widths',async()=>{for(const width of [320,390,768,1366]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,`Overflow at ${width}`);}});
  await test('story pages and saved position survive reload',async()=>{
    await click('[data-action=details][data-id=sam-and-the-red-bag]');await route('start');await persisted();
    assert.match(await evaluate('document.body.innerText'),/Sam has a red bag\./);
    await route('toggle-nav');await click('[data-action=page][data-index="13"]');await persisted();
    await send('Page.reload');await until(`!!document.querySelector('#books')`);
    await click('[data-action=details][data-id=sam-and-the-red-bag]');await route('start');
    assert.match(await evaluate('document.body.innerText'),/Sam and the dog eat the ham\./);
    await route('next');await until(`document.body.innerText.includes('Book finished')`);await route('stats');
  });
  await test('collection creation and membership persist',async()=>{await route('collections');await route('new-collection');await fill('#collection-form [name=name]','My favourites');await click('#collection-form .primary');await until(`!document.querySelector('dialog[open]')`);await route('library');await click('[data-action=add-collection][data-id=sam-and-the-red-bag]');await click('[data-action=add-to-existing]');await until(`!document.querySelector('dialog[open]')`);await route('collections');await route('collection');assert.match(await evaluate('document.body.innerText'),/Sam and the Red Bag/);});
  await test('second profile has isolated progress and theme',async()=>{await route('profile');await route('profiles');await route('create');await fill('[name=name]','Jamie');await fill('[name=audience]','teens');await click('#profile-form [type=submit]');await until(`document.querySelector('#books') && document.body.dataset.theme==='teens'`);const rows=await evaluate(`(async()=>{const {readAll}=await import('./src/db.js');return await readAll('profiles');})()`);assert.equal(rows.length,2);assert.equal(rows.find(p=>p.name==='Jamie').readingProgress.length,0);assert.equal(rows.find(p=>p.name==='Alex').readingProgress[0].status,'finished');});
  await test('Portuguese changes UI and leaves authored books untouched',async()=>{await route('profile');await route('settings');await fill('#language','pt-BR');await until(`document.documentElement.lang==='pt-BR'`);assert.match(await evaluate('document.body.innerText'),/Configurações/);await route('library');assert.match(await evaluate('document.body.innerText'),/Sam and the Red Bag/);await route('profile');await route('settings');await fill('#language','en');await until(`document.documentElement.lang==='en'`);});
  await test('backup new, merge and replace preserve other profiles',async()=>{
    const result=await evaluate(`(async()=>{const db=await import('./src/db.js'),b=await import('./src/backup.js');const profiles=await db.readAll('profiles');const backup=b.validateBackup(b.exportBackup(profiles));const original=profiles.find(p=>p.name==='Alex');const copy=b.importAsNew(backup.profiles.find(p=>p.profile.name==='Alex'));await db.writeRecords([{store:'profiles',value:copy}]);const incoming=structuredClone(original);incoming.readingProgress[0].pageId='page-02';const conflict=b.mergeProfiles(original,incoming);if(!conflict.conflicts.length)throw Error('No conflict');const resolved=b.mergeProfiles(original,incoming,{[conflict.conflicts[0].key]:'incoming'}).profile;await db.writeRecords([{store:'profiles',value:resolved}]);const replacement=b.flattenProfile(backup.profiles.find(p=>p.profile.name==='Alex'));await db.writeRecords([{store:'profiles',value:replacement}]);const after=await db.readAll('profiles');return {length:after.length,other:after.find(p=>p.name==='Jamie').readingProgress.length,replaced:after.find(p=>p.name==='Alex').readingProgress[0].pageId,copyId:copy.profileId,originalId:original.profileId};})()`);
    assert.equal(result.length,3);assert.equal(result.other,0);assert.notEqual(result.copyId,result.originalId);assert.equal(result.replaced,'page-14');
  });
  await test('IndexedDB version 1 to 2 preserves populated records',async()=>{
    const result=await evaluate(`(async()=>{const name='reading-app-migration-fixture';const first=await new Promise((resolve,reject)=>{const r=indexedDB.open(name,1);r.onupgradeneeded=()=>{r.result.createObjectStore('profiles',{keyPath:'profileId'});r.result.createObjectStore('appMeta',{keyPath:'key'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});await new Promise((resolve,reject)=>{const tx=first.transaction('profiles','readwrite');tx.objectStore('profiles').put({profileId:'fixture',name:'Preserved',answers:{q:'Red'},avatar:'sun'});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});first.close();const {openDatabase}=await import('./src/db.js');const upgraded=await openDatabase(name,2);const record=await new Promise(resolve=>{const r=upgraded.transaction('profiles').objectStore('profiles').get('fixture');r.onsuccess=()=>resolve(r.result);});const hasRecovery=upgraded.objectStoreNames.contains('recovery');upgraded.close();return {record,hasRecovery};})()`);
    assert.equal(result.record.answers.q,'Red');assert.equal(result.hasRecovery,true);
  });
  await test('failed upgrade rolls back without clearing previous data',async()=>{
    const result=await evaluate(`(async()=>{const name='reading-app-failed-fixture';const db=await new Promise(resolve=>{const r=indexedDB.open(name,1);r.onupgradeneeded=()=>r.result.createObjectStore('records');r.onsuccess=()=>resolve(r.result);});await new Promise(resolve=>{const tx=db.transaction('records','readwrite');tx.objectStore('records').put({answers:['saved']},'a');tx.oncomplete=resolve;});db.close();await new Promise(resolve=>{const r=indexedDB.open(name,2);r.onupgradeneeded=()=>{r.transaction.objectStore('records').clear();r.transaction.abort();};r.onerror=()=>resolve();});const old=await new Promise(resolve=>{const r=indexedDB.open(name);r.onsuccess=()=>resolve(r.result);});const value=await new Promise(resolve=>{const r=old.transaction('records').objectStore('records').get('a');r.onsuccess=()=>resolve(r.result);});old.close();return value;})()`);
    assert.deepEqual(result,{answers:['saved']});
  });
  await test('offline cold reload restores profile and bundled books',async()=>{
    await route('library');await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});await send('Page.reload');await until(`!!document.querySelector('#books')`);assert.match(await evaluate('document.body.innerText'),/Jamie/);await until(`document.querySelector('#header .avatar img')?.complete && document.querySelector('#header .avatar img')?.naturalWidth>0`);assert.equal(await evaluate('document.querySelectorAll(".cover").length'),1);await click('[data-action=details][data-id=sam-and-the-red-bag]');await route('start');await until(`document.body.innerText.includes('Sam has a red bag.')`);await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
  });
  await test('reader has no overflow at phone and laptop widths',async()=>{
    for(const width of [320,390,1366]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);}
    await screenshot('.impeccable/review/reader-mobile.png',390,844);await screenshot('.impeccable/review/reader-desktop.png',1440,1000);
  });
  await test('every story illustration works offline',async()=>{
    await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
    await route('toggle-nav');
    for(let index=0;index<14;index++){
      await click(`[data-action=page][data-index="${index}"]`);await persisted();
      await until(`document.querySelector('.page-image img')?.complete && document.querySelector('.page-image img')?.naturalWidth>0`);
    }
    await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
  });
  await test('a synchronous invalid write aborts the complete transaction',async()=>{
    const result=await evaluate(`(async()=>{const db=await import('./src/db.js');try{await db.writeRecords([{store:'appMeta',value:{key:'must-rollback',value:'bad'}},{store:'profiles',value:{name:'missing key'}}]);}catch{}return (await db.readAll('appMeta')).some(r=>r.key==='must-rollback');})()`);assert.equal(result,false);
  });
  await test('backup import preview creates a separate profile through the interface',async()=>{
    await route('profile');await route('settings');await route('data');
    const before=await evaluate(`(async()=>{const db=await import('./src/db.js');return (await db.readAll('profiles')).length;})()`);
    await evaluate(`(async()=>{const db=await import('./src/db.js'),backup=await import('./src/backup.js');const rows=await db.readAll('profiles');const data=backup.exportBackup([rows.find(p=>p.name==='Jamie')]);const transfer=new DataTransfer();transfer.items.add(new File([JSON.stringify(data)],'backup.json',{type:'application/json'}));const input=document.querySelector('#import-file');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await until(`!!document.querySelector('[data-action=review-import]')`);await route('review-import');await route('commit-import');await click('#confirm-action');await until(`!document.querySelector('dialog[open]') && !document.querySelector('#import-preview')?.innerText.includes('Import preview')`);
    const after=await evaluate(`(async()=>{const db=await import('./src/db.js');return (await db.readAll('profiles')).length;})()`);assert.equal(after,before+1);
  });
  await test('invalid imports report an error without writing data',async()=>{
    const result=await evaluate(`(async()=>{const db=await import('./src/db.js');const before=JSON.stringify(await db.readAll('profiles'));const transfer=new DataTransfer();transfer.items.add(new File(['{"format":"bad"}'],'invalid.json',{type:'application/json'}));const input=document.querySelector('#import-file');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,200));return {unchanged:before===JSON.stringify(await db.readAll('profiles')),message:document.querySelector('#toast').innerText};})()`);assert.equal(result.unchanged,true);assert.match(result.message,/Unsupported backup/);
  });
  await test('PIN is hashed, verified, and removable',async()=>{
    await route('settings');await route('edit');await fill('[name=pin]','2468');await click('#profile-form [type=submit]');await until(`!!document.querySelector('#animation')`);
    const pin=await evaluate(`(async()=>{const db=await import('./src/db.js');return (await db.readAll('profiles')).find(p=>p.name==='Jamie').pin;})()`);assert.notEqual(pin.hash,'2468');assert.equal(pin.hash.length,64);
    await route('profile');await route('profiles');
    await evaluate(`Array.from(document.querySelectorAll('[data-action=select-profile]')).find(el=>el.textContent.includes('Jamie')&&!el.textContent.includes('copy')).click()`);await until(`!!document.querySelector('#pin-form')`);await fill('#pin-form [name=pin]','0000');await click('#pin-form button');await until(`document.querySelector('#pin-error')?.textContent.includes('did not match')`);await fill('#pin-form [name=pin]','2468');await click('#pin-form button');await until(`!!document.querySelector('#books')`);
    await route('profile');await route('settings');await route('edit');await fill('[name=currentPin]','2468');await click('[name=removePin]');await click('#profile-form [type=submit]');await until(`!!document.querySelector('#animation')`);
    const removed=await evaluate(`(async()=>{const db=await import('./src/db.js');return !(await db.readAll('profiles')).find(p=>p.name==='Jamie').pin;})()`);assert.equal(removed,true);
  });
  await test('service-worker update waits for user action and retains saved answers',async()=>{
    await route('library');
    const before=await evaluate(`(async()=>{const db=await import('./src/db.js');return JSON.stringify(await db.readAll('profiles'));})()`);
    await writeFile('sw.js',originalWorker.replace(/reading-room-assets-[^']+/, 'reading-room-assets-browser-upgrade'));
    await evaluate(`(async()=>{const registration=await navigator.serviceWorker.getRegistration();await registration.update();})()`);
    await until(`!!document.querySelector('[data-action=update]')`,20000);
    assert.equal(await evaluate(`navigator.serviceWorker.controller.scriptURL.endsWith('/sw.js')`),true);
    await route('update');await until(`!!document.querySelector('#books') && !document.querySelector('[data-action=update]')`,20000);
    const after=await evaluate(`(async()=>{const db=await import('./src/db.js');return JSON.stringify(await db.readAll('profiles'));})()`);assert.equal(after,before);
  });
  const errors=browser.events.filter(x=>x.method==='Runtime.exceptionThrown');assert.equal(errors.length,0,JSON.stringify(errors));
} catch(err) {console.error(err.stack);await mkdir('test-results',{recursive:true});const shot=await send('Page.captureScreenshot',{format:'png'}).catch(()=>null);if(shot)await writeFile('test-results/failure.png',Buffer.from(shot.data,'base64'));process.exitCode=1;}
finally {await writeFile('sw.js',originalWorker);await mkdir('test-results',{recursive:true});await writeFile('test-results/browser.json',JSON.stringify(results,null,2));await browser.close();}
