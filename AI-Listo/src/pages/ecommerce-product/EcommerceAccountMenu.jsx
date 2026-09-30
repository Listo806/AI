import React,{useEffect,useMemo,useRef,useState} from "react";
import {ChevronDown,Globe2,LogOut} from "lucide-react";
import "./ecommerce-account-menu.css";
import {EC_LANG_KEY,EC_LANGS,EC_LANG_EVENT,ecT} from "./EcommerceLocale";

const TOKEN_KEY="cortexa_ecommerce_access_token";
const USER_KEY="cortexa_ecommerce_user";
function decodeJwt(token){try{const p=token?.split?.(".")?.[1];if(!p)return{};return JSON.parse(decodeURIComponent(atob(p.replace(/-/g,"+").replace(/_/g,"/")).split("").map(c=>"%"+("00"+c.charCodeAt(0).toString(16)).slice(-2)).join("")))}catch{return{}}}
function currentUser(){
 let saved={};try{saved=JSON.parse(localStorage.getItem(USER_KEY)||"{}")}catch{}
 const jwt=decodeJwt(localStorage.getItem(TOKEN_KEY));
 let fallback={};
 for(const key of ["user","auth_user","currentUser","cortexa_user","authUser"]){try{const v=JSON.parse(localStorage.getItem(key)||"null");if(v&&typeof v==="object"&&(v.email||v.user?.email)){fallback=v.user||v;break}}catch{}}
 return{name:saved.name||jwt.name||jwt.fullName||jwt.full_name||fallback.name||fallback.fullName||[jwt.firstName,jwt.lastName].filter(Boolean).join(" ")||"",email:saved.email||jwt.email||jwt.preferred_username||fallback.email||""}
}
function initials(user){const source=user.name||user.email||"C";return source.split(/[\s@._-]+/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()).join("")||"C"}
export function rememberEcommerceUser(user={}){let old={};try{old=JSON.parse(localStorage.getItem(USER_KEY)||"{}")}catch{}localStorage.setItem(USER_KEY,JSON.stringify({name:user.name||old.name||"",email:user.email||old.email||""}))}
export default function EcommerceAccountMenu(){
 const [profileOpen,setProfileOpen]=useState(false),[langOpen,setLangOpen]=useState(false);const ref=useRef(null);const [user,setUser]=useState(()=>currentUser());const [lang,setLang]=useState(()=>{const x=(localStorage.getItem(EC_LANG_KEY)||localStorage.getItem("i18nextLng")||"en").slice(0,2);return EC_LANGS[x]?x:"en"});
 useEffect(()=>{const close=e=>{if(ref.current&&!ref.current.contains(e.target)){setProfileOpen(false);setLangOpen(false)}};document.addEventListener("mousedown",close);return()=>document.removeEventListener("mousedown",close)},[]);
 useEffect(()=>{if(user.email)return;const token=localStorage.getItem(TOKEN_KEY);if(!token)return;fetch("/api/auth/me",{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.ok?r.json():null).then(data=>{const u=data?.user||data;if(!u?.email)return;const next={name:u.name||u.fullName||"",email:u.email};rememberEcommerceUser(next);setUser(next)}).catch(()=>{})},[user.email]);
 const changeLanguage=next=>{localStorage.setItem(EC_LANG_KEY,next);localStorage.setItem("i18nextLng",next);document.documentElement.lang=next;setLang(next);setLangOpen(false);window.dispatchEvent(new CustomEvent(EC_LANG_EVENT,{detail:{language:next}}));};
 const logout=()=>{localStorage.removeItem(TOKEN_KEY);localStorage.removeItem("cortexa_ecommerce_refresh_token");localStorage.removeItem(USER_KEY);sessionStorage.removeItem(TOKEN_KEY);window.location.replace("/e-commerce/login")};
 return <div className="ec-account-controls" ref={ref}>
  <div className="ec-lang-wrap"><button className="ec-language-trigger" type="button" onClick={()=>{setLangOpen(v=>!v);setProfileOpen(false)}}><Globe2 size={16}/><b>{EC_LANGS[lang]}</b><ChevronDown size={13}/></button>{langOpen&&<div className="ec-language-menu">{[["en","English"],["es","Español"],["pt","Português"]].map(([code,name])=><button className={lang===code?"active":""} key={code} onClick={()=>changeLanguage(code)}><span>{name}</span><em>({EC_LANGS[code]})</em></button>)}</div>}</div>
  <button className="ec-profile-trigger" type="button" aria-haspopup="menu" aria-expanded={profileOpen} onClick={()=>{setProfileOpen(v=>!v);setLangOpen(false)}}><span>{initials(user)}</span><ChevronDown size={15}/></button>
  {profileOpen&&<div className="ec-profile-menu" role="menu">{(user.name||user.email)&&<div className="ec-profile-identity">{user.name&&<strong>{user.name}</strong>}{user.email&&<small>{user.email}</small>}</div>}<button type="button" role="menuitem" onClick={logout}><LogOut size={16}/><span>{ecT("Log Out",lang)}</span></button></div>}
 </div>
}
