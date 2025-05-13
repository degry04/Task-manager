import React, { useState } from 'react';
import { Comment } from '../types/types';

interface CommentSectionProps {
  comments: Comment[];
  onAddComment: (text: string) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ comments, onAddComment }) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  return (
    <div className="comment-section">
      <h4>Комментарий ({comments.length})</h4>
      <form onSubmit={handleSubmit} className="comment-form">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          required
        />
        <button type="submit" className="btn-primary">Добавить комментарий</button>
      </form>
      <div className="comments-list">
        {comments.map(comment => (
          <div key={comment.id} className="comment">
            <p className="comment-text">{comment.text}</p>
            <small className="comment-date">
              {new Date(comment.createdAt).toLocaleString()}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;