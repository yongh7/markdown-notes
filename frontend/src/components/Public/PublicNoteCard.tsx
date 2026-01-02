/**
 * Card component for displaying a single public note in the feed
 */

import { Link } from 'react-router-dom';
import { User, Calendar, FileText } from 'lucide-react';
import { PublicNote } from '../../stores/publicStore';

interface PublicNoteCardProps {
  note: PublicNote;
}

export function PublicNoteCard({ note }: PublicNoteCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200">
      {/* Note Title */}
      <Link
        to={`/note/${note.id}`}
        className="block mb-3"
      >
        <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors flex items-start gap-2">
          <FileText className="w-5 h-5 mt-1 flex-shrink-0 text-blue-600" />
          <span>{note.title}</span>
        </h3>
      </Link>

      {/* Preview */}
      {note.preview && (
        <p className="text-gray-600 mb-4 line-clamp-3">
          {note.preview}
        </p>
      )}

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
        {/* Author */}
        <Link
          to={`/profile/${note.user_id}`}
          className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
        >
          <User className="w-4 h-4" />
          <span>{note.username}</span>
        </Link>

        {/* Date */}
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(note.created_at)}</span>
        </div>
      </div>
    </div>
  );
}
