import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../services/api';
import { LayoutDashboard, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';

export const Auth: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (!supabase) {
        throw new Error('Banco de dados não configurado. Por favor, conecte o Supabase em Settings > Secrets adicionando VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
      }

      if (isResetting) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw new Error('Não foi possível enviar o link de redefinição. Verifique o e-mail digitado.');
        setMessage('Se um perfil com este e-mail existir, você receberá um link de redefinição de senha em instantes.');
        setLoading(false);
        return;
      }

      if (isLogin) {
        localStorage.setItem('preventAutoLogin', 'true');
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Por favor, valide seu e-mail acessando o link que foi enviado para a sua caixa de entrada.');
          }
          throw new Error('E-mail não cadastrado ou senha incorreta.');
        }

        if (authData.user && !authData.user.email_confirmed_at) {
          await supabase.auth.signOut();
          throw new Error('Por favor, valide seu e-mail antes de acessar a plataforma.');
        }
        
        if (authData.user) {
           const { data: profile } = await supabase
             .from('profiles')
             .select('id')
             .eq('id', authData.user.id)
             .single();
             
           if (!profile) {
               const { error: insertError } = await supabase.from('profiles').insert({
                   id: authData.user.id,
                   name: authData.user.user_metadata?.full_name || email.split('@')[0],
                   email: email
               });
               if (insertError) {
                   console.error('Perfil não encontrado e falha ao criar. Prosseguindo sem perfil...', insertError);
               }
           }
        }
      } else {
        localStorage.setItem('preventAutoLogin', 'true');
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            }
          }
        });
        
        if (error) {
           if (error.message && error.message.includes('registered')) {
               throw new Error('Este e-mail já está cadastrado.');
           }
           if (error.message && error.message.toLowerCase().includes('rate limit')) {
               throw new Error('Limite de tentativas excedido. Por favor, tente novamente mais tarde.');
           }
           throw new Error(error.message || 'Erro ao criar conta. Verifique os dados e tente novamente.');
        }
        
        if (data.user) {
           const { data: profile } = await supabase.from('profiles').select('id').eq('id', data.user.id).single();
           if (!profile) {
               const { error: insertError } = await supabase.from('profiles').insert({
                   id: data.user.id,
                   name: name,
                   email: email
               });
               if (insertError) {
                   console.error("Erro ao criar perfil", insertError);
               }
           }
        }

        // Strictly sign out after signup to prevent auto-login
        await supabase.auth.signOut();
        
        setMessage('Conta criada com sucesso! Verifique sua caixa de entrada para validar seu e-mail antes de fazer login.');
        setIsLogin(true);
        setPassword('');
        setLoading(false);
        localStorage.removeItem('preventAutoLogin');
        return;
      }
      
      localStorage.removeItem('preventAutoLogin');
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação.');
      setLoading(false);
    } finally {
      localStorage.removeItem('preventAutoLogin');
    }
  };

  const handleGoogleLogin = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar com Google.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#050505] font-sans text-slate-200 relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-600/20 blur-[120px] pointer-events-none" />

      <div className="w-full flex">
        {/* Left Panel - Branding (Hidden on mobile) */}
        <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative z-10 border-r border-white/5 bg-[#0a0a0a]/50 backdrop-blur-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Kanban Mix</span>
          </div>

          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>A nova forma de gerenciar tarefas</span>
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-[1.1] text-white">
              O fluxo perfeito<br/>para sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">equipe.</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Organize tarefas, colabore em tempo real e alcance todos os seus objetivos com uma experiência fluida, moderna e sem distrações.
            </p>
          </div>

          <div className="text-sm text-slate-500 font-medium">
            © 2026 Kanban Mix.
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10 min-h-screen">
          <div className="w-full max-w-md">
            {/* Mobile Header (Hidden on Desktop) */}
            <div className="flex lg:hidden flex-col items-center mb-10">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 mb-4">
                <LayoutDashboard className="w-7 h-7" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Kanban Mix</h1>
              <p className="text-slate-400 text-center text-sm">O fluxo perfeito para sua equipe</p>
            </div>

            <div className="bg-[#0f1115]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent rounded-[2rem] pointer-events-none" />

              <div className="relative mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {isResetting ? 'Redefinir Senha' : isLogin ? 'Bem-vindo de volta' : 'Comece agora mesmo'}
                </h2>
                <p className="text-slate-400 text-sm">
                  {isResetting 
                    ? 'Insira seu e-mail para receber um link de redefinição.' 
                    : isLogin ? 'Insira suas credenciais para acessar seu espaço.' : 'Crie sua conta para organizar seus projetos.'}
                </p>
              </div>

              {/* Login/Register Toggle */}
              {!isResetting && (
                <div className="flex bg-[#1a1d24] p-1 rounded-xl mb-8 relative z-10">
                  <button 
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${isLogin ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Entrar
                  </button>
                  <button 
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${!isLogin ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Criar Conta
                  </button>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-6 flex items-center">
                  {error}
                </div>
              )}
              {message && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm mb-6 flex items-center">
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                {!isLogin && !isResetting && (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                      <User className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#1a1d24] border border-transparent focus:border-indigo-500/50 rounded-xl pl-11 pr-4 py-3.5 text-sm text-slate-200 outline-none transition-all placeholder:text-slate-500 focus:bg-[#1a1d24]/50 focus:ring-4 focus:ring-indigo-500/10"
                      placeholder="Seu nome completo"
                    />
                  </div>
                )}
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#1a1d24] border border-transparent focus:border-indigo-500/50 rounded-xl pl-11 pr-4 py-3.5 text-sm text-slate-200 outline-none transition-all placeholder:text-slate-500 focus:bg-[#1a1d24]/50 focus:ring-4 focus:ring-indigo-500/10"
                    placeholder="seu@email.com"
                  />
                </div>

                {!isResetting && (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#1a1d24] border border-transparent focus:border-indigo-500/50 rounded-xl pl-11 pr-4 py-3.5 text-sm text-slate-200 outline-none transition-all placeholder:text-slate-500 focus:bg-[#1a1d24]/50 focus:ring-4 focus:ring-indigo-500/10"
                      placeholder="••••••••"
                    />
                  </div>
                )}
                
                {isLogin && !isResetting && (
                  <div className="flex justify-end">
                    <button 
                      type="button" 
                      onClick={() => { setIsResetting(true); setError(null); setMessage(null); }} 
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full group mt-6 relative flex justify-center py-3.5 px-4 text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-[#0f1115] disabled:opacity-50 disabled:cursor-not-allowed transition-all border-none"
                >
                  <span className="relative flex items-center gap-2">
                    {loading ? 'Processando...' : isResetting ? 'Enviar link de recuperação' : isLogin ? 'Acessar Plataforma' : 'Criar Minha Conta'}
                    {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                  </span>
                </button>
                
                {isResetting && (
                  <button
                    type="button"
                    onClick={() => { setIsResetting(false); setError(null); setMessage(null); }}
                    className="w-full mt-2 text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    Voltar para o login
                  </button>
                )}
              </form>

              {!isResetting && supabase && (
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-[#0f1115] text-slate-500">Ou continue com</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      type="button"
                      className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-white/10 rounded-xl text-sm font-semibold text-white bg-[#1a1d24] hover:bg-[#252830] focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Google
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

