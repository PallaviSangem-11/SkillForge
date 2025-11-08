import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  // 🔧 Force dark theme only for this page
  useEffect(() => {
    document.body.style.backgroundColor = '#000';
    document.body.style.color = '#fff';
    return () => {
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-blue-400">
              SkillForge: Learn Faster, Teach Smarter, Manage Better
            </h1>
            <p className="mt-4 text-lg text-gray-300">
              An AI-powered platform that helps students master skills, empowers instructors to create assessments instantly, and enables admins to run the academy smoothly.
            </p>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => navigate('/register')}
                className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition-all"
              >
                Get Started
              </button>
              <button
                onClick={() => navigate('/login')}
                className="border border-blue-400 text-blue-400 px-5 py-3 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
              >
                Sign In
              </button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-gray-400">
              <div className="flex -space-x-2">
                <img className="w-8 h-8 rounded-full border border-blue-500" src="https://i.pravatar.cc/32?img=12" alt="user" />
                <img className="w-8 h-8 rounded-full border border-blue-500" src="https://i.pravatar.cc/32?img=22" alt="user" />
                <img className="w-8 h-8 rounded-full border border-blue-500" src="https://i.pravatar.cc/32?img=32" alt="user" />
              </div>
              <span>Trusted by 5,000+ learners and 200+ instructors</span>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-lg border border-blue-500 bg-gray-800">
              <img
                src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&w=1280&auto=format&fit=crop"
                alt="SkillForge preview"
                className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-gray-900 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-blue-400">Services</h2>
          <p className="text-center text-gray-400 mt-2">Designed for every role in your learning journey</p>
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            <div className="bg-black border border-blue-500 rounded-xl p-6 shadow-lg hover:shadow-blue-700/40 transition">
              <div className="text-3xl mb-3">🎓</div>
              <h3 className="font-semibold text-lg text-blue-300">Students</h3>
              <p className="text-gray-400 mt-2">
                Take AI-generated MCQ quizzes, track progress, and learn faster with instant explanations.
              </p>
            </div>
            <div className="bg-black border border-blue-500 rounded-xl p-6 shadow-lg hover:shadow-blue-700/40 transition">
              <div className="text-3xl mb-3">👩‍🏫</div>
              <h3 className="font-semibold text-lg text-blue-300">Instructors</h3>
              <p className="text-gray-400 mt-2">
                Create clean, auto-graded MCQ quizzes in seconds and view performance analytics.
              </p>
            </div>
            <div className="bg-black border border-blue-500 rounded-xl p-6 shadow-lg hover:shadow-blue-700/40 transition">
              <div className="text-3xl mb-3">🛠️</div>
              <h3 className="font-semibold text-lg text-blue-300">Admins</h3>
              <p className="text-gray-400 mt-2">
                Manage users, courses, and platform insights with a streamlined dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-16 md:py-20 bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <blockquote className="text-2xl md:text-3xl font-semibold text-blue-300 leading-relaxed">
            "Education is not the learning of facts, but the training of the mind to think."
          </blockquote>
          <div className="mt-4 text-gray-400">— Albert Einstein</div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="bg-gray-900 py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-blue-400">Contact Us</h2>
          <p className="text-center text-gray-400 mt-2">We’d love to hear from you</p>
          <form className="mt-8 bg-black border border-blue-500 rounded-xl p-6 shadow-lg space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <input
                className="border border-gray-700 bg-gray-800 text-white rounded-lg px-4 py-3 focus:border-blue-500 outline-none"
                placeholder="Your name"
              />
              <input
                className="border border-gray-700 bg-gray-800 text-white rounded-lg px-4 py-3 focus:border-blue-500 outline-none"
                placeholder="Email address"
              />
            </div>
            <textarea
              className="border border-gray-700 bg-gray-800 text-white rounded-lg px-4 py-3 w-full focus:border-blue-500 outline-none"
              rows="4"
              placeholder="Message"
            ></textarea>
            <div className="text-right">
              <button
                type="button"
                className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition-all"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Landing;
