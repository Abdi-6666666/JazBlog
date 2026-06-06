import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import MarkdownRenderer from '../components/MarkdownRenderer';
import './PostDetail.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function PostDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await axios.get(`${API_URL}/posts/${id}`);
      setPost(response.data);
    } catch (err) {
      setError('Post not found');
      console.error(err);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${API_URL}/posts/${id}/comments`);
      setComments(response.data);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!user) {
      navigate('/login');
      return;
    }

    if (!newComment.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/posts/${id}/comments`,
        { content: newComment },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      setComments([...comments, response.data]);
      setNewComment('');
      setSuccess('Comment posted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to post comment');
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      await axios.delete(`${API_URL}/comments/${commentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      setComments(comments.filter(c => c.id !== commentId));
      setSuccess('Comment deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete comment');
      console.error(err);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Delete this post? This action cannot be undone.')) return;

    try {
      await axios.delete(`${API_URL}/posts/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      navigate('/');
    } catch (err) {
      setError('Failed to delete post');
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mt-4">
        <div className="error">{error}</div>
        <Link to="/" className="btn btn-primary">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="post-detail">
      <div className="container mt-4">
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <div className="post-header">
          <h1 className="post-title">{post.title}</h1>
          <div className="post-info">
            <div>
              <span className="post-author">By {post.author}</span>
              <span className="post-date">on {formatDate(post.createdAt)}</span>
            </div>
            {user && user.username === post.author && (
              <div className="post-actions">
                <Link to={`/edit/${id}`} className="btn btn-secondary btn-small">
                  Edit
                </Link>
                <button
                  onClick={handleDeletePost}
                  className="btn btn-danger btn-small"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="post-tags">
              {post.tags.map((tag) => (
                <span key={tag} className="tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="post-content card">
          <MarkdownRenderer content={post.content} />
        </div>

        <div className="comments-section card">
          <h2>Comments ({comments.length})</h2>

          {user ? (
            <form onSubmit={handleSubmitComment} className="comment-form">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write your comment (supports Markdown)..."
                className="comment-textarea"
                rows="4"
              />
              <button type="submit" className="btn btn-primary">
                Post Comment
              </button>
            </form>
          ) : (
            <div className="login-prompt">
              <p>Sign in to comment</p>
              <Link to="/login" className="btn btn-primary">
                Login
              </Link>
            </div>
          )}

          <div className="comments-list">
            {comments.length === 0 ? (
              <p className="no-comments">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="comment">
                  <div className="comment-header">
                    <span className="comment-author">{comment.author}</span>
                    <span className="comment-date">
                      {formatDate(comment.createdAt)}
                    </span>
                    {user && user.username === comment.author && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="btn-delete-comment"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="comment-content">
                    <MarkdownRenderer content={comment.content} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <Link to="/" className="btn btn-secondary mt-4">
          ← Back to Posts
        </Link>
      </div>
    </div>
  );
}

export default PostDetail;
