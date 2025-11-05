import React, { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';

const SupportButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('support_messages')
        .insert({
          user_id: user.id,
          sender: 'user',
          message: message.trim()
        });

      if (error) throw error;

      setSuccess(true);
      setMessage('');
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
      }, 2000);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110"
        aria-label="Fale com suporte"
      >
        <MessageCircle size={24} />
      </button>

      {/* Support Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-800 rounded-xl shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-700">
              <div className="flex items-center gap-2">
                <MessageCircle className="text-brand-primary" size={20} />
                <h3 className="text-lg font-semibold text-white">Suporte</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {success ? (
                <div className="text-center py-8">
                  <div className="text-green-500 text-lg font-semibold mb-2">
                    ✓ Mensagem enviada!
                  </div>
                  <p className="text-neutral-400 text-sm">
                    Retornaremos em breve.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Como podemos ajudar?
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      rows={5}
                      required
                      className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !message.trim()}
                    className="w-full py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      'Enviando...'
                    ) : (
                      <>
                        <Send size={18} />
                        Enviar mensagem
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SupportButton;
