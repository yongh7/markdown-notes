/**
 * ABC Notation renderer for musical notation
 * Renders ABC notation as sheet music
 */

import { useEffect, useRef } from 'react';
import abcjs from 'abcjs';

interface AbcNotationProps {
  notation: string;
}

export function AbcNotation({ notation }: AbcNotationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && notation) {
      // Clear previous render
      containerRef.current.innerHTML = '';

      try {
        // Render ABC notation as sheet music
        abcjs.renderAbc(containerRef.current, notation, {
          responsive: 'resize',
          staffwidth: 740,
          scale: 1.0,
          add_classes: true,
        });
      } catch (error) {
        console.error('Failed to render ABC notation:', error);
        containerRef.current.innerHTML = `
          <div class="text-red-600 p-4 border border-red-300 rounded bg-red-50">
            <strong>Error rendering music notation:</strong>
            <pre class="mt-2 text-sm">${error}</pre>
          </div>
        `;
      }
    }
  }, [notation]);

  return (
    <div className="my-6 p-4 bg-white border border-gray-300 rounded-lg overflow-x-auto">
      <div ref={containerRef} className="abc-notation" />
    </div>
  );
}
