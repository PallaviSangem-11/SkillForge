import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'mr', label: 'मराठी' },
  { code: 'bn', label: 'বাংলা' },
];

const Language = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('sf_language');
    if (saved) setSelected(saved);
  }, []);

  const saveLanguage = (code) => {
    setSelected(code);
    localStorage.setItem('sf_language', code);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="text-center p-6" style={{ background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' }}>
            <h1 className="text-2xl font-bold text-white">Choose Your Language</h1>
            <p className="text-blue-100 text-sm mt-1">You can change this later in settings</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-3">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => saveLanguage(lang.code)}
                  className={`border rounded-lg px-4 py-3 text-sm font-medium hover:bg-gray-50 ${selected === lang.code ? 'border-blue-500 text-blue-700' : 'border-gray-200 text-gray-800'}`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => navigate('/login')} className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700">Login</button>
              <button onClick={() => navigate('/register')} className="flex-1 border px-4 py-3 rounded-lg hover:bg-gray-50">Sign Up</button>
            </div>
            <div className="mt-4 text-center">
              <button onClick={() => navigate('/landing')} className="text-sm text-blue-600 hover:text-blue-700">Explore landing page →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Language;


