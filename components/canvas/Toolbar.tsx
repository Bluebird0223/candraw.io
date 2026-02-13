'use client';

import { useState } from 'react';

interface ToolbarProps {
    onColorChange: (color: string) => void;
    onWidthChange: (width: number) => void;
    onClear: () => void;
    onShare: () => void;
}

const COLORS = [
    '#000000', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FF8800'
];

const WIDTHS = [2, 5, 10, 20];

export default function Toolbar({ onColorChange, onWidthChange, onClear, onShare }: ToolbarProps) {
    const [color, setColor] = useState(COLORS[0]);
    const [width, setWidth] = useState(WIDTHS[0]);

    const handleColorChange = (newColor: string) => {
        setColor(newColor);
        onColorChange(newColor);
    };

    const handleWidthChange = (newWidth: number) => {
        setWidth(newWidth);
        onWidthChange(newWidth);
    };

    return (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 flex gap-4 items-center z-20">
            {/* Colors */}
            <div className="flex gap-2">
                {COLORS.map((c) => (
                    <button
                        key={c}
                        onClick={() => handleColorChange(c)}
                        className={`w-8 h-8 rounded-full border-2 transition ${color === c ? 'border-blue-500 scale-110' : 'border-transparent hover:scale-105'
                            }`}
                        style={{ backgroundColor: c }}
                    />
                ))}
            </div>

            <div className="w-px h-8 bg-gray-300" />

            {/* Stroke widths */}
            <div className="flex gap-2 items-center">
                {WIDTHS.map((w) => (
                    <button
                        key={w}
                        onClick={() => handleWidthChange(w)}
                        className={`w-8 h-8 rounded flex items-center justify-center transition ${width === w ? 'bg-blue-100' : 'hover:bg-gray-100'
                            }`}
                    >
                        <div
                            className="bg-black rounded-full"
                            style={{ width: w, height: w }}
                        />
                    </button>
                ))}
            </div>

            <div className="w-px h-8 bg-gray-300" />

            {/* Clear button */}
            <button
                onClick={onClear}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
                Clear
            </button>

            {/* Share button */}
            <button
                onClick={onShare}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
                Share
            </button>
        </div>
    );
}