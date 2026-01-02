/**
 * Feed component for displaying public notes with pagination
 */

import { useEffect } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { usePublicStore } from '../../stores/publicStore';
import { PublicNoteCard } from './PublicNoteCard';

interface PublicNotesFeedProps {
  userId?: string; // Optional: filter by specific user
  limit?: number;
}

export function PublicNotesFeed({ userId, limit = 20 }: PublicNotesFeedProps) {
  const { notes, isLoading, error, hasMore, loadPublicNotes, loadUserPublicNotes, reset } = usePublicStore();

  useEffect(() => {
    // Reset and load notes on mount or when userId changes
    reset();
    if (userId) {
      loadUserPublicNotes(userId, limit);
    } else {
      loadPublicNotes(limit);
    }
  }, [userId, limit]);

  const handleLoadMore = () => {
    const offset = notes.length;
    if (userId) {
      loadUserPublicNotes(userId, limit, offset);
    } else {
      loadPublicNotes(limit, offset);
    }
  };

  // Loading state (initial load)
  if (isLoading && notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-gray-600">Loading notes...</p>
      </div>
    );
  }

  // Error state
  if (error && notes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-2">Failed to load notes</div>
        <p className="text-gray-600 text-sm">{error}</p>
      </div>
    );
  }

  // Empty state
  if (notes.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-900 mb-2">
          {userId ? 'No Public Notes Yet' : 'No Notes to Display'}
        </h3>
        <p className="text-gray-600">
          {userId
            ? 'This user hasn\'t shared any public notes.'
            : 'Be the first to share your knowledge!'}
        </p>
      </div>
    );
  }

  // Notes feed
  return (
    <div className="space-y-4">
      {/* Notes grid */}
      <div className="grid gap-4">
        {notes.map((note) => (
          <PublicNoteCard key={note.id} note={note} />
        ))}
      </div>

      {/* Load more button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <span>Load More</span>
            )}
          </button>
        </div>
      )}

      {/* End of feed message */}
      {!hasMore && notes.length > 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          You've reached the end!
        </div>
      )}
    </div>
  );
}
