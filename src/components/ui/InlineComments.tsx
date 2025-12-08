import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import Avatar from './Avatar';
import { cn } from '../../lib/cva';

interface Comment {
    id: string;
    post_id: string;
    user_id: string;
    parent_id?: string;
    content: string;
    like_count: number;
    reply_count: number;
    has_liked: boolean;
    created_at: string;
    author: {
        id: string;
        name: string;
        username: string;
        avatar_url?: string;
        verified?: boolean;
    };
    replies?: Comment[];
}

interface InlineCommentsProps {
    postId: string;
    totalReplies: number;
}

export default function InlineComments({ postId, totalReplies }: InlineCommentsProps) {
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const organizeComments = (comments: Comment[]): Comment[] => {
            const commentMap = new Map<string, Comment>();
            const rootComments: Comment[] = [];

            comments.forEach(comment => {
                commentMap.set(comment.id, { ...comment, replies: [] });
            });

            comments.forEach(comment => {
                if (comment.parent_id) {
                    const parent = commentMap.get(comment.parent_id);
                    if (parent) {
                        parent.replies!.push(commentMap.get(comment.id)!);
                    }
                } else {
                    rootComments.push(commentMap.get(comment.id)!);
                }
            });

            // Sort root comments by likes if we are in the > 13 mode, otherwise maybe chronological?
            // The requirement says "more views/comments/likes" for the single one.
            // Let's stick to likes for now as it's readily available.
            return rootComments.sort((a, b) => b.like_count - a.like_count);
        };

        const fetchComments = async () => {
            try {
                setLoading(true);

                // Fetch comments
                const query = supabase
                    .from('comments')
                    .select('*')
                    .eq('post_id', postId)
                    .order('like_count', { ascending: false }); // Sort by likes for "top" comment logic

                // If > 13 replies, we only strictly need the top one for the preview, 
                // but to be safe and simple we can fetch a reasonable batch.
                // However, the requirement is:
                // <= 13: Show all
                // > 13: Show top 1 + "Show more"

                const { data: commentsData, error } = await query;

                if (error) throw error;

                if (commentsData && commentsData.length > 0) {
                    // Fetch profiles
                    const transformedComments: Comment[] = await Promise.all(
                        commentsData.map(async (comment) => {
                            const { data: profileData } = await supabase
                                .from('profiles')
                                .select('full_name, username, avatar_url, verified')
                                .eq('id', comment.user_id)
                                .single();

                            return {
                                id: comment.id,
                                post_id: comment.post_id,
                                user_id: comment.user_id,
                                parent_id: comment.parent_id,
                                content: comment.content,
                                like_count: comment.like_count || 0,
                                reply_count: comment.reply_count || 0,
                                has_liked: false, // Simplified for feed view
                                created_at: comment.created_at,
                                author: {
                                    id: comment.user_id,
                                    name: profileData?.full_name || 'User',
                                    username: profileData?.username || `user${comment.user_id.slice(-4)}`,
                                    avatar_url: profileData?.avatar_url,
                                    verified: profileData?.verified || false
                                },
                                replies: []
                            };
                        })
                    );

                    // Organize into tree
                    const organizedCommentsList = organizeComments(transformedComments);
                    setComments(organizedCommentsList);
                } else {
                    setComments([]);
                }
            } catch (error) {
                console.error('Error fetching inline comments:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchComments();
    }, [postId]);

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

    const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => (
        <div className="relative flex gap-3 mt-3">
            {/* Avatar container */}
            <div className="shrink-0 relative z-10">
                <Link to={`/profile/${comment.author.id}`} onClick={(e) => e.stopPropagation()}>
                    <Avatar
                        src={comment.author.avatar_url}
                        alt={comment.author.name}
                        name={comment.author.name}
                        size="sm"
                        className="w-9 h-9"
                    />
                </Link>
            </div>

            <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-center gap-2">
                    <Link
                        to={`/profile/${comment.author.id}`}
                        className="font-bold text-sm hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {comment.author.name}
                    </Link>
                    {/* Show "replying to" indicator for nested replies */}
                    {depth > 0 && (
                        <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
                            replying
                        </span>
                    )}
                    <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
                        @{comment.author.username} · {formatTimeAgo(comment.created_at)}
                    </span>
                </div>

                <p className={cn("text-sm mt-0.5 whitespace-pre-wrap", isDark ? "text-gray-300" : "text-gray-700")}>
                    {comment.content}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-2">
                    <button className={cn("flex items-center gap-1 text-xs group", isDark ? "text-gray-500" : "text-gray-400")}>
                        <Heart className="w-3.5 h-3.5 group-hover:text-red-500 transition-colors" />
                        <span>{comment.like_count > 0 && comment.like_count}</span>
                    </button>

                    <button
                        className={cn("flex items-center gap-1 text-xs group", isDark ? "text-gray-500" : "text-gray-400")}
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/post/${postId}`, { state: { focusReply: true } });
                        }}
                    >
                        <MessageCircle className="w-3.5 h-3.5 group-hover:text-blue-500 transition-colors" />
                        <span>{comment.reply_count > 0 && comment.reply_count}</span>
                    </button>

                    <button
                        className={cn("text-xs group hover:text-blue-500", isDark ? "text-gray-500" : "text-gray-400")}
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/post/${postId}`, { state: { focusReply: true, replyTo: comment.id } });
                        }}
                    >
                        Reply
                    </button>
                </div>
            </div>
        </div>
    );

    if (loading) return null;
    if (comments.length === 0) return null;

    // Logic: 1-3 replies -> Show all
    // > 3 replies -> Show top 1 (by likes/reply_count) + "Show more"
    const shouldShowAll = totalReplies <= 3;
    const commentsToShow = shouldShowAll ? comments : comments.slice(0, 1);
    const remainingCount = totalReplies - commentsToShow.length;

    return (
        <div className={cn("relative mt-0 px-4 pt-4", isDark ? "border-gray-800" : "border-gray-100")}>
            {/* Small connector line at top - represents connection to post avatar above */}
            {/* <div
                className={cn(
                    "absolute w-[2px] h-4",
                    isDark ? "bg-gray-700" : "bg-gray-300"
                )}
                style={{
                    left: '32px',
                    top: '0'
                }}
            /> */}

            <div className="space-y-4 relative">
                {/* Vertical line running through all root comments */}
                {commentsToShow.length > 1 && (
                    <div
                        className={cn(
                            "absolute left-[18px] top-[40px] bottom-[40px] w-[2px]",
                            isDark ? "bg-gray-800" : "bg-gray-200"
                        )}
                    />
                )}

                {commentsToShow.map((comment) => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                    />
                ))}
            </div>

            {!shouldShowAll && (
                <div className="mt-4 ml-11">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/post/${postId}`);
                        }}
                        className="text-blue-500 text-sm hover:underline font-medium"
                    >
                        Show {remainingCount} more replies
                    </button>
                </div>
            )}
        </div>
    );
}
