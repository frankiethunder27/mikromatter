interface HashtagContentProps {
  content: string;
  onHashtagClick?: (hashtag: string) => void;
}

export function HashtagContent({ content, onHashtagClick }: HashtagContentProps) {
  const parseContentWithHashtags = () => {
    const hashtagRegex = /(#\w+)/g;
    const parts = content.split(hashtagRegex);
    
    return parts.map((part, index) => {
      if (part.match(hashtagRegex)) {
        const hashtag = part.slice(1);
        return (
          <a
            key={index}
            href={`/hashtag/${hashtag.toLowerCase()}`}
            className="text-primary hover:underline font-semibold"
            onClick={(e) => {
              if (onHashtagClick) {
                e.preventDefault();
                onHashtagClick(hashtag.toLowerCase());
              }
            }}
            data-testid={`hashtag-${hashtag.toLowerCase()}`}
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return <span className="whitespace-pre-wrap break-words">{parseContentWithHashtags()}</span>;
}
