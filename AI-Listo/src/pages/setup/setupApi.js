import apiClient from '../../api/apiClient';
const ws=()=>localStorage.getItem('activeWorkspaceId')||localStorage.getItem('workspace_id')||'';
const ep=(x='')=>`/setup${x}${ws()?`?workspace_id=${encodeURIComponent(ws())}`:''}`;
export const setupApi={get:()=>apiClient.request(ep()),save:(body)=>apiClient.request(ep(),{method:'PATCH',body:JSON.stringify(body)}),test:(body)=>apiClient.request(ep('/test'),{method:'POST',body:JSON.stringify(body)}),activate:()=>apiClient.request(ep('/activate'),{method:'POST',body:'{}'}),assist:(body)=>apiClient.request(ep('/assistance'),{method:'POST',body:JSON.stringify(body)}),dismiss:()=>apiClient.request(ep('/assistance/dismiss'),{method:'POST',body:'{}'})};
