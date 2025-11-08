import { Link } from 'react-router-dom';

const StreamCard = ({ stream }) => {
  return (
    <div className="card group hover:shadow-2xl">
      {/* Thumbnail */}
      <div className="relative h-48 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg mb-4 overflow-hidden">
        {stream.is_live && (
          <div className="absolute top-2 left-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center">
            <span className="animate-pulse mr-2">●</span>
            LIVE
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-16 h-16 text-white opacity-50 group-hover:opacity-100 transition-opacity"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
        </div>
      </div>

      {/* Stream Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-400 uppercase">
            {stream.sport}
          </span>
          {stream.start_time && (
            <span className="text-xs text-gray-400">
              {new Date(stream.start_time).toLocaleDateString()}
            </span>
          )}
        </div>
        
        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
          {stream.title}
        </h3>
        
        {stream.summary && (
          <p className="text-sm text-gray-400 line-clamp-2">
            {stream.summary}
          </p>
        )}

        <Link
          to={`/stream/${stream.id}`}
          className="btn-primary w-full mt-4 inline-block text-center"
        >
          Watch Now
        </Link>
      </div>
    </div>
  );
};

export default StreamCard;
