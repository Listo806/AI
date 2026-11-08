import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const src=await readFile('worker/calendar.js','utf8');
const {calendarResponse}=await import('data:text/javascript;base64,'+Buffer.from(src+'\nexport {calendarResponse};').toString('base64'));
let calls=0;const realFetch=globalThis.fetch;
globalThis.fetch=async()=>{calls++;return Response.json({server_time:Date.now()/1000,generated_at:new Date().toISOString(),events:[{id:'jobs',ts:Date.now()/1000,currency:'USD',title:'Jobs',impact:'high',actual:'0',previous:'3',forecast:'2'},{ts:3,currency:'BAD',title:'bad'}]});};
const req=new Request('https://example.test/api/calendar');const [a,b]=await Promise.all([calendarResponse(req),calendarResponse(req)]);const data=await a.json();assert.equal(data.events.length,1);assert.equal(data.events[0].actual,'0');assert.equal(calls,1);assert.equal(b.status,200);assert.equal((await calendarResponse(new Request(req.url,{method:'POST'}))).status,405);await calendarResponse(req);assert.equal(calls,1);
globalThis.fetch=realFetch;console.log('Calendar normalization, zero values, shared requests, cache and method checks passed.');
