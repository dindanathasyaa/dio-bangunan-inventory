import React from 'react';

const CurrencyInput = ({ value, onChange, ...props }) => {
    // Format the value to have dot separators
    const formatValue = (val) => {
        if (val === null || val === undefined || val === '') return '';
        const num = Number(val);
        if (isNaN(num)) return '';
        return num.toLocaleString('id-ID');
    };

    const handleChange = (e) => {
        // Remove all non-digit characters
        const rawValue = e.target.value.replace(/\D/g, '');
        onChange({ target: { value: rawValue } });
    };

    return (
        <input
            type="text"
            value={formatValue(value)}
            onChange={handleChange}
            {...props}
        />
    );
};

export default CurrencyInput;
