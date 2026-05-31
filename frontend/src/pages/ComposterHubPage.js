import React, { useCallback, useEffect, useState } from 'react';

const initialForm = {
  name: '',
  email: '',
  wasteType: '',
  quantity: '',
  pickupLocation: '',
  preferredTime: '',
  notes: ''
};

function ComposterHubPage({ apiUrl, currentUser }) {
  const [form, setForm] = useState(() => ({
    ...initialForm,
    name: currentUser?.name || '',
    email: currentUser?.email || ''
  }));
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/compost`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to load compost requests');
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
      const response = await fetch(`${apiUrl}/compost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to submit compost request');
      }
      setRequests((current) => [data, ...current]);
      setForm({ ...initialForm, name: currentUser?.name || '', email: currentUser?.email || '' });
      setMessage('Compost request saved to MongoDB.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="feature-page">
      <section className="feature-hero compost-hero">
        <div>
          <p className="eyebrow">ComposterHub</p>
          <h1>Turn unusable food into compost value</h1>
          <p>Route spoiled or non-donatable organic waste to compost pickup partners.</p>
        </div>
      </section>

      <section className="feature-grid three-up">
        <article className="feature-card">
          <span>01</span>
          <h2>Separate edible food</h2>
          <p>Keep rescue donations on the main board and compost only what cannot be served.</p>
        </article>
        <article className="feature-card">
          <span>02</span>
          <h2>Request collection</h2>
          <p>Submit type, quantity, and pickup area so compost teams can schedule quickly.</p>
        </article>
        <article className="feature-card">
          <span>03</span>
          <h2>Track status</h2>
          <p>Requests are saved in MongoDB for the admin or project demo review.</p>
        </article>
      </section>

      <section className="main-grid">
        <section className="form-panel">
          <div className="section-heading">
            <p className="eyebrow">Compost pickup</p>
            <h2>Create request</h2>
          </div>
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>Name<input name="name" value={form.name} onChange={handleChange} required /></label>
            <label>Email<input type="email" name="email" value={form.email} onChange={handleChange} required /></label>
            <label>Waste type<input name="wasteType" value={form.wasteType} onChange={handleChange} placeholder="Vegetable peels, spoiled rice" required /></label>
            <label>Quantity<input name="quantity" value={form.quantity} onChange={handleChange} placeholder="12 kg" required /></label>
            <label>Pickup location<input name="pickupLocation" value={form.pickupLocation} onChange={handleChange} required /></label>
            <label>Preferred time<input name="preferredTime" value={form.preferredTime} onChange={handleChange} placeholder="Tomorrow morning" /></label>
            <label>Notes<textarea name="notes" value={form.notes} onChange={handleChange} /></label>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Submit compost request'}</button>
          </form>
        </section>

        <section className="board-panel">
          <div className="section-heading board-heading">
            <div>
              <p className="eyebrow">Recent requests</p>
              <h2>Compost queue</h2>
            </div>
            <button className="ghost-button" type="button" onClick={fetchRequests}>Refresh</button>
          </div>
          <div className="mini-list">
            {requests.length === 0 ? (
              <div className="empty-state">No compost requests yet.</div>
            ) : requests.slice(0, 6).map((request) => (
              <article key={request._id}>
                <strong>{request.wasteType}</strong>
                <span>{request.quantity} at {request.pickupLocation}</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

export default ComposterHubPage;
