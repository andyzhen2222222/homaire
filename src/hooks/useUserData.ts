import { useState, useEffect } from 'react';
import { Order } from '../types';
import { useAuth } from '../components/AuthContext';
import { getLocalOrdersForUser, subscribeLocalDb } from '../lib/localDb';
import { isRemoteStoreEnabled } from '../lib/storeConfig';
import { fetchUserOrdersFromServer } from '../lib/remoteStore';

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

    const sync = async () => {
      if (isRemoteStoreEnabled()) {
        setOrders(await fetchUserOrdersFromServer(user.uid));
      } else {
        setOrders(getLocalOrdersForUser(user.uid));
      }
      setLoading(false);
    };
    void sync();
    return subscribeLocalDb(() => {
      void sync();
    });
  }, [user]);

  return { orders, loading };
}
