import { useState, useEffect } from 'react';

/**
 * Input angka dengan separator ribuan (tampilan: 10.000.000, value: 10000000)
 * Format Indonesia: titik sebagai pemisah ribuan
 */
export default function CurrencyInput({ value, onChange, className = '', ...props }) {
    const [display, setDisplay] = useState('');

    const formatNumber = (num) => {
        const raw = String(num ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '');
        if (!raw) return '';
        return BigInt(raw).toLocaleString('id-ID');
    };

    useEffect(() => {
        setDisplay(formatNumber(value));
    }, [value]);

    const handleChange = (e) => {
        const raw = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
        if (raw === '') {
            setDisplay('');
            onChange(0);
            return;
        }
        setDisplay(BigInt(raw).toLocaleString('id-ID'));
        onChange(Number(raw));
    };

    return (
        <input
            type="text"
            inputMode="numeric"
            className={className}
            value={display}
            onChange={handleChange}
            {...props}
        />
    );
}
