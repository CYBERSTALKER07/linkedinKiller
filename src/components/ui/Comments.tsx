import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Reply, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import Avatar from './Avatar';
import Button from './Button';
import ReplyInput from './ReplyInput';
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
  is_edited: boolean;
  updated_at?: string;
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

interface CommentsProps {
  postId: string;
  className?: string;
}

export default function Comments({ postId, className }: CommentsProps) {
  const { user } = useAuth();
  const { isDark } = useTheme();

  // Extract the real post ID (remove retweet_ prefix if present)
  const effectivePostId = postId?.startsWith('retweet_')
    ? postId.substring(8)
    : postId;

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  // Refs for maintaining focus
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  // Focus reply input when replying to a comment
  useEffect(() => {
    if (replyingTo && replyInputRef.current) {
      replyInputRef.current.focus();
      // Put cursor at end
      const len = replyInputRef.current.value.length;
      replyInputRef.current.setSelectionRange(len, len);
    }
  }, [replyingTo]);

  // Focus edit input when editing a comment
  useEffect(() => {
    if (editingComment && editInputRef.current) {
      editInputRef.current.focus();
      // Put cursor at end
      const len = editInputRef.current.value.length;
      editInputRef.current.setSelectionRange(len, len);
    }
  }, [editingComment]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);

        // First try a simple query to check if table exists
        const { data: commentsData, error } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', effectivePostId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching comments:', error);

          // If table doesn't exist, show empty state
          if (error.code === '42P01') {
            console.log('Comments table does not exist yet');
            setComments([]);
            return;
          }
          return;
        }

        if (commentsData && commentsData.length > 0) {
          // For each comment, try to fetch the user profile separately
          const transformedComments: Comment[] = await Promise.all(
            commentsData.map(async (comment) => {
              // Try to get user profile
              let authorData = {
                id: comment.user_id,
                name: 'User',
                username: `user${comment.user_id.slice(-4)}`,
                avatar_url: undefined,
                verified: false
              };

              try {
                const { data: profileData, error: profileError } = await supabase
                  .from('profiles')
                  .select('full_name, username, avatar_url, verified')
                  .eq('id', comment.user_id)
                  .limit(1);

                if (profileError) {
                  console.log('Profile query error for user:', comment.user_id, profileError);
                } else if (profileData && profileData.length > 0) {
                  const profile = profileData[0];
                  authorData = {
                    id: comment.user_id,
                    name: profile.full_name || 'User',
                    username: profile.username || `user${comment.user_id.slice(-4)}`,
                    avatar_url: profile.avatar_url,
                    verified: profile.verified || false
                  };
                }
              } catch (profileError) {
                console.log('Error fetching profile for user:', comment.user_id, profileError);
              }

              return {
                id: comment.id,
                post_id: comment.post_id,
                user_id: comment.user_id,
                parent_id: comment.parent_id,
                content: comment.content,
                like_count: comment.like_count || 0,
                reply_count: comment.reply_count || 0,
                has_liked: false, // We'll fetch this separately if needed
                is_edited: comment.is_edited || false,
                updated_at: comment.updated_at,
                created_at: comment.created_at,
                author: authorData
              };
            })
          );

          // Organize comments into threaded structure
          const organizedComments = organizeComments(transformedComments);
          setComments(organizedComments);
        } else {
          setComments([]);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();

  }, [effectivePostId]);



  const organizeComments = (comments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // First pass: create map of all comments
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: organize into parent-child relationships
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

    // Sort function: Likes > Replies > Newest
    const sortFn = (a: Comment, b: Comment) => {
      if (b.like_count !== a.like_count) return b.like_count - a.like_count;
      if (b.reply_count !== a.reply_count) return b.reply_count - a.reply_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    };

    // Sort root comments and replies
    rootComments.sort(sortFn);
    commentMap.forEach(comment => {
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.sort(sortFn);
      }
    });

    return rootComments;
  };

  const handleAddComment = async (parentId?: string, directContent?: string) => {
    const content = directContent || (parentId ? replyContent : newComment);
    if (!user || !content.trim()) return;

    setIsCommenting(true);

    try {
      // First, let's check if the user has a profile
      if (!user.id) {
        throw new Error('User not authenticated');
      }

      // Debug logging
      console.log('Adding comment:', {
        postId: effectivePostId,
        userId: user.id,
        content: content.trim(),
        parentId
      });

      // Simple insert without complex joins first
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          post_id: effectivePostId,
          user_id: user.id,
          parent_id: parentId || null,
          content: content.trim()
        }])
        .select('*')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Comment inserted successfully:', data);

      // Create new comment object with fallback data
      const newCommentObj: Comment = {
        id: data.id,
        post_id: data.post_id,
        user_id: data.user_id,
        parent_id: data.parent_id,
        content: data.content,
        like_count: 0,
        reply_count: 0,
        has_liked: false,
        is_edited: false,
        created_at: data.created_at,
        author: {
          id: user.id,
          name: user.profile?.full_name || user.email?.split('@')[0] || 'You',
          username: user.profile?.username || user.email?.split('@')[0] || 'you',
          avatar_url: user.profile?.avatar_url || undefined,
          verified: false
        },
        replies: []
      };

      if (parentId) {
        // Add as reply to existing comment
        setComments(prevComments =>
          updateCommentsWithReply(prevComments, parentId, newCommentObj)
        );
        setReplyContent('');
        setReplyingTo(null);
      } else {
        // Add as new top-level comment
        setComments(prevComments => [...prevComments, newCommentObj]);
        setNewComment('');
      }

      // Add haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Detailed error adding comment:', error);

      // More specific error messages
      let errorMessage = 'Failed to add comment. ';
      if (error.code === '23503') {
        errorMessage += 'Post not found or invalid.';
      } else if (error.code === '42P01') {
        errorMessage += 'Database tables not set up. Please contact support.';
      } else if (error.message?.includes('JWT')) {
        errorMessage += 'Please log in again.';
      } else {
        errorMessage += 'Please try again.';
      }

      alert(errorMessage);
    } finally {
      setIsCommenting(false);
    }
  };

  const updateCommentsWithReply = (comments: Comment[], parentId: string, reply: Comment): Comment[] => {
    return comments.map(comment => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), reply],
          reply_count: comment.reply_count + 1
        };
      } else if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentsWithReply(comment.replies, parentId, reply)
        };
      }
      return comment;
    });
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) return;

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
      } else {
        // Like
        await supabase
          .from('likes')
          .insert([{
            comment_id: commentId,
            user_id: user.id
          }]);
      }

      // Update local state
      setComments(prevComments =>
        updateCommentLikes(prevComments, commentId, !existingLike)
      );

      // Add haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const updateCommentLikes = (comments: Comment[], commentId: string, isLiked: boolean): Comment[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          has_liked: isLiked,
          like_count: isLiked ? comment.like_count + 1 : comment.like_count - 1
        };
      } else if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentLikes(comment.replies, commentId, isLiked)
        };
      }
      return comment;
    });
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .update({
          content: editContent.trim(),
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Update local state
      setComments(prevComments =>
        updateCommentContent(prevComments, commentId, editContent.trim(), true)
      );

      setEditingComment(null);
      setEditContent('');
    } catch (error) {
      console.error('Error editing comment:', error);
      alert('Failed to edit comment. Please try again.');
    }
  };

  const updateCommentContent = (comments: Comment[], commentId: string, newContent: string, isEdited: boolean): Comment[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          content: newContent,
          is_edited: isEdited
        };
      } else if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentContent(comment.replies, commentId, newContent, isEdited)
        };
      }
      return comment;
    });
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Remove from local state
      setComments(prevComments =>
        removeComment(prevComments, commentId)
      );
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  const removeComment = (comments: Comment[], commentId: string): Comment[] => {
    return comments.filter(comment => {
      if (comment.id === commentId) return false;
      if (comment.replies && comment.replies.length > 0) {
        comment.replies = removeComment(comment.replies, commentId);
      }
      return true;
    });
  };

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
    <div className={cn(
      'border-[0.7px] rounded-xl transition-colors',
      isDark ? 'border-gray-800 hover:bg-gray-950/50' : 'border-gray-200 hover:bg-gray-50/50',
      depth > 0 && 'ml-8  border-gray-300 dark:border-gray-700 pl-4'
    )}>
      <div className="p-4">
        <div className="flex space-x-3">
          <Avatar
            src={comment.author.avatar_url}
            alt={comment.author.name}
            name={comment.author.name}
            size="sm"
            className="shrink-0"
          />

          <div className="flex-1 min-w-0">
            {/* Author Info */}
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-bold text-sm">{comment.author.name}</span>
              {comment.author.verified && (
                <div className="w-4 h-4 bg-info-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
              <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                @{comment.author.username}
              </span>
              <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                ·
              </span>
              <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                {formatTimeAgo(comment.created_at)}
              </span>
              {comment.is_edited && (
                <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>
                  (edited)
                </span>
              )}
            </div>

            {/* Comment Content */}
            {editingComment === comment.id ? (
              <div className="mb-3">
                <textarea
                  ref={editInputRef}
                  dir="ltr"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className={cn(
                    'w-full p-2 border rounded-lg resize-none text-left',
                    isDark
                      ? 'bg-black border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  )}
                  rows={2}
                  placeholder="Edit your comment..."
                />
                <div className="flex space-x-2 mt-2">
                  <Button
                    size="small"
                    onClick={() => handleEditComment(comment.id)}
                    disabled={!editContent.trim()}
                  >
                    Save
                  </Button>
                  <Button
                    size="small"
                    variant="ghost"
                    onClick={() => {
                      setEditingComment(null);
                      setEditContent('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm mb-3 leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>
            )}

            {/* Comment Actions */}
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="small"
                onClick={() => handleLikeComment(comment.id)}
                className={cn(
                  'flex items-center space-x-1 px-0 py-1 text-sm transition-colors',
                  comment.has_liked
                    ? 'text-red-500 hover:text-red-400'
                    : isDark
                      ? 'text-gray-400 hover:text-red-400'
                      : 'text-gray-600 hover:text-red-600'
                )}
              >
                <Heart className={cn('w-4 h-4', comment.has_liked && 'fill-current')} />
                <span>{comment.like_count || ''}</span>
              </Button>

              <Button
                variant="ghost"
                size="small"
                onClick={() => {
                  setReplyingTo(comment.id);
                  setReplyContent('');
                }}
                className={cn(
                  'flex items-center space-x-1 px-0 py-1 text-sm transition-colors',
                  isDark
                    ? 'text-gray-400 hover:text-info-400'
                    : 'text-gray-600 hover:text-info-600'
                )}
              >
                <Reply className="w-5 h-5" />
              </Button>

              {comment.user_id === user?.id && (
                <>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => {
                      setEditingComment(comment.id);
                      setEditContent(comment.content);
                    }}
                    className={cn(
                      'flex items-center space-x-1 px-0 py-1 text-sm transition-colors',
                      isDark
                        ? 'text-gray-400 hover:text-yellow-400'
                        : 'text-gray-600 hover:text-yellow-600'
                    )}
                  >
                    <Edit className="w-4 h-4" />
                    <span></span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => handleDeleteComment(comment.id)}
                    className={cn(
                      'flex items-center space-x-1 px-0 py-1 text-sm transition-colors',
                      isDark
                        ? 'text-gray-400 hover:text-red-400'
                        : 'text-gray-600 hover:text-red-600'
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span></span>
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                size="small"
                className={cn(
                  'flex items-center space-x-1 px-0 py-1 text-sm transition-colors',
                  isDark
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-600 hover:text-gray-500'
                )}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>

            {/* Reply Input */}
            {replyingTo === comment.id && (
              <ReplyInput
                authorName={comment.author.name}
                userAvatarUrl={user?.profile?.avatar_url || undefined}
                userName={user?.profile?.full_name || 'You'}
                isDark={isDark}
                isSubmitting={isCommenting}
                onSubmit={(content) => {
                  handleAddComment(comment.id, content);
                }}
                onCancel={() => {
                  setReplyingTo(null);
                  setReplyContent('');
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-0">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className={cn('p-4', className)}>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex space-x-3">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-0', className)}>
      {/* Add Comment Section */}
      <div className={cn(
        'p-4 border-b',
        isDark ? 'border-gray-800' : 'border-gray-200'
      )}>
        <div className="flex space-x-3">
          <Avatar
            src={user?.profile?.avatar_url || undefined}
            alt={user?.profile?.full_name || 'You'}
            size="md"
            className="shrink-0"
          />
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className={cn(
                'w-full p-3 border rounded-2xl resize-none',
                isDark
                  ? 'bg-black border-gray-700 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              )}
              rows={3}
              placeholder="Write a comment..."
            />
            <div className="flex justify-between items-center mt-2">
              <span className={cn(
                'text-xs',
                isDark ? 'text-gray-400' : 'text-gray-500'
              )}>
                {500 - newComment.length} characters remaining
              </span>
              <Button
                className='rounded-md w-20 h-8'
                onClick={() => handleAddComment()}
                disabled={!newComment.trim() || isCommenting || newComment.length > 500}
                size="small"
              >
                {isCommenting ? 'Posting...' : 'Comment'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className={cn(
          'p-8 text-center',
          isDark ? 'text-gray-400' : 'text-gray-500'
        )}>
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-0">
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}