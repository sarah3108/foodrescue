import React, { useState } from 'react';

const initialForm = {
  name: '',
  email: '',
  topic: 'donation',
  message: ''
};

function CustomerCarePage({ apiUrl, currentUser }) {
  const [form, setForm] = useState(() => ({
    ...initialForm,
    name: currentUser?.name || '',
    email: currentUser?.email || ''
  }));
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus('');
    setError('');

    try {
      const response = await fetch(`${apiUrl}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to submit support message');
      }

      setForm({ ...initialForm, name: currentUser?.name || '', email: currentUser?.email || '' });
      setStatus('Your message was saved. The support team can view it in MongoDB.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="feature-page">
      <section className="feature-hero care-hero">
        <div>
          <p className="eyebrow">Customer care</p>
          <h1>Fast help for donors, NGOs, and volunteers</h1>
          <p>Submit support issues, pickup questions, and technical problems directly to the backend.</p>
        </div>
      </section>

      <section className="main-grid">
        <section className="form-panel">
          <div className="section-heading">
            <p className="eyebrow">Contact support</p>
            <h2>Send a message</h2>
          </div>
          {status && <div className="alert alert-success">{status}</div>}
          {error && <div className="alert alert-error">{error}</div>}
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Name
              <input name="name" value={form.name} onChange={handleChange} required />
            </label>
            <label>
              Email
              <input type="email" name="email" value={form.email} onChange={handleChange} required />
            </label>
            <label>
              Topic
              <select name="topic" value={form.topic} onChange={handleChange}>
                <option value="donation">Donation</option>
                <option value="pickup">Pickup</option>
                <option value="account">Account</option>
                <option value="technical">Technical</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>
              Message
              <textarea name="message" value={form.message} onChange={handleChange} required />
            </label>
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? 'Sending...' : 'Send support request'}
            </button>
          </form>
        </section>

        <section className="board-panel">
          <div className="section-heading">
            <p className="eyebrow">Quick answers</p>
            <h2>Common support topics</h2>
          </div>
          <div className="faq-list">
            <article>
              <h3>Pickup is delayed</h3>
              <p>Use the donation contact details and submit a support ticket for follow-up.</p>
            </article>
            <article>
              <h3>Donation was already collected</h3>
              <p>Mark the pickup complete so the live board stays accurate for everyone.</p>
            </article>
            <article>
              <h3>Account role needs updating</h3>
              <p>Open Profile and switch between donor, volunteer, and NGO roles.</p>
            </article>
          </div>
        </section>
      </section>
    </main>
  );
}

export default CustomerCarePage;
