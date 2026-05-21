import { useEffect, useState } from 'react';

import {
  getTeamBilling,
} from '../services/team.service';

export default function useTeamBilling() {
  const [billing, setBilling] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  /* =====================================================
    LOAD BILLING
  ===================================================== */

  const loadBilling = async () => {
    try {
      setLoading(true);

      const res = await getTeamBilling();

      setBilling(res || null);
    } catch (error) {
      console.error(
        'LOAD BILLING ERROR',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
    INIT
  ===================================================== */

  useEffect(() => {
    loadBilling();
  }, []);

  return {
    billing,
    loading,

    reloadBilling: loadBilling,
  };
}