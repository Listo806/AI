import React from 'react';
import {NavLink,Navigate,useLocation} from 'react-router-dom';
import {Landmark,Building2,ChartNoAxesCombined} from 'lucide-react';
import MarketplaceBankTransferApprovals from './MarketplaceBankTransferApprovals';
import ChartsBankTransferApprovals from './ChartsBankTransferApprovals';
import './unified-bank-transfers.css';

export default function UnifiedBankTransferApprovals(){
 const location=useLocation();
 const charts=location.pathname.includes('/charts/');
 return <div className="unified-transfers">
   <div className="unified-transfer-heading"><Landmark size={19}/><div><strong>Bank Transfer Management</strong><span>Review payments across products in one admin area</span></div></div>
   <div className="unified-transfer-tabs" role="navigation" aria-label="Bank transfer product">
    <NavLink to="/dashboard/admin/marketplace/bank-transfers" className={!charts?'active':''}><Building2 size={17}/> Marketplace</NavLink>
    <NavLink to="/dashboard/admin/charts/payments" className={charts?'active':''}><ChartNoAxesCombined size={17}/> Cortexa Charts</NavLink>
   </div>
   {charts?<ChartsBankTransferApprovals/>:<MarketplaceBankTransferApprovals/>}
 </div>;
}
