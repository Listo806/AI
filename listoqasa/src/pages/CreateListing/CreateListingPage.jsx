import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Check, ChevronDown, CircleHelp, FileText, Home, ImagePlus, Save, ArrowRight, ArrowLeft, UploadCloud, X, Bell } from 'lucide-react';
import './CreateListingPage.css';
import { marketplaceRequest, getMarketplaceUser, logoutMarketplace } from '../../api/marketplaceApi';
const KEY='listoqasa_listing_draft_v1';
const initial={requestLuxury:false,listingType:'',propertyType:'',title:'',city:'',neighborhood:'',address:'',price:'',bedrooms:'',bathrooms:'',area:'',description:''};
const luxuryWords={
 en:{request:'Request Luxury classification (subject to admin approval)',note:'A request does not guarantee approval. Photos, finishes, location, amenities and design are reviewed.',sent:'Luxury classification requested; awaiting admin review.',failed:'Listing saved, but the Luxury request failed: '},
 es:{request:'Solicitar clasificación de lujo (sujeta a aprobación)',note:'La solicitud no garantiza aprobación. Se revisan fotos, acabados, ubicación, servicios y diseño.',sent:'Clasificación de lujo solicitada; pendiente de revisión.',failed:'Anuncio guardado, pero falló la solicitud de lujo: '},
 pt:{request:'Solicitar classificação de luxo (sujeita a aprovação)',note:'O pedido não garante aprovação. Fotos, acabamentos, localização, comodidades e design serão avaliados.',sent:'Classificação de luxo solicitada; aguardando análise.',failed:'Anúncio salvo, mas o pedido de luxo falhou: '}
};
const cities=['Quito','Guayaquil','Cuenca','Manta','Salinas','Samborondón'];
export default function CreateListingPage(){
 const [params]=useSearchParams();
 const luxuryText=luxuryWords[(localStorage.getItem('i18nextLng')||'en').slice(0,2)]||luxuryWords.en;
 const navigate=useNavigate();
 const [account,setAccount]=useState(getMarketplaceUser());
 const [mine,setMine]=useState([]);
 const [draftId,setDraftId]=useState(null);
 const [editingId,setEditingId]=useState(null);
 const [busy,setBusy]=useState(false);
 const [loadingEdit,setLoadingEdit]=useState(Boolean(new URLSearchParams(window.location.search).get('edit')));
 const [data,setData]=useState(()=>{if(new URLSearchParams(window.location.search).has('edit'))return initial;try{return {...initial,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return initial}});
 const [step,setStep]=useState(1),[images,setImages]=useState([]),[notice,setNotice]=useState(''),[confirmed,setConfirmed]=useState(false);
 const [selectedDraft,setSelectedDraft]=useState('');
 const inputRef=useRef(null);
 useEffect(()=>{
  if(!account){navigate('/marketplace/login?next=/my-listings',{replace:true});return;}
  let cancelled=false;
  marketplaceRequest('/platform/listings/dashboard').then(r=>{
   if(cancelled)return;
   const list=r.data||[];setMine(list);
   const edit=params.get('edit');const requested=params.get('draft');
   if(edit){
    const listing=list.find(x=>String(x.id)===edit);
    if(!listing){setNotice('Listing not found or access denied.');setLoadingEdit(false);return;}
    setEditingId(edit);setDraftId(null);setLoadingEdit(false);
    setData({...initial,title:listing.title||'',description:listing.description||'',address:listing.address||'',city:listing.city||'',neighborhood:listing.state||'',price:String(listing.price??''),bedrooms:String(listing.bedrooms??''),bathrooms:String(listing.bathrooms??''),area:String(listing.squareFeet?Math.round(listing.squareFeet/10.7639):''),listingType:listing.type==='rent'?'For Rent':listing.type==='sale'?'For Sale':'',propertyType:listing.propertyType||listing.property_type||'',requestLuxury:listing.luxuryStatus==='pending'});
    return;
   }
   const draft=list.find(x=>x.status==='draft'&&x.id===requested)||(!requested?list.find(x=>x.status==='draft'):null);
   if(draft)loadDraft(draft);
  }).catch(e=>{if(!cancelled){setNotice(e.message);setLoadingEdit(false)}});
  return()=>{cancelled=true};
 },[account,navigate,params]);
 useEffect(()=>()=>images.forEach(i=>URL.revokeObjectURL(i.url)),[]);
 const update=(name,value)=>setData(d=>({...d,[name]:value}));
 const payload=()=>({title:data.title||'Untitled draft',description:data.description,address:data.address,city:data.city,state:data.neighborhood,price:data.price?Number(data.price):null,type:data.listingType==='For Rent'?'rent':'sale',bedrooms:data.bedrooms?Number(data.bedrooms):null,bathrooms:data.bathrooms?Number(data.bathrooms):null,squareFeet:data.area?Number(data.area)*10.7639:null});
 const loadDraft=(draft)=>{setSelectedDraft(draft.id);setDraftId(draft.id);setData({...initial,title:draft.title||'',description:draft.description||'',address:draft.address||'',city:draft.city||'',neighborhood:draft.state||'',price:String(draft.price??''),bedrooms:String(draft.bedrooms??''),bathrooms:String(draft.bathrooms??''),area:String(draft.squareFeet?Math.round(draft.squareFeet/10.7639):''),listingType:draft.type==='rent'?'For Rent':'For Sale'});setImages([]);setStep(1);};
 const save=async()=>{if(loadingEdit)return;setBusy(true);setNotice('');try{const path=editingId?`/platform/listings/${editingId}`:draftId?`/platform/listings/drafts/${draftId}`:'/platform/listings/drafts';const r=await marketplaceRequest(path,{method:editingId||draftId?'PATCH':'POST',body:JSON.stringify(payload())});if(!editingId)setDraftId(r.data.id);setNotice(editingId?'Changes saved successfully.':'Draft saved to your account.');localStorage.removeItem(KEY);if(data.requestLuxury && editingId){try{await marketplaceRequest(`/properties/${editingId}/luxury-request`,{method:'POST'});setNotice(luxuryText.sent)}catch(e){setNotice(luxuryText.failed+e.message)}}if(editingId)navigate('/my-listings');}catch(e){setNotice(e.message)}finally{setBusy(false)}};
 const publish=async()=>{
  if(editingId){await save();return;}
  if(!account)return navigate('/marketplace/login');
  setBusy(true);setNotice('');
  try {
    const path=draftId?`/platform/listings/drafts/${draftId}`:'/platform/listings/drafts';
    const saved=await marketplaceRequest(path,{method:draftId?'PATCH':'POST',body:JSON.stringify(payload())});
    const id=saved.data.id;setDraftId(id);
    if(!images.some(x=>x.file.type.startsWith('image/')) && !mine.find(x=>x.id===id)?.imageCount){setNotice('Please add at least one photo, or reopen a draft with previously uploaded photos.');return;}
    for(const item of images){
      if(!['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime'].includes(item.file.type))throw new Error('Unsupported image or video format.');
      const form=new FormData();form.append('file',item.file);form.append('draftId',id);
      const uploaded=await marketplaceRequest('/integrations/storage/listing-media/upload',{method:'POST',body:form});
      if(!uploaded.id)throw new Error('Upload succeeded but storage returned no file ID');
      await marketplaceRequest(`/platform/listings/drafts/${id}/media`,{method:'POST',body:JSON.stringify({fileId:uploaded.id})});
    }
    await marketplaceRequest(`/platform/listings/drafts/${id}/submit`,{method:'POST'});
    if(data.requestLuxury){try{await marketplaceRequest(`/properties/${id}/luxury-request`,{method:'POST'});setNotice(luxuryText.sent)}catch(e){setNotice(luxuryText.failed+e.message)}}
    setImages([]);setDraftId(null);setData(initial);localStorage.removeItem(KEY);
    setNotice('Your listing has been submitted for review.');
    const result=await marketplaceRequest('/platform/listings');setMine(result.data||[]);
  }catch(e){setNotice(e.message||'Submission failed. Your draft is still saved.');}
  finally{setBusy(false)}
 };
 const addFiles=files=>{const picked=[...files].filter(f=>f.type.startsWith('image/')||f.type.startsWith('video/'));setImages(old=>[...old,...picked.map(file=>({file,url:URL.createObjectURL(file)}))]);};
 const required=['listingType','propertyType','title','city','neighborhood','address','price','bedrooms','bathrooms','area','description'];
 const proceed=()=>{if(step===1){const missing=required.filter(k=>(!editingId||k!=='propertyType')&&!String(data[k]).trim());if(missing.length){setNotice('Please complete all required property fields before continuing.');return;}}setNotice('');setStep(s=>Math.min(3,s+1));window.scrollTo(0,0)};
 const field=(label,key,placeholder='',type='text')=><label className="cl-field"><span>{label} <em>*</em></span><input value={data[key]} type={type} placeholder={placeholder} onChange={e=>update(key,e.target.value)} /></label>;
 const select=(label,key,options,placeholder)=><label className="cl-field"><span>{label} <em>*</em></span><select value={data[key]} onChange={e=>update(key,e.target.value)}><option value="">{placeholder}</option>{options.map(v=><option key={v} value={v}>{v}</option>)}</select></label>;
 return <div className="cl-page"><header className="cl-top"><Link to="/" className="cl-logo"><span>LQ</span> ListoQasa</Link><nav><a href="/my-listings"><Home size={19}/> My Listings</a><a href="mailto:support@listoqasa.com"><CircleHelp size={19}/> Help</a></nav><div className="cl-account"><Bell size={20}/><span className="cl-avatar">{(account?.name||account?.email||"LQ").slice(0,2).toUpperCase()}</span><span>{account?.name||account?.email||"Marketplace"}</span><button type="button" onClick={()=>{logoutMarketplace();navigate("/marketplace/login")}}>Sign out</button></div></header>
 <main className="cl-main">{loadingEdit&&<div className="cl-notice" role="status">Loading property details…</div>}{!editingId&&mine.some(x=>x.status==='draft')&&<div className="cl-draft-picker"><label htmlFor="cl-existing-draft">Continue a saved draft</label><select id="cl-existing-draft" value={selectedDraft} onChange={e=>{const draft=mine.find(x=>x.id===e.target.value&&x.status==='draft');if(draft)loadDraft(draft);else{setSelectedDraft('');setDraftId(null);setData(initial);setImages([]);setStep(1);}}}><option value="">New listing</option>{mine.filter(x=>x.status==='draft').map(x=><option key={x.id} value={x.id}>{x.title||'Untitled draft'}</option>)}</select></div>}{confirmed&&<div className="cl-confirm"><Check/> Payment return detected. Verify your payment status before publishing.<button onClick={()=>setConfirmed(false)} aria-label="Dismiss"><X/></button></div>}
 <div className="cl-heading"><div><h1>{editingId?'Edit Listing':'Create Your Listing'}</h1><p>{editingId?'Review your existing property details. Changes are saved only when you select Save Changes.':'Add the property details and photos. You can save a draft at any time.'}</p></div><div className="cl-steps">{['Property Details','Photos & Videos','Review & Publish'].map((name,i)=><div key={name} className={step===i+1?'current':''}><b>{i+1}</b><span>{name}</span></div>)}</div></div>
 <div className="cl-columns" style={loadingEdit?{opacity:0.45,pointerEvents:'none'}:undefined}><section className="cl-panel"><div className="cl-panel-title"><span className="cl-round"><FileText/></span><div><h2>{step===3?'Review property details':'Property Details'}</h2><p>Tell us about your property. All fields help buyers and renters find the right match.</p></div></div>
 {step===3?<div className="cl-review">{Object.entries(data).map(([key,value])=><p key={key}><strong>{key.replace(/([A-Z])/g,' $1')}</strong><span>{value||'—'}</span></p>)}</div>:<><div className="cl-grid two">{select('Listing type','listingType',['For Sale','For Rent','Vacation Rental'],'Select listing type')}{select('Property type','propertyType',['House','Apartment','Condo','Villa','Land','Commercial'],'Select property type')}</div>{field('Property title','title','e.g. Modern house with garden in Cumbayá')}<div className="cl-grid two">{select('City','city',cities,'Select a city')}{field('Neighborhood','neighborhood','e.g. Cumbayá')}</div>{field('Address','address','e.g. Av. Simón Bolívar y Calle Principal')}<div className="cl-grid four">{field('Price (USD)','price','e.g. 125000','number')}{select('Bedrooms','bedrooms',['0','1','2','3','4','5','6','7+'],'Select')}{select('Bathrooms','bathrooms',['1','1.5','2','2.5','3','3.5','4','5+'],'Select')}{field('Area (m²)','area','e.g. 250','number')}</div><label className="cl-field" style={{display:'block',margin:'16px 0'}}><span><input type="checkbox" checked={Boolean(data.requestLuxury)} onChange={e=>update('requestLuxury',e.target.checked)} /> {luxuryText.request}</span><small style={{display:'block',marginTop:6}}>{luxuryText.note}</small></label><label className="cl-field"><span>Description <em>*</em></span><textarea maxLength={2000} value={data.description} placeholder="Describe your property. Include key features, amenities, and what makes it special..." onChange={e=>update('description',e.target.value)}/><small>{data.description.length}/2000</small></label></>}
 </section><section className="cl-panel"><div className="cl-panel-title"><span className="cl-round"><ImagePlus/></span><div><h2>Add photos and videos</h2><p>Showcase your property with clear, high-quality media.</p></div></div><input ref={inputRef} hidden multiple type="file" accept="image/*,video/*" onChange={e=>addFiles(e.target.files||[])}/><div className="cl-drop" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();addFiles(e.dataTransfer.files)}} onClick={()=>inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter')inputRef.current?.click()}}><span className="cl-drop-icon"><ImagePlus size={34}/></span><strong>Drag files here or <span>browse</span></strong><p>Add high-quality photos and videos of your property.</p><small>You can upload multiple files at once.</small></div><div className="cl-photos">{Array.from({length:Math.max(6,images.length)},(_,i)=><button key={i} type="button" onClick={()=>images[i]?setImages(old=>old.filter((_,j)=>j!==i)):inputRef.current?.click()}>{images[i]?(images[i].file.type.startsWith('video/')?<video src={images[i].url}/>:<img src={images[i].url} alt={`Property photo ${i+1}`}/>):<><ImagePlus/><span>+</span></>}</button>)}</div><p className="cl-upload-note">JPG, PNG, WebP (max 5MB) and MP4, WebM, MOV videos (max 50MB). Uploads occur on submit.</p></section></div>
 {notice&&<p className="cl-notice" role="status">{notice}</p>}</main><footer className="cl-bottom"><button className="cl-secondary" disabled={busy||loadingEdit} onClick={save}><Save size={18}/> {editingId?'Save Changes':'Save Draft'}</button><div>{step>1&&<button className="cl-secondary" onClick={()=>setStep(s=>s-1)}><ArrowLeft size={17}/> Back</button>}{step<3?<button className="cl-primary" disabled={loadingEdit} onClick={proceed}>Continue to {step===1?'Photos & Videos':'Review & Publish'} <ArrowRight size={19}/></button>:<button className="cl-primary" disabled={busy||loadingEdit} onClick={publish}>{busy?"Saving...":editingId?"Save Changes":"Submit for Review"} <ArrowRight size={19}/></button>}</div></footer></div>
}
