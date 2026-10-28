import React, { forwardRef } from 'react';
import { format } from "date-fns";
import { useTranslation } from 'react-i18next';
import { HOLDING_PRO_LOGO_BASE64 } from '@/assets/holdingProLogo';
import { resolveStoreBrandVariant, StoreBrandVariant } from './InvoiceA4Template';

export interface InvoiceData {
    id: string;
    invoice_number?: string;
    order_ref?: string;
    storeName: string;
    storeAddress?: string;
    storePhone?: string;
    workerName?: string;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    created_at: string;
    items: any[];
    total_price: number;
    subtotal?: number;
    amount_paid?: number;
    change?: number;
    type: 'detail' | 'gros' | 'proforma';
    paymentMethod?: string;
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, { data: InvoiceData }>(({ data }, ref) => {
    const isProforma = data.type === 'proforma';
    const isCredit = data.paymentMethod === 'credit';
    const { t } = useTranslation();
    const variant: StoreBrandVariant = resolveStoreBrandVariant(data);

    const formattedDate = (() => {
        try {
            return format(new Date(data.created_at || Date.now()), 'dd/MM/yyyy HH:mm');
        } catch {
            return new Date().toLocaleString('fr-FR');
        }
    })();

    const calculatedSubtotal = data.subtotal ?? data.items?.reduce((sum: number, item: any) => {
        const qty = Number(item.quantity ?? item.qty ?? 1);
        const price = Number(item.unit_price ?? item.price ?? item.product?.unit_price ?? 0);
        const packSize = Number(item.product?.quantity_per_box ?? item.conditionnement ?? 1);
        const isBox = Boolean(item.isBox);
        const multiplier = isBox ? packSize : 1;
        return sum + (qty * price * multiplier);
    }, 0) ?? data.total_price;

    const netTotal = Number(data.total_price || 0);
    const amountPaid = data.amount_paid !== undefined ? Number(data.amount_paid) : netTotal;
    const changeAmount = data.change !== undefined ? Number(data.change) : Math.max(0, amountPaid - netTotal);

    const paymentLabel = (() => {
        if (!data.paymentMethod) return 'ESPÈCES';
        const m = data.paymentMethod.toLowerCase();
        if (m === 'cash' || m === 'especes' || m === 'espèces') return 'ESPÈCES';
        if (m === 'credit' || m === 'crédit') return 'CRÉDIT';
        if (m === 'orange_money' || m === 'om') return 'ORANGE MONEY';
        if (m === 'wave') return 'WAVE';
        if (m === 'cheque' || m === 'chèque') return 'CHÈQUE';
        if (m === 'virement') return 'VIREMENT';
        return data.paymentMethod.toUpperCase();
    })();

    return (
        <div
            ref={ref}
            className="bg-white text-black font-sans hidden print:block mx-auto text-left"
            style={{
                width: '74mm',
                maxWidth: '74mm',
                margin: '0 auto',
                padding: '3mm 2mm 8mm 2mm',
                boxSizing: 'border-box',
                fontSize: '11px',
                lineHeight: 1.25,
                color: '#000',
                backgroundColor: '#fff',
            }}
        >
            <style>{`
                @media print {
                    @page {
                        size: 80mm auto;
                        margin: 0;
                    }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #fff !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>

            {/* BRANDING HEADER 1: HOLDING PRO (NIAMANA DUBAÏ) */}
            {variant === 'holdingpro' && (
                <div className="text-center mb-1">
                    <div className="flex justify-center mb-1">
                        <img
                            src={HOLDING_PRO_LOGO_BASE64}
                            alt="Holding Pro Logo"
                            className="h-14 w-14 object-contain mx-auto rounded-full"
                        />
                    </div>
                    <h1 className="text-base font-black tracking-wider uppercase text-black leading-tight">
                        HOLDING PRO
                    </h1>
                    <p className="text-[11px] font-bold uppercase text-black tracking-wide">
                        SUCCURSALE NIAMANA DUBAÏ
                    </p>
                    <p className="text-[10px] font-black uppercase text-[#dc2626] tracking-wider my-0.5">
                        TOUJOURS CLIENT SATISFAIT
                    </p>
                    <p className="text-[10px] font-bold text-black mt-0.5">
                        Tél: 79 34 60 73 / 70 68 21 00 / 71 06 65 75
                    </p>
                    <p className="text-[9px] text-gray-700">
                        {data.storeAddress || 'Niamana Dubaï, en face station Shell'}
                    </p>
                </div>
            )}

            {/* BRANDING HEADER 2: STIHL NIAMAKORO */}
            {variant === 'stihl_niamakoro' && (
                <div className="text-center mb-1">
                    <div className="flex justify-center mb-1">
                        <img
                            src="/quincaillerie-logo.jpg"
                            alt="Quincaillerie Logo"
                            className="h-14 w-14 object-contain mx-auto rounded"
                        />
                    </div>
                    <span className="inline-block bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded mb-0.5">
                        ETS Madjou Sylla
                    </span>
                    <h1 className="text-sm font-black tracking-wider uppercase text-black leading-tight">
                        QUINCAILLERIE DE LA PAIX
                    </h1>
                    <p className="text-[9px] font-bold text-gray-700 uppercase">
                        Vente tronçonneuses, disques, meules
                    </p>
                    <p className="text-[10px] font-bold text-black mt-0.5">
                        Tél: 77 77 90 60 / 20 22 26 45 / 79 45 49 46
                    </p>
                    <p className="text-[9px] text-gray-700">
                        {data.storeAddress || 'Niamakoro près de SONEF, Bamako'}
                    </p>
                </div>
            )}

            {/* BRANDING HEADER 3: STIHL DIBIDANI */}
            {variant === 'stihl_dibidani' && (
                <div className="text-center mb-1">
                    <div className="flex justify-center mb-1">
                        <img
                            src="/quincaillerie-logo.jpg"
                            alt="Quincaillerie Logo"
                            className="h-14 w-14 object-contain mx-auto rounded"
                        />
                    </div>
                    <span className="inline-block bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded mb-0.5">
                        ETS Madjou Sylla
                    </span>
                    <h1 className="text-sm font-black tracking-wider uppercase text-black leading-tight">
                        QUINCAILLERIE DE LA PAIX
                    </h1>
                    <p className="text-[9px] font-bold text-gray-700 uppercase">
                        Vente tronçonneuses, disques, meules
                    </p>
                    <p className="text-[10px] font-bold text-black mt-0.5">
                        Tél: 77 77 90 60 / 20 22 26 45 / 79 45 49 46
                    </p>
                    <p className="text-[9px] text-gray-700">
                        {data.storeAddress || 'Dibidani, Face centre Djoliba, BP 2844, Bamako'}
                    </p>
                </div>
            )}

            {/* BRANDING HEADER 4: GENERIC / OTHER STORE */}
            {variant === 'generic' && (
                <div className="text-center mb-1">
                    <div className="flex justify-center mb-1">
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="h-12 w-12 object-contain mx-auto rounded"
                        />
                    </div>
                    <h1 className="text-sm font-black tracking-wider uppercase text-black leading-tight">
                        {data.storeName || 'MON MAGASIN'}
                    </h1>
                    {data.storePhone && (
                        <p className="text-[10px] font-bold text-black mt-0.5">
                            Tél: {data.storePhone}
                        </p>
                    )}
                    {data.storeAddress && (
                        <p className="text-[9px] text-gray-700">
                            {data.storeAddress}
                        </p>
                    )}
                </div>
            )}

            {/* Dashed Separator */}
            <div className="border-b border-dashed border-black my-1.5" />

            {/* Centered Document Badge */}
            <div className="text-center mb-1.5">
                <span className="inline-block font-black text-[11px] uppercase tracking-wider border border-black px-3 py-0.5 rounded">
                    {isProforma
                        ? t('invoice.proforma', 'DEVIS / PROFORMA')
                        : (isCredit
                            ? 'FACTURE À CRÉDIT'
                            : t('invoice.cashReceipt', 'TICKET DE CAISSE'))}
                </span>
            </div>

            {/* Meta Info */}
            <div className="space-y-0.5 mb-1.5 text-[10px]">
                <div className="flex justify-between">
                    <span className="font-bold">Ticket N°:</span>
                    <span className="font-mono font-bold">{data.invoice_number || data.id.slice(0, 8)}</span>
                </div>
                {data.order_ref && (
                    <div className="flex justify-between">
                        <span className="font-bold">Réf. Cmd:</span>
                        <span className="font-mono">{data.order_ref}</span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span className="font-bold">Date:</span>
                    <span>{formattedDate}</span>
                </div>
                {data.workerName && (
                    <div className="flex justify-between">
                        <span className="font-bold">Caissier:</span>
                        <span className="uppercase">{data.workerName}</span>
                    </div>
                )}
                {(data.customerName || data.customerPhone) && (
                    <div className="flex justify-between pt-0.5 border-t border-dotted border-gray-400">
                        <span className="font-bold">Client:</span>
                        <span className="font-bold uppercase truncate max-w-[150px]">
                            {data.customerName || 'Client'}
                            {data.customerPhone ? ` (${data.customerPhone})` : ''}
                        </span>
                    </div>
                )}
            </div>

            {/* Dashed Separator */}
            <div className="border-b border-dashed border-black my-1.5" />

            {/* Items Header */}
            <div className="grid grid-cols-[1fr_26px_40px_48px] text-[10px] font-black uppercase pb-0.5 border-b border-black">
                <span>Désignation</span>
                <span className="text-center">Qté</span>
                <span className="text-right">P.U</span>
                <span className="text-right">Total</span>
            </div>

            {/* Items List */}
            <div className="py-1 space-y-1">
                {data.items?.map((item, idx) => {
                    const name = item.product?.name || item.name || 'Article';
                    const qty = Number(item.quantity ?? item.qty ?? 1);
                    const price = Number(item.unit_price ?? item.price ?? item.product?.unit_price ?? 0);
                    const packSize = Number(item.product?.quantity_per_box ?? item.conditionnement ?? 1);
                    const isBox = Boolean(item.isBox);
                    const multiplier = isBox ? packSize : 1;
                    const lineTotal = Number(item.lineTotal ?? item.total ?? (qty * price * multiplier));

                    return (
                        <div key={idx} className="text-[10px] leading-tight">
                            <div className="font-bold text-black uppercase break-words">
                                {name}
                                {item.discount > 0 && (
                                    <span className="text-[#dc2626] font-black text-[9px] ml-1">
                                        (-{item.discount}%)
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-[1fr_26px_40px_48px] text-gray-900 mt-0.5 font-mono">
                                <span className="text-[9px] text-gray-500 font-sans">
                                    {isBox ? `Carton ×${packSize}` : 'Pièce'}
                                </span>
                                <span className="text-center font-bold text-black">{qty}</span>
                                <span className="text-right text-gray-700">{price.toLocaleString('fr-FR')}</span>
                                <span className="text-right font-black text-black">{lineTotal.toLocaleString('fr-FR')}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Dashed Separator */}
            <div className="border-b-2 border-black my-1.5" />

            {/* Totals Section */}
            <div className="space-y-0.5 text-[10px]">
                {calculatedSubtotal !== netTotal && (
                    <div className="flex justify-between text-gray-700">
                        <span>Sous-total:</span>
                        <span className="font-mono">{calculatedSubtotal.toLocaleString('fr-FR')} F</span>
                    </div>
                )}

                <div className="flex justify-between text-xs font-black pt-0.5">
                    <span className="uppercase">TOTAL NET:</span>
                    <span className="font-mono text-sm tracking-tight">{netTotal.toLocaleString('fr-FR')} FCFA</span>
                </div>

                {!isProforma && (
                    <>
                        <div className="flex justify-between text-[10px] text-gray-800 pt-0.5">
                            <span>Mode règlement:</span>
                            <span className="font-black uppercase">{paymentLabel}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-800">
                            <span>Montant reçu:</span>
                            <span className="font-mono font-bold">{amountPaid.toLocaleString('fr-FR')} F</span>
                        </div>
                        {changeAmount > 0 && (
                            <div className="flex justify-between text-[10px] font-bold text-[#dc2626]">
                                <span>Monnaie rendue:</span>
                                <span className="font-mono font-black">{changeAmount.toLocaleString('fr-FR')} F</span>
                            </div>
                        )}
                        {isCredit && (
                            <div className="flex justify-between text-[10px] font-bold text-[#dc2626]">
                                <span>Reste à payer:</span>
                                <span className="font-mono font-black">{Math.max(0, netTotal - amountPaid).toLocaleString('fr-FR')} F</span>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Dashed Separator */}
            <div className="border-b border-dashed border-black my-2" />

            {/* Footer Notice */}
            <div className="text-center text-[9px] text-gray-700 space-y-0.5">
                {isProforma ? (
                    <p className="font-bold uppercase text-black">
                        Ce devis est valable 15 jours
                    </p>
                ) : (
                    <>
                        <p className="font-black uppercase text-black">
                            Les marchandises vendues ne sont ni reprises ni échangées.
                        </p>
                        <p className="font-bold text-black mt-0.5">
                            MERCI DE VOTRE CONFIANCE !
                        </p>
                    </>
                )}
                <div className="pt-1 mt-1 border-t border-dotted border-gray-400 flex justify-center items-center gap-1 text-[8px] text-gray-500 uppercase tracking-wider font-mono">
                    <span>Propulsé par JATE</span>
                </div>
            </div>
        </div>
    );
});

InvoiceTemplate.displayName = "InvoiceTemplate";
