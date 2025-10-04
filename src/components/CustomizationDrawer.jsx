import React, { useState, useEffect } from 'react';
import { X, Save, Settings, Eye, EyeOff } from 'lucide-react';

const CustomizationDrawer = ({ isOpen, onClose, onSave, config, initialSettings, title }) => {
    const [localSettings, setLocalSettings] = useState(initialSettings);

    useEffect(() => {
        if (isOpen) {
            setLocalSettings(initialSettings);
        }
    }, [isOpen, initialSettings]);

    const handleToggle = (id) => {
        const newSettings = { ...localSettings, [id]: !localSettings[id] };
        // Logic for master toggles
        if (id === 'trezo_toolbar') {
            const masterState = newSettings[id];
            newSettings.trezo_toolbar_temporal = masterState;
            newSettings.trezo_toolbar_viewmode = masterState;
            newSettings.trezo_toolbar_new_entry = masterState;
        } else if (id === 'trezo_quick_filters') {
            const masterState = newSettings[id];
            newSettings.trezo_quickfilter_provisions = masterState;
            newSettings.trezo_quickfilter_savings = masterState;
            newSettings.trezo_quickfilter_borrowings = masterState;
            newSettings.trezo_quickfilter_lendings = masterState;
        }
        setLocalSettings(newSettings);
    };
    
    const handleToggleAll = (visible) => {
        const newSettings = {};
        config.forEach(widget => {
            if (widget.id) {
                newSettings[widget.id] = visible;
            }
        });
        setLocalSettings(newSettings);
    };

    const handleSaveClick = () => {
        onSave(localSettings);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className={`fixed inset-0 bg-black z-40 transition-opacity ${isOpen ? 'bg-opacity-60' : 'bg-opacity-0 pointer-events-none'}`} onClick={onClose}></div>
            <div className={`fixed top-0 right-0 bottom-0 w-full max-w-md bg-gray-50 shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 border-b bg-white">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-blue-600" />
                            {title}
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex-grow p-6 overflow-y-auto">
                        <div className="flex justify-end gap-2 mb-4">
                            <button onClick={() => handleToggleAll(true)} className="text-xs font-semibold flex items-center gap-1 text-blue-600 hover:underline"><Eye size={14} /> Tout afficher</button>
                            <button onClick={() => handleToggleAll(false)} className="text-xs font-semibold flex items-center gap-1 text-gray-500 hover:underline"><EyeOff size={14} /> Tout masquer</button>
                        </div>
                        <ul className="space-y-2">
                            {config.map((widget, index) => {
                                if (widget.type === 'group') {
                                    return <li key={`group-${index}`} className="pt-4 pb-1 px-3 text-sm font-bold text-gray-500">{widget.label}</li>;
                                }
                                if (widget.type === 'divider') {
                                    return <li key={`divider-${index}`} className="pt-4"><hr /></li>;
                                }
                                return (
                                    <li key={widget.id} className={`flex items-center justify-between p-3 rounded-lg hover:bg-white ${widget.indent ? 'ml-4' : ''}`}>
                                        <span className={`font-medium ${widget.indent ? 'text-gray-600' : 'text-gray-800'}`}>{widget.label}</span>
                                        <label htmlFor={widget.id} className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                id={widget.id}
                                                checked={!!localSettings[widget.id]}
                                                onChange={() => handleToggle(widget.id)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <div className="flex justify-end gap-3 p-4 border-t bg-white">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveClick}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" /> Enregistrer
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CustomizationDrawer;
