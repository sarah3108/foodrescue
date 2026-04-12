import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [donations, setDonations] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    foodType: '',
    quantity: '',
    location: '',
    contact: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch donations on component mount
  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const response = await fetch('http://localhost:5000/donations');
      if (!response.ok) throw new Error('Failed to fetch donations');
      const data = await response.json();
      setDonations(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/donations/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to add donation');

      const newDonation = await response.json();
      setDonations([...donations, newDonation]);
      setFormData({
        name: '',
        foodType: '',
        quantity: '',
        location: '',
        contact: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Food Rescue Platform</h1>
        <p>Share surplus food with those in need</p>
      </header>

      <main style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h2>Add a Donation</h2>
        <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleInputChange}
              required
              style={{ marginRight: '10px', padding: '5px' }}
            />
            <input
              type="text"
              name="foodType"
              placeholder="Food Type (e.g., Pizza, Bread)"
              value={formData.foodType}
              onChange={handleInputChange}
              required
              style={{ marginRight: '10px', padding: '5px' }}
            />
            <input
              type="text"
              name="quantity"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              required
              style={{ marginRight: '10px', padding: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              name="location"
              placeholder="Location"
              value={formData.location}
              onChange={handleInputChange}
              required
              style={{ marginRight: '10px', padding: '5px' }}
            />
            <input
              type="email"
              name="contact"
              placeholder="Contact Email"
              value={formData.contact}
              onChange={handleInputChange}
              required
              style={{ marginRight: '10px', padding: '5px' }}
            />
          </div>
          <button type="submit" disabled={loading} style={{ padding: '10px 20px' }}>
            {loading ? 'Adding...' : 'Add Donation'}
          </button>
        </form>

        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

        <h2>Available Donations</h2>
        {donations.length === 0 ? (
          <p>No donations available yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {donations.map((donation) => (
              <li key={donation._id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
                <strong>{donation.foodType}</strong> - {donation.quantity} from {donation.name}
                <br />
                Location: {donation.location} | Contact: {donation.contact}
                <br />
                Status: {donation.status} | Added: {new Date(donation.createdAt).toLocaleDateString()}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

export default App;
