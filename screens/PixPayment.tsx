
import React, { useState, useMemo } from 'react';
import { useCredits } from '../hooks/useCredits';
import { TransactionType } from '../types';
import Notification from '../components/Notification';

const PIX_CONVERSION_RATE = 10; // 1 BRL = 10 Credits

const PixPayment: React.FC = () => {
    const [amountBRL, setAmountBRL] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [paymentData, setPaymentData] = useState<{ qrCodeBase64: string; copyPasteCode: string; paymentId: number } | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [copyButtonText, setCopyButtonText] = useState('Copiar');
    const { balance, addCredits, currentUser } = useCredits();

    const creditsToReceive = useMemo(() => {
        const amount = parseFloat(amountBRL);
        return isNaN(amount) ? 0 : Math.floor(amount * PIX_CONVERSION_RATE);
    }, [amountBRL]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9.]/g, '');
        setAmountBRL(value);
    };

    const handleGeneratePix = async (e: React.FormEvent) => {
        e.preventDefault();
        const transactionAmount = parseFloat(amountBRL);
        if (isNaN(transactionAmount) || transactionAmount < 1) {
            setNotification({ message: 'Por favor, insira um valor válido de no mínimo R$ 1,00.', type: 'error' });
            setTimeout(() => setNotification(null), 3000);
            return;
        }

        if (!currentUser) {
            setNotification({ message: 'Você precisa estar logado para realizar a compra.', type: 'error' });
            setTimeout(() => setNotification(null), 3000);
            return;
        }

        setIsLoading(true);
        setPaymentData(null);
        setNotification(null);
        
        try {
            const response = await fetch('https://cpggicxvmgyljvoxlpnu.supabase.co/functions/v1/create-pix-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: transactionAmount,
                    credits: creditsToReceive,
                    userId: currentUser.id,
                }),
            });

            if (!response.ok) {
                throw new Error('Erro ao gerar código PIX');
            }

            const data = await response.json();
            
            if (data.success) {
                setPaymentData({
                    qrCodeBase64: data.qrCodeBase64,
                    copyPasteCode: data.qrCode,
                    paymentId: data.paymentId,
                });
            } else {
                throw new Error('Falha ao gerar pagamento PIX');
            }
        } catch (error) {
            console.error('Erro ao gerar PIX:', error);
            setNotification({ message: 'Erro ao gerar código PIX. Tente novamente.', type: 'error' });
            setTimeout(() => setNotification(null), 3000);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCheckStatus = async () => {
        if (!paymentData) return;

        setIsLoading(true);
        setNotification(null);

        // --- MOCK STATUS CHECK ---
        setTimeout(() => {
            const amountPaid = parseFloat(amountBRL);
            const creditsToAdd = Math.floor(amountPaid * PIX_CONVERSION_RATE);
            
            addCredits(creditsToAdd, `Recarga via PIX de R$ ${amountPaid.toFixed(2)}`, TransactionType.CREDIT_PURCHASE);
            
            setNotification({ message: '✅ Pagamento confirmado! Créditos adicionados.', type: 'success' });
            setPaymentData(null);
            setAmountBRL('');
            setIsLoading(false);
        }, 1000);
    };

    const handleCopy = () => {
        if (paymentData) {
            navigator.clipboard.writeText(paymentData.copyPasteCode);
            setCopyButtonText('Copiado!');
            setTimeout(() => setCopyButtonText('Copiar'), 2000);
        }
    };

    return (
    <div className="max-w-md mx-auto text-white">
        {notification && <Notification message={notification.message} type={notification.type} />}
        
        <h1 className="text-3xl font-bold mb-2">Recarga de Créditos via PIX</h1>
        <p className="text-neutral-400 mb-6">Seu saldo atual: <span className="font-bold text-accent-green">{balance.toLocaleString('en-US')}</span> créditos</p>
        
        <div className="bg-neutral-800 p-6 rounded-lg shadow-lg">
            <form onSubmit={handleGeneratePix}>
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-neutral-300">Valor a ser Cobrado (BRL)</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-neutral-400 sm:text-sm">R$</span>
                        </div>
                        <input 
                            type="text" 
                            name="amount" 
                            id="amount"
                            value={amountBRL}
                            onChange={handleAmountChange}
                            className="focus:ring-brand-primary focus:border-brand-primary block w-full pl-8 pr-12 sm:text-sm border-neutral-600 bg-neutral-700 rounded-md py-2 px-3 text-white" 
                            placeholder="3.00"
                            aria-describedby="price-currency"
                        />
                    </div>
                </div>

                {creditsToReceive > 0 && (
                    <p className="text-center font-bold text-lg text-accent-green my-4">
                        {creditsToReceive.toLocaleString('en-US')} Créditos
                    </p>
                )}

                <button 
                    type="submit"
                    disabled={isLoading || parseFloat(amountBRL) < 1}
                    className="w-full mt-4 flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-accent-green hover:bg-green-600 disabled:bg-neutral-600 disabled:cursor-not-allowed"
                >
                    {isLoading && !paymentData ? 'Gerando...' : 'Gerar Código PIX'}
                </button>
            </form>
        </div>

        {isLoading && !paymentData && (
             <div className="text-center py-10">
                <svg className="animate-spin mx-auto h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        )}

        {paymentData && (
            <div className="mt-6 animate-fade-in-down">
                <div className="bg-white p-6 rounded-lg shadow-lg text-black text-center">
                    <h2 className="text-xl font-bold mb-4">Escaneie o QR Code</h2>
                    <img 
                        src={`data:image/jpeg;base64,${paymentData.qrCodeBase64}`} 
                        alt="PIX QR Code"
                        className="mx-auto w-56 h-56 border border-neutral-300 rounded-md shadow-md"
                    />
                </div>

                <div className="mt-4">
                    <label htmlFor="pix-copy" className="block text-sm font-medium text-neutral-300">Código PIX Copia e Cola</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <input 
                            id="pix-copy"
                            type="text"
                            readOnly
                            value={paymentData.copyPasteCode}
                            className="flex-1 block w-full min-w-0 rounded-none rounded-l-md sm:text-sm border-neutral-600 bg-neutral-700 text-neutral-300 p-2"
                        />
                        <button
                            onClick={handleCopy}
                            className="inline-flex items-center px-4 py-2 border border-l-0 border-neutral-600 rounded-r-md bg-neutral-800 text-sm font-medium text-white hover:bg-neutral-600"
                        >
                            {copyButtonText}
                        </button>
                    </div>
                </div>

                <div className="mt-6 text-center text-sm text-neutral-400">
                    <p>Após o pagamento, seus créditos serão adicionados automaticamente.</p>
                    <p>Se demorar, clique no botão abaixo.</p>
                </div>
                 <button 
                    onClick={handleCheckStatus}
                    disabled={isLoading}
                    className="w-full mt-4 flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-brand-primary hover:bg-brand-primary/90 disabled:bg-neutral-600 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Verificando...' : 'Verificar Status do Pagamento'}
                </button>
            </div>
        )}
    </div>
);
};

export default PixPayment;