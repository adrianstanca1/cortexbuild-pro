import React, { useState, useEffect } from 'react';
import { Company, User, Role } from '../types';
import { api } from '../services/mockApi';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCompanies().then(data => {
      setCompanies(data);
      if (data.length > 0) {
        setSelectedCompanyId(data[0].id.toString());
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      api.getUsersByCompany(parseInt(selectedCompanyId, 10)).then(data => {
        setUsers(data);
        if (data.length > 0) {
          setSelectedUserId(data[0].id.toString());
        } else {
            setSelectedUserId('');
        }
      });
    }
  }, [selectedCompanyId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserId) {
        const user = users.find(u => u.id === parseInt(selectedUserId, 10));
        if (user) {
            onLogin(user);
        }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-sky-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m-3-1-3-1.091m0 0-3 1.091m0 0 3 1.091m0 0-3-1.091m9-5.455-3-1.091m0 0L12 5.091m0 0 3 1.091m0 0-3-1.091" />
                </svg>
                <h1 className="text-3xl font-bold text-slate-800">ConstructFlow</h1>
            </div>
            <p className="text-slate-500">Select your profile to sign in</p>
        </div>
        
        {loading ? <p className="text-center text-slate-500">Loading companies...</p> : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                  <select
                    id="company"
                    value={selectedCompanyId}
                    onChange={e => setSelectedCompanyId(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md"
                  >
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="user" className="block text-sm font-medium text-slate-700 mb-1">User Profile</label>
                  <select
                    id="user"
                    value={selectedUserId}
                    onChange={e => setSelectedUserId(e.target.value)}
                    disabled={!users.length}
                    className="mt-1 block w-full px-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md"
                  >
                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                  </select>
                </div>
              </div>
              <Button type="submit" className="w-full mt-8" size="lg" disabled={!selectedUserId}>
                Sign In
              </Button>
            </form>
        )}
      </Card>
    </div>
  );
};