import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import webpush from 'web-push';

const app = express();
const PORT = process.env.PORT || 5174;
app.use(cors());
app.use(bodyParser.json());

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/listoqasa';
mongoose.connect(mongoUri).catch(()=>console.log('[Mongo] skipped'));

const Lead = mongoose.models.Lead || mongoose.model('Lead', new mongoose.Schema({},{strict:false}));
const PushSub = mongoose.models.PushSub || mongoose.model('PushSub', new mongoose.Schema({},{strict:false}));

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(process.env.VAPID_SUBJECT||'mailto:admin@example.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
}

app.get('/api/health', (req,res)=>res.json({ok:true}));
app.post('/api/leads', async (req,res)=>{ try{ const lead=await Lead.create(req.body||{}); res.json({ok:true,lead}); }catch(e){ res.status(500).json({ok:false,error:e.message}); }});
app.get('/api/leads', async (req,res)=>{ try{ const leads=await Lead.find().sort({_id:-1}).limit(100); res.json({ok:true,leads}); }catch(e){ res.status(500).json({ok:false,error:e.message}); }});
app.post('/api/push/subscribe', async (req,res)=>{ try{ const sub=await PushSub.create(req.body||{}); res.json({ok:true,id:sub._id}); }catch(e){ res.status(500).json({ok:false,error:e.message}); }});
app.post('/api/push/test', async (req,res)=>{ try{ const sub=await PushSub.findOne().sort({_id:-1}); if(!sub) return res.status(400).json({ok:false,error:'no subs'}); await webpush.sendNotification(sub, JSON.stringify({title:'ListoQasa',body:'Test'})); res.json({ok:true}); }catch(e){ res.status(500).json({ok:false,error:e.message}); }});

app.listen(PORT, ()=>console.log('Backend running on http://localhost:'+PORT));
