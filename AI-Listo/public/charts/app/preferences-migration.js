// Preferences migration utility. Run export() on the old origin only after installing
// this script there; import() on the new origin. Never includes tokens or credentials.
const keys = [
 'custom-market-settings-v2','heisenberg-settings','market-bb-settings-v1',
 'market-engine-settings-v1','market-header-collapsed','market-history-biquote-v1',
 'market-indicator-picker-v1','market-osc-pane-collapsed','market-trama-settings-v1',
 'market-vwap-aa-v1','market-watch-slots-v1','market-rsi-settings-v1','market-ma-settings-v1'
];
window.CortexaChartsPreferences = Object.freeze({
 export() {
   const values={};
   for(const key of keys){const value=localStorage.getItem(key);if(value!==null)values[key]=value;}
   return JSON.stringify({version:1,app:'Cortexa Charts',values},null,2);
 },
 import(json) {
   if(typeof json!=='string'||json.length>200000)throw Error('Invalid preferences export');
   const data=JSON.parse(json);
   if(data?.version!==1||data?.app!=='Cortexa Charts'||!data.values||typeof data.values!=='object'||Array.isArray(data.values))throw Error('Invalid Cortexa Charts export');
   let count=0;
   for(const key of keys){const value=data.values[key];if(typeof value==='string'&&value.length<=50000){localStorage.setItem(key,value);count++;}}
   return {imported:count,reloadRequired:true};
 }
});
