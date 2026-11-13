import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateBackup, exportBackup, flattenProfile, importAsNew, mergeProfiles } from '../src/backup.js';
import { checkAnswer, activityTypes } from '../src/content.js';
import { avatarChoices, avatarImage, resolveAvatarId } from '../src/avatars.js';
const fixture=()=>({profileId:'reader-a',name:'Reader',audience:'adults',avatar:'leaf',preferences:{language:'en',animation:'none',level:1,filters:{}},readingProgress:[{profileId:'reader-a',bookId:'sample-red-bag',pageId:'story-01',status:'in-progress',runId:'run-a'}],activityAttempts:[{profileId:'reader-a',attemptId:'attempt-a',bookId:'sample-red-bag',pageId:'check-01',runId:'run-a',answers:{'bag-color':'Red'}}],collections:[{profileId:'reader-a',collectionId:'collection-a',name:'My shelf',bookIds:['sample-red-bag']}]});
test('backup round trip preserves progress, avatar, settings, answers and collections',()=>{const p=fixture();p.avatar='data:image/png;base64,YQ==';assert.deepEqual(flattenProfile(validateBackup(JSON.parse(JSON.stringify(exportBackup([p])))).profiles[0]),p);});
test('invalid, future, unsafe, cross-profile and duplicate records are rejected',()=>{
  for(const mutate of [b=>b.formatVersion=2,b=>b.profiles[0].activityAttempts[0].profileId='other',b=>b.profiles[0].profile.avatar='javascript:alert(1)',b=>b.profiles[0].preferences.language='invalid',b=>b.profiles[0].collections.push(b.profiles[0].collections[0]),b=>b.profiles.push(b.profiles[0])]){const b=exportBackup([fixture()]);mutate(b);assert.throws(()=>validateBackup(b));}
  const unsafe=JSON.parse(JSON.stringify(exportBackup([fixture()])).replace('"answers":{','"answers":{"__proto__":{},'));assert.throws(()=>validateBackup(unsafe));
});
test('new-profile import regenerates all identifiers and rewrites run references',()=>{let counter=0;const p=fixture();const next=importAsNew(exportBackup([p]).profiles[0],()=>`new-${++counter}`);assert.notEqual(next.profileId,p.profileId);for(const key of ['readingProgress','activityAttempts','collections'])assert.equal(next[key][0].profileId,next.profileId);assert.notEqual(next.activityAttempts[0].attemptId,p.activityAttempts[0].attemptId);assert.notEqual(next.collections[0].collectionId,p.collections[0].collectionId);assert.equal(next.readingProgress[0].runId,next.activityAttempts[0].runId);assert.deepEqual(p,fixture());});
test('merge is idempotent and preserves distinct attempts and collections',()=>{const a=fixture(),b=fixture();b.activityAttempts.push({...b.activityAttempts[0],attemptId:'attempt-b'});b.collections.push({...b.collections[0],collectionId:'collection-b',name:'Other shelf'});let result=mergeProfiles(a,b);assert.equal(result.conflicts.length,0);assert.equal(result.profile.activityAttempts.length,2);assert.equal(result.profile.collections.length,2);assert.deepEqual(mergeProfiles(result.profile,b).profile,result.profile);});
test('conflicting answers require an explicit resolution and leave inputs intact',()=>{const a=fixture(),b=fixture();b.activityAttempts[0].answers['bag-color']='Blue';const result=mergeProfiles(a,b);assert.equal(result.conflicts.length,1);const key=result.conflicts[0].key;const resolved=mergeProfiles(a,b,{[key]:'incoming'});assert.equal(resolved.profile.activityAttempts[0].answers['bag-color'],'Blue');assert.equal(a.activityAttempts[0].answers['bag-color'],'Red');});
test('same-name collections with different identities are reviewed',()=>{const a=fixture(),b=fixture();b.collections[0].collectionId='different';b.collections[0].bookIds=['sample-pond'];assert.equal(mergeProfiles(a,b).conflicts.length,1);});
test('typed answers normalize only when authored; blanks never score',()=>{const q={answer:'pen',normalization:{trim:true,caseInsensitive:true}};assert.equal(checkAnswer(q,' PEN '),true);assert.equal(checkAnswer(q,'pin'),false);assert.equal(checkAnswer(q,''),false);assert.equal(checkAnswer({answer:'pen'},'Pen'),false);});
test('sample packages have stable unique IDs, supported activities, valid authored answers',async()=>{const catalogue=JSON.parse(await readFile('content/catalogue.json','utf8'));const ids=new Set();for(const path of catalogue){const b=JSON.parse(await readFile(path,'utf8'));assert.equal(ids.has(b.id),false);ids.add(b.id);assert.equal(new Set(b.pages.map(p=>p.id)).size,b.pages.length);for(const p of b.pages.filter(p=>p.type==='activity')){assert.equal(activityTypes.has(p.activityType),true);for(const q of p.questions){assert.ok(q.hint);assert.equal(checkAnswer(q,q.answer),true);if(q.options)assert.ok(q.options.includes(q.answer));}}}assert.equal(ids.size,2);});
test('all nine character identities round trip through backups, retaining legacy support',()=>{
  assert.equal(avatarChoices.length,9);
  assert.equal(new Set(avatarChoices.map(a=>a.id)).size,9);
  for(const choice of avatarChoices){const p=fixture();p.avatar=choice.id;assert.equal(flattenProfile(validateBackup(exportBackup([p])).profiles[0]).avatar,choice.id);}
  for(const legacy of ['leaf','sun','moon','flower']){const p=fixture();p.avatar=legacy;assert.equal(flattenProfile(validateBackup(exportBackup([p])).profiles[0]).avatar,legacy);assert.ok(avatarChoices.some(a=>a.id===resolveAvatarId(legacy)));}
  const p=fixture();p.avatar='character-99';assert.throws(()=>validateBackup(exportBackup([p])));
});
test('all character portraits are bundled and precached within the offline size budget',async()=>{
  const worker=await readFile('sw.js','utf8');let total=0;
  for(const choice of avatarChoices){const file=avatarImage(choice.id);const bytes=await readFile(file);assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.ok(worker.includes(file));total+=bytes.length;}
  assert.ok(total<300000,`Avatar downloads total ${total} bytes`);
});
