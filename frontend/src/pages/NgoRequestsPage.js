import React, { useCallback, useEffect, useState } from 'react';

const initialForm = {
  organizationName: '',
  contactPerson: '',
  email: '',
  phone: '',
  city: '',
  peopleServed: 50,
  requestType: 'daily-meals',
  notes: ''
};

function NgoRequestsPage({ apiUrl, currentUser }) {
  const [form, setForm] = useState(() => ({
    ...initialForm,
    contactPerson: currentUser?.name || '',
    email: currentUser?.email || ''
  }));
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/ngo-requests`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to load NGO requests');
      }
      setRequests(data);
    } catch (err) {
      setError(err.message);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

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
      const response = await fetch(`${apiUrl}/ngo-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, peopleServed: Number(form.peopleServed) || 1 })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to submit NGO request');
      }
      setRequests((current) => [data, ...current]);
      setForm({ ...initialForm, contactPerson: currentUser?.name || '', email: currentUser?.email || '' });
      setMessage('NGO request saved. It is ready to view in MongoDB Compass.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="feature-page">
      <section className="feature-hero ngo-hero">
        <div>
          <p className="eyebrow">NGO requests</p>
          <h1>Connect verified NGOs with surplus food</h1>
          <p>Collect partnership and food support requests for review inside MongoDB Compass.</p>
        </div>
      </section>

      <section className="main-grid">
        <section className="form-panel">
          <div className="section-heading">
            <p className="eyebrow">Partnership form</p>
            <h2>Request food support</h2>
          </div>
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>Organization name<input name="organizationName" value={form.organizationName} onChange={handleChange} required /></label>
            <label>Contact person<input name="contactPerson" value={form.contactPerson} onChange={handleChange} required /></label>
            <label>Email<input type="email" name="email" value={form.email} onChange={handleChange} required /></label>
            <label>Phone<input name="phone" value={form.phone} onChange={handleChange} required /></label>
            <label>City / area<input name="city" value={form.city} onChange={handleChange} required /></label>
            <label>People served<input type="number" min="1" name="peopleServed" value={form.peopleServed} onChange={handleChange} required /></label>
            <label>
              Request type
              <select name="requestType" value={form.requestType} onChange={handleChange}>
                <option value="daily-meals">Daily meals</option>
                <option value="event-surplus">Event surplus</option>
                <option value="emergency-support">Emergency support</option>
                <option value="partnership">Long-term partnership</option>
              </select>
            </label>
            <label>Notes<textarea name="notes" value={form.notes} onChange={handleChange} /></label>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Submitting...' : 'Submit NGO request'}</button>
          </form>
        </section>

        <section className="board-panel">
          <div className="section-heading board-heading">
            <div>
              <p className="eyebrow">Request board</p>
              <h2>Recent NGO needs</h2>
            </div>
            <button className="ghost-button" type="button" onClick={fetchRequests}>Refresh</button>
          </div>
          <div className="mini-list">
            {requests.length === 0 ? (
              <div className="empty-state">No NGO requests yet.</div>
            ) : requests.slice(0, 7).map((request) => (
              <article key={request._id}>
                <strong>{request.organizationName}</strong>
                <span>{request.city} - {request.peopleServed} people - {request.status}</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

export default NgoRequestsPage;
