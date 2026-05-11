import { useState, useEffect } from 'react';
import { Order } from '../types';
import { useAuth } from '../components/AuthContext';
import { getLocalOrdersForUser, subscribeLocalDb } from '../lib/localDb';

export function useUserOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const sync = () => {
      setOrders(getLocalOrdersForUser(user.uid));
      setLoading(false);
    };
    sync();
    return subscribeLocalDb(sync);
  }, [user]);

  return { orders, loading };
}
