import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCredits } from '../hooks/useCredits';
import { z } from 'zod';

const emailSchema = z.string().email('Email inválido').trim();
const passwordSchema = z.string().min(6, 'A senha deve ter no mínimo 6 caracteres');

const Login: React.FC = () => {
  const { signIn, signUp, resetPassword, user, session } = useAuth();
  const { login: contextLogin, allUsers } = useCredits();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showForgotEmail, setShowForgotEmail] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Auto-login when authenticated
  useEffect(() => {
    if (user && session) {
      // Find or create user in context
      let contextUser = allUsers.find(u => u.id === user.id);
      
      if (!contextUser) {
        // Create new user in context with Supabase user data
        contextUser = {
          id: user.id,
          name: user.email?.split('@')[0] || 'Usuário',
          avatarUrl: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
          email: user.email || '',
          role: 'user' as const,
          following: [],
          followers: 0,
          vitrineSlug: user.email?.split('@')[0] || user.id,
        };
      }
      
      contextLogin(contextUser.id);
    }
  }, [user, session, allUsers, contextLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      emailSchema.parse(email);
      
      if (showForgotPassword) {
        const { error } = await resetPassword(email);
        if (error) throw error;
        setSuccessMessage('Link de recuperação enviado! Verifique seu email.');
        setShowForgotPassword(false);
        setEmail('');
      } else if (showForgotEmail) {
        // For forgot email, we'll show a message to contact support
        setSuccessMessage('Para recuperar seu email, entre em contato com o suporte.');
        setShowForgotEmail(false);
      } else if (activeTab === 'login') {
        passwordSchema.parse(password);
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Email ou senha incorretos');
          } else if (error.message.includes('Email not confirmed')) {
            throw new Error('Por favor, confirme seu email antes de fazer login');
          }
          throw error;
        }
      } else {
        passwordSchema.parse(password);
        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem');
        }
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('User already registered')) {
            throw new Error('Este email já está cadastrado');
          }
          throw error;
        }
        setSuccessMessage('Cadastro realizado! Verifique seu email para confirmar sua conta antes de fazer login.');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setActiveTab('login');
      }
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setError(err.issues?.[0]?.message || 'Erro de validação');
      } else {
        setError(err.message || 'Ocorreu um erro. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 p-4">
        <div className="w-full max-w-md">
            <div className="p-8 space-y-6 bg-neutral-800 rounded-xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white tracking-wider">
                        FUN<span className="text-brand-primary">FANS</span>
                    </h1>
                    <p className="mt-2 text-neutral-400">
                        {showForgotPassword ? 'Recuperar senha' : showForgotEmail ? 'Recuperar email' : 'Your exclusive content hub.'}
                    </p>
                </div>
                
                {!showForgotPassword && !showForgotEmail && (
                    <div className="flex border-b border-neutral-700">
                        <button 
                            onClick={() => {
                                setActiveTab('login');
                                setError('');
                                setSuccessMessage('');
                            }}
                            className={`w-1/2 py-3 font-semibold text-center transition-colors ${activeTab === 'login' ? 'text-white border-b-2 border-brand-primary' : 'text-neutral-400 hover:text-white'}`}
                        >
                            Login
                        </button>
                        <button 
                            onClick={() => {
                                setActiveTab('register');
                                setError('');
                                setSuccessMessage('');
                            }}
                            className={`w-1/2 py-3 font-semibold text-center transition-colors ${activeTab === 'register' ? 'text-white border-b-2 border-brand-primary' : 'text-neutral-400 hover:text-white'}`}
                        >
                            Cadastrar
                        </button>
                    </div>
                )}

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-500 text-sm">
                        {successMessage}
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                    {!showForgotEmail && (
                        <div>
                            <label className="text-sm font-medium text-neutral-300" htmlFor="email">Email</label>
                            <input 
                                id="email" 
                                type="email" 
                                placeholder="voce@exemplo.com" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                                className="w-full mt-1 px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-primary" 
                            />
                        </div>
                    )}
                    
                    {!showForgotPassword && !showForgotEmail && (
                        <>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-sm font-medium text-neutral-300" htmlFor="password">Senha</label>
                                    {activeTab === 'login' && (
                                        <div className="flex gap-3">
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    setShowForgotEmail(true);
                                                    setShowForgotPassword(false);
                                                    setError('');
                                                    setSuccessMessage('');
                                                }}
                                                className="text-xs text-neutral-400 hover:text-brand-light flex items-center gap-1"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                                                Esqueceu o email?
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    setShowForgotPassword(true);
                                                    setShowForgotEmail(false);
                                                    setError('');
                                                    setSuccessMessage('');
                                                }}
                                                className="text-xs text-neutral-400 hover:text-brand-light flex items-center gap-1"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                                Esqueceu a senha?
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <input 
                                    id="password" 
                                    type="password" 
                                    placeholder="••••••••" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required 
                                    className="w-full mt-1 px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-primary" 
                                />
                            </div>

                            {activeTab === 'register' && (
                                <div>
                                    <label className="text-sm font-medium text-neutral-300" htmlFor="confirmPassword">Confirmar Senha</label>
                                    <input 
                                        id="confirmPassword" 
                                        type="password" 
                                        placeholder="••••••••" 
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required 
                                        className="w-full mt-1 px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-primary" 
                                    />
                                </div>
                            )}
                        </>
                    )}

                    {!showForgotEmail && (
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-3 font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Carregando...' : showForgotPassword ? 'Enviar Link de Recuperação' : activeTab === 'login' ? 'Entrar' : 'Criar Conta'}
                        </button>
                    )}

                    {(showForgotPassword || showForgotEmail) && (
                        <button 
                            type="button"
                            onClick={() => {
                                setShowForgotPassword(false);
                                setShowForgotEmail(false);
                                setError('');
                                setSuccessMessage('');
                            }}
                            className="w-full text-sm text-neutral-400 hover:text-white"
                        >
                            Voltar ao login
                        </button>
                    )}
                </form>
            </div>
        </div>
    </div>
  );
};

export default Login;
