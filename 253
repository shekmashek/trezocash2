import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const criticalityConfig = {
    critical: { label: 'Critique', color: 'bg-red-500', emoji: '🟥' },
    essential: { label: 'Essentiel', color: 'bg-yellow-500', emoji: '🟨' },
    discretionary: { label: 'Discrétionnaire', color: 'bg-blue-500', emoji: '🟦' },
};

const CriticalityPicker = ({ value, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const pickerRef = useRef(null);
    const currentConfig = criticalityConfig[value] || criticalityConfig.essential;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={pickerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-6 h-6 rounded-md flex items-center justify-center transition-transform hover:scale-110"
                title={`Criticité: ${currentConfig.label}`}
            >
                <div className={`w-3 h-3 rounded-sm ${currentConfig.color}`}></div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-20"
                    >
                        <ul className="p-1">
                            {Object.entries(criticalityConfig).map(([key, config]) => (
                                <li key={key}>
                                    <button
                                        onClick={() => {
                                            onSelect(key);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-1.5 text-sm rounded-md flex items-center gap-2 ${value === key ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-100'}`}
                                    >
                                        <span className="text-lg">{config.emoji}</span>
                                        <span>{config.label}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CriticalityPicker;
