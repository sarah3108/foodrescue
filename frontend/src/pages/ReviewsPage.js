import React, { useCallback, useEffect, useMemo, useState } from 'react';

const initialForm = {
  name: '',
  role: 'Donor',
  rating: 5,
  message: ''
};

function ReviewsPage({ apiUrl, currentUser }) {
  const [form, setForm] = useState(() => ({ ...initialForm, name: currentUser?.name || '' }));
  const [reviews, setReviews] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/reviews`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to load reviews');
      }
      setReviews(data);
    } catch (err) {
      setError(err.message);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const averageRating = useMemo(() => {
    if (!reviews.length) {
      return '5.0';
    }
    const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${apiUrl}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, rating: Number(form.rating) })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to submit review');
      }
      setReviews((current) => [data, ...current]);
      setForm({ ...initialForm, name: currentUser?.name || '' });
      setMessage('Review posted successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="feature-page">
      <section className="feature-hero review-hero">
        <div>
          <p className="eyebrow">Reviews</p>
          <h1>Community feedback for Food Rescue</h1>
          <p>Collect user reviews from donors, volunteers, and NGOs into MongoDB.</p>
        </div>
        <div className="impact-meter">
          <span>{averageRating}</span>
          <small>average rating</small>
        </div>
      </section>

      <section className="main-grid">
        <section className="form-panel">
          <div className="section-heading">
            <p className="eyebrow">Add feedback</p>
            <h2>Write a review</h2>
          </div>
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>Name<input name="name" value={form.name} onChange={handleChange} required /></label>
            <label>Role<input name="role" value={form.role} onChange={handleChange} required /></label>
            <label>
              Rating
              <select name="rating" value={form.rating} onChange={handleChange}>
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Good</option>
                <option value="3">3 - Okay</option>
                <option value="2">2 - Needs work</option>
                <option value="1">1 - Poor</option>
              </select>
            </label>
            <label>Review<textarea name="message" value={form.message} onChange={handleChange} required /></label>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Posting...' : 'Post review'}</button>
          </form>
        </section>

        <section className="board-panel">
          <div className="section-heading board-heading">
            <div>
              <p className="eyebrow">Community voice</p>
              <h2>Recent reviews</h2>
            </div>
            <button className="ghost-button" type="button" onClick={fetchReviews}>Refresh</button>
          </div>
          <div className="review-list">
            {reviews.length === 0 ? (
              <div className="empty-state">No reviews yet.</div>
            ) : reviews.map((review) => (
              <article key={review._id} className="review-card">
                <div>
                  <strong>{review.name}</strong>
                  <span>{review.role}</span>
                </div>
                <p className="stars">Rating {review.rating}/5</p>
                <p>{review.message}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

export default ReviewsPage;
