import { MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Avatar from './Avatar';
import EnhancedPostCardInteractions from './EnhancedPostCardInteractions';
import { cn } from '../../lib/cva';

interface Answer {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    like_count: number;
    reply_count: number;
    created_at: string;
    author: {
        id: string;
        name: string;
        username: string;
        avatar_url?: string;
        verified?: boolean;
    };
}

interface AnswerPreviewProps {
    answer: Answer;
    totalAnswers: number;
    postId: string;
}

export default function AnswerPreview({ answer, totalAnswers, postId }: AnswerPreviewProps) {
    const { isDark } = useTheme();
    const navigate = useNavigate();

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
        return date.toLocaleDateString();
    };

    const truncateContent = (content: string, maxLength: number = 100) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    };

    return (
        <div
            className={cn(
                'border-t pt-3 px-4 pb-2',
                isDark ? 'border-gray-800' : 'border-gray-200'
            )}
        >
            {/* Answer Preview */}
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/post/${postId}`);
                }}
                className={cn(
                    'flex gap-3 p-3 rounded-xl transition-colors cursor-pointer',
                    isDark ? 'hover:bg-gray-900/50' : 'hover:bg-gray-50'
                )}
            >
                <Avatar
                    src={answer.author.avatar_url}
                    alt={answer.author.name}
                    name={answer.author.name}
                    size="lg"
                    className="shrink-0"
                />

                <div className="flex-1 min-w-0">
                    {/* Author Info */}
                    <div className="flex items-center gap-1.5 mb-1">
                        <span className={cn('font-bold text-sm', isDark ? 'text-white' : 'text-black')}>
                            {answer.author.name}
                        </span>
                        {answer.author.verified && (
                            <svg className="w-4 h-4 text-blue-500 fill-current" viewBox="0 0 24 24">
                                <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .495.083.965.238 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                            </svg>
                        )}
                        <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                            @{answer.author.username}
                        </span>
                        <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>·</span>
                        <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                            {formatTimeAgo(answer.created_at)}
                        </span>
                    </div>

                    {/* Answer Content */}
                    <p className={cn('text-sm mb-2', isDark ? 'text-gray-300' : 'text-gray-700')}>
                        {truncateContent(answer.content)}
                    </p>

                    {/* Full Post Interactions */}
                    <EnhancedPostCardInteractions
                        postId={answer.id}
                        initialLikes={answer.like_count || 0}
                        initialRetweets={0}
                        initialReplies={answer.reply_count || 0}
                        isLiked={false}
                        isRetweeted={false}
                        onLike={() => {
                            // Handle like action
                        }}
                        onRetweet={() => {
                            // Handle retweet action
                        }}
                        onComment={() => navigate(`/post/${postId}`)}
                        onReply={() => navigate(`/post/${postId}/answers`)}
                    />
                </div>
            </div>

            {/* View All Answers Button */}
            {totalAnswers > 1 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/post/${postId}/answers`);
                    }}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 mt-2 rounded-full text-sm font-medium transition-colors w-full',
                        isDark
                            ? 'text-blue-400 hover:bg-blue-500/10'
                            : 'text-blue-600 hover:bg-blue-500/10'
                    )}
                >
                    <MoreVertical className="w-4 h-4 rotate-90" />
                    <span>View all {totalAnswers} answers</span>
                </button>
            )}
        </div>
    );
}
