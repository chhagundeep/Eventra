"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, MoreVertical, Building2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import RegisterTenantModal from "@/components/RegisterTenantModal";

export default function SuperAdminDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "tenants"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      setTenants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  return (
    <>
      <style>{`
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 48px; }
        .reg-button { background-color: #f97316; color: white; border: none; padding: 16px 32px; border-radius: 16px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.2); }
        .card { background: white; border-radius: 40px; border: 1px solid #e2e8f0; padding: 40px; }
        .org-item { display: flex; align-items: center; justify-content: space-between; padding: 20px 30px; background: #f8fafc; border-radius: 24px; margin-bottom: 12px; }
      `}</style>

      <div className="header">
        <div>
          <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-2px' }}>Control Center</h1>
          <p style={{ color: '#64748b', fontWeight: '600', marginTop: '4px' }}>Managing active organizations.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="reg-button">
          <Plus size={20} strokeWidth={3} /> Register Tenant
        </button>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '30px', color: '#0f172a' }}>Organizations</h3>
        
        {tenants.map(t => (
          <div key={t.id} className="org-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ padding: '10px', background: 'white', borderRadius: '12px' }}><Building2 size={20} color="#f97316" /></div>
              <div>
                <div style={{ fontWeight: '800', color: '#0f172a' }}>{t.name}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{t.adminEmail}</div>
              </div>
            </div>
            <div style={{ color: '#22c55e', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase' }}>● Active</div>
            <MoreVertical size={20} color="#cbd5e1" cursor="pointer" />
          </div>
        ))}
      </div>

      <RegisterTenantModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}